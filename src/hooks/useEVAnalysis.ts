import { useState, useCallback } from "react";
import { toast } from "sonner";

interface EVAnalysisParams {
  potSize: number;
  callCost: number;
  equity: number;
  impliedOdds: number;
  ev: number;
  potOdds: number;
  requiredEquity: number;
  recommendation: "call" | "fold" | "marginal";
}

export function useEVAnalysis() {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeEV = useCallback(async (params: EVAnalysisParams) => {
    setIsLoading(true);
    setError(null);
    setAnalysis("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ev-analysis`,
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
          toast.error("Limite de requisições atingido", {
            description: "Aguarde alguns segundos antes de tentar novamente.",
          });
          throw new Error("Limite de requisições excedido");
        }
        if (response.status === 402) {
          toast.error("Créditos insuficientes", {
            description: "Adicione créditos para continuar usando a análise IA.",
          });
          throw new Error("Créditos esgotados");
        }
        throw new Error("Falha ao analisar EV");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem resposta do servidor");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                setAnalysis((prev) => prev + content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer) {
        const lines = buffer.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                setAnalysis((prev) => prev + content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("EV analysis error:", err);
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
    analyzeEV,
    clearAnalysis,
  };
}
