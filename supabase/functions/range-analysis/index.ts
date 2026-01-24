import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RangeAnalysisRequest {
  hand: string;
  action: string;
  frequency: number;
  ev?: number;
  scenario: string;
  position: string;
  stackDepth: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hand, action, frequency, ev, scenario, position, stackDepth } = await req.json() as RangeAnalysisRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const scenarioDescriptions: Record<string, string> = {
      open: "Open Raise (primeira aposta pré-flop)",
      "3bet": "3-Bet (re-raise contra um open raise)",
      "4bet": "4-Bet (re-raise contra um 3-bet)",
      squeeze: "Squeeze (3-bet após um open e um call)",
      coldcall: "Cold Call (call de um open sem ter investido)",
      vs3bet: "Defesa contra 3-Bet (após ter feito open raise)",
      isoraise: "Iso-Raise (raise para isolar limpers)",
      bbdefense: "BB Defense (defesa do big blind contra opens)",
    };

    const actionLabels: Record<string, string> = {
      raise: "RAISE (apostar/aumentar)",
      call: "CALL (pagar)",
      fold: "FOLD (desistir)",
      mixed: "ESTRATÉGIA MISTA",
    };

    const systemPrompt = `Você é um coach de poker profissional especializado em estratégias GTO (Game Theory Optimal). 
Sua função é explicar decisões de range de forma clara e educacional para jogadores de todos os níveis.

Sempre:
- Use linguagem acessível e evite jargões sem explicação
- Explique o PORQUÊ da ação, não apenas qual é
- Relacione com conceitos básicos de poker quando apropriado
- Mencione equity, posição e stack depth quando relevante
- Seja conciso mas completo (máximo 200 palavras)

Formato da resposta:
1. **Por que essa ação?** - Explique a lógica principal
2. **Conceito-chave** - Um conceito de poker que o jogador deve entender
3. **Dica prática** - Como aplicar isso em jogo real`;

    const userPrompt = `Analise esta situação de poker e explique a decisão GTO:

**Mão:** ${hand}
**Ação Recomendada:** ${actionLabels[action] || action} (${(frequency * 100).toFixed(0)}% frequência)
${ev !== undefined ? `**EV (Valor Esperado):** ${ev >= 0 ? '+' : ''}${(ev * 100).toFixed(2)}bb` : ''}
**Cenário:** ${scenarioDescriptions[scenario] || scenario}
**Posição:** ${position}
**Stack Efetivo:** ${stackDepth}

Explique para um jogador iniciante por que esta é a ação GTO correta nesta situação.`;

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
        return new Response(JSON.stringify({ error: "Taxa de requisições excedida. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Range analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
