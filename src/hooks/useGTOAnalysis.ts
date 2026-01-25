import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useUsageLimits } from "./useUsageLimits";

interface Card {
  rank: string;
  suit: string;
}

interface AnalysisContext {
  heroCards: Card[];
  boardCards: Card[];
  potSize: number;
  stackSize: number;
  position: "ip" | "oop";
  facingBet: boolean;
  betSize?: number;
  villainType: string;
  street: "flop" | "turn" | "river";
  handStrength: string;
  draws: string[];
  boardTexture: {
    wetness: string;
    connectivity: string;
    pairing: string;
  };
  equity: number;
  currentRecommendation: {
    action: string;
    sizing?: string;
    confidence: number;
  };
}

export function useGTOAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { usage, checkAndIncrementUsage, canUseAnalysis, planName } = useUsageLimits();
  const usageRef = useRef({ usage, checkAndIncrementUsage, canUseAnalysis, planName });
  usageRef.current = { usage, checkAndIncrementUsage, canUseAnalysis, planName };

  const analyzeWithAI = useCallback(async (context: AnalysisContext) => {
    // Check usage limits before making the API call
    const canProceed = await usageRef.current.checkAndIncrementUsage();
    if (!canProceed) {
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis("");
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gto-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(context),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error("Limite de requisições excedido. Aguarde alguns segundos.");
          throw new Error(errorData.error);
        }
        if (response.status === 402) {
          toast.error("Créditos insuficientes. Adicione créditos ao workspace.");
          throw new Error(errorData.error);
        }
        throw new Error(errorData.error || "Erro ao analisar");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullAnalysis += content;
              setAiAnalysis(fullAnalysis);
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
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullAnalysis += content;
              setAiAnalysis(fullAnalysis);
            }
          } catch { /* ignore */ }
        }
      }

    } catch (e) {
      console.error("AI analysis error:", e);
      setError(e instanceof Error ? e.message : "Erro desconhecido");
      toast.error("Erro ao obter análise da IA");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAiAnalysis("");
    setError(null);
  }, []);

  return {
    isAnalyzing,
    aiAnalysis,
    error,
    analyzeWithAI,
    clearAnalysis,
    usage: usageRef.current.usage,
    planName: usageRef.current.planName,
    canUseAnalysis: usageRef.current.canUseAnalysis,
  };
}
