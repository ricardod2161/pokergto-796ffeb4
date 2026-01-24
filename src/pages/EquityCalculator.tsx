import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PokerCard, CardPlaceholder } from "@/components/poker/PokerCard";
import { Calculator, RotateCcw, History, Grid3X3 } from "lucide-react";
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

export default function EquityCalculator() {
  const [heroCards, setHeroCards] = useState<Card[]>([]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [showCardPicker, setShowCardPicker] = useState<"hero" | "board" | null>(null);
  const [results, setResults] = useState<{ win: number; tie: number; lose: number } | null>(null);

  const handleCardSelect = (rank: Rank, suit: Suit) => {
    const card: Card = { rank, suit };
    
    if (showCardPicker === "hero" && heroCards.length < 2) {
      setHeroCards([...heroCards, card]);
      if (heroCards.length === 1) setShowCardPicker(null);
    } else if (showCardPicker === "board" && boardCards.length < 5) {
      setBoardCards([...boardCards, card]);
      if (boardCards.length === 4) setShowCardPicker(null);
    }
  };

  const isCardUsed = (rank: Rank, suit: Suit) => {
    return [...heroCards, ...boardCards].some(c => c.rank === rank && c.suit === suit);
  };

  const handleCalculate = () => {
    setResults({
      win: 65.4,
      tie: 2.1,
      lose: 32.5
    });
  };

  const handleReset = () => {
    setHeroCards([]);
    setBoardCards([]);
    setResults(null);
    setShowCardPicker(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calculadora de Equity</h1>
            <p className="text-sm text-muted-foreground">Calcule equity mão vs range</p>
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

            {/* Calculate Button */}
            <Button 
              variant="gold" 
              size="lg" 
              className="w-full h-12"
              onClick={handleCalculate}
              disabled={heroCards.length < 2}
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calcular Equity
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Results Card */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <h3 className="font-semibold text-foreground mb-4">Resultados</h3>
              
              {results ? (
                <div className="space-y-4">
                  {/* Main equity display */}
                  <div className="text-center py-6 rounded-xl bg-[hsl(220,15%,10%)]">
                    <span className="text-4xl font-bold font-mono text-success">{results.win}%</span>
                    <p className="text-xs text-muted-foreground mt-1">Equity</p>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                      <span className="text-sm text-muted-foreground">Vitória</span>
                      <span className="font-mono font-bold text-success">{results.win}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <span className="text-sm text-muted-foreground">Empate</span>
                      <span className="font-mono font-bold text-warning">{results.tie}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <span className="text-sm text-muted-foreground">Derrota</span>
                      <span className="font-mono font-bold text-destructive">{results.lose}%</span>
                    </div>
                  </div>

                  {/* Equity bar */}
                  <div className="h-3 rounded-full overflow-hidden flex bg-[hsl(220,15%,12%)]">
                    <div 
                      className="bg-success transition-all"
                      style={{ width: `${results.win}%` }}
                    />
                    <div 
                      className="bg-warning transition-all"
                      style={{ width: `${results.tie}%` }}
                    />
                    <div 
                      className="bg-destructive transition-all"
                      style={{ width: `${results.lose}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Grid3X3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Selecione sua mão e clique em calcular para ver a equity
                  </p>
                </div>
              )}
            </div>

            {/* History */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Cálculos Recentes</h3>
              </div>
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum cálculo ainda
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
