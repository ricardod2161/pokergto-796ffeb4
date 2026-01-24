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

interface CardPickerProps {
  usedCards: Card[];
  onCardSelect: (card: Card) => void;
  title?: string;
}

export function CardPicker({ usedCards, onCardSelect, title }: CardPickerProps) {
  const isCardUsed = (rank: Rank, suit: Suit) => {
    return usedCards.some(c => c.rank === rank && c.suit === suit);
  };

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      {title && (
        <h3 className="font-semibold text-foreground mb-3 text-sm">{title}</h3>
      )}
      <div 
        className="grid gap-[2px] bg-[hsl(220,15%,12%)] p-1 rounded-lg" 
        style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}
      >
        {suits.map(suit => (
          ranks.map(rank => {
            const used = isCardUsed(rank, suit);
            return (
              <button
                key={`${rank}${suit}`}
                onClick={() => !used && onCardSelect({ rank, suit })}
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
  );
}
