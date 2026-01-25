import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useUsageLimits } from "./useUsageLimits";

interface TrainingAnalysisParams {
  hand: string;
  position: string;
  scenario: string;
  userAction: string;
  correctAction: string;
  isCorrect: boolean;
  frequencies: {
    raise: number;
    call: number;
    fold: number;
  };
  ev: number;
}

export function useTrainingAI() {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usage, checkAndIncrementUsage, canUseAnalysis, planName } = useUsageLimits();
  const usageRef = useRef({ usage, checkAndIncrementUsage, canUseAnalysis, planName });
  usageRef.current = { usage, checkAndIncrementUsage, canUseAnalysis, planName };

  const analyzeDecision = useCallback(async (params: TrainingAnalysisParams) => {
    // Check usage limits before making the API call
    const canProceed = await usageRef.current.checkAndIncrementUsage();
    if (!canProceed) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/training-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Limite de requisições atingido");
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 402) {
          toast.error("Créditos insuficientes");
          throw new Error("Credits exhausted");
        }
        throw new Error("Falha ao analisar");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem resposta do servidor");

      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullAnalysis = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullAnalysis += content;
              setAnalysis(fullAnalysis);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullAnalysis += content;
              setAnalysis(fullAnalysis);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      setError(message);
      console.error("Training AI error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis("");
    setError(null);
  }, []);

  return {
    analysis,
    isLoading,
    error,
    analyzeDecision,
    clearAnalysis,
    usage: usageRef.current.usage,
    planName: usageRef.current.planName,
    canUseAnalysis: usageRef.current.canUseAnalysis,
  };
}
