import { cn } from "@/lib/utils";

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

function getActionColor(action: HandAction, frequency: number): string {
  const opacity = Math.max(0.3, frequency);
  
  switch (action) {
    case "raise":
      return `rgba(34, 197, 94, ${opacity})`;
    case "call":
      return `rgba(59, 130, 246, ${opacity})`;
    case "fold":
      return `rgba(107, 114, 128, ${0.2 + frequency * 0.1})`;
    case "mixed":
      return `rgba(168, 85, 247, ${opacity})`;
    default:
      return `rgba(107, 114, 128, 0.2)`;
  }
}

export function RangeMatrix({ position, rangeData, onHandClick, selectedHand }: RangeMatrixProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Range de Abertura {position}
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {Object.values(rangeData).filter(h => h.action !== "fold").length * 100 / 169}% das mãos
        </span>
      </div>
      
      <div className="grid grid-cols-13 gap-0.5 bg-border/30 p-1 rounded-lg">
        {ranks.map((_, rowIdx) => (
          ranks.map((_, colIdx) => {
            const hand = getHandName(rowIdx, colIdx);
            const data = rangeData[hand] || { action: "fold", frequency: 0 };
            const isSelected = selectedHand === hand;
            const isPair = rowIdx === colIdx;

            return (
              <button
                key={hand}
                onClick={() => onHandClick?.(hand, data)}
                className={cn(
                  "aspect-square flex items-center justify-center text-[10px] font-mono font-medium rounded-sm transition-all duration-150",
                  "hover:scale-110 hover:z-10 hover:shadow-lg relative",
                  isSelected && "ring-2 ring-gold scale-110 z-10",
                  isPair && "font-semibold"
                )}
                style={{
                  backgroundColor: getActionColor(data.action, data.frequency),
                  color: data.action === "fold" ? "hsl(var(--muted-foreground))" : "white",
                }}
              >
                {hand}
              </button>
            );
          })
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span className="text-muted-foreground">Raise</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-call" />
          <span className="text-muted-foreground">Call</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <span className="text-muted-foreground">Fold</span>
        </div>
      </div>
    </div>
  );
}
