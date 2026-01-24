import { useState, useMemo, useEffect } from "react";
import { RangeMatrix } from "@/components/poker/RangeMatrix";
import { RangeAIPanel } from "@/components/ranges/RangeAIPanel";
import { QuickHelp, EducationalTooltip, educationalContent } from "@/components/ranges/EducationalTooltips";
import { ControlsContent, CollapsedControls } from "@/components/ranges/RangeControls";
import { useRangeAnalysis } from "@/hooks/useRangeAnalysis";
import { 
  openRanges, 
  threeBetRanges, 
  coldCallRanges, 
  squeezeRanges, 
  isoRaiseRanges,
  vs3BetRanges,
  fourBetRanges,
  bbDefenseRanges,
} from "@/data/gtoRanges";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Zap, Shield, Users, HelpCircle, BookOpen, Info, Sparkles, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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
    description: "Ações ofensivas para construir potes",
    scenarios: [
      { id: "open", label: "Open Raise", shortLabel: "RFI", desc: "Primeira aposta" },
      { id: "3bet", label: "3-Bet", shortLabel: "3B", desc: "Re-raise" },
      { id: "4bet", label: "4-Bet", shortLabel: "4B", desc: "Re-re-raise" },
      { id: "squeeze", label: "Squeeze", shortLabel: "SQZ", desc: "3bet vs caller" },
      { id: "isoraise", label: "Iso-Raise", shortLabel: "ISO", desc: "Isolar limper" },
    ]
  },
  {
    id: "defense",
    label: "Defesa",
    icon: Shield,
    description: "Como reagir a ações agressivas",
    scenarios: [
      { id: "vs3bet", label: "vs 3-Bet", shortLabel: "vs3B", desc: "Defender open" },
      { id: "coldcall", label: "Cold Call", shortLabel: "CC", desc: "Flat em posição" },
      { id: "bbdefense", label: "BB Defense", shortLabel: "BBD", desc: "Defender BB" },
    ]
  }
];

const stackOptions = [
  { id: "20bb", label: "20bb", desc: "Torneio short" },
  { id: "40bb", label: "40bb", desc: "Torneio médio" },
  { id: "60bb", label: "60bb", desc: "Torneio deep" },
  { id: "100bb", label: "100bb", desc: "Cash game" },
  { id: "150bb+", label: "150bb+", desc: "Deep stack" },
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
  const [showHelp, setShowHelp] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const { analysis, isLoading, error, analyzeHand, clearAnalysis } = useRangeAnalysis();

  const handleHandClick = (hand: string, data: HandData) => {
    setSelectedHand(hand);
    setSelectedHandData(data);
    clearAnalysis();
  };

  const handleRequestAnalysis = () => {
    if (!selectedHand || !selectedHandData) return;
    
    analyzeHand({
      hand: selectedHand,
      action: selectedHandData.action,
      frequency: selectedHandData.frequency,
      ev: selectedHandData.ev,
      scenario: selectedScenario,
      position: effectivePosition,
      stackDepth: selectedStack,
    });
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

  // Clear analysis when scenario/position changes
  useEffect(() => {
    clearAnalysis();
  }, [selectedScenario, selectedPosition, clearAnalysis]);

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
              <span className="text-xs text-[hsl(220,15%,50%)]">8-Max Cash Game • Estratégia de Equilíbrio</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className={cn(
                  "h-8 px-3 text-xs gap-1.5",
                  showHelp && "bg-primary/10 text-primary"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Guia
              </Button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,15%)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,70%,50%)] animate-pulse" />
                <span className="text-[10px] text-[hsl(220,15%,60%)]">Solver Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Controls Sheet */}
      {isMobile && (
        <Sheet open={mobileControlsOpen} onOpenChange={setMobileControlsOpen}>
          <SheetContent side="left" className="w-[280px] bg-[hsl(220,20%,7%)] border-[hsl(220,15%,13%)] p-0 overflow-y-auto">
            <SheetHeader className="p-4 border-b border-[hsl(220,15%,13%)]">
              <SheetTitle className="text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[hsl(142,70%,50%)]" />
                Controles de Range
              </SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-3">
              <ControlsContent 
                showHelp={showHelp}
                scenarioCategories={scenarioCategories}
                selectedScenario={selectedScenario}
                setSelectedScenario={setSelectedScenario}
                setSelectedHand={setSelectedHand}
                setSelectedHandData={setSelectedHandData}
                selectedPosition={selectedPosition}
                setSelectedPosition={setSelectedPosition}
                selectedStack={selectedStack}
                setSelectedStack={setSelectedStack}
                effectivePosition={effectivePosition}
                availablePositions={availablePositions}
                positions={positions}
                bbDefensePositions={bbDefensePositions}
                stackOptions={stackOptions}
                onClose={() => setMobileControlsOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="w-full px-2 md:px-4 py-4 h-[calc(100vh-80px)] overflow-y-auto">
        {/* Mobile Controls Toggle */}
        {isMobile && (
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileControlsOpen(true)}
              className="bg-[hsl(220,18%,9%)] border-[hsl(220,15%,18%)] text-white"
            >
              <Menu className="w-4 h-4 mr-2" />
              Controles
            </Button>
            <div className="text-xs text-muted-foreground">
              <span className="text-[hsl(142,70%,50%)]">{currentScenario?.shortLabel}</span>
              <span className="mx-1">•</span>
              <span>{currentPos?.label}</span>
              <span className="mx-1">•</span>
              <span>{selectedStack}</span>
            </div>
          </div>
        )}

        <div className={cn(
          "max-w-[1600px] mx-auto items-start",
          isMobile ? "flex flex-col gap-4" : "flex gap-4 lg:gap-6"
        )}>
          {/* Left Sidebar - Controls (Desktop) */}
          {!isMobile && (
            <div className={cn(
              "flex-shrink-0 space-y-3 sticky top-4 transition-all duration-300",
              leftSidebarCollapsed ? "w-12" : "w-52"
            )}>
              {/* Collapse Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                className="w-full bg-[hsl(220,18%,9%)] border border-[hsl(220,15%,13%)] text-[hsl(220,15%,50%)] hover:text-white hover:bg-[hsl(220,15%,15%)]"
              >
                {leftSidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span className="text-xs">Recolher</span>
                  </>
                )}
              </Button>

              {leftSidebarCollapsed ? (
                <CollapsedControls
                  selectedScenario={selectedScenario}
                  effectivePosition={effectivePosition}
                  selectedStack={selectedStack}
                  onExpand={() => setLeftSidebarCollapsed(false)}
                />
              ) : (
                <ControlsContent 
                  showHelp={showHelp}
                  scenarioCategories={scenarioCategories}
                  selectedScenario={selectedScenario}
                  setSelectedScenario={setSelectedScenario}
                  setSelectedHand={setSelectedHand}
                  setSelectedHandData={setSelectedHandData}
                  selectedPosition={selectedPosition}
                  setSelectedPosition={setSelectedPosition}
                  selectedStack={selectedStack}
                  setSelectedStack={setSelectedStack}
                  effectivePosition={effectivePosition}
                  availablePositions={availablePositions}
                  positions={positions}
                  bbDefensePositions={bbDefensePositions}
                  stackOptions={stackOptions}
                />
              )}
            </div>
          )}

          {/* Main Content - Matrix */}
          <div className={cn("min-w-0", isMobile ? "w-full overflow-x-auto" : "flex-1")}>
            <div className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
              {/* Matrix Header */}
              <div className="px-4 py-3 border-b border-[hsl(220,15%,13%)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <EducationalTooltip term={selectedScenario as keyof typeof educationalContent} showIcon={false}>
                      <span className="text-sm font-semibold text-white cursor-help border-b border-dashed border-white/30">
                        {currentScenario?.label}
                      </span>
                    </EducationalTooltip>
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
                    {selectedStack} efetivo • Clique em uma mão para análise detalhada
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <EducationalTooltip term="range" showIcon={false}>
                      <div className="text-lg font-bold font-mono text-[hsl(142,70%,50%)] cursor-help">{stats.playablePercent}%</div>
                    </EducationalTooltip>
                    <div className="text-[9px] text-[hsl(220,15%,45%)]">Range Total</div>
                  </div>
                  <div className="h-8 w-px bg-[hsl(220,15%,15%)]" />
                  <div className="flex gap-3">
                    <EducationalTooltip term="raise" showIcon={false}>
                      <div className="text-center cursor-help">
                        <div className="text-xs font-mono font-semibold text-[hsl(142,70%,50%)]">{stats.raise}</div>
                        <div className="text-[8px] text-[hsl(220,15%,40%)]">RAISE</div>
                      </div>
                    </EducationalTooltip>
                    <EducationalTooltip term="call" showIcon={false}>
                      <div className="text-center cursor-help">
                        <div className="text-xs font-mono font-semibold text-[hsl(210,85%,55%)]">{stats.call}</div>
                        <div className="text-[8px] text-[hsl(220,15%,40%)]">CALL</div>
                      </div>
                    </EducationalTooltip>
                    <EducationalTooltip term="fold" showIcon={false}>
                      <div className="text-center cursor-help">
                        <div className="text-xs font-mono font-semibold text-[hsl(220,15%,40%)]">{stats.fold}</div>
                        <div className="text-[8px] text-[hsl(220,15%,35%)]">FOLD</div>
                      </div>
                    </EducationalTooltip>
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
                  <EducationalTooltip term="pair" showIcon={false}>
                    <span className="cursor-help"><strong className="font-semibold">AA</strong> = Par</span>
                  </EducationalTooltip>
                  <EducationalTooltip term="suited" showIcon={false}>
                    <span className="cursor-help"><strong className="font-semibold">AKs</strong> = Suited</span>
                  </EducationalTooltip>
                  <EducationalTooltip term="offsuit" showIcon={false}>
                    <span className="cursor-help"><strong className="font-semibold">AKo</strong> = Offsuit</span>
                  </EducationalTooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Hand Details + AI */}
          <div className={cn(
            "shrink-0 flex flex-col gap-3",
            isMobile ? "w-full" : "w-72 sticky top-4"
          )}>
            {/* Hand Details Card */}
            <div className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
              {selectedHand && selectedHandData ? (
                <>
                  {/* Hand Header */}
                  <div className="p-4 border-b border-[hsl(220,15%,13%)] text-center bg-gradient-to-b from-[hsl(220,18%,11%)] to-transparent">
                    <div className="text-[9px] text-[hsl(220,15%,45%)] uppercase tracking-wider mb-1">Mão Selecionada</div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tight">{selectedHand}</div>
                    <div className="text-[10px] text-[hsl(220,15%,50%)] mt-1">
                      {selectedHand.endsWith('s') ? (
                        <EducationalTooltip term="suited" showIcon={false}>
                          <span className="cursor-help">Suited • 4 combos</span>
                        </EducationalTooltip>
                      ) : selectedHand.endsWith('o') ? (
                        <EducationalTooltip term="offsuit" showIcon={false}>
                          <span className="cursor-help">Offsuit • 12 combos</span>
                        </EducationalTooltip>
                      ) : (
                        <EducationalTooltip term="pair" showIcon={false}>
                          <span className="cursor-help">Pocket Pair • 6 combos</span>
                        </EducationalTooltip>
                      )}
                    </div>
                  </div>

                  {/* Action Badge */}
                  <div className="px-4 py-3 flex justify-center border-b border-[hsl(220,15%,13%)]">
                    <EducationalTooltip term={selectedHandData.action as keyof typeof educationalContent} showIcon={false}>
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-help",
                        selectedHandData.action === "raise" && "bg-[hsl(142,70%,35%)] text-white",
                        selectedHandData.action === "call" && "bg-[hsl(210,85%,45%)] text-white",
                        selectedHandData.action === "fold" && "bg-[hsl(220,15%,15%)] text-[hsl(220,15%,50%)] border border-[hsl(220,15%,20%)]"
                      )}>
                        {selectedHandData.action === "raise" && "Raise"}
                        {selectedHandData.action === "call" && "Call"}
                        {selectedHandData.action === "fold" && "Fold"}
                      </span>
                    </EducationalTooltip>
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-3">
                    {/* Frequency */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <EducationalTooltip term="frequency">
                          <span className="text-[10px] text-[hsl(220,15%,50%)]">Frequência</span>
                        </EducationalTooltip>
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
                      <p className="text-[9px] text-muted-foreground mt-1">
                        Porcentagem do tempo que você executa esta ação
                      </p>
                    </div>

                    {/* EV */}
                    {selectedHandData.ev !== undefined && (
                      <div className="flex justify-between items-center py-2 px-3 bg-[hsl(220,15%,11%)] rounded-lg">
                        <EducationalTooltip term="ev">
                          <span className="text-[10px] text-[hsl(220,15%,50%)]">Valor Esperado</span>
                        </EducationalTooltip>
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
                    <div className="pt-2 border-t border-[hsl(220,15%,13%)]">
                      <div className="text-[9px] text-[hsl(142,70%,50%)] uppercase tracking-wider mb-1 font-medium">Nota Estratégica</div>
                      <p className="text-[10px] text-[hsl(220,15%,60%)] leading-relaxed">
                        {selectedHandData.action === "raise" && 
                          `${selectedHand} é uma mão forte para ${currentScenario?.label.toLowerCase()} na posição ${currentPos?.label}.`
                        }
                        {selectedHandData.action === "fold" && 
                          `${selectedHand} está fora do range balanceado de ${currentScenario?.label.toLowerCase()}.`
                        }
                        {selectedHandData.action === "call" && 
                          `${selectedHand} deve ser usada como flatting hand nesta situação.`
                        }
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[hsl(220,15%,12%)] flex items-center justify-center">
                    <Target className="w-4 h-4 text-[hsl(220,15%,35%)]" />
                  </div>
                  <p className="text-xs text-[hsl(220,15%,45%)]">
                    Selecione uma mão da matriz
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Use a análise IA para explicações
                  </p>
                </div>
              )}
            </div>

            {/* AI Analysis Panel - with proper scroll */}
            <div className="shrink-0">
              <RangeAIPanel
                analysis={analysis}
                isLoading={isLoading}
                error={error}
                onRequestAnalysis={handleRequestAnalysis}
                canAnalyze={!!selectedHand && !!selectedHandData}
                hand={selectedHand}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
