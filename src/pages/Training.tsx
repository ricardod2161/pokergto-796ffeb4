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
  BarChart3
} from "lucide-react";

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

  // Offsuit
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

  // Difficulty affects threshold for "correct"
  switch (difficulty) {
    case "easy":
      return userFreq >= 0.25; // 25%+ frequency is acceptable
    case "hard":
      return userFreq >= 0.60; // Must be primary action (60%+)
    default:
      return userFreq >= 0.40; // 40%+ frequency
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

export default function Training() {
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

  const generateQuestion = useCallback(() => {
    const scenario = config.scenarios[Math.floor(Math.random() * config.scenarios.length)];
    const availablePositions = getAvailablePositions(scenario).filter(p => 
      config.positions.some(cp => p.includes(cp) || cp.includes(p))
    );
    
    if (availablePositions.length === 0) {
      // Fallback
      return generateQuestion();
    }

    const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    const rangeData = getRangeData(scenario, position);

    // Get random hand, weighted towards playable hands for better training
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
  }, [config, timedMode]);

  // Timer effect
  useEffect(() => {
    if (!timedMode || timeLeft === null || showResult) return;

    if (timeLeft <= 0) {
      handleAnswer("fold"); // Auto-fold on timeout
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

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] text-[hsl(220,15%,85%)]">
      {/* Header */}
      <div className="border-b border-[hsl(220,15%,15%)] bg-[hsl(220,20%,7%)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(280,70%,50%)] to-[hsl(320,70%,45%)] flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Treinamento GTO</h1>
              <p className="text-xs text-[hsl(220,15%,50%)]">Pratique decisões pré-flop</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats Pills */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,18%)] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[hsl(43,96%,56%)]" />
                <span className="text-sm font-mono font-medium text-white">{accuracy}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,18%)] flex items-center gap-2">
                <Flame className="w-4 h-4 text-[hsl(15,90%,55%)]" />
                <span className="text-sm font-mono font-medium text-white">{sessionStats.streak}</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,18%)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[hsl(210,85%,55%)]" />
                <span className="text-sm font-mono font-medium text-white">{totalQuestions}</span>
              </div>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showConfig 
                  ? "bg-[hsl(220,15%,20%)] text-white" 
                  : "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,50%)] hover:text-white"
              )}
            >
              <Settings2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-[hsl(220,15%,12%)] text-[hsl(220,15%,50%)] hover:text-white transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Training Area */}
          <div className="flex-1">
            {question && (
              <div className="space-y-6">
                {/* Scenario & Position Badge */}
                <div className="flex items-center justify-center gap-3">
                  <div className="px-4 py-2 rounded-lg bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,18%)]">
                    <span className="text-sm text-[hsl(220,15%,50%)]">Cenário:</span>
                    <span className="ml-2 font-semibold text-white">{SCENARIO_LABELS[question.scenario]}</span>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,18%)]">
                    <span className="text-sm text-[hsl(220,15%,50%)]">Posição:</span>
                    <span className="ml-2 font-semibold text-[hsl(210,85%,55%)]">{question.position}</span>
                  </div>
                  {timedMode && timeLeft !== null && (
                    <div className={cn(
                      "px-4 py-2 rounded-lg border flex items-center gap-2",
                      timeLeft <= 3 
                        ? "bg-[hsl(0,70%,15%)] border-[hsl(0,70%,30%)] text-[hsl(0,70%,60%)]"
                        : "bg-[hsl(220,15%,12%)] border-[hsl(220,15%,18%)]"
                    )}>
                      <Clock className="w-4 h-4" />
                      <span className="font-mono font-bold">{timeLeft}s</span>
                    </div>
                  )}
                </div>

                {/* Cards Display */}
                <div className="flex justify-center py-8">
                  <div className="flex gap-4">
                    {question.cards.map((card, i) => (
                      <div key={i} className="transform hover:scale-105 transition-transform">
                        <PokerCard 
                          rank={card.rank as "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2"} 
                          suit={SUIT_NAMES[card.suit] as "hearts" | "diamonds" | "clubs" | "spades"}
                          size="lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hand Notation */}
                <div className="text-center">
                  <span className="text-2xl font-mono font-bold text-white">{question.hand}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 py-4">
                  {(["raise", "call", "fold"] as Action[]).map((action) => {
                    const isSelected = selectedAction === action;
                    const isCorrectAction = showResult && question.correctAction === action;
                    const isWrongSelection = showResult && isSelected && !isCorrect;
                    
                    // Get frequency for this action
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
                          "relative px-8 py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all",
                          "border-2 min-w-[140px]",
                          !showResult && action === "raise" && "bg-[hsl(142,50%,20%)] border-[hsl(142,70%,35%)] text-[hsl(142,70%,60%)] hover:bg-[hsl(142,70%,25%)]",
                          !showResult && action === "call" && "bg-[hsl(210,50%,20%)] border-[hsl(210,85%,45%)] text-[hsl(210,85%,65%)] hover:bg-[hsl(210,85%,25%)]",
                          !showResult && action === "fold" && "bg-[hsl(220,15%,12%)] border-[hsl(220,15%,25%)] text-[hsl(220,15%,50%)] hover:bg-[hsl(220,15%,18%)]",
                          showResult && isCorrectAction && "bg-[hsl(142,70%,25%)] border-[hsl(142,70%,45%)] text-white ring-2 ring-[hsl(142,70%,45%)] ring-offset-2 ring-offset-[hsl(220,20%,6%)]",
                          showResult && isWrongSelection && "bg-[hsl(0,70%,25%)] border-[hsl(0,70%,45%)] text-white",
                          showResult && !isCorrectAction && !isWrongSelection && "opacity-40"
                        )}
                      >
                        {action === "raise" && <Zap className="w-5 h-5 inline mr-2" />}
                        {action}
                        
                        {/* Show frequency on result */}
                        {showResult && freq > 0 && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-[hsl(220,15%,50%)]">
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
                    "mx-auto max-w-xl p-6 rounded-xl border-2 mt-8",
                    isCorrect 
                      ? "bg-[hsl(142,50%,10%)] border-[hsl(142,70%,35%)]"
                      : "bg-[hsl(0,50%,10%)] border-[hsl(0,70%,40%)]"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        isCorrect ? "bg-[hsl(142,70%,25%)]" : "bg-[hsl(0,70%,30%)]"
                      )}>
                        {isCorrect 
                          ? <CheckCircle2 className="w-6 h-6 text-[hsl(142,70%,60%)]" />
                          : <XCircle className="w-6 h-6 text-[hsl(0,70%,70%)]" />
                        }
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "text-lg font-bold mb-2",
                          isCorrect ? "text-[hsl(142,70%,60%)]" : "text-[hsl(0,70%,65%)]"
                        )}>
                          {isCorrect ? "Correto!" : "Incorreto"}
                        </h3>
                        <p className="text-sm text-[hsl(220,15%,60%)] mb-3">
                          A ação GTO para <span className="font-mono font-bold text-white">{question.hand}</span> em <span className="text-[hsl(210,85%,55%)]">{question.position}</span> ({SCENARIO_LABELS[question.scenario]}) é:
                        </p>
                        
                        {/* Frequency Breakdown */}
                        {question.frequencies && (
                          <div className="space-y-2 mb-4">
                            {Object.entries(question.frequencies)
                              .filter(([_, freq]) => freq > 0)
                              .sort(([_, a], [__, b]) => b - a)
                              .map(([action, freq]) => (
                                <div key={action} className="flex items-center gap-3">
                                  <span className={cn(
                                    "w-16 text-xs font-bold uppercase",
                                    action === "raise" && "text-[hsl(142,70%,50%)]",
                                    action === "call" && "text-[hsl(210,85%,55%)]",
                                    action === "fold" && "text-[hsl(220,15%,50%)]"
                                  )}>
                                    {action}
                                  </span>
                                  <div className="flex-1 h-2 bg-[hsl(220,15%,15%)] rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        action === "raise" && "bg-[hsl(142,70%,45%)]",
                                        action === "call" && "bg-[hsl(210,85%,50%)]",
                                        action === "fold" && "bg-[hsl(220,15%,35%)]"
                                      )}
                                      style={{ width: `${freq * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-mono text-white w-12 text-right">
                                    {(freq * 100).toFixed(0)}%
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        )}

                        {/* EV Display */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[hsl(220,15%,50%)]">EV:</span>
                          <span className={cn(
                            "font-mono font-bold",
                            question.ev >= 0 ? "text-[hsl(142,70%,50%)]" : "text-[hsl(0,70%,55%)]"
                          )}>
                            {question.ev >= 0 ? "+" : ""}{question.ev.toFixed(2)}bb
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={handleNext}
                      className="w-full mt-6 py-3 rounded-lg bg-[hsl(220,15%,18%)] hover:bg-[hsl(220,15%,22%)] border border-[hsl(220,15%,25%)] text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      Próxima Mão
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Config Sidebar */}
          {showConfig && (
            <div className="w-80 bg-[hsl(220,20%,8%)] border border-[hsl(220,15%,15%)] rounded-xl p-4 h-fit">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configurações
              </h3>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="text-xs text-[hsl(220,15%,50%)] uppercase tracking-wide mb-2 block">
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
                          ? "bg-[hsl(210,85%,45%)] text-white"
                          : "bg-[hsl(220,15%,12%)] text-[hsl(220,15%,50%)] hover:text-white"
                      )}
                    >
                      {d === "easy" ? "Fácil" : d === "normal" ? "Normal" : "Difícil"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timed Mode */}
              <div className="mb-6">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-[hsl(220,15%,50%)] uppercase tracking-wide">
                    Modo Cronometrado
                  </span>
                  <button
                    onClick={() => setTimedMode(!timedMode)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      timedMode ? "bg-[hsl(210,85%,45%)]" : "bg-[hsl(220,15%,20%)]"
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
              <div className="mb-6">
                <label className="text-xs text-[hsl(220,15%,50%)] uppercase tracking-wide mb-2 block">
                  Cenários
                </label>
                <div className="space-y-1">
                  {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
                    <label 
                      key={s}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[hsl(220,15%,12%)] cursor-pointer"
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
                        className="w-4 h-4 rounded border-[hsl(220,15%,30%)] bg-[hsl(220,15%,12%)] text-[hsl(210,85%,45%)] focus:ring-[hsl(210,85%,45%)]"
                      />
                      <span className="text-sm text-[hsl(220,15%,70%)]">{SCENARIO_LABELS[s]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Session Stats */}
              <div className="border-t border-[hsl(220,15%,15%)] pt-4">
                <h4 className="text-xs text-[hsl(220,15%,50%)] uppercase tracking-wide mb-3">
                  Estatísticas da Sessão
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(220,15%,50%)]">Corretas</span>
                    <span className="font-mono text-[hsl(142,70%,50%)]">{sessionStats.correct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(220,15%,50%)]">Incorretas</span>
                    <span className="font-mono text-[hsl(0,70%,55%)]">{sessionStats.incorrect}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(220,15%,50%)]">Precisão</span>
                    <span className="font-mono text-white">{accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(220,15%,50%)]">Melhor Sequência</span>
                    <span className="font-mono text-[hsl(43,96%,56%)]">{sessionStats.bestStreak}</span>
                  </div>
                </div>

                {/* Per-Scenario Stats */}
                {Object.keys(sessionStats.byScenario).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[hsl(220,15%,15%)]">
                    <h5 className="text-xs text-[hsl(220,15%,40%)] mb-2">Por Cenário</h5>
                    <div className="space-y-1.5">
                      {Object.entries(sessionStats.byScenario).map(([scenario, stats]) => (
                        <div key={scenario} className="flex items-center justify-between text-xs">
                          <span className="text-[hsl(220,15%,50%)]">{SCENARIO_LABELS[scenario as Scenario]}</span>
                          <span className="font-mono">
                            <span className="text-[hsl(142,70%,50%)]">{stats.correct}</span>
                            <span className="text-[hsl(220,15%,40%)]">/</span>
                            <span className="text-white">{stats.total}</span>
                            <span className="text-[hsl(220,15%,40%)] ml-1">
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
          )}
        </div>
      </div>
    </div>
  );
}
