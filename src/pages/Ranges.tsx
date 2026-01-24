import { useState } from "react";
import { RangeMatrix } from "@/components/poker/RangeMatrix";
import { positionRanges } from "@/data/rangeData";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

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

const stackOptions = ["20bb", "40bb", "60bb", "100bb", "150bb+"];
const scenarioOptions = [
  { value: "Open", label: "Open Raise" },
  { value: "vs3bet", label: "vs 3-Bet" },
  { value: "3bet", label: "3-Bet" },
  { value: "4bet", label: "4-Bet" },
];

interface HandData {
  action: "raise" | "call" | "fold" | "mixed";
  frequency: number;
  ev?: number;
}

export default function Ranges() {
  const [selectedPosition, setSelectedPosition] = useState("CO");
  const [selectedStack, setSelectedStack] = useState("100bb");
  const [selectedScenario, setSelectedScenario] = useState("Open");
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [selectedHandData, setSelectedHandData] = useState<HandData | null>(null);

  const handleHandClick = (hand: string, data: HandData) => {
    setSelectedHand(hand);
    setSelectedHandData(data);
  };

  const rangeData = positionRanges[selectedPosition] || positionRanges.CO;
  const playableHands = Object.values(rangeData).filter(h => h.action !== "fold").length;
  const playablePercent = ((playableHands / 169) * 100).toFixed(1);
  const currentPos = positions.find(p => p.id === selectedPosition);

  return (
    <div className="p-5 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">Analisador de Ranges</h1>
          <p className="text-xs text-muted-foreground">Ranges GTO para mesas 8-Max</p>
        </div>

        <div className="flex gap-5">
          {/* Left Column */}
          <div className="flex-1 space-y-4">
            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              {/* Position */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Posição
                </label>
                <div className="flex gap-1">
                  {positions.map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => setSelectedPosition(pos.id)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs font-medium rounded transition-colors",
                        selectedPosition === pos.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                      )}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-8">
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
                          "px-2 py-1 text-xs font-medium rounded transition-colors",
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

                {/* Scenario */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Cenário
                  </label>
                  <div className="flex gap-1">
                    {scenarioOptions.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSelectedScenario(s.value)}
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded transition-colors",
                          selectedScenario === s.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                        )}
                      >
                        {s.label}
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
                    Range de Abertura — {currentPos?.label}
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
                  <span className="text-[10px] text-muted-foreground">Raise</span>
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
          <div className="w-64 shrink-0">
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
                        `Mão forte para abrir de ${currentPos?.label}. Use sizing de 2.5-3bb.`
                      }
                      {selectedHandData.action === "fold" && 
                        `Muito fraca para ${currentPos?.label}. Aguarde melhor spot.`
                      }
                      {selectedHandData.action === "call" && 
                        `Estratégia mista. Avalie dinâmica da mesa.`
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
          </div>
        </div>
      </div>
    </div>
  );
}
