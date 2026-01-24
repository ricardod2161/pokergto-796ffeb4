import { cn } from "@/lib/utils";
import { Zap, Shield, Users, Info, Sparkles, Target } from "lucide-react";
import { QuickHelp, EducationalTooltip, educationalContent } from "./EducationalTooltips";

interface Position {
  id: string;
  label: string;
  color?: string;
}

interface Scenario {
  id: string;
  label: string;
  shortLabel: string;
  desc: string;
}

interface Category {
  id: string;
  label: string;
  icon: typeof Zap;
  description: string;
  scenarios: Scenario[];
}

interface StackOption {
  id: string;
  label: string;
  desc: string;
}

interface ControlsContentProps {
  showHelp: boolean;
  scenarioCategories: Category[];
  selectedScenario: string;
  setSelectedScenario: (scenario: string) => void;
  setSelectedHand: (hand: string | null) => void;
  setSelectedHandData: (data: any) => void;
  selectedPosition: string;
  setSelectedPosition: (position: string) => void;
  selectedStack: string;
  setSelectedStack: (stack: string) => void;
  effectivePosition: string;
  availablePositions: string[];
  positions: Position[];
  bbDefensePositions: Position[];
  stackOptions: StackOption[];
  onClose?: () => void;
}

export function ControlsContent({
  showHelp,
  scenarioCategories,
  selectedScenario,
  setSelectedScenario,
  setSelectedHand,
  setSelectedHandData,
  selectedPosition,
  setSelectedPosition,
  selectedStack,
  setSelectedStack,
  effectivePosition,
  availablePositions,
  positions,
  bbDefensePositions,
  stackOptions,
  onClose,
}: ControlsContentProps) {
  return (
    <>
      {/* Quick Help Panel */}
      {showHelp && <QuickHelp />}

      {/* Scenario Selection */}
      {scenarioCategories.map((category) => (
        <div key={category.id} className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
          <div className="px-3 py-2 border-b border-[hsl(220,15%,13%)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <category.icon className="w-3.5 h-3.5 text-[hsl(220,15%,45%)]" />
              <span className="text-[10px] font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider">{category.label}</span>
            </div>
            <EducationalTooltip term={category.id === "offense" ? "raise" : "call"}>
              <Info className="w-3 h-3 text-[hsl(220,15%,35%)]" />
            </EducationalTooltip>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1">
            {category.scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario.id);
                  setSelectedHand(null);
                  setSelectedHandData(null);
                  onClose?.();
                }}
                className={cn(
                  "px-2 py-2 text-left rounded transition-all group relative",
                  selectedScenario === scenario.id
                    ? "bg-[hsl(142,70%,35%)] text-white"
                    : "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,55%)] hover:bg-[hsl(220,15%,15%)] hover:text-[hsl(220,15%,70%)]"
                )}
              >
                <div className="text-[10px] font-medium">{scenario.shortLabel}</div>
                <div className={cn(
                  "text-[8px] mt-0.5",
                  selectedScenario === scenario.id 
                    ? "text-white/70" 
                    : "text-[hsl(220,15%,40%)]"
                )}>
                  {scenario.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Position Selection */}
      <div className="bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[hsl(220,15%,13%)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[hsl(220,15%,45%)]" />
            <span className="text-[10px] font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider">
              {selectedScenario === "bbdefense" ? "Oponente" : "Posição"}
            </span>
          </div>
          <EducationalTooltip term={effectivePosition as keyof typeof educationalContent}>
            <Info className="w-3 h-3 text-[hsl(220,15%,35%)]" />
          </EducationalTooltip>
        </div>
        <div className="p-2">
          {selectedScenario === "bbdefense" ? (
            <div className="grid grid-cols-2 gap-1">
              {bbDefensePositions.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => {
                    setSelectedPosition(pos.id);
                    onClose?.();
                  }}
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
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedPosition(pos.id);
                        onClose?.();
                      }
                    }}
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
        <div className="px-3 py-2 border-b border-[hsl(220,15%,13%)] flex items-center justify-between">
          <span className="text-[10px] font-medium text-[hsl(220,15%,50%)] uppercase tracking-wider">Stack Efetivo</span>
          <EducationalTooltip term="range">
            <Info className="w-3 h-3 text-[hsl(220,15%,35%)]" />
          </EducationalTooltip>
        </div>
        <div className="p-2 grid grid-cols-5 gap-1">
          {stackOptions.map((stack) => (
            <button
              key={stack.id}
              onClick={() => {
                setSelectedStack(stack.id);
                onClose?.();
              }}
              className={cn(
                "py-2 text-center rounded transition-all",
                selectedStack === stack.id
                  ? "bg-[hsl(43,90%,50%)] text-[hsl(220,20%,10%)]"
                  : "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,55%)] hover:bg-[hsl(220,15%,15%)]"
              )}
            >
              <div className="text-[9px] font-medium">{stack.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Educational Info Box */}
      <div className="bg-gradient-to-br from-[hsl(260,30%,12%)] to-[hsl(220,18%,9%)] rounded-lg border border-[hsl(260,30%,20%)] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-foreground">Dica Pro</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Clique em qualquer mão da matriz e use a <strong className="text-purple-300">Análise IA</strong> para entender o porquê de cada ação. Perfeito para aprender GTO do zero!
        </p>
      </div>
    </>
  );
}

interface CollapsedControlsProps {
  selectedScenario: string;
  effectivePosition: string;
  selectedStack: string;
  onExpand: () => void;
}

export function CollapsedControls({
  selectedScenario,
  effectivePosition,
  selectedStack,
  onExpand,
}: CollapsedControlsProps) {
  const scenarioLabels: Record<string, string> = {
    open: "RFI",
    "3bet": "3B",
    "4bet": "4B",
    squeeze: "SQZ",
    isoraise: "ISO",
    vs3bet: "vs3B",
    coldcall: "CC",
    bbdefense: "BBD",
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onExpand}
        className="w-full bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] p-2 flex flex-col items-center gap-1 hover:bg-[hsl(220,15%,12%)] transition-colors"
      >
        <Zap className="w-4 h-4 text-[hsl(142,70%,50%)]" />
        <span className="text-[8px] text-[hsl(220,15%,60%)] font-medium">
          {scenarioLabels[selectedScenario] || selectedScenario}
        </span>
      </button>
      <button
        onClick={onExpand}
        className="w-full bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] p-2 flex flex-col items-center gap-1 hover:bg-[hsl(220,15%,12%)] transition-colors"
      >
        <Users className="w-4 h-4 text-[hsl(210,70%,50%)]" />
        <span className="text-[8px] text-[hsl(220,15%,60%)] font-medium">
          {effectivePosition.replace("vs", "")}
        </span>
      </button>
      <button
        onClick={onExpand}
        className="w-full bg-[hsl(220,18%,9%)] rounded-lg border border-[hsl(220,15%,13%)] p-2 flex flex-col items-center gap-1 hover:bg-[hsl(220,15%,12%)] transition-colors"
      >
        <Target className="w-4 h-4 text-[hsl(43,90%,50%)]" />
        <span className="text-[8px] text-[hsl(220,15%,60%)] font-medium">
          {selectedStack}
        </span>
      </button>
    </div>
  );
}