import { cn } from "@/lib/utils";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface PokerCardProps {
  rank: Rank;
  suit: Suit;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  className?: string;
}

const suitSymbols: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const suitColors: Record<Suit, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-gray-900",
  spades: "text-gray-900",
};

const sizes = {
  sm: "w-8 h-11 text-xs",
  md: "w-12 h-16 text-sm",
  lg: "w-16 h-22 text-lg",
};

export function PokerCard({ rank, suit, size = "md", faceDown = false, className }: PokerCardProps) {
  if (faceDown) {
    return (
      <div className={cn(
        "rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg flex items-center justify-center border-2 border-primary/50",
        sizes[size],
        className
      )}>
        <span className="text-primary-foreground font-bold">♠</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg bg-white shadow-lg flex flex-col items-center justify-center font-bold border border-gray-200",
      sizes[size],
      suitColors[suit],
      className
    )}>
      <span className="leading-none">{rank}</span>
      <span className="leading-none">{suitSymbols[suit]}</span>
    </div>
  );
}

interface CardPlaceholderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CardPlaceholder({ size = "md", className }: CardPlaceholderProps) {
  return (
    <div className={cn(
      "rounded-lg border-2 border-dashed border-border/50 bg-muted/30 flex items-center justify-center",
      sizes[size],
      className
    )}>
      <span className="text-muted-foreground text-lg">?</span>
    </div>
  );
}
