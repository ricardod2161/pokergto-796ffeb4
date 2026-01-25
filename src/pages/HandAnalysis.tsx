import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, Play, Pause, SkipBack, SkipForward, AlertTriangle, CheckCircle, 
  Info, ChevronRight, TrendingUp, Target, Brain, Users, DollarSign,
  HelpCircle, Lightbulb, Eye, Zap, ChevronLeft, FileText, Trash2, Sparkles, X
} from "lucide-react";
import { PokerCard, CardPlaceholder } from "@/components/poker/PokerCard";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { parseHandHistory, generateSampleHand, type ParsedHand, type Street, type Action } from "@/lib/handHistoryParser";
import { useHandAnalysisAI } from "@/hooks/useHandAnalysisAI";
import { HandAnalysisAIPanel } from "@/components/hand-analysis/HandAnalysisAIPanel";
import { UsageBadge } from "@/components/usage/UsageBadge";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface HeroCard {
  rank: Rank;
  suit: Suit;
}

interface PlayerStats {
  vpip: number;
  pfr: number;
  threeBet: number;
  foldTo3Bet: number;
  cbet: number;
  foldToCbet: number;
  aggression: number;
  hands: number;
  playerType: string;
}

interface TablePlayer {
  position: string;
  name: string;
  stack: number;
  isHero: boolean;
  isActive: boolean;
  cards?: { rank: string; suit: string }[];
  currentBet?: number;
  hasFolded?: boolean;
  stats?: PlayerStats;
}

// Position coordinates for 6-max table (percentages)
const positionCoords6Max = {
  BTN: { top: "75%", left: "75%" },
  SB: { top: "45%", left: "92%" },
  BB: { top: "15%", left: "75%" },
  UTG: { top: "15%", left: "25%" },
  MP: { top: "45%", left: "8%" },
  CO: { top: "75%", left: "25%" },
};

// Position coordinates for 8-max table (percentages)
const positionCoords8Max = {
  BTN: { top: "80%", left: "65%" },
  SB: { top: "55%", left: "92%" },
  BB: { top: "25%", left: "88%" },
  UTG: { top: "12%", left: "55%" },
  "UTG+1": { top: "12%", left: "35%" },
  MP: { top: "25%", left: "12%" },
  HJ: { top: "55%", left: "8%" },
  CO: { top: "80%", left: "25%" },
};

// Position coordinates for 9-max table (percentages)
const positionCoords9Max = {
  BTN: { top: "80%", left: "70%" },
  SB: { top: "55%", left: "92%" },
  BB: { top: "25%", left: "88%" },
  UTG: { top: "12%", left: "65%" },
  "UTG+1": { top: "12%", left: "35%" },
  MP: { top: "25%", left: "12%" },
  "MP+1": { top: "55%", left: "8%" },
  HJ: { top: "80%", left: "15%" },
  CO: { top: "80%", left: "42%" },
};

// Get available positions for each table size
const getPositionsForTableSize = (size: 6 | 8 | 9): string[] => {
  if (size === 6) return ["BTN", "SB", "BB", "UTG", "MP", "CO"];
  if (size === 8) return ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO"];
  return ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "MP+1", "HJ", "CO"];
};

const ranks: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const suitSymbols: Record<Suit, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };

export default function HandAnalysis() {
  const [handHistory, setHandHistory] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<Street>("flop");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [parsedHand, setParsedHand] = useState<ParsedHand | null>(() => generateSampleHand());
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [tableSize, setTableSize] = useState<6 | 8 | 9>(8);
  const [heroPosition, setHeroPosition] = useState<string>("BTN");
  const [customHeroCards, setCustomHeroCards] = useState<HeroCard[]>([
    { rank: "A", suit: "spades" },
    { rank: "K", suit: "hearts" }
  ]);
  const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // AI Analysis hook
  const { analysis, isLoading: isAnalyzing, error: analysisError, analyzeHand, clearAnalysis, usage, planName, canUseAnalysis } = useHandAnalysisAI();

  // Available positions for the current table size
  const availablePositions = useMemo(() => getPositionsForTableSize(tableSize), [tableSize]);

  // Update hero position if current position is not available for the new table size
  useMemo(() => {
    if (!availablePositions.includes(heroPosition)) {
      setHeroPosition("BTN");
    }
  }, [availablePositions, heroPosition]);

  // Card picker handlers
  const handleCardSelect = (card: HeroCard) => {
    if (customHeroCards.length < 2) {
      setCustomHeroCards([...customHeroCards, card]);
      if (customHeroCards.length === 1) {
        setIsCardPickerOpen(false);
      }
    }
  };

  const handleRemoveCard = (index: number) => {
    setCustomHeroCards(customHeroCards.filter((_, i) => i !== index));
  };

  const isCardUsed = (rank: Rank, suit: Suit) => {
    return customHeroCards.some(c => c.rank === rank && c.suit === suit);
  };

  // Generate player stats (simulated for demo)
  const generatePlayerStats = (position: string, isHero: boolean): PlayerStats | undefined => {
    if (isHero) return undefined; // Hero doesn't show HUD
    
    // Randomized but realistic stats based on player types
    const playerProfiles: Record<string, PlayerStats> = {
      "SB": { vpip: 32, pfr: 24, threeBet: 8, foldTo3Bet: 52, cbet: 68, foldToCbet: 42, aggression: 2.8, hands: 892, playerType: "LAG" },
      "BB": { vpip: 28, pfr: 22, threeBet: 9, foldTo3Bet: 58, cbet: 72, foldToCbet: 45, aggression: 2.4, hands: 1247, playerType: "TAG" },
      "UTG": { vpip: 18, pfr: 16, threeBet: 6, foldTo3Bet: 65, cbet: 75, foldToCbet: 38, aggression: 2.1, hands: 654, playerType: "NIT" },
      "UTG+1": { vpip: 20, pfr: 17, threeBet: 7, foldTo3Bet: 62, cbet: 70, foldToCbet: 40, aggression: 2.2, hands: 423, playerType: "TAG" },
      "MP": { vpip: 24, pfr: 20, threeBet: 8, foldTo3Bet: 55, cbet: 65, foldToCbet: 48, aggression: 2.5, hands: 789, playerType: "TAG" },
      "MP+1": { vpip: 35, pfr: 12, threeBet: 4, foldTo3Bet: 70, cbet: 45, foldToCbet: 55, aggression: 1.5, hands: 312, playerType: "Fish" },
      "HJ": { vpip: 26, pfr: 22, threeBet: 10, foldTo3Bet: 50, cbet: 78, foldToCbet: 35, aggression: 3.1, hands: 1089, playerType: "LAG" },
      "CO": { vpip: 30, pfr: 25, threeBet: 11, foldTo3Bet: 48, cbet: 70, foldToCbet: 40, aggression: 2.9, hands: 567, playerType: "LAG" },
    };
    
    return playerProfiles[position] || { vpip: 25, pfr: 20, threeBet: 8, foldTo3Bet: 55, cbet: 65, foldToCbet: 45, aggression: 2.3, hands: 500, playerType: "REG" };
  };

  // Generate table players based on parsed hand or defaults
  const tablePlayers = useMemo((): TablePlayer[] => {
    const positions = getPositionsForTableSize(tableSize);
    
    // Generate player names dynamically
    const getPlayerName = (position: string, isHero: boolean): string => {
      if (isHero) return "Herói";
      const positionIndex = positions.indexOf(position);
      return `Player${positionIndex + 1}`;
    };

    // Generate random stack for variety
    const getPlayerStack = (position: string, isHero: boolean): number => {
      if (isHero) return 500;
      // Generate pseudo-random but consistent stacks based on position
      const baseStacks: Record<string, number> = {
        "SB": 485, "BB": 520, "UTG": 450, "UTG+1": 420, 
        "MP": 380, "MP+1": 390, "HJ": 550, "CO": 610, "BTN": 500
      };
      return baseStacks[position] || 500;
    };

    // Determine active status (blinds and hero are always active for demo)
    const isActivePosition = (position: string, isHero: boolean): boolean => {
      if (isHero) return true;
      if (position === "SB" || position === "BB") return true;
      return false;
    };

    return positions.map((position) => {
      const isHero = position === heroPosition;
      return {
        position,
        name: getPlayerName(position, isHero),
        stack: getPlayerStack(position, isHero),
        isHero,
        isActive: isActivePosition(position, isHero),
        hasFolded: !isActivePosition(position, isHero),
        cards: isHero ? customHeroCards : undefined,
        stats: isHero ? undefined : generatePlayerStats(position, false),
      };
    });
  }, [tableSize, heroPosition, parsedHand, customHeroCards]);

  // Get cards based on parsed hand or custom selection
  const heroCards = useMemo(() => {
    if (parsedHand?.heroCards && parsedHand.heroCards.length >= 2) {
      return parsedHand.heroCards;
    }
    return customHeroCards;
  }, [parsedHand, customHeroCards]);
  
  const boardCards = useMemo(() => {
    if (parsedHand?.communityCards) {
      return parsedHand.communityCards;
    }
    return {
      flop: [
        { rank: "K" as const, suit: "diamonds" as const },
        { rank: "7" as const, suit: "clubs" as const },
        { rank: "2" as const, suit: "spades" as const }
      ],
      turn: { rank: "Q" as const, suit: "hearts" as const },
      river: { rank: "3" as const, suit: "diamonds" as const }
    };
  }, [parsedHand]);

  const actionHistory = useMemo(() => {
    if (parsedHand?.actions && parsedHand.actions.length > 0) {
      return parsedHand.actions.map(action => ({
        player: action.isHero ? `Herói (${parsedHand.heroPosition})` : action.player,
        action: formatAction(action),
        street: action.street,
        type: action.action,
      }));
    }
    return [
      { player: "Vilão (BB)", action: "Raise para R$ 6", street: "preflop" as Street, type: "raise" },
      { player: "Herói (BTN)", action: "3-Bet para R$ 18", street: "preflop" as Street, type: "raise" },
      { player: "Vilão (BB)", action: "Call R$ 12", street: "preflop" as Street, type: "call" },
      { player: "Vilão (BB)", action: "Check", street: "flop" as Street, type: "check" },
      { player: "Herói (BTN)", action: "Aposta R$ 22 (60% pote)", street: "flop" as Street, type: "bet" },
      { player: "Vilão (BB)", action: "Call R$ 22", street: "flop" as Street, type: "call" },
    ];
  }, [parsedHand]);

  function formatAction(action: Action): string {
    const amount = action.amount ? `R$ ${action.amount.toFixed(0)}` : "";
    switch (action.action) {
      case "fold": return "Fold";
      case "check": return "Check";
      case "call": return `Call ${amount}`;
      case "bet": return `Aposta ${amount}`;
      case "raise": return `Raise para ${amount}`;
      case "all-in": return `All-in ${amount}`;
      default: return action.action;
    }
  }

  const villainStats = [
    { label: "VPIP", value: "28%", tooltip: "Voluntarily Put In Pot - Frequência de entrada voluntária em potes" },
    { label: "PFR", value: "22%", tooltip: "Pre-Flop Raise - Frequência de raises pré-flop" },
    { label: "3-Bet", value: "9%", tooltip: "Frequência de 3-bet quando há um raise anterior" },
    { label: "Fold p/ 3-Bet", value: "58%", tooltip: "Frequência de fold quando enfrenta um 3-bet" },
    { label: "C-Bet", value: "72%", tooltip: "Continuation Bet - Frequência de aposta de continuação no flop" },
    { label: "Fold p/ C-Bet", value: "45%", tooltip: "Frequência de fold quando enfrenta uma c-bet" },
  ];

  const streetLabels: Record<Street, string> = {
    preflop: "Pré-Flop",
    flop: "Flop",
    turn: "Turn",
    river: "River"
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "raise":
      case "bet":
        return "text-success";
      case "call":
        return "text-primary";
      case "check":
        return "text-muted-foreground";
      case "fold":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  const handleProcessHand = () => {
    const parsed = parseHandHistory(handHistory);
    if (parsed) {
      setParsedHand(parsed);
      setCurrentStreet("preflop");
      setCurrentActionIndex(0);
      setShowImportDialog(false);
      setHandHistory("");
      toast.success("Mão importada com sucesso!", {
        description: `${parsed.site} - Hand #${parsed.handId}`,
      });
    } else {
      toast.error("Erro ao processar histórico", {
        description: "Verifique se o formato está correto e tente novamente.",
      });
    }
  };

  const handleLoadSample = () => {
    setParsedHand(generateSampleHand());
    setCurrentStreet("flop");
    setCurrentActionIndex(0);
    setShowImportDialog(false);
    toast.success("Mão de exemplo carregada!");
  };

  const handleClearHand = () => {
    setParsedHand(null);
    setCurrentStreet("preflop");
    setCurrentActionIndex(0);
    toast.info("Mão removida");
  };

  const handleNextAction = () => {
    if (currentActionIndex < actionHistory.length - 1) {
      const nextIndex = currentActionIndex + 1;
      setCurrentActionIndex(nextIndex);
      setCurrentStreet(actionHistory[nextIndex].street);
    }
  };

  const handlePrevAction = () => {
    if (currentActionIndex > 0) {
      const prevIndex = currentActionIndex - 1;
      setCurrentActionIndex(prevIndex);
      setCurrentStreet(actionHistory[prevIndex].street);
    }
  };

  const handleFirstAction = () => {
    setCurrentActionIndex(0);
    setCurrentStreet(actionHistory[0]?.street || "preflop");
  };

  const handleLastAction = () => {
    const lastIndex = actionHistory.length - 1;
    setCurrentActionIndex(lastIndex);
    setCurrentStreet(actionHistory[lastIndex]?.street || "river");
  };

  const potSize = parsedHand?.potSize || 245;
  const positionCoords = tableSize === 6 ? positionCoords6Max : tableSize === 8 ? positionCoords8Max : positionCoords9Max;

  // Request AI analysis
  const handleRequestAnalysis = useCallback(() => {
    const villain = tablePlayers.find(p => !p.isHero && p.isActive);
    analyzeHand({
      heroCards: heroCards as { rank: string; suit: string }[],
      boardCards: {
        flop: boardCards.flop as { rank: string; suit: string }[],
        turn: boardCards.turn as { rank: string; suit: string } | null,
        river: boardCards.river as { rank: string; suit: string } | null,
      },
      heroPosition: parsedHand?.heroPosition || heroPosition,
      villainPosition: villain?.position || "BB",
      currentStreet,
      actions: actionHistory.map(a => ({
        player: a.player,
        action: a.action,
        type: a.type,
        street: a.street,
      })),
      potSize,
      heroStack: parsedHand?.hero?.stack || 500,
      villainStack: villain?.stack || 485,
    });
  }, [heroCards, boardCards, currentStreet, actionHistory, potSize, parsedHand, tablePlayers, analyzeHand, heroPosition]);

  // Get player type color
  const getPlayerTypeColor = (type: string) => {
    switch (type) {
      case "NIT": return "text-blue-400";
      case "TAG": return "text-success";
      case "LAG": return "text-warning";
      case "Fish": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  // Get stat color based on value
  const getStatColor = (stat: string, value: number) => {
    if (stat === "vpip") {
      if (value < 20) return "text-blue-400"; // Tight
      if (value < 30) return "text-success"; // Normal
      return "text-warning"; // Loose
    }
    if (stat === "pfr") {
      if (value < 15) return "text-blue-400";
      if (value < 25) return "text-success";
      return "text-warning";
    }
    if (stat === "threeBet") {
      if (value < 6) return "text-blue-400";
      if (value < 10) return "text-success";
      return "text-warning";
    }
    return "text-foreground";
  };

  const PlayerSeat = ({ player, coords }: { player: TablePlayer; coords: { top: string; left: string } }) => {
    const cardSize = isMobile ? "xs" : "sm";
    const stats = player.stats;
    
    const seatContent = (
      <div 
        className={cn(
          "absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-all duration-300 group",
          player.hasFolded && "opacity-40"
        )}
        style={{ top: coords.top, left: coords.left }}
      >
        {/* Player cards */}
        <div className="flex gap-0.5">
          {player.isHero && player.cards ? (
            player.cards.map((card, i) => (
              <PokerCard 
                key={i} 
                rank={card.rank as any} 
                suit={card.suit as any} 
                size={cardSize}
                highlighted={player.isActive}
              />
            ))
          ) : (
            <>
              <PokerCard rank="A" suit="spades" size={cardSize} faceDown />
              <PokerCard rank="A" suit="spades" size={cardSize} faceDown />
            </>
          )}
        </div>
        
        {/* Player info badge */}
        <div className={cn(
          "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-center min-w-[50px] sm:min-w-[70px] transition-all cursor-pointer",
          player.isHero 
            ? "bg-primary text-primary-foreground" 
            : player.isActive 
              ? "bg-[hsl(220,15%,20%)] text-foreground border border-[hsl(220,15%,30%)] hover:border-primary/50"
              : "bg-[hsl(220,15%,15%)] text-muted-foreground hover:bg-[hsl(220,15%,18%)]",
          player.hasFolded && "line-through"
        )}>
          <p className={cn(
            "font-medium leading-tight",
            isMobile ? "text-[8px]" : "text-[10px]"
          )}>
            {player.position}
          </p>
          <p className={cn(
            "font-mono",
            isMobile ? "text-[7px]" : "text-[9px]"
          )}>
            {player.hasFolded ? "Fold" : `R$ ${player.stack}`}
          </p>
        </div>
      </div>
    );

    // If no stats (hero) or mobile, just return the seat
    if (!stats || isMobile) {
      return seatContent;
    }

    // With HUD tooltip for non-hero players
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {seatContent}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="p-0 bg-[hsl(220,18%,10%)] border-[hsl(220,15%,20%)] shadow-xl w-[200px]"
            sideOffset={8}
          >
            {/* HUD Header */}
            <div className="px-3 py-2 border-b border-[hsl(220,15%,18%)] bg-[hsl(220,15%,8%)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{player.name}</span>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", getPlayerTypeColor(stats.playerType))}>
                  {stats.playerType}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{stats.hands} mãos</p>
            </div>

            {/* Main Stats Grid */}
            <div className="p-2 space-y-2">
              {/* VPIP / PFR / 3-Bet Row */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="text-center p-1.5 rounded bg-[hsl(220,15%,12%)]">
                  <p className={cn("text-sm font-mono font-bold", getStatColor("vpip", stats.vpip))}>{stats.vpip}%</p>
                  <p className="text-[9px] text-muted-foreground">VPIP</p>
                </div>
                <div className="text-center p-1.5 rounded bg-[hsl(220,15%,12%)]">
                  <p className={cn("text-sm font-mono font-bold", getStatColor("pfr", stats.pfr))}>{stats.pfr}%</p>
                  <p className="text-[9px] text-muted-foreground">PFR</p>
                </div>
                <div className="text-center p-1.5 rounded bg-[hsl(220,15%,12%)]">
                  <p className={cn("text-sm font-mono font-bold", getStatColor("threeBet", stats.threeBet))}>{stats.threeBet}%</p>
                  <p className="text-[9px] text-muted-foreground">3-Bet</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex justify-between items-center px-2 py-1 rounded bg-[hsl(220,15%,12%)]">
                  <span className="text-[9px] text-muted-foreground">Fold 3-Bet</span>
                  <span className="text-xs font-mono text-foreground">{stats.foldTo3Bet}%</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 rounded bg-[hsl(220,15%,12%)]">
                  <span className="text-[9px] text-muted-foreground">C-Bet</span>
                  <span className="text-xs font-mono text-foreground">{stats.cbet}%</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 rounded bg-[hsl(220,15%,12%)]">
                  <span className="text-[9px] text-muted-foreground">Fold C-Bet</span>
                  <span className="text-xs font-mono text-foreground">{stats.foldToCbet}%</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 rounded bg-[hsl(220,15%,12%)]">
                  <span className="text-[9px] text-muted-foreground">AGG</span>
                  <span className="text-xs font-mono text-foreground">{stats.aggression.toFixed(1)}</span>
                </div>
              </div>

              {/* Quick Insight */}
              <div className="p-2 rounded bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {stats.playerType === "NIT" && "Joga muito tight. Respeite seus raises, mas roube seus blinds."}
                  {stats.playerType === "TAG" && "Jogador sólido. Cuidado com value bets, mas pode ser blefado."}
                  {stats.playerType === "LAG" && "Agressivo e wide. 3-Bet mais para valor e trap com mãos fortes."}
                  {stats.playerType === "Fish" && "Jogador fraco. Value bet thin e evite blefes elaborados."}
                  {stats.playerType === "REG" && "Regular equilibrado. Jogue GTO e evite lines exploitáveis."}
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const ImportPanel = () => (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-primary block mb-1">Como importar mãos</span>
            Copie o histórico completo da mão do seu cliente de poker e cole aqui.
          </div>
        </div>
      </div>
      
      <Textarea
        placeholder={`Cole o histórico da mão aqui...

Exemplo PokerStars:
PokerStars Hand #123456789:  Hold'em No Limit ($0.50/$1.00)
Table 'Mesa 1' 6-max Seat #1 is the button
Seat 1: Hero ($100 in chips)
Dealt to Hero [Ah Kd]
...`}
        value={handHistory}
        onChange={(e) => setHandHistory(e.target.value)}
        className="min-h-40 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)] font-mono text-xs resize-none placeholder:text-muted-foreground/50"
      />
      
      <div className="flex gap-2">
        <Button 
          variant="gold" 
          className="flex-1"
          disabled={!handHistory.trim()}
          onClick={handleProcessHand}
        >
          <Upload className="w-4 h-4 mr-2" />
          Processar Mão
        </Button>
        <Button 
          variant="outline" 
          className="border-[hsl(220,15%,20%)]"
          onClick={handleLoadSample}
        >
          <FileText className="w-4 h-4 mr-2" />
          Exemplo
        </Button>
      </div>
      
      <div className="p-3 rounded-lg bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,15%)]">
        <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
          Formatos Suportados
        </p>
        <div className="flex flex-wrap gap-2">
          {["PokerStars", "888poker", "PartyPoker", "GGPoker", "Winamax"].map((format) => (
            <span key={format} className="px-2 py-1 text-[10px] rounded bg-[hsl(220,15%,15%)] text-muted-foreground">
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const AnalysisSidebar = () => (
    <div className="space-y-4">
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="w-full bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,15%)]">
          <TabsTrigger value="ai" className="flex-1 text-xs data-[state=active]:bg-primary">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            IA
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex-1 text-xs data-[state=active]:bg-primary">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="import" className="flex-1 text-xs data-[state=active]:bg-primary">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Importar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai" className="mt-4 space-y-4">
          {/* AI Analysis Panel */}
          <HandAnalysisAIPanel
            analysis={analysis}
            isLoading={isAnalyzing}
            error={analysisError}
            onRequestAnalysis={handleRequestAnalysis}
            canAnalyze={heroCards.length >= 2}
          />

          {/* Hand Strength Meter */}
          <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-gold" />
              Força da Mão
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Força Absoluta</span>
                  <span className="font-mono text-success font-medium">Top Pair</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(220,15%,15%)] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-success to-success/70 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Equity vs Range</span>
                  <span className="font-mono text-success font-medium">78.4%</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(220,15%,15%)] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: "78.4%" }} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-4">
          <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Stats do Vilão
              </h3>
              <span className="text-[10px] text-muted-foreground px-2 py-1 bg-[hsl(220,15%,12%)] rounded-full">
                1.247 mãos
              </span>
            </div>
            
            <TooltipProvider>
              <div className="grid grid-cols-2 gap-2">
                {villainStats.map((stat) => (
                  <Tooltip key={stat.label}>
                    <TooltipTrigger asChild>
                      <div className="text-center p-3 rounded-lg bg-[hsl(220,15%,10%)] hover:bg-[hsl(220,15%,12%)] transition-colors cursor-help">
                        <p className="text-lg font-mono font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-48">
                      <p className="text-xs">{stat.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>

            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Perfil Identificado</span>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">TAG (Tight-Aggressive)</span> - Joga poucos potes mas aposta agressivamente.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="import" className="mt-4">
          <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-gold" />
              Importar Mão
            </h3>
            <ImportPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 lg:p-6 xl:p-8 space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Análise de Mãos</h1>
            <p className="text-xs lg:text-sm text-muted-foreground">
              {parsedHand?.site !== "Demo" && parsedHand?.handId 
                ? `${parsedHand.site} - Hand #${parsedHand.handId}` 
                : "Importe e revise mãos com análise GTO detalhada"}
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            <UsageBadge />
            {/* Hero cards selector */}
            <Popover open={isCardPickerOpen} onOpenChange={setIsCardPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[hsl(220,15%,20%)] bg-[hsl(220,15%,10%)] hover:bg-[hsl(220,15%,15%)] transition-colors">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Mão:</span>
                  <div className="flex gap-0.5">
                    {customHeroCards.length > 0 ? (
                      customHeroCards.map((card, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-6 h-8 rounded text-[10px] font-bold flex flex-col items-center justify-center bg-white",
                            (card.suit === "hearts" || card.suit === "diamonds") ? "text-red-500" : "text-gray-900"
                          )}
                        >
                          <span>{card.rank}</span>
                          <span className="text-[8px] -mt-0.5">{suitSymbols[card.suit]}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="w-6 h-8 rounded bg-[hsl(220,15%,20%)] border border-dashed border-[hsl(220,15%,30%)]" />
                        <div className="w-6 h-8 rounded bg-[hsl(220,15%,20%)] border border-dashed border-[hsl(220,15%,30%)]" />
                      </>
                    )}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-3 bg-[hsl(220,18%,10%)] border-[hsl(220,15%,20%)] shadow-xl z-50" 
                align="start"
                sideOffset={8}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Selecionar Cartas</h4>
                    {customHeroCards.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomHeroCards([])}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  {/* Selected cards preview */}
                  <div className="flex gap-2 items-center justify-center p-2 rounded-lg bg-[hsl(220,15%,8%)]">
                    {customHeroCards.map((card, i) => (
                      <div key={i} className="relative group">
                        <div 
                          className={cn(
                            "w-10 h-14 rounded-md text-sm font-bold flex flex-col items-center justify-center bg-white shadow-md",
                            (card.suit === "hearts" || card.suit === "diamonds") ? "text-red-500" : "text-gray-900"
                          )}
                        >
                          <span>{card.rank}</span>
                          <span className="text-xs">{suitSymbols[card.suit]}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveCard(i)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </button>
                      </div>
                    ))}
                    {Array.from({ length: 2 - customHeroCards.length }).map((_, i) => (
                      <div 
                        key={`empty-${i}`} 
                        className="w-10 h-14 rounded-md border-2 border-dashed border-[hsl(220,15%,25%)] flex items-center justify-center"
                      >
                        <span className="text-xs text-muted-foreground">?</span>
                      </div>
                    ))}
                  </div>

                  {/* Card grid */}
                  {customHeroCards.length < 2 && (
                    <div 
                      className="grid gap-[2px] bg-[hsl(220,15%,12%)] p-1 rounded-lg" 
                      style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}
                    >
                      {suits.map(suit => (
                        ranks.map(rank => {
                          const used = isCardUsed(rank, suit);
                          return (
                            <button
                              key={`${rank}${suit}`}
                              onClick={() => !used && handleCardSelect({ rank, suit })}
                              disabled={used}
                              className={cn(
                                "aspect-[3/4] flex flex-col items-center justify-center text-xs font-mono font-semibold rounded transition-all",
                                used 
                                  ? "bg-[hsl(220,15%,10%)] text-muted-foreground/30 cursor-not-allowed"
                                  : "bg-white text-gray-900 hover:scale-105 hover:shadow-lg cursor-pointer",
                                (suit === "hearts" || suit === "diamonds") && !used && "text-red-500"
                              )}
                            >
                              <span className="text-[10px] leading-none">{rank}</span>
                              <span className="text-[8px] leading-none">{suitSymbols[suit]}</span>
                            </button>
                          );
                        })
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Hero position selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Posição:</span>
              <select
                value={heroPosition}
                onChange={(e) => setHeroPosition(e.target.value)}
                className="px-2 py-1.5 text-xs font-medium rounded-lg border border-[hsl(220,15%,20%)] bg-[hsl(220,15%,10%)] text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {availablePositions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Table size toggle */}
            <div className="flex rounded-lg border border-[hsl(220,15%,20%)] overflow-hidden">
              {([6, 8, 9] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setTableSize(size)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors",
                    tableSize === size 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-[hsl(220,15%,10%)] text-muted-foreground hover:text-foreground"
                  )}
                >
                  {size}-Max
                </button>
              ))}
            </div>

            {parsedHand && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleClearHand}
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
            
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="gold" size="sm">
                  <Upload className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Importar Histórico</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[hsl(220,18%,8%)] border-[hsl(220,15%,15%)] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Importar Mão</DialogTitle>
                </DialogHeader>
                <ImportPanel />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Educational Info */}
        <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">Hand Replayer Profissional</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visualize todas as posições da mesa e navegue jogada por jogada. Clique em qualquer ação no histórico para pular diretamente.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Replayer */}
          <div className="lg:col-span-2 space-y-4">
            {/* Table View */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
              <div className={cn(
                "relative bg-gradient-to-b from-[hsl(153,40%,18%)] to-[hsl(153,45%,12%)]",
                isMobile ? "aspect-square min-h-[320px]" : "aspect-[16/10] min-h-[400px]"
              )}>
                {/* Table felt border */}
                <div className={cn(
                  "absolute border-4 border-[hsl(153,35%,25%)]/40 rounded-[50%]",
                  isMobile ? "inset-6" : "inset-10 lg:inset-12"
                )} />
                
                {/* Inner table line */}
                <div className={cn(
                  "absolute border-2 border-[hsl(153,35%,30%)]/30 rounded-[50%]",
                  isMobile ? "inset-8" : "inset-14 lg:inset-16"
                )} />
                
                {/* Pot display - center */}
                <div className="absolute top-[25%] left-1/2 -translate-x-1/2 text-center z-10">
                  <p className="text-[10px] lg:text-xs text-white/60 uppercase tracking-wider font-medium">Pote</p>
                  <p className={cn(
                    "font-mono font-bold text-gold",
                    isMobile ? "text-lg" : "text-2xl lg:text-3xl"
                  )}>R$ {potSize.toFixed(2).replace(".", ",")}</p>
                </div>

                {/* Board cards - center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 sm:gap-1.5 z-10">
                  {currentStreet !== "preflop" && boardCards.flop.map((card, i) => (
                    <PokerCard key={i} rank={card.rank} suit={card.suit} size={isMobile ? "sm" : "md"} />
                  ))}
                  {(currentStreet === "turn" || currentStreet === "river") && boardCards.turn && (
                    <PokerCard rank={boardCards.turn.rank} suit={boardCards.turn.suit} size={isMobile ? "sm" : "md"} />
                  )}
                  {currentStreet === "river" && boardCards.river && (
                    <PokerCard rank={boardCards.river.rank} suit={boardCards.river.suit} size={isMobile ? "sm" : "md"} />
                  )}
                  {currentStreet === "preflop" && (
                    <div className="px-4 py-2 rounded-lg bg-[hsl(220,18%,10%)]/80 backdrop-blur-sm">
                      <span className="text-white/60 text-sm font-medium">Pré-Flop</span>
                    </div>
                  )}
                </div>

                {/* All player positions */}
                {tablePlayers.map((player) => {
                  const coords = positionCoords[player.position as keyof typeof positionCoords];
                  if (!coords) return null;
                  return <PlayerSeat key={player.position} player={player} coords={coords} />;
                })}

                {/* Equity display */}
                <div className={cn(
                  "absolute bg-[hsl(220,18%,10%)]/90 backdrop-blur-sm rounded-lg text-right border border-[hsl(220,15%,18%)] z-20",
                  isMobile ? "top-2 right-2 p-2" : "top-4 right-4 p-3"
                )}>
                  <p className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-wider">Equity</p>
                  <p className={cn(
                    "font-mono font-bold text-success",
                    isMobile ? "text-base" : "text-xl"
                  )}>78.4%</p>
                </div>

                {/* Current action indicator */}
                {actionHistory[currentActionIndex] && (
                  <div className={cn(
                    "absolute bg-[hsl(220,18%,10%)]/90 backdrop-blur-sm rounded-lg border border-[hsl(220,15%,18%)] z-20",
                    isMobile ? "bottom-2 left-2 p-2" : "bottom-4 left-4 p-3"
                  )}>
                    <p className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-wider">Ação Atual</p>
                    <p className={cn(
                      "font-mono font-medium",
                      isMobile ? "text-xs" : "text-sm",
                      getActionColor(actionHistory[currentActionIndex].type)
                    )}>
                      {actionHistory[currentActionIndex].action}
                    </p>
                  </div>
                )}
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 py-3 sm:py-4 bg-[hsl(220,15%,8%)] border-t border-[hsl(220,15%,15%)]">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handleFirstAction}
                  disabled={currentActionIndex === 0}
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handlePrevAction}
                  disabled={currentActionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button 
                  variant="gold" 
                  size="icon" 
                  className={cn(isMobile ? "w-10 h-10" : "w-12 h-12")}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handleNextAction}
                  disabled={currentActionIndex >= actionHistory.length - 1}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handleLastAction}
                  disabled={currentActionIndex >= actionHistory.length - 1}
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Street indicator */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 bg-[hsl(220,15%,7%)]">
                {(["preflop", "flop", "turn", "river"] as const).map((street) => (
                  <button
                    key={street}
                    onClick={() => setCurrentStreet(street)}
                    className={cn(
                      "px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full font-medium transition-all",
                      isMobile ? "text-[10px]" : "text-xs",
                      currentStreet === street
                        ? "bg-primary text-primary-foreground"
                        : "bg-[hsl(220,15%,12%)] text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {streetLabels[street]}
                  </button>
                ))}
              </div>
            </div>

            {/* Action History */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-sm lg:text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gold" />
                  Histórico de Ações
                </h3>
                <span className="text-[10px] text-muted-foreground px-2 py-1 bg-[hsl(220,15%,12%)] rounded-full">
                  {currentActionIndex + 1}/{actionHistory.length}
                </span>
              </div>
              
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {actionHistory.map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setCurrentActionIndex(i);
                      setCurrentStreet(action.street);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-all text-left",
                      i === currentActionIndex 
                        ? "bg-primary/20 border border-primary/30" 
                        : action.street === currentStreet
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-[hsl(220,15%,10%)]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        i === currentActionIndex ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      <span className="text-muted-foreground truncate">{action.player}</span>
                    </div>
                    <span className={cn("font-mono shrink-0", getActionColor(action.type))}>{action.action}</span>
                  </button>
                ))}
              </div>
              
              {/* Pot Progress */}
              <div className="mt-4 pt-4 border-t border-[hsl(220,15%,15%)]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Progressão do Pote</span>
                  <span className="font-mono text-gold">R$ {potSize.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex gap-1">
                  {(["preflop", "flop", "turn", "river"] as const).map((street) => (
                    <div 
                      key={street}
                      className={cn(
                        "flex-1 h-2 rounded-full transition-colors",
                        currentStreet === street 
                          ? "bg-primary" 
                          : (["preflop", "flop", "turn", "river"].indexOf(street) <= ["preflop", "flop", "turn", "river"].indexOf(currentStreet))
                            ? "bg-success/80"
                            : "bg-[hsl(220,15%,15%)]"
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  {(["preflop", "flop", "turn", "river"] as const).map((street) => (
                    <span key={street} className={cn(currentStreet === street && "text-primary font-medium")}>
                      {streetLabels[street]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Analysis Tabs */}
            {isMobile && (
              <AnalysisSidebar />
            )}
          </div>

          {/* Analysis Sidebar - Desktop (1024px+) */}
          {!isMobile && (
            <div className="hidden lg:block">
              <AnalysisSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
