import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PokerCard, CardPlaceholder } from "@/components/poker/PokerCard";
import { TrendingUp, TrendingDown, Crosshair, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface Card {
  rank: Rank;
  suit: Suit;
}

const ranks: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

const suitSymbols: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export default function BettingAssistant() {
  const [heroCards, setHeroCards] = useState<Card[]>([]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [potSize, setPotSize] = useState("");
  const [showCardPicker, setShowCardPicker] = useState<"hero" | "board" | null>(null);
  const [recommendation, setRecommendation] = useState<{
    action: "bet" | "check" | "fold";
    sizing?: string;
    reason: string;
    equityChange: number;
  } | null>(null);

  const handleCardSelect = (rank: Rank, suit: Suit) => {
    const card: Card = { rank, suit };
    
    if (showCardPicker === "hero" && heroCards.length < 2) {
      setHeroCards([...heroCards, card]);
      if (heroCards.length === 1) setShowCardPicker(null);
    } else if (showCardPicker === "board" && boardCards.length < 5) {
      setBoardCards([...boardCards, card]);
    }
  };

  const isCardUsed = (rank: Rank, suit: Suit) => {
    return [...heroCards, ...boardCards].some(c => c.rank === rank && c.suit === suit);
  };

  const handleAnalyze = () => {
    setRecommendation({
      action: "bet",
      sizing: "75%",
      reason: "Top pair forte com backdoor flush draw em board molhado. Apostando por valor e proteção.",
      equityChange: 12.5
    });
  };

  const handleReset = () => {
    setHeroCards([]);
    setBoardCards([]);
    setPotSize("");
    setRecommendation(null);
    setShowCardPicker(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assistente de Apostas</h1>
            <p className="text-sm text-muted-foreground">Receba recomendações de sizing ótimo</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,15%)]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hero Hand */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Sua Mão</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCardPicker(showCardPicker === "hero" ? null : "hero")}
                  className="border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,15%)]"
                >
                  Selecionar Cartas
                </Button>
              </div>
              <div className="flex gap-3">
                {heroCards.map((card, i) => (
                  <PokerCard key={i} rank={card.rank} suit={card.suit} size="lg" />
                ))}
                {Array.from({ length: 2 - heroCards.length }).map((_, i) => (
                  <CardPlaceholder key={`empty-${i}`} size="lg" />
                ))}
              </div>
            </div>

            {/* Board */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Board</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCardPicker(showCardPicker === "board" ? null : "board")}
                  className="border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,15%)]"
                >
                  Adicionar Cartas
                </Button>
              </div>
              <div className="flex gap-3 mb-3">
                {boardCards.map((card, i) => (
                  <PokerCard key={i} rank={card.rank} suit={card.suit} size="lg" />
                ))}
                {Array.from({ length: 5 - boardCards.length }).map((_, i) => (
                  <CardPlaceholder key={`empty-${i}`} size="lg" />
                ))}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className={boardCards.length >= 3 ? "text-primary" : ""}>Flop</span>
                <span>•</span>
                <span className={boardCards.length >= 4 ? "text-primary" : ""}>Turn</span>
                <span>•</span>
                <span className={boardCards.length >= 5 ? "text-primary" : ""}>River</span>
              </div>
            </div>

            {/* Card Picker */}
            {showCardPicker && (
              <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
                <h3 className="font-semibold text-foreground mb-4">
                  Selecionar Carta {showCardPicker === "hero" ? "da Mão" : "do Board"}
                </h3>
                <div className="grid gap-px bg-[hsl(220,15%,12%)] p-1 rounded-lg" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
                  {suits.map(suit => (
                    ranks.map(rank => {
                      const used = isCardUsed(rank, suit);
                      return (
                        <button
                          key={`${rank}${suit}`}
                          onClick={() => !used && handleCardSelect(rank, suit)}
                          disabled={used}
                          className={cn(
                            "aspect-[3/4] flex flex-col items-center justify-center text-xs font-mono font-semibold rounded transition-all",
                            used 
                              ? "bg-[hsl(220,15%,10%)] text-muted-foreground/30 cursor-not-allowed"
                              : "bg-white text-gray-900 hover:scale-105 hover:shadow-lg cursor-pointer",
                            (suit === "hearts" || suit === "diamonds") && !used && "text-red-500"
                          )}
                        >
                          <span className="text-[10px] leading-none">{rank}</span>
                          <span className="text-[8px] leading-none">{suitSymbols[suit]}</span>
                        </button>
                      );
                    })
                  ))}
                </div>
              </div>
            )}

            {/* Pot Size */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <div className="space-y-2">
                <Label htmlFor="potSize" className="text-sm text-muted-foreground">
                  Tamanho do Pote Atual (BB)
                </Label>
                <Input
                  id="potSize"
                  type="number"
                  placeholder="ex: 45"
                  value={potSize}
                  onChange={(e) => setPotSize(e.target.value)}
                  className="h-11 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)] font-mono focus:border-primary"
                />
              </div>
            </div>

            {/* Analyze Button */}
            <Button 
              variant="gold" 
              size="lg" 
              className="w-full h-12"
              onClick={handleAnalyze}
              disabled={heroCards.length < 2 || boardCards.length < 3}
            >
              <Crosshair className="w-5 h-5 mr-2" />
              Obter Recomendação
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Recommendation Card */}
            <div className={cn(
              "rounded-xl bg-[hsl(220,18%,8%)] border p-5 transition-all",
              recommendation && recommendation.action === "bet" && "border-success/50",
              recommendation && recommendation.action === "check" && "border-warning/50",
              recommendation && recommendation.action === "fold" && "border-destructive/50",
              !recommendation && "border-[hsl(220,15%,15%)]"
            )}>
              <h3 className="font-semibold text-foreground mb-4">Recomendação</h3>
              
              {recommendation ? (
                <div className="space-y-5">
                  {/* Main action */}
                  <div className={cn(
                    "flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold",
                    recommendation.action === "bet" && "bg-success/20 text-success border border-success/30",
                    recommendation.action === "check" && "bg-warning/20 text-warning border border-warning/30",
                    recommendation.action === "fold" && "bg-destructive/20 text-destructive border border-destructive/30"
                  )}>
                    {recommendation.action === "bet" && "🎯 APOSTAR"}
                    {recommendation.action === "check" && "⏸ CHECK"}
                    {recommendation.action === "fold" && "✗ FOLD"}
                  </div>

                  {/* Sizing suggestion */}
                  {recommendation.sizing && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sizing Sugerido</p>
                      <div className="grid grid-cols-3 gap-2">
                        {["33%", "50%", "75%", "100%", "150%", "All-in"].map((size) => (
                          <button
                            key={size}
                            className={cn(
                              "py-2.5 rounded-lg text-sm font-medium transition-all",
                              size === recommendation.sizing
                                ? "bg-primary text-primary-foreground"
                                : "bg-[hsl(220,15%,12%)] text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equity change */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220,15%,10%)]">
                    <span className="text-sm text-muted-foreground">Mudança na Equity</span>
                    <div className={cn(
                      "flex items-center gap-1 font-mono font-bold",
                      recommendation.equityChange >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {recommendation.equityChange >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {recommendation.equityChange >= 0 ? "+" : ""}
                        {recommendation.equityChange}%
                      </span>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Análise</p>
                    <p className="text-sm text-foreground leading-relaxed">{recommendation.reason}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Crosshair className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Selecione sua mão e o board, depois clique em analisar
                  </p>
                </div>
              )}
            </div>

            {/* Board Texture Analysis */}
            {boardCards.length >= 3 && (
              <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
                <h3 className="font-semibold text-foreground mb-4">Textura do Board</h3>
                <div className="space-y-2">
                  {[
                    { label: "Textura", value: "Seco" },
                    { label: "Flush Draws", value: "Nenhum" },
                    { label: "Straight Draws", value: "Gutshot possível" },
                    { label: "Pareado", value: "Não" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm py-1.5">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-foreground font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
