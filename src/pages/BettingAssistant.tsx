import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Crosshair, RotateCcw, Sparkles } from "lucide-react";
import { CardPicker } from "@/components/betting/CardPicker";
import { HandInput } from "@/components/betting/HandInput";
import { BoardTexturePanel } from "@/components/betting/BoardTexturePanel";
import { RecommendationPanel } from "@/components/betting/RecommendationPanel";
import { MultiStreetPlan } from "@/components/betting/MultiStreetPlan";
import { HandHistoryPanel, HandHistoryEntry } from "@/components/betting/HandHistoryPanel";
import { GameContextForm } from "@/components/betting/GameContextForm";
import { AIAnalysisPanel } from "@/components/betting/AIAnalysisPanel";
import { UsageBadge } from "@/components/usage/UsageBadge";
import { useGTOAnalysis } from "@/hooks/useGTOAnalysis";
import {
  analyzeBoardTexture,
  analyzeHand,
  getRecommendation,
  getMultiStreetPlan,
  BettingRecommendation,
  BoardTexture,
  StreetPlan,
  GameContext
} from "@/lib/pokerAnalysis";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface Card {
  rank: Rank;
  suit: Suit;
}

export default function BettingAssistant() {
  // Card state
  const [heroCards, setHeroCards] = useState<Card[]>([]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [showCardPicker, setShowCardPicker] = useState<"hero" | "board" | null>(null);
  
  // Game context state
  const [potSize, setPotSize] = useState("45");
  const [stackSize, setStackSize] = useState("100");
  const [betSize, setBetSize] = useState("");
  const [position, setPosition] = useState<"ip" | "oop">("ip");
  const [facingBet, setFacingBet] = useState(false);
  const [villainType, setVillainType] = useState<"unknown" | "tight" | "loose" | "aggressive" | "passive">("unknown");
  
  // Results state
  const [recommendation, setRecommendation] = useState<BettingRecommendation | null>(null);
  const [multiStreetPlan, setMultiStreetPlan] = useState<StreetPlan[]>([]);
  const [history, setHistory] = useState<HandHistoryEntry[]>([]);
  
  // AI Analysis hook
  const { isAnalyzing, aiAnalysis, error: aiError, analyzeWithAI, clearAnalysis, usage, planName, canUseAnalysis } = useGTOAnalysis();

  // Computed values
  const allUsedCards = useMemo(() => [...heroCards, ...boardCards], [heroCards, boardCards]);
  
  const currentStreet = useMemo((): "flop" | "turn" | "river" => {
    if (boardCards.length >= 5) return "river";
    if (boardCards.length >= 4) return "turn";
    return "flop";
  }, [boardCards.length]);

  const boardTexture = useMemo((): BoardTexture => {
    return analyzeBoardTexture(boardCards);
  }, [boardCards]);

  const handAnalysis = useMemo(() => {
    return analyzeHand(heroCards, boardCards);
  }, [heroCards, boardCards]);

  // Handlers
  const handleCardSelect = useCallback((card: Card) => {
    if (showCardPicker === "hero" && heroCards.length < 2) {
      setHeroCards(prev => {
        const newCards = [...prev, card];
        if (newCards.length === 2) setShowCardPicker(null);
        return newCards;
      });
    } else if (showCardPicker === "board" && boardCards.length < 5) {
      setBoardCards(prev => [...prev, card]);
    }
  }, [showCardPicker, heroCards.length, boardCards.length]);

  const handleRemoveHeroCard = useCallback((index: number) => {
    setHeroCards(prev => prev.filter((_, i) => i !== index));
    setRecommendation(null);
  }, []);

  const handleRemoveBoardCard = useCallback((index: number) => {
    setBoardCards(prev => prev.filter((_, i) => i !== index));
    setRecommendation(null);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (heroCards.length < 2 || boardCards.length < 3) return;

    const context: GameContext = {
      heroCards,
      board: boardCards,
      potSize: parseFloat(potSize) || 45,
      street: currentStreet,
      position,
      facingBet,
      betSize: facingBet ? parseFloat(betSize) || 15 : undefined,
      villainType,
      stackSize: parseFloat(stackSize) || 100
    };

    const rec = getRecommendation(context);
    setRecommendation(rec);

    const plans = getMultiStreetPlan(context);
    setMultiStreetPlan(plans);

    // Add to history
    const entry: HandHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      heroCards: [...heroCards],
      boardCards: [...boardCards],
      potSize: context.potSize,
      street: currentStreet,
      action: rec.primaryAction,
      sizing: rec.sizing,
      equity: handAnalysis.equity
    };
    setHistory(prev => [entry, ...prev].slice(0, 50));
  }, [heroCards, boardCards, potSize, stackSize, betSize, position, facingBet, villainType, currentStreet, handAnalysis.equity]);

  const handleReset = useCallback(() => {
    setHeroCards([]);
    setBoardCards([]);
    setPotSize("45");
    setStackSize("100");
    setBetSize("");
    setFacingBet(false);
    setRecommendation(null);
    setMultiStreetPlan([]);
    setShowCardPicker(null);
    clearAnalysis();
  }, [clearAnalysis]);

  const handleRequestAIAnalysis = useCallback(() => {
    if (!recommendation || heroCards.length < 2 || boardCards.length < 3) return;
    
    // Derive draws from hand analysis
    const draws: string[] = [];
    if (handAnalysis.hasFlushDraw) draws.push("Flush Draw");
    if (handAnalysis.hasStraightDraw) draws.push("Straight Draw");
    
    analyzeWithAI({
      heroCards,
      boardCards,
      potSize: parseFloat(potSize) || 45,
      stackSize: parseFloat(stackSize) || 100,
      position,
      facingBet,
      betSize: facingBet ? parseFloat(betSize) || undefined : undefined,
      villainType,
      street: currentStreet,
      handStrength: handAnalysis.category,
      draws,
      boardTexture: {
        wetness: boardTexture.wetness,
        connectivity: boardTexture.connected ? "connected" : "disconnected",
        pairing: boardTexture.paired ? "paired" : boardTexture.trips ? "trips" : "unpaired",
      },
      equity: handAnalysis.equity,
      currentRecommendation: {
        action: recommendation.primaryAction,
        sizing: recommendation.sizing,
        confidence: recommendation.confidence,
      },
    });
  }, [
    recommendation, heroCards, boardCards, potSize, stackSize, position,
    facingBet, betSize, villainType, currentStreet, handAnalysis, boardTexture, analyzeWithAI
  ]);

  const handleHistorySelect = useCallback((entry: HandHistoryEntry) => {
    setHeroCards(entry.heroCards);
    setBoardCards(entry.boardCards);
    setPotSize(entry.potSize.toString());
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const canAnalyze = heroCards.length >= 2 && boardCards.length >= 3;

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Assistente de Apostas
            </h1>
            <p className="text-xs text-muted-foreground">Análise GTO com recomendações de sizing ótimo</p>
          </div>
          <div className="flex items-center gap-2">
            <UsageBadge />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,15%)] h-8"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reiniciar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left Column - Input */}
          <div className="xl:col-span-5 space-y-4">
            {/* Hero Hand */}
            <HandInput
              label="Sua Mão"
              cards={heroCards}
              maxCards={2}
              isActive={showCardPicker === "hero"}
              onToggle={() => setShowCardPicker(showCardPicker === "hero" ? null : "hero")}
              onRemoveCard={handleRemoveHeroCard}
              buttonLabel={heroCards.length < 2 ? "Selecionar" : "Editar"}
            />

            {/* Board */}
            <HandInput
              label="Board"
              cards={boardCards}
              maxCards={5}
              isActive={showCardPicker === "board"}
              onToggle={() => setShowCardPicker(showCardPicker === "board" ? null : "board")}
              onRemoveCard={handleRemoveBoardCard}
              buttonLabel={boardCards.length < 5 ? "Adicionar" : "Editar"}
              sublabels={["Flop", "Turn", "River"]}
            />

            {/* Card Picker */}
            {showCardPicker && (
              <CardPicker
                usedCards={allUsedCards}
                onCardSelect={handleCardSelect}
                title={`Selecionar Carta ${showCardPicker === "hero" ? "da Mão" : "do Board"}`}
              />
            )}

            {/* Game Context */}
            <GameContextForm
              potSize={potSize}
              setPotSize={setPotSize}
              stackSize={stackSize}
              setStackSize={setStackSize}
              betSize={betSize}
              setBetSize={setBetSize}
              position={position}
              setPosition={setPosition}
              facingBet={facingBet}
              setFacingBet={setFacingBet}
              villainType={villainType}
              setVillainType={setVillainType}
            />

            {/* Analyze Button */}
            <Button 
              variant="gold" 
              size="lg" 
              className="w-full h-10"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
            >
              <Crosshair className="w-4 h-4 mr-2" />
              Obter Recomendação GTO
            </Button>
          </div>

          {/* Center Column - Results */}
          <div className="xl:col-span-4 space-y-4">
            {/* Recommendation */}
            <RecommendationPanel 
              recommendation={recommendation} 
              equity={handAnalysis.equity}
            />

            {/* Multi-Street Plan */}
            {multiStreetPlan.length > 0 && (
              <MultiStreetPlan 
                plans={multiStreetPlan} 
                currentStreet={currentStreet}
              />
            )}

            {/* AI Analysis */}
            <AIAnalysisPanel
              analysis={aiAnalysis}
              isLoading={isAnalyzing}
              error={aiError}
              onRequestAnalysis={handleRequestAIAnalysis}
              canAnalyze={!!recommendation && heroCards.length >= 2 && boardCards.length >= 3}
            />
          </div>

          {/* Right Column - Analysis & History */}
          <div className="xl:col-span-3 space-y-4">
            {/* Board Texture */}
            {boardCards.length >= 3 && (
              <BoardTexturePanel texture={boardTexture} />
            )}

            {/* Hand History */}
            <HandHistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              onClear={handleClearHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
