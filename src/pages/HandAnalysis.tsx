import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Pause, SkipBack, SkipForward, AlertTriangle } from "lucide-react";
import { PokerCard, CardPlaceholder } from "@/components/poker/PokerCard";
import { cn } from "@/lib/utils";

export default function HandAnalysis() {
  const [handHistory, setHandHistory] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreet, setCurrentStreet] = useState<"preflop" | "flop" | "turn" | "river">("flop");

  // Demo hand state
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
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hand Analysis</h1>
          <p className="text-muted-foreground">Import and replay hands with GTO analysis</p>
        </div>
        <Button variant="gold">
          <Upload className="w-4 h-4 mr-2" />
          Import Hand History
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Replayer */}
        <div className="xl:col-span-2 space-y-6">
          {/* Table View */}
          <div className="card-glass rounded-xl p-6">
            <div className="relative aspect-video bg-felt rounded-xl overflow-hidden">
              {/* Poker table felt */}
              <div className="absolute inset-4 border-4 border-felt-light/30 rounded-full" />
              
              {/* Pot display */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center">
                <p className="text-xs text-white/60">POT</p>
                <p className="text-xl font-mono font-bold text-gold">$245.00</p>
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
                <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Hero (BTN) • $500
                </div>
              </div>

              {/* Villain position */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                  Villain (BB) • $485
                </div>
                <div className="flex gap-1">
                  <PokerCard rank="A" suit="spades" size="sm" faceDown />
                  <PokerCard rank="A" suit="spades" size="sm" faceDown />
                </div>
              </div>

              {/* Equity display */}
              <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm rounded-lg p-3 text-right">
                <p className="text-xs text-muted-foreground">Equity vs Range</p>
                <p className="text-lg font-mono font-bold text-success">78.4%</p>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button variant="ghost" size="icon">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button 
                variant="gold" 
                size="icon" 
                className="w-12 h-12"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button variant="ghost" size="icon">
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Street indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {(["preflop", "flop", "turn", "river"] as const).map((street) => (
                <button
                  key={street}
                  onClick={() => setCurrentStreet(street)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    currentStreet === street
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {street.charAt(0).toUpperCase() + street.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Action History */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Action History</h3>
            <div className="space-y-2 text-sm">
              {[
                { player: "Villain (BB)", action: "Raises to $6", street: "preflop" },
                { player: "Hero (BTN)", action: "3-Bets to $18", street: "preflop" },
                { player: "Villain (BB)", action: "Calls $12", street: "preflop" },
                { player: "Villain (BB)", action: "Checks", street: "flop" },
                { player: "Hero (BTN)", action: "Bets $22 (60% pot)", street: "flop" },
                { player: "Villain (BB)", action: "Calls $22", street: "flop" },
              ].map((action, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
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
        <div className="space-y-6">
          {/* GTO Analysis */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">GTO Analysis</h3>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-sm font-medium text-success">Optimal Play</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your c-bet sizing of 60% pot is GTO optimal on this texture.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning">Suggestion</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Consider using 33% sizing on dry boards to maximize fold equity.
                </p>
              </div>
            </div>
          </div>

          {/* Villain HUD */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Villain Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "VPIP", value: "28%" },
                { label: "PFR", value: "22%" },
                { label: "3-Bet", value: "9%" },
                { label: "Fold to 3-Bet", value: "58%" },
                { label: "C-Bet", value: "72%" },
                { label: "Fold to C-Bet", value: "45%" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-mono font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Sample: 1,247 hands
            </p>
          </div>

          {/* Import Text Area */}
          <div className="card-glass rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Import Hand</h3>
            <Textarea
              placeholder="Paste hand history here..."
              value={handHistory}
              onChange={(e) => setHandHistory(e.target.value)}
              className="min-h-32 bg-input border-border font-mono text-xs"
            />
            <Button variant="outline" className="w-full">
              Process Hand
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
