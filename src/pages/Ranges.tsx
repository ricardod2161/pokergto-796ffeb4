import { useState } from "react";
import { RangeMatrix } from "@/components/poker/RangeMatrix";
import { positionRanges } from "@/data/rangeData";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Info,
  ChevronDown,
  Layers,
  Target
} from "lucide-react";

const positions = [
  { id: "UTG", label: "UTG", fullName: "Under the Gun", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "UTG1", label: "UTG+1", fullName: "Under the Gun +1", color: "bg-red-500/15 text-red-400/80 border-red-500/25" },
  { id: "MP", label: "MP", fullName: "Posição Média", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "HJ", label: "HJ", fullName: "Hijack", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "CO", label: "CO", fullName: "Cutoff", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { id: "BTN", label: "BTN", fullName: "Button", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { id: "SB", label: "SB", fullName: "Small Blind", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "BB", label: "BB", fullName: "Big Blind", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

const stackDepths = [
  { value: "20bb", label: "20bb", desc: "Short Stack" },
  { value: "40bb", label: "40bb", desc: "Mid Stack" },
  { value: "60bb", label: "60bb", desc: "Deep" },
  { value: "100bb", label: "100bb", desc: "Profundo" },
  { value: "150bb+", label: "150bb+", desc: "Muito Profundo" },
];

const scenarios = [
  { value: "Open", label: "Open Raise", desc: "Primeira entrada no pote" },
  { value: "vs 3-Bet", label: "vs 3-Bet", desc: "Contra um 3-bet" },
  { value: "3-Bet", label: "3-Bet", desc: "Re-raise contra opener" },
  { value: "4-Bet", label: "4-Bet", desc: "Re-raise contra 3-bet" },
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

  const currentPosition = positions.find(p => p.id === selectedPosition);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analisador de Ranges</h1>
          <p className="text-muted-foreground">Ranges GTO de abertura para mesas 8-Max</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
          <Info className="w-4 h-4" />
          <span>Baseado em estratégia GTO equilibrada</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card-glass rounded-xl p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Position Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium text-foreground">Posição na Mesa</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setSelectedPosition(pos.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-200",
                    "border-2",
                    selectedPosition === pos.id
                      ? cn(pos.color, "shadow-lg")
                      : "bg-secondary/30 text-secondary-foreground border-transparent hover:bg-secondary/50 hover:border-border"
                  )}
                >
                  <span className="font-bold text-sm">{pos.label}</span>
                </button>
              ))}
            </div>
            {currentPosition && (
              <p className="text-xs text-muted-foreground text-center">
                {currentPosition.fullName}
              </p>
            )}
          </div>

          {/* Stack Depth */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium text-foreground">Profundidade de Stack</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {stackDepths.map((stack) => (
                <button
                  key={stack.value}
                  onClick={() => setSelectedStack(stack.value)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border",
                    selectedStack === stack.value
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-secondary/30 text-secondary-foreground border-transparent hover:bg-secondary/50 hover:border-border"
                  )}
                >
                  {stack.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium text-foreground">Cenário</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.value}
                  onClick={() => setSelectedScenario(scenario.value)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border",
                    selectedScenario === scenario.value
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-secondary/30 text-secondary-foreground border-transparent hover:bg-secondary/50 hover:border-border"
                  )}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Matrix */}
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

        {/* Hand Details Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          {/* Selected Hand Details */}
          <div className="card-glass rounded-xl p-5 sticky top-6">
            {selectedHand && selectedHandData ? (
              <div className="space-y-5">
                {/* Hand Display */}
                <div className="text-center pb-4 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Mão Selecionada</p>
                  <p className="text-4xl font-mono font-bold text-foreground">{selectedHand}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedHand.endsWith('s') ? 'Suited' : selectedHand.endsWith('o') ? 'Offsuit' : 'Par'}
                  </p>
                </div>

                {/* Action Badge */}
                <div className="flex justify-center">
                  <span className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide",
                    selectedHandData.action === "raise" && "bg-success/20 text-success border border-success/30",
                    selectedHandData.action === "call" && "bg-call/20 text-call border border-call/30",
                    selectedHandData.action === "fold" && "bg-muted text-muted-foreground border border-border"
                  )}>
                    {selectedHandData.action === "raise" ? "Open/Raise" : 
                     selectedHandData.action === "call" ? "Call" : "Fold"}
                  </span>
                </div>
                
                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Frequência</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${selectedHandData.frequency * 100}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-foreground w-12 text-right">
                        {(selectedHandData.frequency * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  {selectedHandData.ev !== undefined && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Valor Esperado</span>
                      <span className={cn(
                        "font-mono font-bold flex items-center gap-1",
                        selectedHandData.ev >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {selectedHandData.ev >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {selectedHandData.ev >= 0 ? "+" : ""}{(selectedHandData.ev * 100).toFixed(2)} BB
                      </span>
                    </div>
                  )}
                </div>

                {/* Strategy Tip */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-2">💡 Estratégia</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedHandData.action === "raise" && 
                      `${selectedHand} é uma mão de abertura sólida em ${selectedPosition}. Abra com seu sizing padrão (2.5-3bb) e esteja preparado para continuar contra 3-bets com frequência.`
                    }
                    {selectedHandData.action === "fold" && 
                      `${selectedHand} é fraca demais para abrir de ${selectedPosition}. Folde e espere melhores spots. Jogar mãos marginais fora de posição é -EV.`
                    }
                    {selectedHandData.action === "call" && 
                      `${selectedHand} é uma mão de estratégia mista. Dependendo da dinâmica da mesa, pode ser jogada como raise ou call.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <span className="text-2xl">🃏</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhuma mão selecionada</p>
                <p className="text-xs text-muted-foreground">
                  Clique em uma mão na matriz para ver os detalhes
                </p>
              </div>
            )}
          </div>

          {/* Position Info Card */}
          <div className="card-glass rounded-xl p-5">
            <h4 className="text-sm font-medium text-foreground mb-3">Sobre a Posição</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {selectedPosition === "UTG" && (
                <p>UTG é a posição mais tight. Jogue apenas mãos premium pois terá muitos jogadores para agir depois.</p>
              )}
              {selectedPosition === "UTG1" && (
                <p>Similar ao UTG, ainda muito tight. Pequena expansão de range é possível.</p>
              )}
              {selectedPosition === "MP" && (
                <p>Posição intermediária. Pode começar a adicionar algumas mãos especulativas.</p>
              )}
              {selectedPosition === "HJ" && (
                <p>Hijack permite range mais amplo. Suited connectors e pares médios entram.</p>
              )}
              {selectedPosition === "CO" && (
                <p>Cutoff é uma posição muito lucrativa. Range amplo com vantagem posicional.</p>
              )}
              {selectedPosition === "BTN" && (
                <p>Button é a melhor posição! Range mais amplo possível com máxima vantagem posicional.</p>
              )}
              {selectedPosition === "SB" && (
                <p>Small Blind exige cuidado. Fora de posição pós-flop, mas pode defender wide vs steals.</p>
              )}
              {selectedPosition === "BB" && (
                <p>Big Blind defende muito devido aos odds. Mas cuidado jogando OOP pós-flop.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
