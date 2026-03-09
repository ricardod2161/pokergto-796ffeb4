import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PokerCard, CardPlaceholder } from "@/components/poker/PokerCard";
import { Calculator, RotateCcw, History, Grid3X3, Trash2, TrendingUp, Percent, ChevronDown, ChevronUp, Sparkles, Brain, Loader2, RefreshCw, Target, BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEquityAnalysis } from "@/hooks/useEquityAnalysis";
import { UsageBadge } from "@/components/usage/UsageBadge";
import { runMonteCarloEquity } from "@/lib/equityEngine";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
type Position = "BTN" | "CO" | "HJ" | "MP" | "UTG" | "BB" | "SB";

interface Card {
  rank: Rank;
  suit: Suit;
}

interface CalculationHistory {
  id: string;
  heroCards: Card[];
  boardCards: Card[];
  equity: number;
  position: Position;
  timestamp: Date;
}

const ranks: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

const positions: { value: Position; label: string; description: string }[] = [
  { value: "BTN", label: "BTN", description: "Button" },
  { value: "CO", label: "CO", description: "Cutoff" },
  { value: "HJ", label: "HJ", description: "Hijack" },
  { value: "MP", label: "MP", description: "Middle" },
  { value: "UTG", label: "UTG", description: "Under Gun" },
  { value: "SB", label: "SB", description: "Small Blind" },
  { value: "BB", label: "BB", description: "Big Blind" },
];

const suitSymbols: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const formatCards = (cards: Card[]): string => {
  return cards.map(c => `${c.rank}${suitSymbols[c.suit]}`).join(" ");
};

const getStreet = (boardLength: number): "preflop" | "flop" | "turn" | "river" => {
  if (boardLength === 0) return "preflop";
  if (boardLength <= 3) return "flop";
  if (boardLength === 4) return "turn";
  return "river";
};

export default function EquityCalculator() {
  const isMobile = useIsMobile();
  const [heroCards, setHeroCards] = useState<Card[]>([]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [position, setPosition] = useState<Position>("BTN");
  const [showCardPicker, setShowCardPicker] = useState<"hero" | "board" | null>(null);
  const [results, setResults] = useState<{ win: number; tie: number; lose: number } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { analysis, isLoading: isAnalyzing, error: analysisError, analyzeEquity, clearAnalysis, usage, planName, canUseAnalysis } = useEquityAnalysis();

  const handleCardSelect = (rank: Rank, suit: Suit) => {
    const card: Card = { rank, suit };
    
    if (showCardPicker === "hero" && heroCards.length < 2) {
      setHeroCards([...heroCards, card]);
      if (heroCards.length === 1) setShowCardPicker(null);
    } else if (showCardPicker === "board" && boardCards.length < 5) {
      setBoardCards([...boardCards, card]);
      if (boardCards.length === 4) setShowCardPicker(null);
    }
  };

  const handleRemoveCard = (type: "hero" | "board", index: number) => {
    if (type === "hero") {
      setHeroCards(heroCards.filter((_, i) => i !== index));
    } else {
      setBoardCards(boardCards.filter((_, i) => i !== index));
    }
    setResults(null);
    clearAnalysis();
  };

  const isCardUsed = (rank: Rank, suit: Suit) => {
    return [...heroCards, ...boardCards].some(c => c.rank === rank && c.suit === suit);
  };

  const handleCalculate = async () => {
    if (heroCards.length < 2) return;
    setIsCalculating(true);
    clearAnalysis();
    
    try {
      const result = await runMonteCarloEquity(heroCards, boardCards, 5000);
      setResults({ win: result.win, tie: result.tie, lose: result.lose });
      
      const newEntry: CalculationHistory = {
        id: Date.now().toString(),
        heroCards: [...heroCards],
        boardCards: [...boardCards],
        equity: result.win,
        position,
        timestamp: new Date(),
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 5));
    } catch (err) {
      console.error("Monte Carlo error:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setHeroCards([]);
    setBoardCards([]);
    setResults(null);
    setShowCardPicker(null);
    clearAnalysis();
  };

  const handleRequestAnalysis = () => {
    if (!results || heroCards.length < 2) return;
    
    analyzeEquity({
      heroCards,
      boardCards,
      position,
      equity: results.win,
      street: getStreet(boardCards.length),
    });
  };

  const loadFromHistory = (entry: CalculationHistory) => {
    setHeroCards(entry.heroCards);
    setBoardCards(entry.boardCards);
    setPosition(entry.position);
    setResults({ win: entry.equity, tie: 2.1, lose: 100 - entry.equity - 2.1 });
    clearAnalysis();
  };

  const getEquityColor = (equity: number) => {
    if (equity >= 60) return "text-success";
    if (equity >= 40) return "text-warning";
    return "text-destructive";
  };

  const getEquityBgColor = (equity: number) => {
    if (equity >= 60) return "bg-success/20 border-success/30";
    if (equity >= 40) return "bg-warning/20 border-warning/30";
    return "bg-destructive/20 border-destructive/30";
  };

  const parseAnalysis = (text: string) => {
    const sections: { title: string; content: string; icon: React.ReactNode }[] = [];
    const parts = text.split(/\*\*([^*]+)\*\*/);
    
    let currentTitle = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      if (i % 2 === 1) {
        currentTitle = part.replace(/[:\?]/g, '').trim();
      } else if (currentTitle) {
        let icon: React.ReactNode = <BookOpen className="w-3.5 h-3.5" />;
        if (currentTitle.toLowerCase().includes('análise') || currentTitle.toLowerCase().includes('equity')) {
          icon = <Target className="w-3.5 h-3.5" />;
        } else if (currentTitle.toLowerCase().includes('estratégia')) {
          icon = <BookOpen className="w-3.5 h-3.5" />;
        } else if (currentTitle.toLowerCase().includes('dica')) {
          icon = <Lightbulb className="w-3.5 h-3.5" />;
        }
        
        sections.push({ title: currentTitle, content: part.trim(), icon });
        currentTitle = '';
      }
    }
    
    return sections;
  };

  const canAnalyze = results !== null && heroCards.length >= 2 && !isAnalyzing;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Percent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Calculadora de Equity</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Calcule equity mão vs range com precisão</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UsageBadge />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="border-border/50 hover:bg-muted/50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Position Selector */}
            <div className="rounded-xl bg-card/50 border border-border/50 p-4 md:p-5 backdrop-blur-sm transition-all hover:border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <h3 className="font-semibold text-foreground text-sm">Sua Posição</h3>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {positions.map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setPosition(pos.value)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 md:py-3 rounded-lg border transition-all",
                      position === pos.value
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-card/50 text-muted-foreground border-border/50 hover:bg-muted/50 hover:text-foreground hover:border-border"
                    )}
                  >
                    <span className="font-bold text-xs md:text-sm">{pos.label}</span>
                    <span className="text-[9px] md:text-[10px] opacity-70 hidden sm:block">{pos.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Hand */}
            <div className="rounded-xl bg-card/50 border border-border/50 p-4 md:p-5 backdrop-blur-sm transition-all hover:border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="font-semibold text-foreground">Sua Mão</h3>
                  <span className="text-xs text-muted-foreground">({heroCards.length}/2)</span>
                </div>
                <Button 
                  variant={showCardPicker === "hero" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCardPicker(showCardPicker === "hero" ? null : "hero")}
                  className={cn(
                    "transition-all",
                    showCardPicker === "hero" 
                      ? "bg-primary text-primary-foreground" 
                      : "border-border/50 hover:bg-muted/50"
                  )}
                >
                  {showCardPicker === "hero" ? "Fechar" : "Selecionar"}
                </Button>
              </div>
              <div className="flex gap-3 flex-wrap">
                {heroCards.map((card, i) => (
                  <div key={i} className="relative group">
                    <PokerCard rank={card.rank} suit={card.suit} size="lg" />
                    <button
                      onClick={() => handleRemoveCard("hero", i)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: 2 - heroCards.length }).map((_, i) => (
                  <div 
                    key={`empty-${i}`} 
                    className={cn(
                      "transition-all",
                      showCardPicker === "hero" && "animate-pulse"
                    )}
                  >
                    <CardPlaceholder size="lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Board */}
            <div className="rounded-xl bg-card/50 border border-border/50 p-4 md:p-5 backdrop-blur-sm transition-all hover:border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <h3 className="font-semibold text-foreground">Board</h3>
                  <span className="text-xs text-muted-foreground">({boardCards.length}/5)</span>
                </div>
                <Button 
                  variant={showCardPicker === "board" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCardPicker(showCardPicker === "board" ? null : "board")}
                  className={cn(
                    "transition-all",
                    showCardPicker === "board" 
                      ? "bg-primary text-primary-foreground" 
                      : "border-border/50 hover:bg-muted/50"
                  )}
                >
                  {showCardPicker === "board" ? "Fechar" : "Adicionar"}
                </Button>
              </div>
              <div className="flex gap-2 md:gap-3 flex-wrap mb-4">
                {boardCards.map((card, i) => (
                  <div key={i} className="relative group">
                    <PokerCard rank={card.rank} suit={card.suit} size={isMobile ? "md" : "lg"} />
                    <button
                      onClick={() => handleRemoveCard("board", i)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: 5 - boardCards.length }).map((_, i) => (
                  <div 
                    key={`empty-${i}`} 
                    className={cn(
                      "transition-all",
                      showCardPicker === "board" && "animate-pulse"
                    )}
                  >
                    <CardPlaceholder size={isMobile ? "md" : "lg"} />
                  </div>
                ))}
              </div>
              
              {/* Street Indicators */}
              <div className="flex items-center gap-1 text-xs">
                <div className={cn(
                  "px-2 py-1 rounded-md transition-all",
                  boardCards.length >= 3 
                    ? "bg-primary/20 text-primary font-medium" 
                    : "text-muted-foreground"
                )}>
                  Flop
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground/50 rotate-[-90deg]" />
                <div className={cn(
                  "px-2 py-1 rounded-md transition-all",
                  boardCards.length >= 4 
                    ? "bg-primary/20 text-primary font-medium" 
                    : "text-muted-foreground"
                )}>
                  Turn
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground/50 rotate-[-90deg]" />
                <div className={cn(
                  "px-2 py-1 rounded-md transition-all",
                  boardCards.length >= 5 
                    ? "bg-primary/20 text-primary font-medium" 
                    : "text-muted-foreground"
                )}>
                  River
                </div>
              </div>
            </div>

            {/* Card Picker */}
            {showCardPicker && (
              <div className="rounded-xl bg-card/80 border border-primary/30 p-4 md:p-5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Selecionar Carta {showCardPicker === "hero" ? "da Mão" : "do Board"}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                    Clique para selecionar
                  </span>
                </div>
                <div 
                  className="grid gap-1 md:gap-1.5 p-2 rounded-lg bg-muted/30" 
                  style={{ gridTemplateColumns: `repeat(13, 1fr)` }}
                >
                  {suits.map(suit => (
                    ranks.map(rank => {
                      const used = isCardUsed(rank, suit);
                      return (
                        <button
                          key={`${rank}${suit}`}
                          onClick={() => !used && handleCardSelect(rank, suit)}
                          disabled={used}
                          className={cn(
                            "aspect-[3/4] flex flex-col items-center justify-center text-xs font-mono font-bold rounded-md transition-all border",
                            used 
                              ? "bg-muted/20 text-muted-foreground/20 cursor-not-allowed border-transparent"
                              : "bg-card hover:scale-110 hover:shadow-xl hover:z-10 cursor-pointer border-border/50 hover:border-primary/50 shadow-sm",
                            (suit === "hearts" || suit === "diamonds") && !used && "text-red-500",
                            (suit === "clubs" || suit === "spades") && !used && "text-foreground"
                          )}
                        >
                          <span className="text-[10px] md:text-xs leading-none">{rank}</span>
                          <span className="text-[8px] md:text-[10px] leading-none mt-0.5">{suitSymbols[suit]}</span>
                        </button>
                      );
                    })
                  ))}
                </div>
              </div>
            )}

            {/* Calculate Button */}
            <Button 
              variant="gold" 
              size="lg" 
              className="w-full h-12 md:h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleCalculate}
              disabled={heroCards.length < 2 || isCalculating}
            >
              {isCalculating ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 mr-2" />
                  Calcular Equity
                </>
              )}
            </Button>
          </div>

          {/* Results & AI Section */}
          <div className="space-y-4">
            {/* Results Card */}
            <div className="rounded-xl bg-card/50 border border-border/50 p-4 md:p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Resultados</h3>
                {results && (
                  <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {position}
                  </span>
                )}
              </div>
              
              {results ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={cn(
                    "text-center py-6 md:py-8 rounded-xl border transition-all",
                    getEquityBgColor(results.win)
                  )}>
                    <span className={cn(
                      "text-4xl md:text-5xl font-bold font-mono",
                      getEquityColor(results.win)
                    )}>
                      {results.win}%
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">Sua Equity</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20 transition-all hover:bg-success/15">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-sm text-muted-foreground">Vitória</span>
                      </div>
                      <span className="font-mono font-bold text-success">{results.win}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20 transition-all hover:bg-warning/15">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <span className="text-sm text-muted-foreground">Empate</span>
                      </div>
                      <span className="font-mono font-bold text-warning">{results.tie}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 transition-all hover:bg-destructive/15">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-sm text-muted-foreground">Derrota</span>
                      </div>
                      <span className="font-mono font-bold text-destructive">{results.lose}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Distribuição</span>
                      <span>100%</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden flex bg-muted/30 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-success to-success/80 transition-all duration-500"
                        style={{ width: `${results.win}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-warning to-warning/80 transition-all duration-500"
                        style={{ width: `${results.tie}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-destructive to-destructive/80 transition-all duration-500"
                        style={{ width: `${results.lose}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 md:py-12 text-center">
                  <div className="p-4 rounded-full bg-muted/30 mb-4">
                    <Grid3X3 className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[200px]">
                    Selecione sua mão e clique em calcular para ver a equity
                  </p>
                </div>
              )}
            </div>

            {/* AI Analysis Panel */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[hsl(220,15%,13%)] flex items-center justify-between bg-gradient-to-r from-[hsl(220,18%,10%)] to-[hsl(260,30%,12%)]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    <Brain className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Análise IA</h3>
                    <p className="text-[9px] text-muted-foreground">Insights estratégicos</p>
                  </div>
                </div>
                {analysis && !isAnalyzing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRequestAnalysis}
                    disabled={!canAnalyze}
                    className="h-7 px-2 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Atualizar
                  </Button>
                )}
              </div>

              <div className="p-4 max-h-[350px] overflow-y-auto">
                {!analysis && !isAnalyzing && !analysisError && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="relative mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center">
                        <Brain className="w-7 h-7 text-purple-400/50" />
                      </div>
                      <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {results ? "Analisar esta equity?" : "Calcule primeiro"}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                      {results 
                        ? "Obtenha insights estratégicos baseados na sua posição e equity"
                        : "Calcule a equity para receber análise da IA"}
                    </p>
                    {results && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRequestAnalysis}
                        disabled={!canAnalyze}
                        className="border-purple-500/30 hover:bg-purple-500/10 text-purple-300"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Analisar com IA
                      </Button>
                    )}
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      <div className="absolute inset-0 w-8 h-8 border-2 border-purple-500/20 rounded-full animate-ping" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Analisando equity...</p>
                  </div>
                )}

                {analysisError && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                    <p className="text-xs text-destructive mb-2">{analysisError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRequestAnalysis}
                      disabled={!canAnalyze}
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                )}

                {analysis && !isAnalyzing && (
                  <div className="space-y-3">
                    {parseAnalysis(analysis).map((section, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "p-3 rounded-lg border",
                          i === 0 && "bg-[hsl(142,70%,25%)]/10 border-[hsl(142,70%,35%)]/30",
                          i === 1 && "bg-[hsl(210,85%,35%)]/10 border-[hsl(210,85%,45%)]/30",
                          i === 2 && "bg-[hsl(43,90%,45%)]/10 border-[hsl(43,90%,50%)]/30",
                          i > 2 && "bg-[hsl(220,15%,12%)] border-[hsl(220,15%,18%)]"
                        )}
                      >
                        <div className={cn(
                          "flex items-center gap-2 mb-2",
                          i === 0 && "text-[hsl(142,70%,55%)]",
                          i === 1 && "text-[hsl(210,85%,65%)]",
                          i === 2 && "text-[hsl(43,90%,55%)]",
                          i > 2 && "text-foreground"
                        )}>
                          {section.icon}
                          <span className="text-xs font-semibold">{section.title}</span>
                        </div>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    ))}

                    {parseAnalysis(analysis).length === 0 && (
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {analysis}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 pt-2 border-t border-[hsl(220,15%,15%)]">
                      <Sparkles className="w-3 h-3 text-purple-400/50" />
                      <span className="text-[10px] text-muted-foreground">
                        Análise gerada por IA
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <div className="rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground text-sm">Histórico</h3>
                    {history.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {history.length}
                      </span>
                    )}
                  </div>
                  {isHistoryOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {history.length > 0 ? (
                      <div className="space-y-2">
                        {history.map((entry) => (
                          <button
                            key={entry.id}
                            onClick={() => loadFromHistory(entry)}
                            className="w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all text-left group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium text-foreground">
                                  {formatCards(entry.heroCards)}
                                </span>
                                <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                                  {entry.position}
                                </span>
                              </div>
                              <span className={cn(
                                "font-mono font-bold text-sm",
                                getEquityColor(entry.equity)
                              )}>
                                {entry.equity}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                Board: {entry.boardCards.length > 0 ? formatCards(entry.boardCards) : "—"}
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                Carregar →
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum cálculo ainda
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
