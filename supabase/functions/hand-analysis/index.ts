import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      heroCards, 
      boardCards, 
      heroPosition, 
      villainPosition,
      currentStreet,
      actions,
      potSize,
      heroStack,
      villainStack
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format cards for display
    const formatCard = (card: { rank: string; suit: string }) => {
      const suitSymbol = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[card.suit] || card.suit;
      return `${card.rank}${suitSymbol}`;
    };

    const heroCardsStr = heroCards?.map(formatCard).join(" ") || "Desconhecido";
    const flopStr = boardCards?.flop?.map(formatCard).join(" ") || "";
    const turnStr = boardCards?.turn ? formatCard(boardCards.turn) : "";
    const riverStr = boardCards?.river ? formatCard(boardCards.river) : "";
    
    let boardStr = "";
    if (flopStr) boardStr = `Flop: ${flopStr}`;
    if (turnStr) boardStr += ` | Turn: ${turnStr}`;
    if (riverStr) boardStr += ` | River: ${riverStr}`;

    // Format actions
    const actionsStr = actions?.map((a: any) => 
      `${a.player}: ${a.action}`
    ).join("\n") || "Sem ações registradas";

    const systemPrompt = `Você é um coach profissional de poker especializado em análise GTO (Game Theory Optimal). 
Sua função é analisar mãos de poker e fornecer feedback educativo e personalizado em português brasileiro.

IMPORTANTE:
- Seja específico e direto ao ponto
- Use termos técnicos de poker mas explique-os brevemente para iniciantes
- Forneça exemplos práticos quando possível
- Identifique erros e sugira melhorias concretas
- Use emojis para tornar a análise mais visual e engajadora

Estruture sua resposta EXATAMENTE neste formato com os cabeçalhos em negrito:

**📊 Análise da Situação**
[Descreva brevemente a situação: posições, stacks efetivos, ação pré-flop, textura do board]

**✅ O que você fez bem**
[Liste pontos positivos da linha de jogo, se houver]

**⚠️ Erros Identificados**
[Liste erros ou decisões subótimas com explicação do porquê]

**💡 Linha GTO Recomendada**
[Explique a linha de jogo ideal segundo GTO, com frequências se aplicável]

**🎯 Dica Prática**
[Uma dica específica e acionável que o jogador pode aplicar imediatamente]

**📈 Conceito-Chave**
[Explique um conceito de poker relacionado à situação para aprendizado]`;

    const userPrompt = `Analise esta mão de poker:

**Cartas do Herói:** ${heroCardsStr}
**Posição do Herói:** ${heroPosition || "Desconhecida"}
**Posição do Vilão:** ${villainPosition || "BB"}
**Street Atual:** ${currentStreet || "Desconhecido"}
**Board:** ${boardStr || "Pré-flop"}

**Stacks:**
- Herói: R$ ${heroStack || 500}
- Vilão: R$ ${villainStack || 485}

**Tamanho do Pote:** R$ ${potSize || 0}

**Histórico de Ações:**
${actionsStr}

Forneça uma análise GTO completa e educativa desta mão.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com o serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Hand analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
