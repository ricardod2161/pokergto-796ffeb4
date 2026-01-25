import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  getRangeData, 
  getScenarioInfo, 
  getAvailablePositions,
  RANKS,
  HandData
} from "@/data/gtoRanges";
import { PokerCard } from "@/components/poker/PokerCard";
import { UsageBadge } from "@/components/usage/UsageBadge";
import { useTrainingAI } from "@/hooks/useTrainingAI";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Target, 
  Zap, 
  Trophy, 
  RotateCcw, 
  Settings2, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  ChevronRight,
  BarChart3,
  Brain,
  Loader2,
  Sparkles,
  BookOpen,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Scenario = "open" | "3bet" | "4bet" | "squeeze" | "coldcall" | "vs3bet" | "isoraise" | "bbdefense";
type Action = "raise" | "call" | "fold";

interface TrainingConfig {
  scenarios: Scenario[];
  positions: string[];
  difficulty: "easy" | "normal" | "hard";
}

interface SessionStats {
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
  byScenario: Record<string, { correct: number; total: number }>;
}

interface Question {
  hand: string;
  cards: { rank: string; suit: string }[];
  position: string;
  scenario: Scenario;
  correctAction: Action;
  correctFrequency: number;
  ev: number;
  frequencies?: { raise: number; call: number; fold: number };
}

const SUITS = ["h", "d", "c", "s"] as const;
const SUIT_NAMES: Record<string, string> = { h: "hearts", d: "diamonds", c: "clubs", s: "spades" };

function getRandomSuit(): typeof SUITS[number] {
  return SUITS[Math.floor(Math.random() * SUITS.length)];
}

function generateCards(hand: string): { rank: string; suit: string }[] {
  const rank1 = hand[0];
  const rank2 = hand[1];
  const isSuited = hand.endsWith("s");
  const isPair = hand.length === 2;

  if (isPair) {
    const suits = [...SUITS].sort(() => Math.random() - 0.5).slice(0, 2);
    return [
      { rank: rank1, suit: suits[0] },
      { rank: rank2, suit: suits[1] }
    ];
  }

  if (isSuited) {
    const suit = getRandomSuit();
    return [
      { rank: rank1, suit },
      { rank: rank2, suit }
    ];
  }

  const suit1 = getRandomSuit();
  let suit2 = getRandomSuit();
  while (suit2 === suit1) {
    suit2 = getRandomSuit();
  }
  return [
    { rank: rank1, suit: suit1 },
    { rank: rank2, suit: suit2 }
  ];
}

function getPrimaryAction(data: HandData): Action {
  if (data.frequencies) {
    const { raise, call, fold } = data.frequencies;
    if (raise >= call && raise >= fold) return "raise";
    if (call >= raise && call >= fold) return "call";
    return "fold";
  }
  return data.action === "mixed" ? "raise" : data.action as Action;
}

function isActionCorrect(userAction: Action, data: HandData, difficulty: string): boolean {
  if (!data.frequencies) {
    return userAction === data.action;
  }

  const { raise, call, fold } = data.frequencies;
  const userFreq = userAction === "raise" ? raise : userAction === "call" ? call : fold;

  switch (difficulty) {
    case "easy":
      return userFreq >= 0.25;
    case "hard":
      return userFreq >= 0.60;
    default:
      return userFreq >= 0.40;
  }
}

const DEFAULT_CONFIG: TrainingConfig = {
  scenarios: ["open", "3bet", "vs3bet"],
  positions: ["UTG", "MP", "CO", "BTN", "SB", "BB"],
  difficulty: "normal"
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  open: "Open Raise",
  "3bet": "3-Bet",
  "4bet": "4-Bet",
  squeeze: "Squeeze",
  coldcall: "Cold Call",
  vs3bet: "vs 3-Bet",
  isoraise: "Iso-Raise",
  bbdefense: "BB Defense"
};

// Parse AI analysis into sections
function parseAnalysis(text: string): { title: string; content: string; icon: string }[] {
  const sections: { title: string; content: string; icon: string }[] = [];
  const regex = /\*\*([^*]+)\*\*\s*\n([^*]+?)(?=\*\*|$)/gs;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    let icon = "📊";
    if (title.includes("📊")) icon = "📊";
    else if (title.includes("💡")) icon = "💡";
    else if (title.includes("🎯")) icon = "🎯";
    sections.push({ title: title.replace(/[📊💡🎯]/g, "").trim(), content, icon });
  }

  return sections;
}

export default function Training() {
  const isMobile = useIsMobile();
  const [config, setConfig] = useState<TrainingConfig>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
    byScenario: {}
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timedMode, setTimedMode] = useState(false);

  // AI Analysis
  const { 
    analysis, 
    isLoading: isAnalyzing, 
    error: aiError, 
    analyzeDecision, 
    clearAnalysis,
    usage,
    planName,
    canUseAnalysis 
  } = useTrainingAI();

  const generateQuestion = useCallback(() => {
    clearAnalysis();
    const scenario = config.scenarios[Math.floor(Math.random() * config.scenarios.length)];
    const availablePositions = getAvailablePositions(scenario).filter(p => 
      config.positions.some(cp => p.includes(cp) || cp.includes(p))
    );
    
    if (availablePositions.length === 0) {
      return generateQuestion();
    }

    const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    const rangeData = getRangeData(scenario, position);

    const hands = Object.entries(rangeData);
    const playableHands = hands.filter(([_, data]) => data.action !== "fold" || Math.random() < 0.3);
    const [hand, data] = playableHands[Math.floor(Math.random() * playableHands.length)];

    const correctAction = getPrimaryAction(data);
    const cards = generateCards(hand);

    setQuestion({
      hand,
      cards,
      position,
      scenario,
      correctAction,
      correctFrequency: data.frequency,
      ev: data.ev || 0,
      frequencies: data.frequencies
    });
    setSelectedAction(null);
    setShowResult(false);
    
    if (timedMode) {
      setTimeLeft(10);
    }
  }, [config, timedMode, clearAnalysis]);

  // Timer effect
  useEffect(() => {
    if (!timedMode || timeLeft === null || showResult) return;

    if (timeLeft <= 0) {
      handleAnswer("fold");
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timedMode, showResult]);

  // Initialize first question
  useEffect(() => {
    generateQuestion();
  }, []);

  const handleAnswer = (action: Action) => {
    if (showResult || !question) return;

    setSelectedAction(action);
    setShowResult(true);

    const rangeData = getRangeData(question.scenario, question.position);
    const handData = rangeData[question.hand];
    const correct = isActionCorrect(action, handData, config.difficulty);
    
    setIsCorrect(correct);

    setSessionStats(prev => {
      const newStreak = correct ? prev.streak + 1 : 0;
      const scenarioKey = question.scenario;
      const prevScenario = prev.byScenario[scenarioKey] || { correct: 0, total: 0 };

      return {
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        byScenario: {
          ...prev.byScenario,
          [scenarioKey]: {
            correct: prevScenario.correct + (correct ? 1 : 0),
            total: prevScenario.total + 1
          }
        }
      };
    });

    // Auto-trigger AI analysis after answer
    if (question.frequencies) {
      analyzeDecision({
        hand: question.hand,
        position: question.position,
        scenario: question.scenario,
        userAction: action,
        correctAction: question.correctAction,
        isCorrect: correct,
        frequencies: question.frequencies,
        ev: question.ev
      });
    }
  };

  const handleNext = () => {
    generateQuestion();
  };

  const handleReset = () => {
    setSessionStats({
      correct: 0,
      incorrect: 0,
      streak: 0,
      bestStreak: 0,
      byScenario: {}
    });
    generateQuestion();
  };

  const accuracy = sessionStats.correct + sessionStats.incorrect > 0
    ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)
    : 0;

  const totalQuestions = sessionStats.correct + sessionStats.incorrect;
  const parsedAnalysis = useMemo(() => parseAnalysis(analysis), [analysis]);

  // Config sidebar content (reusable for both desktop and mobile)
  const ConfigContent = () => (
    <div className="space-y-6">
      {/* Difficulty */}
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
          Dificuldade
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["easy", "normal", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
              className={cn(
                "py-2 rounded-lg text-sm font-medium transition-colors",
                config.difficulty === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {d === "easy" ? "Fácil" : d === "normal" ? "Normal" : "Difícil"}
            </button>
          ))}
        </div>
      </div>

      {/* Timed Mode */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Modo Cronometrado
          </span>
          <button
            onClick={() => setTimedMode(!timedMode)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              timedMode ? "bg-primary" : "bg-muted"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
              timedMode ? "translate-x-6" : "translate-x-0.5"
            )} />
          </button>
        </label>
      </div>

      {/* Scenarios */}
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
          Cenários
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
            <label 
              key={s}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={config.scenarios.includes(s)}
                onChange={(e) => {
                  setConfig(c => ({
                    ...c,
                    scenarios: e.target.checked
                      ? [...c.scenarios, s]
                      : c.scenarios.filter(sc => sc !== s)
                  }));
                }}
                className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{SCENARIO_LABELS[s]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Session Stats */}
      <div className="border-t border-border pt-4">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
          Estatísticas da Sessão
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Corretas</span>
            <span className="font-mono text-green-500">{sessionStats.correct}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Incorretas</span>
            <span className="font-mono text-red-500">{sessionStats.incorrect}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Precisão</span>
            <span className="font-mono text-foreground">{accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Melhor Sequência</span>
            <span className="font-mono text-yellow-500">{sessionStats.bestStreak}</span>
          </div>
        </div>

        {Object.keys(sessionStats.byScenario).length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h5 className="text-xs text-muted-foreground mb-2">Por Cenário</h5>
            <div className="space-y-1.5">
              {Object.entries(sessionStats.byScenario).map(([scenario, stats]) => (
                <div key={scenario} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{SCENARIO_LABELS[scenario as Scenario]}</span>
                  <span className="font-mono">
                    <span className="text-green-500">{stats.correct}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground">{stats.total}</span>
                    <span className="text-muted-foreground ml-1">
                      ({Math.round((stats.correct / stats.total) * 100)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Treinamento GTO</h1>
              <p className="text-xs text-muted-foreground">Pratique decisões pré-flop</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Stats Pills - Responsive */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="px-2 sm:px-3 py-1.5 rounded-full bg-muted border border-border flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-xs sm:text-sm font-mono font-medium text-foreground">{accuracy}%</span>
              </div>
              <div className="px-2 sm:px-3 py-1.5 rounded-full bg-muted border border-border flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs sm:text-sm font-mono font-medium text-foreground">{sessionStats.streak}</span>
              </div>
              <div className="hidden sm:flex px-3 py-1.5 rounded-full bg-muted border border-border items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-sm font-mono font-medium text-foreground">{totalQuestions}</span>
              </div>
            </div>

            <UsageBadge className="hidden sm:flex" />

            {/* Mobile Config Sheet */}
            {isMobile ? (
              <Sheet open={showConfig} onOpenChange={setShowConfig}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Configurações
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ConfigContent />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                variant={showConfig ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowConfig(!showConfig)}
                className="h-9 w-9"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-9 w-9"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Main Training Area */}
          <div className="flex-1 min-w-0">
            {question && (
              <div className="space-y-4 sm:space-y-6">
                {/* Scenario & Position Badge */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <div className="px-3 sm:px-4 py-2 rounded-lg bg-card border border-border">
                    <span className="text-xs sm:text-sm text-muted-foreground">Cenário:</span>
                    <span className="ml-1 sm:ml-2 font-semibold text-foreground">{SCENARIO_LABELS[question.scenario]}</span>
                  </div>
                  <div className="px-3 sm:px-4 py-2 rounded-lg bg-card border border-border">
                    <span className="text-xs sm:text-sm text-muted-foreground">Posição:</span>
                    <span className="ml-1 sm:ml-2 font-semibold text-primary">{question.position}</span>
                  </div>
                  {timedMode && timeLeft !== null && (
                    <div className={cn(
                      "px-3 sm:px-4 py-2 rounded-lg border flex items-center gap-2",
                      timeLeft <= 3 
                        ? "bg-destructive/20 border-destructive text-destructive"
                        : "bg-card border-border"
                    )}>
                      <Clock className="w-4 h-4" />
                      <span className="font-mono font-bold">{timeLeft}s</span>
                    </div>
                  )}
                </div>

                {/* Cards Display */}
                <div className="flex justify-center py-6 sm:py-8">
                  <div className="flex gap-3 sm:gap-4">
                    {question.cards.map((card, i) => (
                      <div key={i} className="transform hover:scale-105 transition-transform">
                        <PokerCard 
                          rank={card.rank as "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2"} 
                          suit={SUIT_NAMES[card.suit] as "hearts" | "diamonds" | "clubs" | "spades"}
                          size={isMobile ? "md" : "lg"}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hand Notation */}
                <div className="text-center">
                  <span className="text-xl sm:text-2xl font-mono font-bold text-foreground">{question.hand}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-2 sm:gap-4 py-2 sm:py-4">
                  {(["raise", "call", "fold"] as Action[]).map((action) => {
                    const isSelected = selectedAction === action;
                    const isCorrectAction = showResult && question.correctAction === action;
                    const isWrongSelection = showResult && isSelected && !isCorrect;
                    
                    let freq = 0;
                    if (showResult && question.frequencies) {
                      freq = question.frequencies[action] * 100;
                    }

                    return (
                      <button
                        key={action}
                        onClick={() => handleAnswer(action)}
                        disabled={showResult}
                        className={cn(
                          "relative px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg uppercase tracking-wide transition-all",
                          "border-2 min-w-[90px] sm:min-w-[140px]",
                          !showResult && action === "raise" && "bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30",
                          !showResult && action === "call" && "bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30",
                          !showResult && action === "fold" && "bg-muted border-border text-muted-foreground hover:bg-muted/80",
                          showResult && isCorrectAction && "bg-green-500/30 border-green-500 text-green-400 ring-2 ring-green-500 ring-offset-2 ring-offset-background",
                          showResult && isWrongSelection && "bg-red-500/30 border-red-500 text-red-400",
                          showResult && !isCorrectAction && !isWrongSelection && "opacity-40"
                        )}
                      >
                        {action === "raise" && <Zap className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />}
                        {action}
                        
                        {showResult && freq > 0 && (
                          <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-mono text-muted-foreground">
                            {freq.toFixed(0)}%
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Result Feedback */}
                {showResult && (
                  <div className={cn(
                    "mx-auto max-w-2xl p-4 sm:p-6 rounded-xl border-2 mt-6 sm:mt-8",
                    isCorrect 
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-red-500/10 border-red-500/50"
                  )}>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        isCorrect ? "bg-green-500/30" : "bg-red-500/30"
                      )}>
                        {isCorrect 
                          ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                          : <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "text-base sm:text-lg font-bold mb-2",
                          isCorrect ? "text-green-500" : "text-red-500"
                        )}>
                          {isCorrect ? "Correto! 🎉" : "Incorreto"}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                          A ação GTO para <span className="font-mono font-bold text-foreground">{question.hand}</span> em <span className="text-primary">{question.position}</span> ({SCENARIO_LABELS[question.scenario]}) é:
                        </p>
                        
                        {/* Frequency Breakdown */}
                        {question.frequencies && (
                          <div className="space-y-2 mb-4">
                            {Object.entries(question.frequencies)
                              .filter(([_, freq]) => freq > 0)
                              .sort(([_, a], [__, b]) => b - a)
                              .map(([action, freq]) => (
                                <div key={action} className="flex items-center gap-2 sm:gap-3">
                                  <span className={cn(
                                    "w-12 sm:w-16 text-xs font-bold uppercase",
                                    action === "raise" && "text-green-500",
                                    action === "call" && "text-blue-500",
                                    action === "fold" && "text-muted-foreground"
                                  )}>
                                    {action}
                                  </span>
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        action === "raise" && "bg-green-500",
                                        action === "call" && "bg-blue-500",
                                        action === "fold" && "bg-muted-foreground"
                                      )}
                                      style={{ width: `${freq * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs sm:text-sm font-mono text-foreground w-10 sm:w-12 text-right">
                                    {(freq * 100).toFixed(0)}%
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        )}

                        {/* EV Display */}
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <span className="text-muted-foreground">EV:</span>
                          <span className={cn(
                            "font-mono font-bold",
                            question.ev >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {question.ev >= 0 ? "+" : ""}{question.ev.toFixed(2)}bb
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Section */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-foreground text-sm">Análise IA</h4>
                        {isAnalyzing && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />
                        )}
                      </div>

                      {isAnalyzing && !analysis && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando análise personalizada...
                        </div>
                      )}

                      {aiError && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                          {aiError}
                        </div>
                      )}

                      {analysis && parsedAnalysis.length > 0 ? (
                        <div className="space-y-3">
                          {parsedAnalysis.map((section, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "p-3 rounded-lg",
                                i === 0 && "bg-blue-500/10 border border-blue-500/20",
                                i === 1 && "bg-yellow-500/10 border border-yellow-500/20",
                                i === 2 && "bg-green-500/10 border border-green-500/20"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span>{section.icon}</span>
                                <h5 className="font-medium text-foreground text-sm">{section.title}</h5>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {section.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : analysis ? (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                          {analysis}
                        </div>
                      ) : null}
                    </div>

                    {/* Next Button */}
                    <Button
                      onClick={handleNext}
                      className="w-full mt-4 sm:mt-6"
                      size={isMobile ? "default" : "lg"}
                    >
                      Próxima Mão
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Config Sidebar */}
          {!isMobile && showConfig && (
            <div className="w-80 bg-card border border-border rounded-xl p-4 h-fit sticky top-20">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configurações
              </h3>
              <ConfigContent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
