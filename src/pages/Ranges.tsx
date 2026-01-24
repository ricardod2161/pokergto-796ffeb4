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
  bbDefenseRanges
} from "@/data/rangeData";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info, ChevronRight } from "lucide-react";

const positions = [
  { id: "UTG", label: "UTG", desc: "Under the Gun" },
  { id: "UTG1", label: "UTG+1", desc: "Under the Gun +1" },
  { id: "MP", label: "MP", desc: "Middle Position" },
  { id: "HJ", label: "HJ", desc: "Hijack" },
  { id: "CO", label: "CO", desc: "Cutoff" },
  { id: "BTN", label: "BTN", desc: "Button" },
  { id: "SB", label: "SB", desc: "Small Blind" },
  { id: "BB", label: "BB", desc: "Big Blind" },
];

const scenarios = [
  { 
    id: "open", 
    label: "Open Raise", 
    desc: "Primeira entrada no pote",
    category: "Abertura"
  },
  { 
    id: "3bet", 
    label: "3-Bet", 
    desc: "Re-raise contra um open",
    category: "Agressão"
  },
  { 
    id: "4bet", 
    label: "4-Bet", 
    desc: "Re-raise contra um 3-bet",
    category: "Agressão"
  },
  { 
    id: "squeeze", 
    label: "Squeeze", 
    desc: "3-bet após raise + call",
    category: "Agressão"
  },
  { 
    id: "coldcall", 
    label: "Cold Call", 
    desc: "Call de um raise",
    category: "Passivo"
  },
  { 
    id: "vs3bet", 
    label: "vs 3-Bet", 
    desc: "Defesa contra 3-bet",
    category: "Defesa"
  },
  { 
    id: "isoraise", 
    label: "Iso-Raise", 
    desc: "Raise sobre limpers",
    category: "Agressão"
  },
  { 
    id: "bbdefense", 
    label: "BB Defense", 
    desc: "Defesa do big blind",
    category: "Defesa"
  },
];

const stackOptions = ["20bb", "40bb", "60bb", "100bb", "150bb+"];

interface HandData {
  action: "raise" | "call" | "fold" | "mixed";
  frequency: number;
  ev?: number;
}

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

  // Get available positions for current scenario
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

  // Auto-select valid position when scenario changes
  const effectivePosition = useMemo(() => {
    if (selectedScenario === "bbdefense") {
      return "vsBTN"; // Default for BB defense
    }
    if (availablePositions.includes(selectedPosition)) {
      return selectedPosition;
    }
    return availablePositions[0] || "CO";
  }, [selectedPosition, availablePositions, selectedScenario]);

  // Get current range data
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

  const playableHands = Object.values(rangeData).filter(h => h.action !== "fold").length;
  const playablePercent = ((playableHands / 169) * 100).toFixed(1);
  
  const currentPos = selectedScenario === "bbdefense" 
    ? { label: effectivePosition, desc: `Defesa vs ${effectivePosition.replace('vs', '')}` }
    : positions.find(p => p.id === effectivePosition);
  
  const currentScenario = scenarios.find(s => s.id === selectedScenario);

  // BB Defense position options
  const bbDefensePositions = [
    { id: "vsUTG", label: "vs UTG" },
    { id: "vsMP", label: "vs MP" },
    { id: "vsCO", label: "vs CO" },
    { id: "vsBTN", label: "vs BTN" },
    { id: "vsSB", label: "vs SB" },
  ];

  return (
    <div className="p-5 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Analisador de Ranges</h1>
            <p className="text-xs text-muted-foreground">Ranges GTO completos para mesas 8-Max</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-slate-800/50 px-2.5 py-1.5 rounded">
            <Info className="w-3 h-3" />
            <span>Baseado em estratégia GTO equilibrada</span>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-4">
            {/* Scenario Selector */}
            <div className="bg-card border border-border rounded-lg p-4">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                Cenário
              </label>
              <div className="flex flex-wrap gap-1.5">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScenario(s.id);
                      setSelectedHand(null);
                      setSelectedHandData(null);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded transition-all",
                      selectedScenario === s.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {currentScenario && (
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-primary">{currentScenario.category}</span>
                  <ChevronRight className="w-3 h-3" />
                  {currentScenario.desc}
                </p>
              )}
            </div>

            {/* Filters Row */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex gap-8">
                {/* Position / BB Defense Options */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    {selectedScenario === "bbdefense" ? "Oponente" : "Posição"}
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {selectedScenario === "bbdefense" ? (
                      bbDefensePositions.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => setSelectedPosition(pos.id)}
                          className={cn(
                            "px-2.5 py-1.5 text-xs font-medium rounded transition-colors",
                            effectivePosition === pos.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                          )}
                        >
                          {pos.label}
                        </button>
                      ))
                    ) : (
                      positions.map((pos) => {
                        const isAvailable = availablePositions.includes(pos.id);
                        return (
                          <button
                            key={pos.id}
                            onClick={() => isAvailable && setSelectedPosition(pos.id)}
                            disabled={!isAvailable}
                            className={cn(
                              "px-2.5 py-1.5 text-xs font-medium rounded transition-colors",
                              effectivePosition === pos.id
                                ? "bg-primary text-primary-foreground"
                                : isAvailable
                                  ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                                  : "bg-slate-900/50 text-slate-600 cursor-not-allowed"
                            )}
                          >
                            {pos.label}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Stack */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Stack
                  </label>
                  <div className="flex gap-1">
                    {stackOptions.map((stack) => (
                      <button
                        key={stack}
                        onClick={() => setSelectedStack(stack)}
                        className={cn(
                          "px-2 py-1.5 text-xs font-medium rounded transition-colors",
                          selectedStack === stack
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                        )}
                      >
                        {stack}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-foreground">
                    {currentScenario?.label} — {currentPos?.label}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {currentPos?.desc} • Clique para detalhes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono text-emerald-400">{playablePercent}%</p>
                  <p className="text-[10px] text-muted-foreground">{playableHands} de 169</p>
                </div>
              </div>

              <RangeMatrix
                rangeData={rangeData}
                onHandClick={handleHandClick}
                selectedHand={selectedHand || undefined}
              />

              {/* Legend */}
              <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                  <span className="text-[10px] text-muted-foreground">Raise/Bet</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-sky-600" />
                  <span className="text-[10px] text-muted-foreground">Call</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-slate-700" />
                  <span className="text-[10px] text-muted-foreground">Fold</span>
                </div>
                <span className="text-[9px] text-muted-foreground/50 ml-auto">
                  s=suited · o=offsuit
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="w-64 shrink-0 space-y-4">
            {/* Hand Details */}
            <div className="bg-card border border-border rounded-lg p-4 sticky top-5">
              {selectedHand && selectedHandData ? (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-border/50">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Selecionada</p>
                    <p className="text-2xl font-mono font-bold text-foreground mt-1">{selectedHand}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedHand.endsWith('s') ? 'Suited' : selectedHand.endsWith('o') ? 'Offsuit' : 'Par'}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <span className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide",
                      selectedHandData.action === "raise" && "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30",
                      selectedHandData.action === "call" && "bg-sky-600/20 text-sky-400 border border-sky-600/30",
                      selectedHandData.action === "fold" && "bg-slate-600/20 text-slate-400 border border-slate-600/30"
                    )}>
                      {selectedHandData.action}
                    </span>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Frequência</span>
                        <span className="font-mono font-medium">{(selectedHandData.frequency * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${selectedHandData.frequency * 100}%` }}
                        />
                      </div>
                    </div>

                    {selectedHandData.ev !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">EV</span>
                        <span className={cn(
                          "font-mono font-medium flex items-center gap-0.5",
                          selectedHandData.ev >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {selectedHandData.ev >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {selectedHandData.ev >= 0 ? "+" : ""}{(selectedHandData.ev * 100).toFixed(2)}bb
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Info className="w-3 h-3 text-primary" />
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Dica</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {selectedHandData.action === "raise" && 
                        `${selectedHand} é uma mão forte para ${currentScenario?.label.toLowerCase()} de ${currentPos?.label}.`
                      }
                      {selectedHandData.action === "fold" && 
                        `${selectedHand} não faz parte do range de ${currentScenario?.label.toLowerCase()} de ${currentPos?.label}.`
                      }
                      {selectedHandData.action === "call" && 
                        `${selectedHand} deve ser usada como call neste cenário.`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2 opacity-50">🃏</div>
                  <p className="text-[11px] text-muted-foreground">
                    Clique em uma mão<br />para ver detalhes
                  </p>
                </div>
              )}
            </div>

            {/* Scenario Info */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Sobre o Cenário
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {selectedScenario === "open" && "Range de abertura inicial. Ajuste baseado na posição e dinâmica da mesa."}
                {selectedScenario === "3bet" && "Range de 3-bet para valor e blefe. Mais tight vs EP, mais loose vs LP."}
                {selectedScenario === "4bet" && "Range de 4-bet muito polarizado. Principalmente AA/KK para valor + alguns blefes."}
                {selectedScenario === "squeeze" && "Squeeze após raise + call. Aproveite dead money e polarize seu range."}
                {selectedScenario === "coldcall" && "Cold call preserva SPR. Prefira mãos com boa playability pós-flop."}
                {selectedScenario === "vs3bet" && "Defesa contra 3-bet. Misture calls e 4-bets para ser imprevisível."}
                {selectedScenario === "isoraise" && "Iso-raise vs limpers. Amplie range vs limpers fracos."}
                {selectedScenario === "bbdefense" && "Defesa do BB. Aproveite odds e defenda amplo, especialmente vs BTN/SB."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
