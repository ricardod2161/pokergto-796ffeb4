import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, Play, Pause, SkipBack, SkipForward, AlertTriangle, CheckCircle, 
  Info, ChevronRight, TrendingUp, Target, Brain, Users, DollarSign,
  HelpCircle, Lightbulb, Eye, Zap, ChevronLeft
} from "lucide-react";
import { PokerCard } from "@/components/poker/PokerCard";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function HandAnalysis() {
  const [handHistory, setHandHistory] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<"preflop" | "flop" | "turn" | "river">("flop");
  const [showImportSheet, setShowImportSheet] = useState(false);
  const isMobile = useIsMobile();

  const heroCards = [
    { rank: "A" as const, suit: "spades" as const },
    { rank: "K" as const, suit: "hearts" as const }
  ];
  
  const boardCards = {
    flop: [
      { rank: "K" as const, suit: "diamonds" as const },
      { rank: "7" as const, suit: "clubs" as const },
      { rank: "2" as const, suit: "spades" as const }
    ],
    turn: { rank: "Q" as const, suit: "hearts" as const },
    river: { rank: "3" as const, suit: "diamonds" as const }
  };

  const actionHistory = [
    { player: "Vilão (BB)", action: "Raise para R$ 6", street: "preflop", type: "raise" },
    { player: "Herói (BTN)", action: "3-Bet para R$ 18", street: "preflop", type: "raise" },
    { player: "Vilão (BB)", action: "Call R$ 12", street: "preflop", type: "call" },
    { player: "Vilão (BB)", action: "Check", street: "flop", type: "check" },
    { player: "Herói (BTN)", action: "Aposta R$ 22 (60% pote)", street: "flop", type: "bet" },
    { player: "Vilão (BB)", action: "Call R$ 22", street: "flop", type: "call" },
    { player: "Vilão (BB)", action: "Check", street: "turn", type: "check" },
    { player: "Herói (BTN)", action: "Aposta R$ 45 (55% pote)", street: "turn", type: "bet" },
  ];

  const villainStats = [
    { label: "VPIP", value: "28%", tooltip: "Voluntarily Put In Pot - Frequência de entrada voluntária em potes" },
    { label: "PFR", value: "22%", tooltip: "Pre-Flop Raise - Frequência de raises pré-flop" },
    { label: "3-Bet", value: "9%", tooltip: "Frequência de 3-bet quando há um raise anterior" },
    { label: "Fold p/ 3-Bet", value: "58%", tooltip: "Frequência de fold quando enfrenta um 3-bet" },
    { label: "C-Bet", value: "72%", tooltip: "Continuation Bet - Frequência de aposta de continuação no flop" },
    { label: "Fold p/ C-Bet", value: "45%", tooltip: "Frequência de fold quando enfrenta uma c-bet" },
  ];

  const streetLabels = {
    preflop: "Pré-Flop",
    flop: "Flop",
    turn: "Turn",
    river: "River"
  };

  // Filter actions by current street for highlight
  const currentStreetActions = actionHistory.filter(a => a.street === currentStreet);

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

  const ImportPanel = () => (
    <div className="space-y-4">
      {/* Educational Banner */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-primary block mb-1">Como importar mãos</span>
            Copie o histórico completo da mão do seu cliente de poker (PokerStars, 888poker, etc.) e cole aqui para análise detalhada.
          </div>
        </div>
      </div>
      
      <Textarea
        placeholder="Cole o histórico da mão aqui...&#10;&#10;Exemplo:&#10;PokerStars Hand #123456789:...&#10;Table 'Mesa 1' 6-max Seat #1..."
        value={handHistory}
        onChange={(e) => setHandHistory(e.target.value)}
        className="min-h-32 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)] font-mono text-xs resize-none placeholder:text-muted-foreground/50"
      />
      <Button 
        variant="gold" 
        className="w-full"
        disabled={!handHistory.trim()}
      >
        <Upload className="w-4 h-4 mr-2" />
        Processar Mão
      </Button>
      
      {/* Format Examples */}
      <div className="p-3 rounded-lg bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,15%)]">
        <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
          Formatos Suportados
        </p>
        <div className="flex flex-wrap gap-2">
          {["PokerStars", "888poker", "PartyPoker", "GGPoker"].map((format) => (
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
      <Tabs defaultValue="gto" className="w-full">
        <TabsList className="w-full bg-[hsl(220,15%,10%)] border border-[hsl(220,15%,15%)]">
          <TabsTrigger value="gto" className="flex-1 text-xs data-[state=active]:bg-primary">
            <Brain className="w-3.5 h-3.5 mr-1.5" />
            GTO
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
        
        <TabsContent value="gto" className="mt-4 space-y-4">
          {/* GTO Analysis */}
          <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Análise GTO
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-64">
                    <p className="text-xs">
                      <span className="font-medium">GTO (Game Theory Optimal)</span> é a estratégia matematicamente perfeita que não pode ser explorada. Esta análise compara suas jogadas com o padrão GTO.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">Jogada Ótima</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Seu sizing de c-bet de <span className="text-success font-medium">60% do pote</span> é GTO ótimo nesta textura K72r. Boards secos favorecem c-bets maiores.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning">Oportunidade</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Contra jogadores com alto <span className="text-warning font-medium">Fold to C-Bet (45%)</span>, considere aumentar frequência de blefes com backdoor draws.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Dica para Iniciantes</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Você tem <span className="text-primary font-medium">top pair top kicker (TPTK)</span>. Esta é uma das melhores mãos feitas possíveis neste board. Continue apostando por valor!
                </p>
              </div>
            </div>
          </div>

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
          {/* Villain HUD */}
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

            {/* Player Type */}
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Perfil Identificado</span>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">TAG (Tight-Aggressive)</span> - Joga poucos potes mas aposta agressivamente. Cuidado com suas apostas.
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
            <p className="text-xs lg:text-sm text-muted-foreground">Importe e revise mãos com análise GTO detalhada</p>
          </div>
          
          {isMobile ? (
            <Sheet open={showImportSheet} onOpenChange={setShowImportSheet}>
              <SheetTrigger asChild>
                <Button variant="gold" size="sm" className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Histórico
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] bg-[hsl(220,18%,8%)] border-[hsl(220,15%,15%)]">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Importar Mão</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto">
                  <ImportPanel />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="gold" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar Histórico
            </Button>
          )}
        </div>

        {/* Educational Info for Beginners */}
        <div className="p-3 lg:p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground mb-1">O que é o Hand Replayer?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reveja suas mãos jogada por jogada e descubra onde você poderia ter tomado decisões melhores. 
                A análise GTO mostra a jogada matematicamente correta em cada situação.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Replayer */}
          <div className="xl:col-span-2 space-y-4">
            {/* Table View */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
              <div className={cn(
                "relative bg-gradient-to-b from-[hsl(153,40%,18%)] to-[hsl(153,45%,12%)]",
                isMobile ? "aspect-[4/3] min-h-[280px]" : "aspect-[16/10]"
              )}>
                {/* Table border */}
                <div className={cn(
                  "absolute border-4 border-[hsl(153,35%,25%)]/40 rounded-full",
                  isMobile ? "inset-4 sm:inset-6" : "inset-8"
                )} />
                
                {/* Pot display */}
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 text-center",
                  isMobile ? "top-[15%]" : "top-[20%]"
                )}>
                  <p className="text-[10px] lg:text-xs text-white/60 uppercase tracking-wider">Pote</p>
                  <p className={cn(
                    "font-mono font-bold text-gold",
                    isMobile ? "text-lg" : "text-2xl"
                  )}>R$ 245,00</p>
                </div>

                {/* Board cards */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 sm:gap-2">
                  {boardCards.flop.map((card, i) => (
                    <PokerCard key={i} rank={card.rank} suit={card.suit} size={isMobile ? "sm" : "md"} />
                  ))}
                  {(currentStreet === "turn" || currentStreet === "river") && (
                    <PokerCard rank={boardCards.turn.rank} suit={boardCards.turn.suit} size={isMobile ? "sm" : "md"} />
                  )}
                  {currentStreet === "river" && (
                    <PokerCard rank={boardCards.river.rank} suit={boardCards.river.suit} size={isMobile ? "sm" : "md"} />
                  )}
                </div>

                {/* Hero position */}
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 sm:gap-2",
                  isMobile ? "bottom-4" : "bottom-8"
                )}>
                  <div className="flex gap-1">
                    {heroCards.map((card, i) => (
                      <PokerCard key={i} rank={card.rank} suit={card.suit} size={isMobile ? "sm" : "md"} />
                    ))}
                  </div>
                  <div className={cn(
                    "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary text-primary-foreground font-medium",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Herói (BTN) • R$ 500
                  </div>
                </div>

                {/* Villain position */}
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 sm:gap-2",
                  isMobile ? "top-3" : "top-6"
                )}>
                  <div className={cn(
                    "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[hsl(220,15%,20%)] text-foreground font-medium",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>
                    Vilão (BB) • R$ 485
                  </div>
                  <div className="flex gap-1">
                    <PokerCard rank="A" suit="spades" size={isMobile ? "sm" : "sm"} faceDown />
                    <PokerCard rank="A" suit="spades" size={isMobile ? "sm" : "sm"} faceDown />
                  </div>
                </div>

                {/* Equity display */}
                <div className={cn(
                  "absolute bg-[hsl(220,18%,10%)]/90 backdrop-blur-sm rounded-lg text-right border border-[hsl(220,15%,18%)]",
                  isMobile ? "top-2 right-2 p-2" : "top-4 right-4 p-3"
                )}>
                  <p className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-wider">Equity vs Range</p>
                  <p className={cn(
                    "font-mono font-bold text-success",
                    isMobile ? "text-base" : "text-xl"
                  )}>78.4%</p>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 py-3 sm:py-4 bg-[hsl(220,15%,8%)] border-t border-[hsl(220,15%,15%)]">
                <Button variant="ghost" size="icon" className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10">
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10">
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
                <Button variant="ghost" size="icon" className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-[hsl(220,15%,15%)] h-8 w-8 sm:h-10 sm:w-10">
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
                  {streetLabels[currentStreet]}
                </span>
              </div>
              
              <div className="space-y-1">
                {actionHistory.map((action, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-all",
                      action.street === currentStreet 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-[hsl(220,15%,10%)]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        action.street === currentStreet ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      <span className="text-muted-foreground">{action.player}</span>
                    </div>
                    <span className={cn("font-mono", getActionColor(action.type))}>{action.action}</span>
                  </div>
                ))}
              </div>
              
              {/* Pot Progress */}
              <div className="mt-4 pt-4 border-t border-[hsl(220,15%,15%)]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Progressão do Pote</span>
                  <span className="font-mono text-gold">R$ 245,00</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 h-2 rounded-full bg-primary/80" />
                  <div className="flex-1 h-2 rounded-full bg-success/80" />
                  <div className="flex-1 h-2 rounded-full bg-[hsl(220,15%,20%)]" />
                  <div className="flex-1 h-2 rounded-full bg-[hsl(220,15%,15%)]" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  <span>Pré-Flop</span>
                  <span>Flop</span>
                  <span>Turn</span>
                  <span>River</span>
                </div>
              </div>
            </div>

            {/* Mobile Analysis Tabs */}
            {isMobile && (
              <AnalysisSidebar />
            )}
          </div>

          {/* Analysis Sidebar - Desktop Only */}
          {!isMobile && (
            <div className="hidden xl:block">
              <AnalysisSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
