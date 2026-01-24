import { cn } from "@/lib/utils";

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

function getActionStyles(action: HandAction, frequency: number): string {
  const baseStyles = {
    fold: "bg-slate-800/60 text-slate-500 hover:bg-slate-700/60",
    call: "bg-sky-600 text-white hover:bg-sky-500",
    raise: "bg-emerald-600 text-white hover:bg-emerald-500",
    mixed: "bg-gradient-to-br from-emerald-600 to-sky-600 text-white",
  };
  return baseStyles[action] || baseStyles.fold;
}

export function RangeMatrix({ rangeData, onHandClick, selectedHand }: RangeMatrixProps) {
  const cells = [];
  
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = getHandName(row, col);
      const data = rangeData[hand] || { action: "fold" as const, frequency: 0 };
      const isSelected = selectedHand === hand;
      const isPair = row === col;
      const isSuited = row < col;

      cells.push(
        <button
          key={hand}
          onClick={() => onHandClick?.(hand, data)}
          className={cn(
            "flex items-center justify-center text-[9px] font-mono leading-none transition-all duration-75 rounded-[2px]",
            getActionStyles(data.action, data.frequency),
            isSelected && "ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 z-10 scale-110",
            isPair && "font-semibold"
          )}
        >
          {hand}
        </button>
      );
    }
  }

  return (
    <div className="inline-flex flex-col select-none">
      {/* Column headers */}
      <div className="flex" style={{ marginLeft: 18 }}>
        {ranks.map((rank) => (
          <div 
            key={rank} 
            className="text-[10px] font-mono text-slate-500 flex items-center justify-center font-medium"
            style={{ width: 30, height: 16 }}
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
              className="text-[10px] font-mono text-slate-500 flex items-center justify-center font-medium"
              style={{ width: 18, height: 26 }}
            >
              {rank}
            </div>
          ))}
        </div>
        
        {/* Matrix */}
        <div 
          className="rounded-md overflow-hidden border border-slate-700/50"
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(13, 30px)',
            gridTemplateRows: 'repeat(13, 26px)',
            gap: '1px',
            backgroundColor: 'rgba(51, 65, 85, 0.3)'
          }}
        >
          {cells}
        </div>
      </div>
    </div>
  );
}
