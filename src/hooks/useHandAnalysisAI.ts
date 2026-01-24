import { useState, useCallback } from "react";

interface HandContext {
  heroCards: { rank: string; suit: string }[];
  boardCards: {
    flop: { rank: string; suit: string }[];
    turn: { rank: string; suit: string } | null;
    river: { rank: string; suit: string } | null;
  };
  heroPosition: string;
  villainPosition: string;
  currentStreet: string;
  actions: { player: string; action: string; type: string; street: string }[];
  potSize: number;
  heroStack: number;
  villainStack: number;
}

export function useHandAnalysisAI() {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeHand = useCallback(async (context: HandContext) => {
    setIsLoading(true);
    setError(null);
    setAnalysis("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hand-analysis`,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Sem resposta do servidor");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnalysis = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullAnalysis += content;
              setAnalysis(fullAnalysis);
            }
          } catch {
            // Incomplete JSON, will be completed in next chunk
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
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
          } catch {
            // Ignore incomplete data
          }
        }
      }
    } catch (err) {
      console.error("Hand analysis error:", err);
      setError(err instanceof Error ? err.message : "Erro ao analisar mão");
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
    analyzeHand,
    clearAnalysis,
  };
}
