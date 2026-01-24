import { useState, useCallback } from "react";
import { toast } from "sonner";

interface Card {
  rank: string;
  suit: string;
}

interface EquityAnalysisParams {
  heroCards: Card[];
  boardCards: Card[];
  position: string;
  equity: number;
  street: "preflop" | "flop" | "turn" | "river";
}

export function useEquityAnalysis() {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeEquity = useCallback(async (params: EquityAnalysisParams) => {
    setIsLoading(true);
    setError(null);
    setAnalysis("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/equity-analysis`,
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
          toast.error("Limite de requisições excedido. Aguarde alguns segundos.");
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 402) {
          toast.error("Créditos insuficientes. Adicione créditos ao workspace.");
          throw new Error("Credits exhausted");
        }
        throw new Error("Failed to analyze");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setAnalysis(fullText);
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      setError(message);
      console.error("Equity analysis error:", e);
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
    analyzeEquity,
    clearAnalysis,
  };
}
