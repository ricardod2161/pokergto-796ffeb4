import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Lightbulb,
  BookOpen,
  ChevronDown,
  RotateCcw,
  Target,
  Percent,
  DollarSign,
  TrendingUpDown,
  Info,
  CheckCircle2,
  XCircle,
  MinusCircle,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEVAnalysis } from "@/hooks/useEVAnalysis";
import { EVAIPanel } from "@/components/ev/EVAIPanel";
import { UsageBadge } from "@/components/usage/UsageBadge";

interface HistoryEntry {
  id: string;
  potSize: number;
  callCost: number;
  equity: number;
  impliedOdds: number;
  ev: number;
  recommendation: "call" | "fold" | "marginal";
  timestamp: Date;
}

export default function EVCalculator() {
  const isMobile = useIsMobile();
  const [potSize, setPotSize] = useState("");
  const [callCost, setCallCost] = useState("");
  const [equity, setEquity] = useState("50");
  const [impliedOdds, setImpliedOdds] = useState("");
  const [result, setResult] = useState<{
    ev: number;
    recommendation: "call" | "fold" | "marginal";
    details: string;
    potOdds: number;
    requiredEquity: number;
  } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showEducation, setShowEducation] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  const { analysis, isLoading: isAILoading, error: aiError, analyzeEV, clearAnalysis, usage, planName, canUseAnalysis } = useEVAnalysis();

  // Clear AI analysis when inputs change significantly
  useEffect(() => {
    clearAnalysis();
  }, [potSize, callCost, equity, impliedOdds, clearAnalysis]);

  const handleCalculate = () => {
    const pot = parseFloat(potSize) || 0;
    const call = parseFloat(callCost) || 0;
    const eq = parseFloat(equity) || 0;
    const implied = parseFloat(impliedOdds) || 0;

    if (pot <= 0 || call <= 0 || eq <= 0) return;

    const totalPot = pot + call + implied;
    const ev = (eq / 100) * totalPot - (1 - eq / 100) * call;
    const potOdds = (call / (pot + call)) * 100;
    const requiredEquity = (call / (pot + call + implied)) * 100;
    
    let recommendation: "call" | "fold" | "marginal";
    let details: string;

    if (ev > call * 0.1) {
      recommendation = "call";
      details = `Com ${eq}% de equity contra a exigência de ${requiredEquity.toFixed(1)}%, você tem uma situação +EV clara. Em média, ganhará ${ev.toFixed(2)} BB por decisão.`;
    } else if (ev < -call * 0.1) {
      recommendation = "fold";
      details = `Sua equity de ${eq}% está abaixo do necessário (${requiredEquity.toFixed(1)}%). Pagar seria -EV, perdendo em média ${Math.abs(ev).toFixed(2)} BB.`;
    } else {
      recommendation = "marginal";
      details = `Situação muito próxima do breakeven. Considere fatores como posição, tendências do vilão e possíveis implied odds adicionais.`;
    }

    setResult({ ev, recommendation, details, potOdds, requiredEquity });

    // Add to history
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      potSize: pot,
      callCost: call,
      equity: eq,
      impliedOdds: implied,
      ev,
      recommendation,
      timestamp: new Date()
    };
    setHistory(prev => [newEntry, ...prev.slice(0, 4)]);
  };

  const handleReset = () => {
    setPotSize("");
    setCallCost("");
    setEquity("50");
    setImpliedOdds("");
    setResult(null);
    clearAnalysis();
  };

  const handleRequestAIAnalysis = () => {
    if (!result) return;
    
    analyzeEV({
      potSize: parseFloat(potSize) || 0,
      callCost: parseFloat(callCost) || 0,
      equity: parseFloat(equity) || 0,
      impliedOdds: parseFloat(impliedOdds) || 0,
      ev: result.ev,
      potOdds: result.potOdds,
      requiredEquity: result.requiredEquity,
      recommendation: result.recommendation,
    });
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setPotSize(entry.potSize.toString());
    setCallCost(entry.callCost.toString());
    setEquity(entry.equity.toString());
    setImpliedOdds(entry.impliedOdds > 0 ? entry.impliedOdds.toString() : "");
    handleCalculate();
  };

  const pot = parseFloat(potSize) || 0;
  const call = parseFloat(callCost) || 0;
  const eq = parseFloat(equity) || 0;
  const livePotOdds = pot + call > 0 ? ((call / (pot + call)) * 100).toFixed(1) : "0";
  const liveRequiredEquity = pot + call > 0 ? ((call / (pot + call)) * 100).toFixed(1) : "0";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Calculadora de EV</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Calcule o Valor Esperado e tome decisões matematicamente corretas
                  </p>
                </div>
              </div>
              <UsageBadge />
            </div>
          </div>

          {/* Educational Banner for Beginners */}
          <Collapsible open={showEducation} onOpenChange={setShowEducation}>
            <div className="rounded-xl bg-primary/5 border border-primary/20 overflow-hidden">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground text-sm md:text-base">
                    O que é EV (Valor Esperado)?
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    Iniciante
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  showEducation && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3 text-sm text-muted-foreground border-t border-primary/10 pt-4">
                  <p>
                    <strong className="text-foreground">EV (Expected Value)</strong> é o lucro ou prejuízo médio 
                    que você terá se tomar a mesma decisão milhares de vezes. É a base matemática do poker.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2 text-success font-medium mb-1">
                        <TrendingUp className="w-4 h-4" />
                        +EV (Positivo)
                      </div>
                      <p className="text-xs">Jogada lucrativa a longo prazo. Mesmo perdendo às vezes, você ganha no geral.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                        <TrendingDown className="w-4 h-4" />
                        -EV (Negativo)
                      </div>
                      <p className="text-xs">Jogada perdedora. Mesmo acertando às vezes, você perde dinheiro no geral.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-center gap-2 text-warning font-medium mb-1">
                        <MinusCircle className="w-4 h-4" />
                        Breakeven
                      </div>
                      <p className="text-xs">Nem ganha nem perde. Decisão é neutra matematicamente.</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <div className={cn(
            "grid gap-4 md:gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
          )}>
            {/* Input Section */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl bg-card border border-border p-4 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Parâmetros da Mão
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7">
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Insira os valores da situação atual da mão para calcular se pagar é lucrativo.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="space-y-5">
                  {/* Pot Size */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="potSize" className="text-sm text-foreground flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        Tamanho do Pote
                        <span className="text-xs text-muted-foreground">(BB)</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>O valor total no pote ANTES de você decidir. Inclui todas as apostas anteriores.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="potSize"
                      type="number"
                      placeholder="ex: 100"
                      value={potSize}
                      onChange={(e) => setPotSize(e.target.value)}
                      className="h-11 bg-muted/50 border-border font-mono focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Pote total antes da sua decisão
                    </p>
                  </div>

                  {/* Call Cost */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="callCost" className="text-sm text-foreground flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        Custo do Call
                        <span className="text-xs text-muted-foreground">(BB)</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Quanto você precisa pagar para continuar na mão. É a aposta do adversário.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="callCost"
                      type="number"
                      placeholder="ex: 25"
                      value={callCost}
                      onChange={(e) => setCallCost(e.target.value)}
                      className="h-11 bg-muted/50 border-border font-mono focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Valor que você precisa pagar para ver mais cartas
                    </p>
                  </div>

                  {/* Equity Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="equity" className="text-sm text-foreground flex items-center gap-2">
                        <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                        Sua Equity
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold text-primary">{equity}%</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3.5 h-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Sua probabilidade de ganhar a mão. Use a Calculadora de Equity para descobrir este valor.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Slider
                      value={[parseFloat(equity) || 50]}
                      onValueChange={(value) => setEquity(value[0].toString())}
                      max={100}
                      min={0}
                      step={1}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0% (Perdendo)</span>
                      <span>50% (Coin flip)</span>
                      <span>100% (Nuts)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Sua chance de ganhar. Use a calculadora de equity para saber o valor exato.
                    </p>
                  </div>

                  {/* Implied Odds */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="impliedOdds" className="text-sm text-foreground flex items-center gap-2">
                        <TrendingUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                        Implied Odds
                        <span className="text-xs text-muted-foreground/50">(Opcional)</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Quanto você espera GANHAR A MAIS se acertar seu draw. Use para flushes, straights e outras mãos de draw.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="impliedOdds"
                      type="number"
                      placeholder="ex: 50"
                      value={impliedOdds}
                      onChange={(e) => setImpliedOdds(e.target.value)}
                      className="h-11 bg-muted/50 border-border font-mono focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Ganhos extras esperados se você completar sua mão
                    </p>
                  </div>
                </div>

                {/* Live Stats Preview */}
                {(pot > 0 || call > 0) && (
                  <div className="mt-5 p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Visualização Rápida
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-mono font-bold text-foreground">{livePotOdds}%</div>
                        <div className="text-xs text-muted-foreground">Pot Odds</div>
                      </div>
                      <div className="text-center">
                        <div className={cn(
                          "text-lg font-mono font-bold",
                          eq >= parseFloat(liveRequiredEquity) ? "text-success" : "text-destructive"
                        )}>
                          {liveRequiredEquity}%
                        </div>
                        <div className="text-xs text-muted-foreground">Equity Necessária</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="flex-1 h-12 bg-primary hover:bg-primary/90" 
                    onClick={handleCalculate}
                    disabled={!potSize || !callCost}
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Calcular EV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-12 w-12 border-border hover:bg-muted"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* History Panel - Mobile & Desktop */}
              {history.length > 0 && (
                <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                  <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground text-sm">
                          Histórico ({history.length})
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        showHistory && "rotate-180"
                      )} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2">
                        {history.map((entry) => (
                          <button
                            key={entry.id}
                            onClick={() => loadFromHistory(entry)}
                            className="w-full p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {entry.recommendation === "call" && <CheckCircle2 className="w-4 h-4 text-success" />}
                                {entry.recommendation === "fold" && <XCircle className="w-4 h-4 text-destructive" />}
                                {entry.recommendation === "marginal" && <MinusCircle className="w-4 h-4 text-warning" />}
                                <span className="font-mono text-sm">
                                  {entry.ev >= 0 ? "+" : ""}{entry.ev.toFixed(1)} BB
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {entry.equity}% eq
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Pote: {entry.potSize}BB • Call: {entry.callCost}BB
                            </div>
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}
            </div>

            {/* Results Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* EV Display */}
              <div className={cn(
                "rounded-xl bg-card border p-4 md:p-6 transition-all",
                result && result.recommendation === "call" && "border-success/50 shadow-[0_0_20px_-5px] shadow-success/20",
                result && result.recommendation === "fold" && "border-destructive/50 shadow-[0_0_20px_-5px] shadow-destructive/20",
                result && result.recommendation === "marginal" && "border-warning/50 shadow-[0_0_20px_-5px] shadow-warning/20",
                !result && "border-border"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Resultado do Cálculo
                  </h3>
                  {result && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      result.recommendation === "call" && "bg-success/20 text-success",
                      result.recommendation === "fold" && "bg-destructive/20 text-destructive",
                      result.recommendation === "marginal" && "bg-warning/20 text-warning"
                    )}>
                      {result.recommendation === "call" && "Jogada +EV"}
                      {result.recommendation === "fold" && "Jogada -EV"}
                      {result.recommendation === "marginal" && "Breakeven"}
                    </span>
                  )}
                </div>
                
                {result ? (
                  <div className="space-y-6">
                    {/* Main EV Value */}
                    <div className="flex flex-col items-center justify-center py-6 md:py-8">
                      <div className={cn(
                        "flex items-center gap-4 text-4xl md:text-5xl font-mono font-bold",
                        result.ev >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {result.ev >= 0 ? (
                          <TrendingUp className="w-10 h-10 md:w-12 md:h-12" />
                        ) : (
                          <TrendingDown className="w-10 h-10 md:w-12 md:h-12" />
                        )}
                        <span>{result.ev >= 0 ? "+" : ""}{result.ev.toFixed(2)} BB</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Valor Esperado por decisão
                      </p>
                    </div>

                    {/* Recommendation Badge */}
                    <div className={cn(
                      "flex items-center justify-center gap-3 py-4 px-6 rounded-xl text-lg md:text-xl font-bold",
                      result.recommendation === "call" && "bg-success/20 text-success border border-success/30",
                      result.recommendation === "fold" && "bg-destructive/20 text-destructive border border-destructive/30",
                      result.recommendation === "marginal" && "bg-warning/20 text-warning border border-warning/30"
                    )}>
                      {result.recommendation === "call" && (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          PAGAR (Call)
                        </>
                      )}
                      {result.recommendation === "fold" && (
                        <>
                          <XCircle className="w-6 h-6" />
                          DESISTIR (Fold)
                        </>
                      )}
                      {result.recommendation === "marginal" && (
                        <>
                          <MinusCircle className="w-6 h-6" />
                          MARGINAL
                        </>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                        <div className="text-lg md:text-xl font-mono font-bold text-foreground">
                          {result.potOdds.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Pot Odds</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                        <div className="text-lg md:text-xl font-mono font-bold text-foreground">
                          {result.requiredEquity.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Equity Necessária</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                        <div className={cn(
                          "text-lg md:text-xl font-mono font-bold",
                          parseFloat(equity) >= result.requiredEquity ? "text-success" : "text-destructive"
                        )}>
                          {equity}%
                        </div>
                        <div className="text-xs text-muted-foreground">Sua Equity</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                        <div className={cn(
                          "text-lg md:text-xl font-mono font-bold",
                          parseFloat(equity) - result.requiredEquity >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {(parseFloat(equity) - result.requiredEquity) >= 0 ? "+" : ""}
                          {(parseFloat(equity) - result.requiredEquity).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Margem</div>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-foreground mb-1">Explicação</div>
                          <p className="text-sm text-muted-foreground">{result.details}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                      <Calculator className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      Insira os valores para calcular o EV
                    </p>
                    <p className="text-xs text-muted-foreground/70 max-w-sm">
                      Preencha o tamanho do pote, custo do call e sua equity para descobrir se a jogada é lucrativa
                    </p>
                  </div>
                )}
              </div>

              {/* AI Analysis Panel */}
              <EVAIPanel
                analysis={analysis}
                isLoading={isAILoading}
                error={aiError}
                onRequestAnalysis={handleRequestAIAnalysis}
                canAnalyze={!!result && !isAILoading}
                hasResult={!!result}
              />

              {/* Educational Cards */}
              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-2"
              )}>
                {/* Formula Explanation */}
                <div className="rounded-xl bg-card border border-border p-4 md:p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Fórmula do EV
                  </h3>
                  <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm overflow-x-auto">
                    <p className="text-primary whitespace-nowrap">
                      EV = (Equity × PoteTotal) - ((1 - Equity) × Call)
                    </p>
                  </div>
                  <div className="space-y-3 mt-4 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <span className="text-foreground font-medium">PoteTotal</span>
                        <span className="text-muted-foreground"> = Pote atual + seu Call + Implied Odds</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
                      <div>
                        <span className="text-success font-medium">+EV</span>
                        <span className="text-muted-foreground"> = Você lucra a longo prazo. PAGUE!</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                      <div>
                        <span className="text-destructive font-medium">-EV</span>
                        <span className="text-muted-foreground"> = Você perde a longo prazo. DESISTA!</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="rounded-xl bg-card border border-border p-4 md:p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Dicas para Iniciantes
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                      <span className="text-primary font-bold">1.</span>
                      <div>
                        <span className="text-foreground font-medium">Pot Odds</span>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          = Call ÷ (Pote + Call). É a equity mínima que você precisa.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                      <span className="text-primary font-bold">2.</span>
                      <div>
                        <span className="text-foreground font-medium">Regra de Ouro</span>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Se sua equity &gt; pot odds necessários → PAGUE!
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                      <span className="text-primary font-bold">3.</span>
                      <div>
                        <span className="text-foreground font-medium">Implied Odds</span>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Com draws fortes (flush, straight), adicione ganhos extras esperados.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                      <span className="text-primary font-bold">4.</span>
                      <div>
                        <span className="text-foreground font-medium">Variância</span>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          +EV não garante vitória imediata. É lucro no LONGO PRAZO.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
