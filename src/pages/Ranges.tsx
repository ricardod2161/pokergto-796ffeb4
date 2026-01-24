import { useState } from "react";
import { RangeMatrix } from "@/components/poker/RangeMatrix";
import { PositionSelector } from "@/components/poker/PositionSelector";
import { positionRanges } from "@/data/rangeData";
import { cn } from "@/lib/utils";

const stackDepths = ["20bb", "40bb", "60bb", "100bb", "150bb+"];
const actions = ["Open", "vs 3-Bet", "3-Bet", "4-Bet"];

interface HandData {
  action: "raise" | "call" | "fold" | "mixed";
  frequency: number;
  ev?: number;
}

export default function Ranges() {
  const [selectedPosition, setSelectedPosition] = useState("CO");
  const [selectedStack, setSelectedStack] = useState("100bb");
  const [selectedAction, setSelectedAction] = useState("Open");
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [selectedHandData, setSelectedHandData] = useState<HandData | null>(null);

  const handleHandClick = (hand: string, data: HandData) => {
    setSelectedHand(hand);
    setSelectedHandData(data);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Range Analyzer</h1>
        <p className="text-muted-foreground">8-Max GTO opening ranges by position</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Panel - Filters */}
        <div className="xl:col-span-1 space-y-6">
          {/* Position Selector */}
          <div className="card-glass rounded-xl p-5">
            <PositionSelector
              selectedPosition={selectedPosition}
              onPositionChange={setSelectedPosition}
            />
          </div>

          {/* Stack Depth */}
          <div className="card-glass rounded-xl p-5 space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Stack Depth</label>
            <div className="flex flex-wrap gap-2">
              {stackDepths.map((stack) => (
                <button
                  key={stack}
                  onClick={() => setSelectedStack(stack)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                    selectedStack === stack
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {stack}
                </button>
              ))}
            </div>
          </div>

          {/* Action Type */}
          <div className="card-glass rounded-xl p-5 space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Scenario</label>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action}
                  onClick={() => setSelectedAction(action)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                    selectedAction === action
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Hand Details Panel */}
          {selectedHand && selectedHandData && (
            <div className="card-glass rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Hand Details</h3>
                <span className="text-2xl font-mono font-bold text-foreground">{selectedHand}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Action</span>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-sm font-medium capitalize",
                    selectedHandData.action === "raise" && "bg-success/20 text-success",
                    selectedHandData.action === "call" && "bg-call/20 text-call",
                    selectedHandData.action === "fold" && "bg-muted text-muted-foreground"
                  )}>
                    {selectedHandData.action}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Frequency</span>
                  <span className="font-mono text-foreground">
                    {(selectedHandData.frequency * 100).toFixed(0)}%
                  </span>
                </div>
                
                {selectedHandData.ev !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expected Value</span>
                    <span className={cn(
                      "font-mono font-medium",
                      selectedHandData.ev >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {selectedHandData.ev >= 0 ? "+" : ""}{(selectedHandData.ev * 100).toFixed(1)} BB
                    </span>
                  </div>
                )}
              </div>

              {/* Strategy breakdown */}
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {selectedHandData.action === "raise" && 
                    `This hand is a clear open in ${selectedPosition} position. Consider sizing based on stack depth and table dynamics.`
                  }
                  {selectedHandData.action === "fold" && 
                    `This hand is typically too weak to open from ${selectedPosition}. Folding is the optimal play.`
                  }
                  {selectedHandData.action === "call" && 
                    `Mixed strategy hand. Can be played as a call or raise depending on opponent tendencies.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Matrix */}
        <div className="xl:col-span-3">
          <div className="card-glass rounded-xl p-6">
            <RangeMatrix
              position={selectedPosition}
              rangeData={positionRanges[selectedPosition] || positionRanges.CO}
              onHandClick={handleHandClick}
              selectedHand={selectedHand || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
