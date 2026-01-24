import { useState } from "react";
import { cn } from "@/lib/utils";
import { History, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface Card {
  rank: Rank;
  suit: Suit;
}

export interface HandHistoryEntry {
  id: string;
  timestamp: Date;
  heroCards: Card[];
  boardCards: Card[];
  potSize: number;
  street: "flop" | "turn" | "river";
  action: string;
  sizing?: string;
  equity: number;
  result?: "correct" | "incorrect" | "pending";
}

interface HandHistoryPanelProps {
  history: HandHistoryEntry[];
  onSelect: (entry: HandHistoryEntry) => void;
  onClear: () => void;
}

const suitSymbols: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

function CardDisplay({ card }: { card: Card }) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  return (
    <span className={cn("font-mono font-bold", isRed ? "text-red-400" : "text-foreground")}>
      {card.rank}{suitSymbols[card.suit]}
    </span>
  );
}

export function HandHistoryPanel({ history, onSelect, onClear }: HandHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayHistory = isExpanded ? history : history.slice(0, 3);

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Histórico</h3>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhuma análise no histórico
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {displayHistory.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                className="w-full text-left p-2 rounded-lg bg-[hsl(220,15%,10%)] hover:bg-[hsl(220,15%,12%)] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    {entry.heroCards.map((card, i) => (
                      <CardDisplay key={i} card={card} />
                    ))}
                    <span className="text-muted-foreground mx-1">|</span>
                    {entry.boardCards.slice(0, 3).map((card, i) => (
                      <CardDisplay key={i} card={card} />
                    ))}
                    {entry.boardCards.length > 3 && (
                      <span className="text-muted-foreground/50">+{entry.boardCards.length - 3}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-mono font-bold",
                    entry.equity >= 50 ? "text-success" : "text-destructive"
                  )}>
                    {entry.equity}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded capitalize",
                      entry.action === "bet" || entry.action === "raise" 
                        ? "bg-success/20 text-success"
                        : entry.action === "call"
                          ? "bg-primary/20 text-primary"
                          : entry.action === "check"
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive"
                    )}>
                      {entry.action}
                      {entry.sizing && ` ${entry.sizing}`}
                    </span>
                    <span className="text-muted-foreground">{entry.potSize}bb pot</span>
                  </div>
                  <span className="text-muted-foreground/50">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          {history.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Ver todos ({history.length - 3} mais)
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
