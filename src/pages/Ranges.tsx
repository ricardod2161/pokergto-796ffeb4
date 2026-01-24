import { useState, useMemo } from "react";
import { RangeMatrix } from "@/components/poker/RangeMatrix";
import { 
  openRanges, 
  threeBetRanges, 
  coldCallRanges, 
  squeezeRanges, 
  isoRaiseRanges,
  vs3BetRanges,
  fourBetRanges,
  bbDefenseRanges,
  calculateRangeStats,
  getScenarioInfo
} from "@/data/gtoRanges";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Zap, Shield, Users } from "lucide-react";

const positions = [
  { id: "UTG", label: "UTG", color: "hsl(0, 70%, 45%)" },
  { id: "UTG1", label: "UTG+1", color: "hsl(25, 70%, 45%)" },
  { id: "MP", label: "MP", color: "hsl(45, 70%, 45%)" },
  { id: "HJ", label: "HJ", color: "hsl(80, 60%, 40%)" },
  { id: "CO", label: "CO", color: "hsl(160, 60%, 38%)" },
  { id: "BTN", label: "BTN", color: "hsl(210, 70%, 50%)" },
  { id: "SB", label: "SB", color: "hsl(270, 60%, 50%)" },
  { id: "BB", label: "BB", color: "hsl(320, 60%, 50%)" },
];

const scenarioCategories = [
  {
    id: "offense",
    label: "Agressão",
    icon: Zap,
    scenarios: [
      { id: "open", label: "Open Raise", shortLabel: "RFI" },
      { id: "3bet", label: "3-Bet", shortLabel: "3B" },
      { id: "4bet", label: "4-Bet", shortLabel: "4B" },
      { id: "squeeze", label: "Squeeze", shortLabel: "SQZ" },
      { id: "isoraise", label: "Iso-Raise", shortLabel: "ISO" },
    ]
  },
  {
    id: "defense",
    label: "Defesa",
    icon: Shield,
    scenarios: [
      { id: "vs3bet", label: "vs 3-Bet", shortLabel: "vs3B" },
      { id: "coldcall", label: "Cold Call", shortLabel: "CC" },
      { id: "bbdefense", label: "BB Defense", shortLabel: "BBD" },
    ]
  }
];

const stackOptions = [
  { id: "20bb", label: "20bb" },
  { id: "40bb", label: "40bb" },
  { id: "60bb", label: "60bb" },
  { id: "100bb", label: "100bb" },
  { id: "150bb+", label: "150bb+" },
];

interface HandData {
  action: "raise" | "call" | "fold" | "mixed";
  frequency: number;
  ev?: number;
}

const bbDefensePositions = [
  { id: "vsUTG", label: "vs UTG" },
  { id: "vsMP", label: "vs MP" },
  { id: "vsCO", label: "vs CO" },
  { id: "vsBTN", label: "vs BTN" },
  { id: "vsSB", label: "vs SB" },
];

export default function Ranges() {
  const [selectedPosition, setSelectedPosition] = useState("CO");
  const [selectedScenario, setSelectedScenario] = useState("open");
  const [selectedStack, setSelectedStack] = useState("100bb");
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [selectedHandData, setSelectedHandData] = useState<HandData | null>(null);

  const handleHandClick = (hand: string, data: HandData) => {
    setSelectedHand(hand);
    setSelectedHandData(data);
  };

  const availablePositions = useMemo(() => {
    const getRangeData = () => {
      switch (selectedScenario) {
        case "open": return openRanges;
        case "3bet": return threeBetRanges;
        case "4bet": return fourBetRanges;
        case "squeeze": return squeezeRanges;
        case "coldcall": return coldCallRanges;
        case "vs3bet": return vs3BetRanges;
        case "isoraise": return isoRaiseRanges;
        case "bbdefense": return bbDefenseRanges;
        default: return openRanges;
      }
    };
    return Object.keys(getRangeData());
  }, [selectedScenario]);

  const effectivePosition = useMemo(() => {
    if (selectedScenario === "bbdefense") {
      return "vsBTN";
    }
    if (availablePositions.includes(selectedPosition)) {
      return selectedPosition;
    }
    return availablePositions[0] || "CO";
  }, [selectedPosition, availablePositions, selectedScenario]);

  const rangeData = useMemo(() => {
    switch (selectedScenario) {
      case "open": return openRanges[effectivePosition] || openRanges.CO;
      case "3bet": return threeBetRanges[effectivePosition] || threeBetRanges.BTN;
      case "4bet": return fourBetRanges[effectivePosition] || fourBetRanges.BTN;
      case "squeeze": return squeezeRanges[effectivePosition] || squeezeRanges.BTN;
      case "coldcall": return coldCallRanges[effectivePosition] || coldCallRanges.BTN;
      case "vs3bet": return vs3BetRanges[effectivePosition] || vs3BetRanges.CO;
      case "isoraise": return isoRaiseRanges[effectivePosition] || isoRaiseRanges.BTN;
      case "bbdefense": return bbDefenseRanges[effectivePosition] || bbDefenseRanges.vsBTN;
      default: return openRanges.CO;
    }
  }, [selectedScenario, effectivePosition]);

  const stats = useMemo(() => {
    const hands = Object.values(rangeData);
    const raiseHands = hands.filter(h => h.action === "raise");
    const callHands = hands.filter(h => h.action === "call");
    const foldHands = hands.filter(h => h.action === "fold");
    const playable = raiseHands.length + callHands.length;
    
    return {
      total: 169,
      playable,
      raise: raiseHands.length,
      call: callHands.length,
      fold: foldHands.length,
      playablePercent: ((playable / 169) * 100).toFixed(1),
      raisePercent: ((raiseHands.length / 169) * 100).toFixed(1),
      callPercent: ((callHands.length / 169) * 100).toFixed(1),
    };
  }, [rangeData]);

  const currentScenario = scenarioCategories
    .flatMap(c => c.scenarios)
    .find(s => s.id === selectedScenario);

  const currentPos = selectedScenario === "bbdefense" 
    ? bbDefensePositions.find(p => p.id === effectivePosition)
    : positions.find(p => p.id === effectivePosition);

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      {/* Top Navigation Bar */}
      <div className="border-b border-[hsl(220,15%,12%)] bg-[hsl(220,18%,8%)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-12 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[hsl(142,70%,45%)]" />
                <span className="text-sm font-semibold text-white">GTO Ranges</span>
              </div>
              <div className="h-4 w-px bg-[hsl(220,15%,18%)]" />
              <span className="text-xs text-[hsl(220,15%,50%)]">8-Max Cash Game • Equilibrium Strategy</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,15%)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,70%,50%)] animate-pulse" />
                <span className="text-[10px] text-[hsl(220,15%,60%)]">Solver Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Left Sidebar - Controls */}
          <div className="w-56 shrink-0 space-y-3">
            {/* Scenario Selection */}
            {scenarioCategories.map((category) => (
              <div key={category.id} className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
                <div className="px-3 py-2 border-b border-[hsl(220,15%,13%)] flex items-center gap-2">
                  <category.icon className="w-3.5 h-3.5 text-[hsl(220,15%,45%)]" />
                  <span className="text-[10px] font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider">{category.label}</span>
                </div>
                <div className="p-2 grid grid-cols-2 gap-1">
                  {category.scenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        setSelectedScenario(scenario.id);
                        setSelectedHand(null);
                        setSelectedHandData(null);
                      }}
                      className={cn(
                        "px-2 py-1.5 text-[10px] font-medium rounded transition-all text-left",
                        selectedScenario === scenario.id
                          ? "bg-[hsl(142,70%,35%)] text-white"
                          : "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,55%)] hover:bg-[hsl(220,15%,15%)] hover:text-[hsl(220,15%,70%)]"
                      )}
                    >
                      {scenario.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Position Selection */}
            <div className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
              <div className="px-3 py-2 border-b border-[hsl(220,15%,13%)] flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[hsl(220,15%,45%)]" />
                <span className="text-[10px] font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider">
                  {selectedScenario === "bbdefense" ? "Oponente" : "Posição"}
                </span>
              </div>
              <div className="p-2">
                {selectedScenario === "bbdefense" ? (
                  <div className="grid grid-cols-2 gap-1">
                    {bbDefensePositions.map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setSelectedPosition(pos.id)}
                        className={cn(
                          "px-2 py-1.5 text-[10px] font-medium rounded transition-all",
                          effectivePosition === pos.id
                            ? "bg-[hsl(210,70%,45%)] text-white"
                            : "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,55%)] hover:bg-[hsl(220,15%,15%)]"
                        )}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {positions.map((pos) => {
                      const isAvailable = availablePositions.includes(pos.id);
                      return (
                        <button
                          key={pos.id}
                          onClick={() => isAvailable && setSelectedPosition(pos.id)}
                          disabled={!isAvailable}
                          className={cn(
                            "px-1.5 py-1.5 text-[10px] font-medium rounded transition-all",
                            effectivePosition === pos.id
                              ? "text-white"
                              : isAvailable
                                ? "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,55%)] hover:bg-[hsl(220,15%,15%)]"
                                : "bg-[hsl(220,15%,8%)] text-[hsl(220,15%,25%)] cursor-not-allowed"
                          )}
                          style={effectivePosition === pos.id ? { backgroundColor: pos.color } : {}}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Stack Depth */}
            <div className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
              <div className="px-3 py-2 border-b border-[hsl(220,15%,13%)]">
                <span className="text-[10px] font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider">Stack Depth</span>
              </div>
              <div className="p-2 flex gap-1">
                {stackOptions.map((stack) => (
                  <button
                    key={stack.id}
                    onClick={() => setSelectedStack(stack.id)}
                    className={cn(
                      "flex-1 px-1 py-1.5 text-[9px] font-medium rounded transition-all",
                      selectedStack === stack.id
                        ? "bg-[hsl(43,90%,50%)] text-[hsl(220,20%,10%)]"
                        : "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,55%)] hover:bg-[hsl(220,15%,15%)]"
                    )}
                  >
                    {stack.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Matrix */}
          <div className="flex-1 min-w-0">
            <div className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
              {/* Matrix Header */}
              <div className="px-4 py-3 border-b border-[hsl(220,15%,13%)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{currentScenario?.label}</span>
                    <span className="text-xs text-[hsl(220,15%,45%)]">—</span>
                    <span 
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ 
                        backgroundColor: `${positions.find(p => p.id === effectivePosition)?.color || 'hsl(210,70%,50%)'}20`,
                        color: positions.find(p => p.id === effectivePosition)?.color || 'hsl(210,70%,50%)'
                      }}
                    >
                      {currentPos?.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[hsl(220,15%,45%)] mt-0.5">
                    {selectedStack} effective • Click hand for details
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-[hsl(142,70%,50%)]">{stats.playablePercent}%</div>
                    <div className="text-[9px] text-[hsl(220,15%,45%)]">Range</div>
                  </div>
                  <div className="h-8 w-px bg-[hsl(220,15%,15%)]" />
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="text-xs font-mono font-semibold text-[hsl(142,70%,50%)]">{stats.raise}</div>
                      <div className="text-[8px] text-[hsl(220,15%,40%)]">RAISE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono font-semibold text-[hsl(210,85%,55%)]">{stats.call}</div>
                      <div className="text-[8px] text-[hsl(220,15%,40%)]">CALL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono font-semibold text-[hsl(220,15%,40%)]">{stats.fold}</div>
                      <div className="text-[8px] text-[hsl(220,15%,35%)]">FOLD</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrix Container */}
              <div className="p-4 flex justify-center">
                <RangeMatrix
                  rangeData={rangeData}
                  onHandClick={handleHandClick}
                  selectedHand={selectedHand || undefined}
                />
              </div>

              {/* Legend */}
              <div className="px-4 py-2 border-t border-[hsl(220,15%,13%)] flex items-center justify-between bg-[hsl(220,18%,8%)]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[hsl(142,70%,35%)]" />
                    <span className="text-[9px] text-[hsl(220,15%,50%)]">Raise/Bet</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[hsl(210,85%,45%)]" />
                    <span className="text-[9px] text-[hsl(220,15%,50%)]">Call</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,18%)]" />
                    <span className="text-[9px] text-[hsl(220,15%,50%)]">Fold</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-[hsl(220,15%,40%)]">
                  <span><strong className="font-semibold">AA</strong> = Pair</span>
                  <span><strong className="font-semibold">AKs</strong> = Suited</span>
                  <span><strong className="font-semibold">AKo</strong> = Offsuit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Hand Details */}
          <div className="w-64 shrink-0">
            <div className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden sticky top-4">
              {selectedHand && selectedHandData ? (
                <>
                  {/* Hand Header */}
                  <div className="p-4 border-b border-[hsl(220,15%,13%)] text-center bg-gradient-to-b from-[hsl(220,18%,11%)] to-transparent">
                    <div className="text-[9px] text-[hsl(220,15%,45%)] uppercase tracking-wider mb-1">Selected Hand</div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tight">{selectedHand}</div>
                    <div className="text-[10px] text-[hsl(220,15%,50%)] mt-1">
                      {selectedHand.endsWith('s') ? 'Suited • 4 combos' : selectedHand.endsWith('o') ? 'Offsuit • 12 combos' : 'Pocket Pair • 6 combos'}
                    </div>
                  </div>

                  {/* Action Badge */}
                  <div className="px-4 py-3 flex justify-center border-b border-[hsl(220,15%,13%)]">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      selectedHandData.action === "raise" && "bg-[hsl(142,70%,35%)] text-white",
                      selectedHandData.action === "call" && "bg-[hsl(210,85%,45%)] text-white",
                      selectedHandData.action === "fold" && "bg-[hsl(220,15%,15%)] text-[hsl(220,15%,50%)] border border-[hsl(220,15%,20%)]"
                    )}>
                      {selectedHandData.action}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-4">
                    {/* Frequency */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-[hsl(220,15%,50%)]">Frequency</span>
                        <span className="text-sm font-mono font-bold text-white">{(selectedHandData.frequency * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-[hsl(220,15%,12%)] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${selectedHandData.frequency * 100}%`,
                            backgroundColor: selectedHandData.action === "raise" 
                              ? "hsl(142,70%,45%)" 
                              : selectedHandData.action === "call" 
                                ? "hsl(210,85%,55%)" 
                                : "hsl(220,15%,30%)"
                          }}
                        />
                      </div>
                    </div>

                    {/* EV */}
                    {selectedHandData.ev !== undefined && (
                      <div className="flex justify-between items-center py-2 px-3 bg-[hsl(220,15%,11%)] rounded-lg">
                        <span className="text-[10px] text-[hsl(220,15%,50%)]">Expected Value</span>
                        <span className={cn(
                          "text-sm font-mono font-bold flex items-center gap-1",
                          selectedHandData.ev >= 0 ? "text-[hsl(142,70%,50%)]" : "text-[hsl(0,70%,55%)]"
                        )}>
                          {selectedHandData.ev >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {selectedHandData.ev >= 0 ? "+" : ""}{(selectedHandData.ev * 100).toFixed(1)}bb
                        </span>
                      </div>
                    )}

                    {/* Strategy Note */}
                    <div className="pt-3 border-t border-[hsl(220,15%,13%)]">
                      <div className="text-[9px] text-[hsl(142,70%,50%)] uppercase tracking-wider mb-1.5 font-medium">Strategy Note</div>
                      <p className="text-[11px] text-[hsl(220,15%,60%)] leading-relaxed">
                        {selectedHandData.action === "raise" && 
                          `${selectedHand} is a strong ${currentScenario?.label.toLowerCase()} hand from ${currentPos?.label}. Execute with standard sizing.`
                        }
                        {selectedHandData.action === "fold" && 
                          `${selectedHand} is outside the balanced ${currentScenario?.label.toLowerCase()} range from ${currentPos?.label}.`
                        }
                        {selectedHandData.action === "call" && 
                          `${selectedHand} should be used as a flatting hand in this scenario for balance.`
                        }
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[hsl(220,15%,12%)] flex items-center justify-center">
                    <Target className="w-5 h-5 text-[hsl(220,15%,35%)]" />
                  </div>
                  <p className="text-xs text-[hsl(220,15%,45%)]">
                    Select a hand from the<br />matrix to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
