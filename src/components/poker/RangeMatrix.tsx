import { cn } from "@/lib/utils";
import { useMemo } from "react";

const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

type HandAction = "raise" | "call" | "fold" | "mixed";

interface HandData {
  action: HandAction;
  frequency: number;
  ev?: number;
}

interface RangeMatrixProps {
  rangeData: Record<string, HandData>;
  onHandClick?: (hand: string, data: HandData) => void;
  selectedHand?: string;
  compact?: boolean;
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
  if (action === "fold") {
    return "bg-[hsl(220,15%,12%)] text-[hsl(220,10%,35%)]";
  }
  if (action === "raise") {
    return "bg-[hsl(142,70%,35%)] text-white";
  }
  if (action === "call") {
    return "bg-[hsl(210,85%,45%)] text-white";
  }
  if (action === "mixed") {
    return "bg-gradient-to-br from-[hsl(142,70%,35%)] to-[hsl(210,85%,45%)] text-white";
  }
  return "bg-[hsl(220,15%,12%)] text-[hsl(220,10%,35%)]";
}

export function RangeMatrix({ rangeData, onHandClick, selectedHand, compact = false }: RangeMatrixProps) {
  const cellSize = compact ? { w: 26, h: 22 } : { w: 32, h: 28 };
  
  const cells = useMemo(() => {
    const result = [];
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        const hand = getHandName(row, col);
        const data = rangeData[hand] || { action: "fold" as const, frequency: 0 };
        const isSelected = selectedHand === hand;
        const isPair = row === col;

        result.push(
          <button
            key={hand}
            onClick={() => onHandClick?.(hand, data)}
            className={cn(
              "flex items-center justify-center font-mono leading-none transition-all duration-100",
              compact ? "text-[8px]" : "text-[9px]",
              getActionColor(data.action, data.frequency),
              isSelected && "ring-1 ring-[hsl(43,96%,56%)] ring-offset-1 ring-offset-[hsl(220,20%,7%)] z-20 scale-110",
              isPair && "font-semibold",
              data.action !== "fold" && "hover:brightness-110 hover:z-10"
            )}
            style={{
              width: cellSize.w,
              height: cellSize.h,
            }}
          >
            {hand}
          </button>
        );
      }
    }
    return result;
  }, [rangeData, selectedHand, onHandClick, cellSize, compact]);

  return (
    <div className="inline-flex flex-col select-none">
      {/* Column headers */}
      <div className="flex" style={{ marginLeft: compact ? 14 : 18 }}>
        {ranks.map((rank) => (
          <div 
            key={rank} 
            className="text-[9px] font-mono text-[hsl(220,15%,40%)] flex items-center justify-center font-medium"
            style={{ width: cellSize.w, height: 14 }}
          >
            {rank}
          </div>
        ))}
      </div>
      
      {/* Grid with row headers */}
      <div className="flex">
        {/* Row headers */}
        <div className="flex flex-col">
          {ranks.map((rank) => (
            <div 
              key={rank} 
              className="text-[9px] font-mono text-[hsl(220,15%,40%)] flex items-center justify-center font-medium"
              style={{ width: compact ? 14 : 18, height: cellSize.h }}
            >
              {rank}
            </div>
          ))}
        </div>
        
        {/* Matrix */}
        <div 
          className="rounded overflow-hidden border border-[hsl(220,15%,15%)]"
          style={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(13, ${cellSize.w}px)`,
            gridTemplateRows: `repeat(13, ${cellSize.h}px)`,
            gap: '1px',
            backgroundColor: 'hsl(220, 15%, 8%)'
          }}
        >
          {cells}
        </div>
      </div>
    </div>
  );
}
