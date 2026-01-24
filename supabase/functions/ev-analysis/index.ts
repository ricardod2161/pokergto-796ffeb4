import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: EVAnalysisParams = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { potSize, callCost, equity, impliedOdds, ev, potOdds, requiredEquity, recommendation } = params;

    const systemPrompt = `Você é um coach de poker profissional especializado em análise de EV (Expected Value). 
Sua função é explicar decisões de EV de forma clara e didática para jogadores iniciantes e intermediários.
Use português brasileiro e seja objetivo, mas completo nas explicações.

IMPORTANTE:
- Formate suas respostas usando **negrito** para destacar conceitos importantes
- Organize em seções claras
- Use exemplos práticos quando possível
- Explique o "porquê" por trás de cada conceito
- Mantenha um tom encorajador e educativo`;

    const userPrompt = `Analise esta situação de EV e explique de forma detalhada para um iniciante:

**Dados da Situação:**
- Tamanho do Pote: ${potSize} BB
- Custo do Call: ${callCost} BB
- Equity do Jogador: ${equity}%
- Implied Odds: ${impliedOdds > 0 ? `${impliedOdds} BB` : 'Nenhum'}
- Pot Odds: ${potOdds.toFixed(1)}%
- Equity Necessária: ${requiredEquity.toFixed(1)}%
- EV Calculado: ${ev.toFixed(2)} BB
- Decisão Recomendada: ${recommendation === 'call' ? 'CALL (+EV)' : recommendation === 'fold' ? 'FOLD (-EV)' : 'MARGINAL (Breakeven)'}

Por favor, forneça uma análise completa incluindo:

**1. Análise da Decisão:**
Explique por que ${recommendation === 'call' ? 'pagar é lucrativo' : recommendation === 'fold' ? 'dar fold é correto' : 'a decisão está no limite'} nesta situação específica.

**2. Entendendo os Números:**
Quebre a matemática de forma simples. Explique o que significa ter ${equity}% de equity contra uma necessidade de ${requiredEquity.toFixed(1)}%.

**3. Conceito de Pot Odds:**
Explique o que significa ter pot odds de ${potOdds.toFixed(1)}% e como isso se relaciona com a equity necessária.

${impliedOdds > 0 ? `**4. Impacto das Implied Odds:**
Explique como os ${impliedOdds} BB de implied odds afetam esta decisão e quando é correto considerar implied odds.` : ''}

**${impliedOdds > 0 ? '5' : '4'}. Dica Prática:**
Dê uma dica actionable que o jogador pode usar em situações similares no futuro.`;

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
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos para continuar usando a análise IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao conectar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("EV analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
