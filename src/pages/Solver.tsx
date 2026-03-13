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
type Position = typeof POSITIONS[number];

function PushFoldChart() {
  const [stack, setStack] = useState(10);
  const [position, setPosition] = useState<Position>("BTN");
  const [selected, setSelected] = useState<{ hand: string; decision: PushFoldDecision } | null>(null);

  // Build 13×13 grid decisions
  const grid = useMemo(() => {
    const cells: Array<{ hand: string; decision: PushFoldDecision; isPair: boolean; isSuited: boolean }> = [];
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const rank1 = ALL_RANKS[r];
        const rank2 = ALL_RANKS[c];
        let hand: string;
        if (r === c) hand = `${rank1}${rank2}`; // pair
        else if (r < c) hand = `${rank1}${rank2}s`; // suited (upper triangle)
        else hand = `${rank2}${rank1}o`; // offsuit (lower triangle)
        const decision = getPushFoldDecision(hand, stack, position);
        cells.push({ hand, decision, isPair: r === c, isSuited: r < c });
      }
    }
    return cells;
  }, [stack, position]);

  const getCellColor = (d: PushFoldDecision) => {
    if (d.action === "push") {
      if (d.frequency >= 0.85) return "bg-green-500/80 hover:bg-green-500 text-white border-green-400/30";
      if (d.frequency >= 0.4) return "bg-yellow-500/70 hover:bg-yellow-500 text-white border-yellow-400/30";
      return "bg-yellow-600/40 hover:bg-yellow-600/60 text-yellow-200 border-yellow-600/20";
    }
    return "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/30";
  };

  // Stats
  const pushCount = grid.filter(c => c.decision.action === "push").length;
  const pushPct = Math.round((pushCount / 169) * 100);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Profundidade de Stack</Label>
            <span className="font-mono font-bold text-primary text-lg">{stack}bb</span>
          </div>
          <Slider
            min={1} max={20} step={1}
            value={[stack]}
            onValueChange={([v]) => setStack(v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1bb</span><span>10bb</span><span>20bb</span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <Label className="text-sm font-semibold">Posição</Label>
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
            Push em <span className="text-primary font-semibold">{pushPct}%</span> das mãos ({pushCount}/169)
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Gráfico Push/Fold — {stack}bb {position}</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/80 inline-block" /> Push</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/70 inline-block" /> Misto</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/40 inline-block border border-border" /> Fold</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `20px repeat(13, 1fr)` }}>
          <div />
          {ALL_RANKS.map(r => (
            <div key={r} className="text-center text-[10px] text-muted-foreground font-mono pb-1">{r}</div>
          ))}

          {/* Rows */}
          {ALL_RANKS.map((rowRank, r) => (
            <>
              <div key={`label-${r}`} className="flex items-center justify-center text-[10px] text-muted-foreground font-mono">{rowRank}</div>
              {ALL_RANKS.map((_, c) => {
                const cell = grid[r * 13 + c];
                const isSelected = selected?.hand === cell.hand;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSelected(isSelected ? null : { hand: cell.hand, decision: cell.decision })}
                    className={cn(
                      "aspect-square flex items-center justify-center text-[9px] font-mono font-bold rounded transition-all border",
                      getCellColor(cell.decision),
                      isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-card scale-110 z-10 relative"
                    )}
                    title={`${cell.hand}: ${cell.decision.action} (${Math.round(cell.decision.frequency * 100)}%)`}
                  >
                    <span className="leading-none">{cell.hand.slice(0, -1 * (cell.hand.length > 2 ? 1 : 0))}</span>
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Selected hand detail */}
      {selected && (
        <div className="rounded-xl bg-card border border-primary/30 p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-2xl text-primary">{selected.hand}</span>
              <Badge className={cn(
                "text-sm px-3",
                selected.decision.action === "push"
                  ? selected.decision.frequency >= 0.85
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-muted text-muted-foreground"
              )}>
                {selected.decision.action.toUpperCase()} — {Math.round(selected.decision.frequency * 100)}%
              </Badge>
            </div>
            <span className={cn(
              "font-mono font-bold",
              selected.decision.ev >= 0 ? "text-green-400" : "text-red-400"
            )}>
              EV: {selected.decision.ev >= 0 ? "+" : ""}{selected.decision.ev}bb
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{selected.decision.reasoning}</p>
        </div>
      )}
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
