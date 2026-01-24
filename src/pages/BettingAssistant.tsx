import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PokerCard, CardPlaceholder } from "@/components/poker/PokerCard";
import { TrendingUp, TrendingDown, Minus, Crosshair } from "lucide-react";
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
    // Demo recommendation
    setRecommendation({
      action: "bet",
      sizing: "75% pot",
      reason: "Strong top pair with backdoor flush draw on a wet board. Betting for value and protection.",
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
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Betting Assistant</h1>
          <p className="text-muted-foreground">Get optimal bet sizing recommendations</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Hand */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Your Hand</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCardPicker(showCardPicker === "hero" ? null : "hero")}
              >
                {heroCards.length < 2 ? "Select Cards" : "Change"}
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
                {boardCards.length < 5 ? "Add Cards" : "Change"}
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
            
            {/* Equity evolution indicator */}
            {boardCards.length >= 3 && heroCards.length === 2 && (
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Equity Evolution:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Preflop</span>
                    <span className="font-mono text-foreground">52%</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-success" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Flop</span>
                    <span className="font-mono text-success">78%</span>
                  </div>
                  {boardCards.length >= 4 && (
                    <>
                      <TrendingUp className="w-4 h-4 text-success" />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Turn</span>
                        <span className="font-mono text-success">82%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card Picker */}
          {showCardPicker && (
            <div className="card-glass rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">
                Select {showCardPicker === "hero" ? "Hero" : "Board"} Card
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCardPicker(null)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}

          {/* Pot Size */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="potSize">Current Pot Size (BB)</Label>
              <Input
                id="potSize"
                type="number"
                placeholder="e.g., 45"
                value={potSize}
                onChange={(e) => setPotSize(e.target.value)}
                className="h-11 bg-input border-border font-mono"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <Button 
            variant="gold" 
            size="lg" 
            className="w-full"
            onClick={handleAnalyze}
            disabled={heroCards.length < 2 || boardCards.length < 3}
          >
            <Crosshair className="w-5 h-5 mr-2" />
            Get Recommendation
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Recommendation Card */}
          <div className={cn(
            "card-glass rounded-xl p-6 transition-all",
            recommendation && recommendation.action === "bet" && "border-success/50",
            recommendation && recommendation.action === "check" && "border-warning/50",
            recommendation && recommendation.action === "fold" && "border-destructive/50"
          )}>
            <h3 className="font-semibold text-foreground mb-4">Recommendation</h3>
            
            {recommendation ? (
              <div className="space-y-6">
                {/* Main action */}
                <div className={cn(
                  "flex items-center justify-center gap-3 py-4 px-4 rounded-lg text-xl font-bold",
                  recommendation.action === "bet" && "bg-success/20 text-success",
                  recommendation.action === "check" && "bg-warning/20 text-warning",
                  recommendation.action === "fold" && "bg-destructive/20 text-destructive"
                )}>
                  {recommendation.action === "bet" && "🎯 BET"}
                  {recommendation.action === "check" && "⏸ CHECK"}
                  {recommendation.action === "fold" && "✗ FOLD"}
                </div>

                {/* Sizing suggestion */}
                {recommendation.sizing && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Suggested Sizing:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["33%", "50%", "75%", "100%", "150%", "All-in"].map((size) => (
                        <button
                          key={size}
                          className={cn(
                            "py-2 rounded-lg text-sm font-medium transition-all",
                            size === recommendation.sizing
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equity change */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Equity Change</span>
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
                  <p className="text-sm text-muted-foreground">Analysis:</p>
                  <p className="text-sm text-foreground">{recommendation.reason}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Crosshair className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select your hand and the board, then click analyze
                </p>
              </div>
            )}
          </div>

          {/* Board Texture Analysis */}
          {boardCards.length >= 3 && (
            <div className="card-glass rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Board Texture</h3>
              <div className="space-y-2">
                {[
                  { label: "Texture", value: "Dry" },
                  { label: "Flush Draws", value: "None" },
                  { label: "Straight Draws", value: "Gutshot possible" },
                  { label: "Paired", value: "No" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
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
  );
}
