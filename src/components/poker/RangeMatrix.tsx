import { cn } from "@/lib/utils";
import { useState } from "react";

const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

type HandAction = "raise" | "call" | "fold" | "mixed";

interface HandData {
  action: HandAction;
  frequency: number;
  ev?: number;
}

interface RangeMatrixProps {
  position: string;
  rangeData: Record<string, HandData>;
  onHandClick?: (hand: string, data: HandData) => void;
  selectedHand?: string;
}

function getHandName(row: number, col: number): string {
  if (row === col) {
    return `${ranks[row]}${ranks[col]}`;
  } else if (row < col) {
    return `${ranks[row]}${ranks[col]}s`;
  } else {
    return `${ranks[col]}${ranks[row]}o`;
  }
}

function getActionStyles(action: HandAction, frequency: number): { bg: string; text: string } {
  const opacity = Math.max(0.4, Math.min(1, frequency));
  
  switch (action) {
    case "raise":
      return { 
        bg: `rgba(34, 197, 94, ${opacity})`, 
        text: frequency > 0.5 ? "white" : "rgba(255,255,255,0.9)" 
      };
    case "call":
      return { 
        bg: `rgba(59, 130, 246, ${opacity})`, 
        text: frequency > 0.5 ? "white" : "rgba(255,255,255,0.9)" 
      };
    case "fold":
      return { 
        bg: "rgba(55, 65, 81, 0.3)", 
        text: "rgba(156, 163, 175, 0.7)" 
      };
    case "mixed":
      return { 
        bg: `linear-gradient(135deg, rgba(34, 197, 94, ${opacity}) 50%, rgba(59, 130, 246, ${opacity}) 50%)`, 
        text: "white" 
      };
    default:
      return { bg: "rgba(55, 65, 81, 0.2)", text: "rgba(156, 163, 175, 0.5)" };
  }
}

export function RangeMatrix({ position, rangeData, onHandClick, selectedHand }: RangeMatrixProps) {
  const [hoveredHand, setHoveredHand] = useState<string | null>(null);

  const totalHands = 169;
  const playableHands = Object.values(rangeData).filter(h => h.action !== "fold").length;
  const playablePercent = ((playableHands / totalHands) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Range de Abertura - {position}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Clique em uma mão para ver detalhes
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-primary">{playablePercent}%</p>
          <p className="text-xs text-muted-foreground">{playableHands} de {totalHands} mãos</p>
        </div>
      </div>

      {/* Matrix Container */}
      <div className="relative">
        {/* Row labels (left side) */}
        <div className="absolute -left-7 top-0 h-full flex flex-col">
          {ranks.map((rank, idx) => (
            <div 
              key={rank} 
              className="flex-1 flex items-center justify-end pr-2 text-xs font-mono text-muted-foreground"
              style={{ height: `${100/13}%` }}
            >
              {rank}
            </div>
          ))}
        </div>

        {/* Column labels (top) */}
        <div className="flex mb-1.5 pl-0">
          {ranks.map((rank) => (
            <div 
              key={rank} 
              className="flex-1 text-center text-xs font-mono text-muted-foreground"
            >
              {rank}
            </div>
          ))}
        </div>

        {/* The Matrix Grid */}
        <div className="grid grid-cols-13 gap-[3px] p-2 bg-background/50 rounded-xl border border-border/50">
          {ranks.map((_, rowIdx) => (
            ranks.map((_, colIdx) => {
              const hand = getHandName(rowIdx, colIdx);
              const data = rangeData[hand] || { action: "fold" as const, frequency: 0 };
              const isSelected = selectedHand === hand;
              const isHovered = hoveredHand === hand;
              const isPair = rowIdx === colIdx;
              const isSuited = rowIdx < colIdx;
              const styles = getActionStyles(data.action, data.frequency);

              return (
                <button
                  key={hand}
                  onClick={() => onHandClick?.(hand, data)}
                  onMouseEnter={() => setHoveredHand(hand)}
                  onMouseLeave={() => setHoveredHand(null)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-md transition-all duration-200",
                    "text-[11px] font-mono font-medium",
                    "hover:scale-[1.15] hover:z-20 hover:shadow-xl hover:shadow-black/30",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background",
                    isSelected && "ring-2 ring-gold ring-offset-1 ring-offset-background scale-110 z-20 shadow-lg shadow-gold/20",
                    isPair && "font-bold",
                    data.action === "fold" && "opacity-60 hover:opacity-100"
                  )}
                  style={{
                    background: data.action === "mixed" ? styles.bg : styles.bg,
                    color: styles.text,
                  }}
                  title={`${hand} - ${data.action} (${(data.frequency * 100).toFixed(0)}%)`}
                >
                  {hand}
                </button>
              );
            })
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-success shadow-sm" />
            <span className="text-sm text-muted-foreground">Raise/Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-call shadow-sm" />
            <span className="text-sm text-muted-foreground">Call</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gray-600/30 border border-border/50" />
            <span className="text-sm text-muted-foreground">Fold</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-muted-foreground/70">AKs = suited</span>
            <span className="text-xs text-muted-foreground/70">|</span>
            <span className="text-xs text-muted-foreground/70">AKo = offsuit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
