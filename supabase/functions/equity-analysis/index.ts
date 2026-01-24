import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Card {
  rank: string;
  suit: string;
}

interface AnalysisRequest {
  heroCards: Card[];
  boardCards: Card[];
  position: string;
  equity: number;
  street: "preflop" | "flop" | "turn" | "river";
}

const formatCard = (card: Card): string => {
  const suitSymbols: Record<string, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠"
  };
  return `${card.rank}${suitSymbols[card.suit] || card.suit}`;
};

const formatHand = (cards: Card[]): string => {
  return cards.map(formatCard).join(" ");
};

const formatBoard = (cards: Card[]): string => {
  if (cards.length === 0) return "Sem board (Preflop)";
  return cards.map(formatCard).join(" ");
};

const getPositionName = (pos: string): string => {
  const names: Record<string, string> = {
    "BTN": "Button (BTN)",
    "CO": "Cutoff (CO)",
    "HJ": "Hijack (HJ)",
    "MP": "Middle Position (MP)",
    "UTG": "Under the Gun (UTG)",
    "BB": "Big Blind (BB)",
    "SB": "Small Blind (SB)"
  };
  return names[pos] || pos;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: AnalysisRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um coach de poker profissional especializado em análise de equity e estratégia GTO.
Sua função é analisar a equity calculada e fornecer insights estratégicos sobre como jogar a mão.

REGRAS:
- Seja direto e educativo
- Use terminologia de poker em português
- Explique como a equity deve influenciar as decisões
- Considere a posição e a textura do board
- Forneça dicas práticas baseadas na equity
- Limite sua resposta a 3 parágrafos concisos
- Use formatação com **título** para cada seção`;

    const userPrompt = `Analise esta situação de equity:

**Mão:** ${formatHand(data.heroCards)}
**Board (${data.street}):** ${formatBoard(data.boardCards)}
**Posição:** ${getPositionName(data.position)}
**Equity Calculada:** ${data.equity}%

Por favor, forneça:

**Análise da Equity:** Como interpretar este valor de equity nesta situação específica

**Estratégia Recomendada:** Qual abordagem tomar baseado na posição e equity

**Dica Prática:** Um conselho aplicável para jogar esta mão`;

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
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Equity analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
