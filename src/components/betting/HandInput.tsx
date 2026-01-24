import { Button } from "@/components/ui/button";
import { PokerCard, CardPlaceholder } from "@/components/poker/PokerCard";
import { X } from "lucide-react";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface Card {
  rank: Rank;
  suit: Suit;
}

interface HandInputProps {
  label: string;
  cards: Card[];
  maxCards: number;
  isActive: boolean;
  onToggle: () => void;
  onRemoveCard?: (index: number) => void;
  buttonLabel: string;
  sublabels?: string[];
}

export function HandInput({ 
  label, 
  cards, 
  maxCards, 
  isActive, 
  onToggle, 
  onRemoveCard,
  buttonLabel,
  sublabels 
}: HandInputProps) {
  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">{label}</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToggle}
          className={`border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,15%)] text-xs h-7 ${
            isActive ? 'bg-primary/20 border-primary/50' : ''
          }`}
        >
          {buttonLabel}
        </Button>
      </div>
      <div className="flex gap-2 items-center">
        {cards.map((card, i) => (
          <div key={i} className="relative group">
            <PokerCard rank={card.rank} suit={card.suit} size="md" />
            {onRemoveCard && (
              <button
                onClick={() => onRemoveCard(i)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            )}
          </div>
        ))}
        {Array.from({ length: maxCards - cards.length }).map((_, i) => (
          <CardPlaceholder key={`empty-${i}`} size="md" />
        ))}
      </div>
      {sublabels && sublabels.length > 0 && (
        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
          {sublabels.map((label, i) => (
            <span 
              key={label}
              className={cards.length >= (label === "Flop" ? 3 : label === "Turn" ? 4 : 5) ? "text-primary" : ""}
            >
              {label}
              {i < sublabels.length - 1 && <span className="ml-2">•</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
