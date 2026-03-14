import { useState, useMemo, useCallback } from "react";
import { Cpu, Loader2, Trophy, TrendingUp, Grid3X3, Plus, Trash2, Info, PhoneCall } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CardPicker } from "@/components/betting/CardPicker";
import { UsageBadge } from "@/components/usage/UsageBadge";
import {
  parseRangeString,
  calculateRangeEquity,
  calculateICM,
  getPushFoldDecision,
  getCallDecision,
  VILLAIN_RANGES,
  ALL_RANKS,
  CALL_RANGES_BB,
} from "@/lib/solverEngine";
import type { RangeEquityResult, ICMResult, PushFoldDecision, CallDecision } from "@/lib/solverEngine";
import type { EngineCard } from "@/lib/equityEngine";

// ─── Types ────────────────────────────────────────────────────────────────────
type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
interface Card { rank: Rank; suit: Suit }

const SUIT_SYMBOLS: Record<Suit, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
const SUIT_TO_NUM: Record<Suit, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
const RANK_TO_NUM: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
};

function cardToEngine(c: Card): EngineCard {
  return { rank: RANK_TO_NUM[c.rank] as any, suit: SUIT_TO_NUM[c.suit] as any };
}

// ─── Shared card display ──────────────────────────────────────────────────────
function CardBadge({ card, onRemove }: { card: Card; onRemove: () => void }) {
  const red = card.suit === "hearts" || card.suit === "diamonds";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-mono font-bold cursor-pointer border",
        "bg-background border-border hover:border-destructive/60 transition-colors",
        red ? "text-red-400" : "text-foreground"
      )}
      onClick={onRemove}
      title="Clique para remover"
    >
      {card.rank}{SUIT_SYMBOLS[card.suit]}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 1 — Range vs Range
// ═══════════════════════════════════════════════════════════════════════════════
function RangeVsRange() {
  const [heroRange, setHeroRange] = useState("AA,KK,QQ,JJ,TT,AKs,AQs,AJs,ATs,KQs,AKo,AQo");
  const [villainRange, setVillainRange] = useState("AA,KK,QQ,JJ,TT,99,88,AKs,AQs,AJs,ATs,KQs,AKo,AQo,AJo");
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [result, setResult] = useState<RangeEquityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const heroCount = useMemo(() =>
    parseRangeString(heroRange).reduce((s, c) => s + c.combos * c.frequency, 0),
    [heroRange]
  );
  const villainCount = useMemo(() =>
    parseRangeString(villainRange).reduce((s, c) => s + c.combos * c.frequency, 0),
    [villainRange]
  );

  const handleCalc = useCallback(() => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      try {
        const hr = parseRangeString(heroRange);
        const vr = parseRangeString(villainRange);
        const board = boardCards.map(cardToEngine);
        const res = calculateRangeEquity(hr, vr, board, 600);
        setResult(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 0);
  }, [heroRange, villainRange, boardCards]);

  const addBoardCard = (c: Card) => {
    if (boardCards.length < 5) setBoardCards(prev => [...prev, c]);
    if (boardCards.length >= 4) setShowPicker(false);
  };

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hero */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-primary">Range do Herói</Label>
            <Badge variant="outline" className="text-xs">{Math.round(heroCount)} combos</Badge>
          </div>
          <Input
            value={heroRange}
            onChange={e => setHeroRange(e.target.value)}
            placeholder="ex: AA,KK,AKs,AKo"
            className="font-mono text-sm"
          />
          <Select onValueChange={v => setHeroRange(v)}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Preset de range…" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VILLAIN_RANGES).map(([label, range]) => (
                <SelectItem key={label} value={range}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Villain */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-muted-foreground">Range do Vilão</Label>
            <Badge variant="outline" className="text-xs">{Math.round(villainCount)} combos</Badge>
          </div>
          <Input
            value={villainRange}
            onChange={e => setVillainRange(e.target.value)}
            placeholder="ex: AA,KK,QQ,AKs"
            className="font-mono text-sm"
          />
          <Select onValueChange={v => setVillainRange(v)}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Preset de range…" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VILLAIN_RANGES).map(([label, range]) => (
                <SelectItem key={label} value={range}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Board */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Board ({boardCards.length}/5 cartas)</Label>
          <div className="flex items-center gap-2">
            {boardCards.map((c, i) => (
              <CardBadge key={i} card={c} onRemove={() => setBoardCards(prev => prev.filter((_, j) => j !== i))} />
            ))}
            {boardCards.length < 5 && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowPicker(v => !v)}>
                <Plus className="h-3 w-3 mr-1" />{showPicker ? "Fechar" : "Adicionar"}
              </Button>
            )}
            {boardCards.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setBoardCards([])}>
                Limpar
              </Button>
            )}
          </div>
        </div>
        {showPicker && (
          <CardPicker
            usedCards={boardCards as any}
            onCardSelect={c => addBoardCard(c as unknown as Card)}
            title="Selecionar carta do board"
          />
        )}
      </div>

      {/* Calculate */}
      <Button onClick={handleCalc} disabled={loading} className="w-full" size="lg">
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Calculando…</> : "Calcular Equidade"}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Equity bars */}
          <div className="rounded-xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Equidade de Range</h3>
              <div className="flex gap-2">
                <Badge className={cn(
                  "text-xs",
                  result.rangeAdvantage === "hero" ? "bg-primary/20 text-primary border-primary/30" :
                  result.rangeAdvantage === "villain" ? "bg-destructive/20 text-destructive border-destructive/30" :
                  "bg-muted text-muted-foreground"
                )}>
                  {result.rangeAdvantage === "hero" ? "Vantagem: Herói" :
                   result.rangeAdvantage === "villain" ? "Vantagem: Vilão" : "Range Neutro"}
                </Badge>
                <Badge className={cn(
                  "text-xs",
                  result.nutAdvantage === "hero" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                  result.nutAdvantage === "villain" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                  "bg-muted text-muted-foreground"
                )}>
                  Nuts: {result.nutAdvantage === "hero" ? "Herói" : result.nutAdvantage === "villain" ? "Vilão" : "Neutro"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary font-semibold">Herói</span>
                <span className="font-mono font-bold text-primary">{result.heroEquity}%</span>
              </div>
              <div className="relative h-5 rounded-full overflow-hidden bg-muted">
                <div
                  className="absolute left-0 top-0 h-full bg-primary transition-all duration-700 rounded-full"
                  style={{ width: `${result.heroEquity}%` }}
                />
                <div
                  className="absolute right-0 top-0 h-full bg-destructive/70 transition-all duration-700 rounded-full"
                  style={{ width: `${result.villainEquity}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vilão</span>
                <span className="font-mono font-bold text-muted-foreground">{result.villainEquity}%</span>
              </div>
            </div>
          </div>

          {/* Top hands tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Top Mãos — Herói", hands: result.topHeroHands, colorClass: "text-primary" },
              { label: "Top Mãos — Vilão", hands: result.topVillainHands, colorClass: "text-muted-foreground" },
            ].map(({ label, hands, colorClass }) => (
              <div key={label} className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h4 className={cn("text-xs font-semibold uppercase tracking-wide", colorClass)}>{label}</h4>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left px-4 py-2">Mão</th>
                      <th className="text-right px-4 py-2">Equity</th>
                      <th className="text-right px-4 py-2">Combos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hands.map((h, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2 font-mono font-bold">{h.hand}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={cn(
                            "font-mono font-semibold",
                            h.equity >= 70 ? "text-primary" : h.equity >= 50 ? "text-amber-400" : "text-destructive"
                          )}>
                            {h.equity.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">{h.combos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 2 — ICM Calculator
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_PLAYERS = [
  { name: "Herói", chips: 35000, prize: 1500 },
  { name: "Jogador 2", chips: 28000, prize: 900 },
  { name: "Jogador 3", chips: 22000, prize: 600 },
  { name: "Jogador 4", chips: 18000, prize: 450 },
  { name: "Jogador 5", chips: 12000, prize: 300 },
  { name: "Jogador 6", chips: 5000, prize: 0 },
];

function ICMCalculator() {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [heroIndex, setHeroIndex] = useState(0);
  const [result, setResult] = useState<ICMResult | null>(null);

  const updatePlayer = (i: number, field: keyof (typeof players)[0], value: string) => {
    setPlayers(prev => prev.map((p, j) => j === i ? { ...p, [field]: field === "name" ? value : Number(value) || 0 } : p));
  };

  const addPlayer = () => {
    if (players.length < 9) setPlayers(prev => [...prev, { name: `Jogador ${prev.length + 1}`, chips: 5000, prize: 0 }]);
  };

  const removePlayer = (i: number) => {
    if (players.length > 2) {
      setPlayers(prev => prev.filter((_, j) => j !== i));
      if (heroIndex >= i) setHeroIndex(Math.max(0, heroIndex - 1));
    }
  };

  const handleCalc = () => {
    const stacks = players.map(p => p.chips);
    const prizes = players.map(p => p.prize).filter(p => p > 0);
    const res = calculateICM(stacks, prizes, heroIndex);
    setResult(res);
  };

  return (
    <div className="space-y-5">
      {/* Players table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Jogadores ({players.length})</h3>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addPlayer} disabled={players.length >= 9}>
            <Plus className="h-3 w-3 mr-1" />Adicionar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left px-4 py-2 w-4"></th>
                <th className="text-left px-4 py-2">Nome</th>
                <th className="text-right px-4 py-2">Fichas</th>
                <th className="text-right px-4 py-2">Prêmio ($)</th>
                <th className="px-4 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    i === heroIndex && "bg-primary/5"
                  )}
                >
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setHeroIndex(i)}
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-colors",
                        i === heroIndex ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}
                      title="Definir como herói"
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <Input
                      value={p.name}
                      onChange={e => updatePlayer(i, "name", e.target.value)}
                      className="h-7 text-xs bg-transparent border-0 px-0 focus-visible:ring-0"
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <Input
                      type="number"
                      value={p.chips}
                      onChange={e => updatePlayer(i, "chips", e.target.value)}
                      className="h-7 text-xs text-right font-mono"
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <Input
                      type="number"
                      value={p.prize}
                      onChange={e => updatePlayer(i, "prize", e.target.value)}
                      className="h-7 text-xs text-right font-mono"
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removePlayer(i)}
                      disabled={players.length <= 2}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button onClick={handleCalc} className="w-full" size="lg">
        Calcular ICM
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Results table */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Resultados ICM</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left px-4 py-2">Jogador</th>
                    <th className="text-right px-4 py-2">Fichas</th>
                    <th className="text-right px-4 py-2">Chip EV</th>
                    <th className="text-right px-4 py-2">ICM EV</th>
                    <th className="text-right px-4 py-2">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => {
                    const totalChips = players.reduce((s, pl) => s + pl.chips, 0);
                    const chipEV = (p.chips / totalChips) * result.totalPrize;
                    const icmEV = result.equity[i] ?? 0;
                    const diff = icmEV - chipEV;
                    const isHero = i === heroIndex;
                    return (
                      <tr key={i} className={cn("border-b border-border/50", isHero && "bg-primary/5 font-semibold")}>
                        <td className="px-4 py-2">
                          {isHero && <span className="text-primary mr-1">▶</span>}
                          {p.name}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                          {p.chips.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          ${chipEV.toFixed(0)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-primary">
                          ${icmEV.toFixed(0)}
                        </td>
                        <td className={cn("px-4 py-2 text-right font-mono text-xs", diff >= 0 ? "text-green-400" : "text-red-400")}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ICM Pressure gauge */}
          <div className="rounded-xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Pressão ICM</h3>
              <span className="font-mono font-bold text-lg text-primary">{result.icmPressure}%</span>
            </div>
            <Progress value={result.icmPressure} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Baixa pressão</span>
              <span>Alta pressão</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 3 — Push/Fold Chart
// ═══════════════════════════════════════════════════════════════════════════════
const POSITIONS = ["UTG", "CO", "BTN", "SB"] as const;
const CALL_VS_POSITIONS = ["vsUTG", "vsCO", "vsBTN", "vsSB"] as const;
type Position = typeof POSITIONS[number];
type CallVsPosition = typeof CALL_VS_POSITIONS[number];

type SelectedCell =
  | { mode: "push"; hand: string; decision: PushFoldDecision }
  | { mode: "call"; hand: string; decision: CallDecision };

function PushFoldChart() {
  const [stack, setStack] = useState(10);
  const [position, setPosition] = useState<Position>("BTN");
  const [callVsPos, setCallVsPos] = useState<CallVsPosition>("vsBTN");
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [activeTab, setActiveTab] = useState<"push" | "call">("push");

  // ── Push grid ──────────────────────────────────────────────────────────────
  const pushGrid = useMemo(() => {
    return Array.from({ length: 169 }, (_, idx) => {
      const r = Math.floor(idx / 13);
      const c = idx % 13;
      const rank1 = ALL_RANKS[r];
      const rank2 = ALL_RANKS[c];
      const hand = r === c ? `${rank1}${rank2}` : r < c ? `${rank1}${rank2}s` : `${rank2}${rank1}o`;
      const decision = getPushFoldDecision(hand, stack, position);
      return { hand, decision, isPair: r === c };
    });
  }, [stack, position]);

  // ── Call grid ──────────────────────────────────────────────────────────────
  const callGrid = useMemo(() => {
    const villainPos = callVsPos.replace("vs", "") as Position;
    return Array.from({ length: 169 }, (_, idx) => {
      const r = Math.floor(idx / 13);
      const c = idx % 13;
      const rank1 = ALL_RANKS[r];
      const rank2 = ALL_RANKS[c];
      const hand = r === c ? `${rank1}${rank2}` : r < c ? `${rank1}${rank2}s` : `${rank2}${rank1}o`;
      const decision = getCallDecision(hand, stack, villainPos);
      return { hand, decision, isPair: r === c };
    });
  }, [stack, callVsPos]);

  // ── Top call hands summary ─────────────────────────────────────────────────
  const topCallHands = useMemo(() => {
    return callGrid
      .filter(c => c.decision.shouldCall)
      .sort((a, b) => b.decision.maxBB - a.decision.maxBB || b.decision.frequency - a.decision.frequency)
      .slice(0, 20);
  }, [callGrid]);

  const getPushCellColor = (d: PushFoldDecision) => {
    if (d.action === "push") {
      if (d.frequency >= 0.85) return "bg-green-600/80 hover:bg-green-600 text-white border-green-500/30";
      if (d.frequency >= 0.4)  return "bg-yellow-500/70 hover:bg-yellow-500 text-white border-yellow-400/30";
      return "bg-yellow-700/40 hover:bg-yellow-700/60 text-yellow-200 border-yellow-700/20";
    }
    return "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/30";
  };

  const getCallCellColor = (d: CallDecision) => {
    if (d.shouldCall) {
      if (d.frequency >= 0.85) return "bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500/30";
      if (d.frequency >= 0.4)  return "bg-blue-400/50 hover:bg-blue-400/70 text-white border-blue-400/30";
      return "bg-blue-300/30 hover:bg-blue-300/50 text-blue-200 border-blue-300/20";
    }
    return "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/30";
  };

  const pushCount = pushGrid.filter(c => c.decision.action === "push").length;
  const callCount = callGrid.filter(c => c.decision.shouldCall).length;

  const CALL_VS_LABELS: Record<CallVsPosition, string> = {
    vsUTG: "vs UTG", vsCO: "vs CO", vsBTN: "vs BTN", vsSB: "vs SB"
  };

  function HandGrid({
    gridData,
    getCellColorFn,
    onSelect,
    selectedHand,
  }: {
    gridData: Array<{ hand: string; isPair: boolean } & ({ decision: PushFoldDecision } | { decision: CallDecision })>;
    getCellColorFn: (d: any) => string;
    onSelect: (hand: string, decision: any) => void;
    selectedHand?: string;
  }) {
    return (
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `20px repeat(13, 1fr)` }}>
        <div />
        {ALL_RANKS.map(r => (
          <div key={r} className="text-center text-[10px] text-muted-foreground font-mono pb-1">{r}</div>
        ))}
        {ALL_RANKS.map((rowRank, r) => (
          <>
            <div key={`lbl-${r}`} className="flex items-center justify-center text-[10px] text-muted-foreground font-mono">{rowRank}</div>
            {ALL_RANKS.map((_, c) => {
              const cell = gridData[r * 13 + c];
              const isSel = selectedHand === cell.hand;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => onSelect(cell.hand, cell.decision)}
                  className={cn(
                    "aspect-square flex items-center justify-center text-[9px] font-mono font-bold rounded transition-all border",
                    getCellColorFn(cell.decision),
                    isSel && "ring-2 ring-primary ring-offset-1 ring-offset-card scale-110 z-10 relative"
                  )}
                  title={cell.hand}
                >
                  <span className="leading-none">
                    {cell.isPair ? cell.hand.slice(0, 2) : cell.hand.slice(0, cell.hand.length - 1)}
                  </span>
                </button>
              );
            })}
          </>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stack slider */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Profundidade de Stack</Label>
            <span className="font-mono font-bold text-primary text-lg">{stack}bb</span>
          </div>
          <Slider min={1} max={20} step={1} value={[stack]} onValueChange={([v]) => setStack(v)} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1bb</span><span>10bb</span><span>20bb</span>
          </div>
        </div>

        {/* Push position */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <Label className="text-sm font-semibold">Sua Posição (Push)</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => setPosition(pos)}
                className={cn(
                  "rounded-lg py-2 text-xs font-semibold transition-all border",
                  position === pos
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60"
                )}
              >
                {pos}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Push: <span className="text-primary font-semibold">{pushCount} mãos</span>
            &nbsp;·&nbsp;
            Call: <span className="text-blue-400 font-semibold">{callCount} mãos</span>
          </p>
        </div>
      </div>

      {/* Sub-tabs: Push vs Call */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {/* Tab switcher header */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("push")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors",
              activeTab === "push"
                ? "bg-green-600/10 text-green-400 border-b-2 border-green-500"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            Push — {stack}bb {position}
            <Badge variant="outline" className="text-xs ml-1">{pushCount} mãos</Badge>
          </button>
          <button
            onClick={() => setActiveTab("call")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors",
              activeTab === "call"
                ? "bg-blue-600/10 text-blue-400 border-b-2 border-blue-500"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Call — {CALL_VS_LABELS[callVsPos]}
            <Badge variant="outline" className="text-xs ml-1">{callCount} mãos</Badge>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Call: position selector */}
          {activeTab === "call" && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Chamando vs:</span>
              {CALL_VS_POSITIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setCallVsPos(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    callVsPos === p
                      ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60"
                  )}
                >
                  {CALL_VS_LABELS[p]}
                </button>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {activeTab === "push" ? (
              <>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-600/80 inline-block" /> Push puro</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/70 inline-block" /> Misto</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/40 inline-block border border-border" /> Fold</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600/80 inline-block" /> Call puro</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400/50 inline-block" /> Call misto</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/40 inline-block border border-border" /> Fold</span>
              </>
            )}
          </div>

          {/* Grid */}
          {activeTab === "push" ? (
            <HandGrid
              gridData={pushGrid}
              getCellColorFn={getPushCellColor}
              onSelect={(hand, d) => setSelected(s => s?.hand === hand && s.mode === "push" ? null : { mode: "push", hand, decision: d })}
              selectedHand={selected?.mode === "push" ? selected.hand : undefined}
            />
          ) : (
            <HandGrid
              gridData={callGrid}
              getCellColorFn={getCallCellColor}
              onSelect={(hand, d) => setSelected(s => s?.hand === hand && s.mode === "call" ? null : { mode: "call", hand, decision: d })}
              selectedHand={selected?.mode === "call" ? selected.hand : undefined}
            />
          )}
        </div>
      </div>

      {/* Selected hand detail */}
      {selected && (
        <div className="rounded-xl bg-card border border-primary/30 p-5 space-y-2 animate-in fade-in duration-200">
          {selected.mode === "push" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-2xl text-green-400">{selected.hand}</span>
                <Badge className={cn(
                  "text-sm px-3",
                  selected.decision.frequency >= 0.85
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                )}>
                  PUSH — {Math.round(selected.decision.frequency * 100)}%
                </Badge>
                <span className={cn("font-mono font-bold ml-auto", selected.decision.ev >= 0 ? "text-green-400" : "text-destructive")}>
                  EV: {selected.decision.ev >= 0 ? "+" : ""}{selected.decision.ev}bb
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{selected.decision.reasoning}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-2xl text-blue-400">{selected.hand}</span>
                <Badge className={cn(
                  "text-sm px-3",
                  selected.decision.shouldCall
                    ? selected.decision.frequency >= 0.85
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-blue-400/20 text-blue-300 border-blue-400/30"
                    : "bg-muted text-muted-foreground"
                )}>
                  {selected.decision.shouldCall ? "CALL" : "FOLD"} — {Math.round(selected.decision.frequency * 100)}%
                </Badge>
                {selected.decision.maxBB > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Call puro até <span className="font-mono font-bold text-blue-400">{selected.decision.maxBB}bb</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selected.decision.reasoning}</p>
            </>
          )}
        </div>
      )}

      {/* All-positions reference table */}
      {activeTab === "call" && (() => {
        const ALL_POSITIONS = ["vsUTG", "vsCO", "vsBTN", "vsSB"] as const;
        const POS_LABELS: Record<string, string> = { vsUTG: "vs UTG", vsCO: "vs CO", vsBTN: "vs BTN", vsSB: "vs SB" };

        // Build sorted union of all hands across all positions
        const allHandsSet = new Set<string>();
        ALL_POSITIONS.forEach(p => Object.keys(CALL_RANGES_BB[p] ?? {}).forEach(h => allHandsSet.add(h)));

        const RANK_ORDER = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
        const rankVal = (r: string) => RANK_ORDER.indexOf(r);

        const pairHands: string[] = [];
        const suitedHands: string[] = [];
        const offsuitHands: string[] = [];

        allHandsSet.forEach(h => {
          if (h.length === 2) pairHands.push(h);
          else if (h.endsWith("s")) suitedHands.push(h);
          else offsuitHands.push(h);
        });

        const sortByStrength = (a: string, b: string) => {
          const r1a = rankVal(a[0]), r1b = rankVal(b[0]);
          if (r1a !== r1b) return r1a - r1b;
          return rankVal(a[1]) - rankVal(b[1]);
        };

        pairHands.sort(sortByStrength);
        suitedHands.sort(sortByStrength);
        offsuitHands.sort(sortByStrength);

        const sortedHands = [...pairHands, ...suitedHands, ...offsuitHands];

        const getCellStatus = (hand: string, pos: string) => {
          const maxBB = (CALL_RANGES_BB[pos] ?? {})[hand] ?? 0;
          if (maxBB === 0) return null;
          if (stack <= maxBB - 3) return "call";
          if (stack <= maxBB) return "mixed";
          return "fold";
        };

        return (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold">Ranges de Call por Posição</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Máx. de BB para chamar um all-in · stack atual: <span className="font-mono font-bold text-primary">{stack}bb</span>
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-2 border-b border-border flex items-center gap-4 text-xs text-muted-foreground bg-muted/20">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Call puro (stack ≤ maxBB−3)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Marginal (≤ maxBB)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" /> Fold / não na range
              </span>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs min-w-[400px]">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-3 py-2.5 font-semibold w-14">Mão</th>
                    {ALL_POSITIONS.map(p => (
                      <th key={p} className="text-center px-2 py-2.5 font-semibold">{POS_LABELS[p]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedHands.map((hand, i) => {
                    const statuses = ALL_POSITIONS.map(p => ({ pos: p, maxBB: (CALL_RANGES_BB[p] ?? {})[hand] ?? 0, status: getCellStatus(hand, p) }));
                    const anyCallable = statuses.some(s => s.status === "call" || s.status === "mixed");
                    return (
                      <tr
                        key={hand}
                        className={cn(
                          "border-b border-border/40 transition-colors",
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                          anyCallable && "hover:bg-primary/5"
                        )}
                      >
                        <td className={cn(
                          "px-3 py-2 font-mono font-bold",
                          anyCallable ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                          {hand}
                        </td>
                        {statuses.map(({ pos, maxBB, status }) => (
                          <td key={pos} className="px-2 py-2 text-center">
                            {maxBB === 0 ? (
                              <span className="text-muted-foreground/30">—</span>
                            ) : (
                              <span className={cn(
                                "inline-flex items-center justify-center gap-1 font-mono font-semibold rounded px-1.5 py-0.5",
                                status === "call"   && "bg-green-500/15 text-green-400",
                                status === "mixed"  && "bg-yellow-400/15 text-yellow-400",
                                status === "fold"   && "text-muted-foreground/40"
                              )}>
                                {status !== "fold" && (
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full inline-block",
                                    status === "call"  && "bg-green-500",
                                    status === "mixed" && "bg-yellow-400",
                                  )} />
                                )}
                                {maxBB}bb
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function Solver() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Solver GTO</h1>
              <p className="text-sm text-muted-foreground">Ferramentas avançadas de análise matemática</p>
            </div>
          </div>
          <UsageBadge />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="range" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="range" className="flex items-center gap-2 text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Range vs Range</span>
              <span className="sm:hidden">Ranges</span>
            </TabsTrigger>
            <TabsTrigger value="icm" className="flex items-center gap-2 text-xs sm:text-sm">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Calculadora ICM</span>
              <span className="sm:hidden">ICM</span>
            </TabsTrigger>
            <TabsTrigger value="pushfold" className="flex items-center gap-2 text-xs sm:text-sm">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Push/Fold Chart</span>
              <span className="sm:hidden">Push/Fold</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="range">
            <RangeVsRange />
          </TabsContent>

          <TabsContent value="icm">
            <ICMCalculator />
          </TabsContent>

          <TabsContent value="pushfold">
            <PushFoldChart />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
