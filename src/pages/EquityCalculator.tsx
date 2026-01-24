import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardPlaceholder, PokerCard } from "@/components/poker/PokerCard";
import { Calculator, RotateCcw, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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

  const pieData = results ? [
    { name: "Vitória", value: results.win, color: "hsl(142, 71%, 45%)" },
    { name: "Empate", value: results.tie, color: "hsl(43, 96%, 56%)" },
    { name: "Derrota", value: results.lose, color: "hsl(0, 72%, 51%)" },
  ] : [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calculadora de Equity</h1>
          <p className="text-muted-foreground">Calcule equity mão vs range</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reiniciar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Hand */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Sua Mão</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCardPicker(showCardPicker === "hero" ? null : "hero")}
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
          <div className="card-glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Board</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCardPicker(showCardPicker === "board" ? null : "board")}
              >
                Adicionar Cartas
              </Button>
            </div>
            <div className="flex gap-3">
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
            <div className="card-glass rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">
                Selecionar Carta {showCardPicker === "hero" ? "da Mão" : "do Board"}
              </h3>
              <div className="grid grid-cols-13 gap-1">
                {suits.map(suit => (
                  ranks.map(rank => {
                    const used = isCardUsed(rank, suit);
                    return (
                      <button
                        key={`${rank}${suit}`}
                        onClick={() => !used && handleCardSelect(rank, suit)}
                        disabled={used}
                        className={cn(
                          "aspect-square flex items-center justify-center text-xs font-mono font-semibold rounded transition-all",
                          "border",
                          used 
                            ? "bg-muted/50 text-muted-foreground border-border cursor-not-allowed opacity-50"
                            : "bg-white text-gray-900 border-gray-200 hover:scale-110 hover:shadow-lg cursor-pointer",
                          (suit === "hearts" || suit === "diamonds") && !used && "text-red-500"
                        )}
                      >
                        <span>{rank}</span>
                        <span className="text-[8px]">{suitSymbols[suit]}</span>
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
            className="w-full"
            onClick={handleCalculate}
            disabled={heroCards.length < 2}
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calcular Equity
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Results Card */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Resultados</h3>
            
            {results ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                    <span className="text-sm text-muted-foreground">Vitória</span>
                    <span className="font-mono font-bold text-success">{results.win}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                    <span className="text-sm text-muted-foreground">Empate</span>
                    <span className="font-mono font-bold text-warning">{results.tie}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                    <span className="text-sm text-muted-foreground">Derrota</span>
                    <span className="font-mono font-bold text-destructive">{results.lose}%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Selecione sua mão e clique em calcular para ver a equity
                </p>
              </div>
            )}
          </div>

          {/* History */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Cálculos Recentes</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="text-center py-4">Nenhum cálculo ainda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
