import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Pause, SkipBack, SkipForward, AlertTriangle, CheckCircle } from "lucide-react";
import { PokerCard } from "@/components/poker/PokerCard";
import { cn } from "@/lib/utils";

export default function HandAnalysis() {
  const [handHistory, setHandHistory] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<"preflop" | "flop" | "turn" | "river">("flop");

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

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análise de Mãos</h1>
            <p className="text-sm text-muted-foreground">Importe e revise mãos com análise GTO</p>
          </div>
          <Button variant="gold" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar Histórico
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Replayer */}
          <div className="xl:col-span-2 space-y-4">
            {/* Table View */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] overflow-hidden">
              <div className="relative aspect-[16/10] bg-gradient-to-b from-[hsl(153,40%,18%)] to-[hsl(153,45%,12%)]">
                {/* Table border */}
                <div className="absolute inset-8 border-4 border-[hsl(153,35%,25%)]/40 rounded-full" />
                
                {/* Pot display */}
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center">
                  <p className="text-xs text-white/60 uppercase tracking-wider">Pote</p>
                  <p className="text-2xl font-mono font-bold text-gold">R$ 245,00</p>
                </div>

                {/* Board cards */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
                  {boardCards.flop.map((card, i) => (
                    <PokerCard key={i} rank={card.rank} suit={card.suit} size="md" />
                  ))}
                  {(currentStreet === "turn" || currentStreet === "river") && (
                    <PokerCard rank={boardCards.turn.rank} suit={boardCards.turn.suit} size="md" />
                  )}
                  {currentStreet === "river" && (
                    <PokerCard rank={boardCards.river.rank} suit={boardCards.river.suit} size="md" />
                  )}
                </div>

                {/* Hero position */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {heroCards.map((card, i) => (
                      <PokerCard key={i} rank={card.rank} suit={card.suit} size="md" />
                    ))}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Herói (BTN) • R$ 500
                  </div>
                </div>

                {/* Villain position */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-[hsl(220,15%,20%)] text-foreground text-xs font-medium">
                    Vilão (BB) • R$ 485
                  </div>
                  <div className="flex gap-1">
                    <PokerCard rank="A" suit="spades" size="sm" faceDown />
                    <PokerCard rank="A" suit="spades" size="sm" faceDown />
                  </div>
                </div>

                {/* Equity display */}
                <div className="absolute top-4 right-4 bg-[hsl(220,18%,10%)]/90 backdrop-blur-sm rounded-lg p-3 text-right border border-[hsl(220,15%,18%)]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Equity vs Range</p>
                  <p className="text-xl font-mono font-bold text-success">78.4%</p>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-4 py-4 bg-[hsl(220,15%,8%)] border-t border-[hsl(220,15%,15%)]">
                <Button variant="ghost" size="icon" className="hover:bg-[hsl(220,15%,15%)]">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button 
                  variant="gold" 
                  size="icon" 
                  className="w-12 h-12"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-[hsl(220,15%,15%)]">
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Street indicator */}
              <div className="flex items-center justify-center gap-2 py-3 bg-[hsl(220,15%,7%)]">
                {(["preflop", "flop", "turn", "river"] as const).map((street) => (
                  <button
                    key={street}
                    onClick={() => setCurrentStreet(street)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                      currentStreet === street
                        ? "bg-primary text-primary-foreground"
                        : "bg-[hsl(220,15%,12%)] text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {street === "preflop" ? "Pré-Flop" : street.charAt(0).toUpperCase() + street.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Action History */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <h3 className="font-semibold text-foreground mb-4">Histórico de Ações</h3>
              <div className="space-y-1">
                {[
                  { player: "Vilão (BB)", action: "Raise para R$ 6", street: "preflop" },
                  { player: "Herói (BTN)", action: "3-Bet para R$ 18", street: "preflop" },
                  { player: "Vilão (BB)", action: "Call R$ 12", street: "preflop" },
                  { player: "Vilão (BB)", action: "Check", street: "flop" },
                  { player: "Herói (BTN)", action: "Aposta R$ 22 (60% pote)", street: "flop" },
                  { player: "Vilão (BB)", action: "Call R$ 22", street: "flop" },
                ].map((action, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg text-sm",
                      action.street === currentStreet && "bg-primary/10"
                    )}
                  >
                    <span className="text-muted-foreground">{action.player}</span>
                    <span className="font-mono text-foreground">{action.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Sidebar */}
          <div className="space-y-4">
            {/* GTO Analysis */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <h3 className="font-semibold text-foreground mb-4">Análise GTO</h3>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-success">Jogada Ótima</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seu sizing de c-bet de 60% do pote é GTO ótimo nesta textura.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-warning">Sugestão</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Considere usar sizing de 33% em boards secos para maximizar fold equity.
                  </p>
                </div>
              </div>
            </div>

            {/* Villain HUD */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <h3 className="font-semibold text-foreground mb-4">Stats do Vilão</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "VPIP", value: "28%" },
                  { label: "PFR", value: "22%" },
                  { label: "3-Bet", value: "9%" },
                  { label: "Fold p/ 3-Bet", value: "58%" },
                  { label: "C-Bet", value: "72%" },
                  { label: "Fold p/ C-Bet", value: "45%" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-2.5 rounded-lg bg-[hsl(220,15%,10%)]">
                    <p className="text-base font-mono font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Amostra: 1.247 mãos
              </p>
            </div>

            {/* Import Text Area */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <h3 className="font-semibold text-foreground mb-4">Importar Mão</h3>
              <Textarea
                placeholder="Cole o histórico da mão aqui..."
                value={handHistory}
                onChange={(e) => setHandHistory(e.target.value)}
                className="min-h-24 bg-[hsl(220,15%,10%)] border-[hsl(220,15%,18%)] font-mono text-xs resize-none"
              />
              <Button 
                variant="outline" 
                className="w-full mt-3 border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,15%)]"
              >
                Processar Mão
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
