import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrainingAnalysisRequest {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const params: TrainingAnalysisRequest = await req.json();
    const { hand, position, scenario, userAction, correctAction, isCorrect, frequencies, ev } = params;

    const scenarioLabels: Record<string, string> = {
      open: "Open Raise (primeira agressão)",
      "3bet": "3-Bet (re-raise sobre open)",
      "4bet": "4-Bet (re-raise sobre 3bet)",
      squeeze: "Squeeze (3bet com caller no meio)",
      coldcall: "Cold Call (flat sobre open)",
      vs3bet: "vs 3-Bet (defesa ao 3bet)",
      isoraise: "Iso-Raise (isolar limper)",
      bbdefense: "BB Defense (defesa do big blind)",
    };

    const actionLabels: Record<string, string> = {
      raise: "Raise/3-Bet",
      call: "Call/Flat",
      fold: "Fold",
    };

    const systemPrompt = `Você é um coach de poker profissional especializado em estratégia GTO (Game Theory Optimal) para No-Limit Hold'em.

Sua tarefa é explicar de forma CONCISA e EDUCATIVA por que uma decisão está correta ou incorreta no treinamento pré-flop.

REGRAS IMPORTANTES:
1. Seja CONCISO - máximo 3-4 frases por seção
2. Use linguagem simples, evite jargões desnecessários
3. Foque no "POR QUE" da decisão GTO
4. Mencione conceitos como equity, posição, SPR quando relevante
5. Dê uma dica prática memorável

Formato de resposta:
**📊 Análise GTO**
[Explique brevemente por que esta é a frequência GTO]

**💡 Conceito Chave**
[Um conceito importante que o jogador deve lembrar]

**🎯 Dica Prática**
[Uma dica memorável para situações similares]`;

    const userPrompt = `Analise esta decisão de treinamento pré-flop:

**Mão:** ${hand}
**Posição:** ${position}
**Cenário:** ${scenarioLabels[scenario] || scenario}
**Ação do jogador:** ${actionLabels[userAction] || userAction}
**Ação GTO primária:** ${actionLabels[correctAction] || correctAction}
**Resultado:** ${isCorrect ? "✅ CORRETO" : "❌ INCORRETO"}

**Frequências GTO:**
- Raise: ${(frequencies.raise * 100).toFixed(0)}%
- Call: ${(frequencies.call * 100).toFixed(0)}%
- Fold: ${(frequencies.fold * 100).toFixed(0)}%

**EV da mão:** ${ev >= 0 ? "+" : ""}${ev.toFixed(2)}bb

${isCorrect 
  ? "Explique por que o jogador fez a escolha correta e reforce o conceito GTO por trás."
  : "Explique por que a ação do jogador não é a ideal e qual seria o raciocínio GTO correto."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Aguarde alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Training analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
