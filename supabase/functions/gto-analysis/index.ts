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
  if (cards.length === 0) return "Sem board";
  return cards.map(formatCard).join(" ");
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

    const systemPrompt = `Você é um coach de poker profissional especializado em estratégia GTO (Game Theory Optimal). 
Sua função é analisar situações de poker e fornecer explicações detalhadas sobre as decisões ótimas.

REGRAS:
- Seja direto e técnico, mas acessível
- Use terminologia de poker em português quando possível
- Explique o raciocínio por trás das recomendações
- Considere textura do board, ranges e equity
- Mencione considerações de exploitative play quando relevante
- Limite sua resposta a 3-4 parágrafos concisos
- Formate a análise de forma clara e estruturada`;

    const userPrompt = `Analise esta situação de poker:

**Mão:** ${formatHand(data.heroCards)}
**Board (${data.street}):** ${formatBoard(data.boardCards)}
**Pot:** ${data.potSize} bb
**Stack:** ${data.stackSize} bb
**Posição:** ${data.position === "ip" ? "In Position" : "Out of Position"}
**Facing Bet:** ${data.facingBet ? `Sim (${data.betSize} bb)` : "Não"}
**Tipo de Vilão:** ${data.villainType}

**Análise Atual:**
- Força da mão: ${data.handStrength}
- Draws: ${data.draws.length > 0 ? data.draws.join(", ") : "Nenhum"}
- Textura: ${data.boardTexture.wetness}, ${data.boardTexture.connectivity}, ${data.boardTexture.pairing}
- Equity estimada: ${data.equity}%

**Recomendação do sistema:** ${data.currentRecommendation.action.toUpperCase()}${data.currentRecommendation.sizing ? ` (${data.currentRecommendation.sizing})` : ""} com ${data.currentRecommendation.confidence}% de confiança

Por favor, explique:
1. Por que esta ação é GTO-optimal nesta situação
2. Como a textura do board afeta nossa estratégia
3. Considerações sobre range do vilão
4. Ajustes exploitativos baseados no tipo de vilão`;

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
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("GTO analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
