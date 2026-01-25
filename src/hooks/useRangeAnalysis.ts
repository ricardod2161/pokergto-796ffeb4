import { useState, useCallback, useRef } from 'react';
import { useUsageLimits } from './useUsageLimits';

interface RangeAnalysisParams {
  hand: string;
  action: string;
  frequency: number;
  ev?: number;
  scenario: string;
  position: string;
  stackDepth: string;
}

export function useRangeAnalysis() {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usage, checkAndIncrementUsage, canUseAnalysis, planName } = useUsageLimits();
  const usageRef = useRef({ usage, checkAndIncrementUsage, canUseAnalysis, planName });
  usageRef.current = { usage, checkAndIncrementUsage, canUseAnalysis, planName };

  const analyzeHand = useCallback(async (params: RangeAnalysisParams) => {
    // Check usage limits before making the API call
    const canProceed = await usageRef.current.checkAndIncrementUsage();
    if (!canProceed) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/range-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errorData.error || 'Taxa de requisições excedida. Aguarde alguns segundos.');
        }
        if (response.status === 402) {
          throw new Error(errorData.error || 'Créditos insuficientes.');
        }
        throw new Error(errorData.error || 'Erro ao obter análise');
      }

      if (!response.body) {
        throw new Error('Resposta vazia do servidor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setAnalysis(fullText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setAnalysis(fullText);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Range analysis error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao analisar mão');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis('');
    setError(null);
  }, []);

  return {
    analysis,
    isLoading,
    error,
    analyzeHand,
    clearAnalysis,
    usage: usageRef.current.usage,
    planName: usageRef.current.planName,
    canUseAnalysis: usageRef.current.canUseAnalysis,
  };
}
