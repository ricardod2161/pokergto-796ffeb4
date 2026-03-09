import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Plus, RefreshCw, Database, Trash2, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const GTO_OPTIMAL = { vpip: 22, pfr: 18, threeBet: 8 };

const POSITIONS = ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB"];

const POS_COLORS: Record<string, string> = {
  UTG: "hsl(0 72% 51%)",
  "UTG+1": "hsl(25 95% 53%)",
  MP: "hsl(48 96% 53%)",
  HJ: "hsl(142 71% 45%)",
  CO: "hsl(189 94% 43%)",
  BTN: "hsl(217 91% 60%)",
  SB: "hsl(263 70% 50%)",
  BB: "hsl(330 81% 60%)",
};

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface Session {
  id: string;
  position: string;
  result_bb: number;
  vpip: number;
  pfr: number;
  three_bet: number;
  hands_played: number;
  date: string;
}

interface DbStats {
  total_equity_calculations: number | null;
  total_ev_calculations: number | null;
  total_range_analyses: number | null;
  total_hands_analyzed: number | null;
  total_ai_consultations: number | null;
}

interface FormState {
  position: string;
  result_bb: string;
  vpip: string;
  pfr: string;
  three_bet: string;
  hands_played: string;
}

const DEFAULT_FORM: FormState = {
  position: "BTN",
  result_bb: "0",
  vpip: "24",
  pfr: "18",
  three_bet: "8",
  hands_played: "100",
};

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

export default function Statistics() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  // ── Data loading ──────────────────────────────

  const loadSessions = useCallback(() => {
    if (!user) return;
    try {
      const stored = JSON.parse(
        localStorage.getItem(`gto_sessions_${user.id}`) || "[]"
      );
      setSessions(stored);
    } catch {
      setSessions([]);
    }
  }, [user]);

  const fetchDbStats = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("user_statistics")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setDbStats(data as DbStats | null);
    } catch {
      /* table may not have a row yet */
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadSessions();
    fetchDbStats();
  }, [loadSessions, fetchDbStats]);

  // ── CRUD ──────────────────────────────────────

  const handleSave = () => {
    if (!user) return;
    const session: Session = {
      id: Date.now().toString(),
      position: form.position,
      result_bb: parseFloat(form.result_bb) || 0,
      vpip: parseFloat(form.vpip) || 0,
      pfr: parseFloat(form.pfr) || 0,
      three_bet: parseFloat(form.three_bet) || 0,
      hands_played: parseInt(form.hands_played) || 0,
      date: new Date().toISOString(),
    };
    const updated = [session, ...sessions].slice(0, 100);
    localStorage.setItem(`gto_sessions_${user.id}`, JSON.stringify(updated));
    setSessions(updated);
    setShowForm(false);
    setForm(DEFAULT_FORM);
    toast.success("Sessão salva!");
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    const updated = sessions.filter(s => s.id !== id);
    localStorage.setItem(`gto_sessions_${user.id}`, JSON.stringify(updated));
    setSessions(updated);
    toast.success("Sessão removida");
  };

  // ── Aggregates ────────────────────────────────

  const totalHands = sessions.reduce((s, r) => s + r.hands_played, 0);
  const totalBB = sessions.reduce((s, r) => s + r.result_bb, 0);
  const bb100 = totalHands > 0 ? (totalBB / totalHands) * 100 : null;
  const avgVPIP = sessions.length
    ? sessions.reduce((s, r) => s + r.vpip, 0) / sessions.length
    : null;
  const avgPFR = sessions.length
    ? sessions.reduce((s, r) => s + r.pfr, 0) / sessions.length
    : null;
  const avg3Bet = sessions.length
    ? sessions.reduce((s, r) => s + r.three_bet, 0) / sessions.length
    : null;

  // Chart: last 20 sessions
  const chartData = sessions
    .slice(0, 20)
    .reverse()
    .map((s, i) => ({ n: `#${i + 1}`, result: s.result_bb }));

  // Position breakdown
  const posBD = POSITIONS.map(pos => {
    const ps = sessions.filter(s => s.position === pos);
    const profit = ps.reduce((s, r) => s + r.result_bb, 0);
    const hands = ps.reduce((s, r) => s + r.hands_played, 0);
    return {
      pos,
      profit,
      hands,
      wr: hands > 0 ? Math.round((profit / hands) * 1000) / 10 : null,
    };
  }).filter(p => p.hands > 0);

  // GTO benchmarks
  const benchmarks = (
    [
      { stat: "VPIP", current: avgVPIP, optimal: GTO_OPTIMAL.vpip, unit: "%" },
      { stat: "PFR", current: avgPFR, optimal: GTO_OPTIMAL.pfr, unit: "%" },
      { stat: "3-Bet", current: avg3Bet, optimal: GTO_OPTIMAL.threeBet, unit: "%" },
    ] as { stat: string; current: number | null; optimal: number; unit: string }[]
  ).filter(b => b.current !== null) as {
    stat: string;
    current: number;
    optimal: number;
    unit: string;
  }[];

  // DB usage stats
  const liveStats = dbStats
    ? [
        { label: "Equity Calc", v: dbStats.total_equity_calculations ?? 0, color: "text-primary" },
        { label: "EV Calc", v: dbStats.total_ev_calculations ?? 0, color: "text-[hsl(43,96%,56%)]" },
        { label: "Ranges", v: dbStats.total_range_analyses ?? 0, color: "text-[hsl(189,94%,43%)]" },
        { label: "Mãos Analisadas", v: dbStats.total_hands_analyzed ?? 0, color: "text-success" },
        { label: "Consultas AI", v: dbStats.total_ai_consultations ?? 0, color: "text-primary" },
      ]
    : [];

  // ── Render ────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
            <p className="text-sm text-muted-foreground">Análise real do seu perfil de jogo</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { loadSessions(); fetchDbStats(); }}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("w-4 h-4 mr-1.5", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={() => setShowForm(v => !v)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {showForm ? "Fechar" : "Nova Sessão"}
            </Button>
          </div>
        </div>

        {/* Session form */}
        {showForm && (
          <div className="rounded-xl bg-card border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Registrar Sessão</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {/* Position */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Posição</Label>
                <Select
                  value={form.position}
                  onValueChange={v => setForm(p => ({ ...p, position: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Numeric fields */}
              {[
                { label: "Resultado (BB)", key: "result_bb" },
                { label: "Mãos", key: "hands_played" },
                { label: "VPIP %", key: "vpip" },
                { label: "PFR %", key: "pfr" },
                { label: "3-Bet %", key: "three_bet" },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    value={form[f.key as keyof FormState]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave}>Salvar</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* DB usage stats */}
        {liveStats.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Uso total da plataforma</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {liveStats.map(s => (
                <div key={s.label} className="text-center py-3 px-2 rounded-lg bg-muted/20">
                  <p className={cn("text-xl font-bold font-mono", s.color)}>
                    {s.v.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mb-6">
              <BarChart2 className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhuma sessão ainda</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Registre suas sessões para ver win rate, tendências por posição e comparação com GTO.
            </p>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Primeira Sessão
            </Button>
          </div>
        )}

        {sessions.length > 0 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: "BB/100",
                  val: bb100 !== null
                    ? `${bb100 >= 0 ? "+" : ""}${bb100.toFixed(2)}`
                    : "—",
                  sub: "Win rate geral",
                  color: bb100 !== null && bb100 >= 0 ? "text-success" : "text-destructive",
                },
                {
                  label: "Sessões",
                  val: sessions.length.toString(),
                  sub: "Registradas",
                  color: "text-primary",
                },
                {
                  label: "Mãos",
                  val: totalHands >= 1000
                    ? `${(totalHands / 1000).toFixed(1)}k`
                    : totalHands.toString(),
                  sub: "Amostra total",
                  color: "text-foreground",
                },
                {
                  label: "Lucro",
                  val: `${totalBB >= 0 ? "+" : ""}${totalBB.toFixed(0)} BB`,
                  sub: "Acumulado",
                  color: totalBB >= 0 ? "text-success" : "text-destructive",
                },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl bg-card border border-border p-5 flex flex-col gap-1"
                >
                  <span className={cn("text-2xl font-bold font-mono", s.color)}>{s.val}</span>
                  <span className="text-xs font-medium text-foreground">{s.label}</span>
                  <span className="text-[11px] text-muted-foreground">{s.sub}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar chart */}
              <div className="rounded-xl bg-card border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground text-sm">Resultado por Sessão</h3>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <XAxis
                        dataKey="n"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(215 15% 50%)", fontSize: 10 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(215 15% 50%)", fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(220 18% 10%)",
                          border: "1px solid hsl(220 15% 18%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v} BB`, "Resultado"]}
                      />
                      <ReferenceLine y={0} stroke="hsl(215 15% 25%)" strokeDasharray="3 3" />
                      <Bar dataKey="result" radius={[3, 3, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.result >= 0 ? "hsl(158 64% 38%)" : "hsl(0 72% 48%)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GTO benchmarks */}
              {benchmarks.length > 0 ? (
                <div className="rounded-xl bg-card border border-border p-5">
                  <h3 className="font-semibold text-foreground text-sm mb-4">vs GTO Ideal (6-max)</h3>
                  <div className="space-y-4">
                    {benchmarks.map(b => {
                      const diff = Math.round((b.current - b.optimal) * 10) / 10;
                      const ok = Math.abs(diff) <= 2;
                      return (
                        <div key={b.stat} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{b.stat}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-foreground">
                                {Math.round(b.current * 10) / 10}{b.unit}
                              </span>
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded font-mono",
                                ok
                                  ? "bg-success/20 text-success"
                                  : diff > 0
                                    ? "bg-warning/20 text-warning"
                                    : "bg-destructive/20 text-destructive"
                              )}>
                                {diff > 0 ? "+" : ""}{diff}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                ok ? "bg-success" : "bg-warning"
                              )}
                              style={{
                                width: `${Math.min(100, (b.current / (b.optimal * 1.5)) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Ideal: {b.optimal}{b.unit}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-card border border-border p-5 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Adicione sessões com dados de VPIP/PFR/3-Bet para ver comparação GTO.
                  </p>
                </div>
              )}
            </div>

            {/* Position breakdown */}
            {posBD.length > 0 && (
              <div className="rounded-xl bg-card border border-border p-5">
                <h3 className="font-semibold text-foreground text-sm mb-4">
                  Desempenho por Posição
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {posBD.map(p => (
                    <div
                      key={p.pos}
                      className={cn(
                        "rounded-lg p-4 text-center border transition-all hover:scale-105",
                        p.profit >= 0
                          ? "bg-success/5 border-success/20"
                          : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      <p
                        className="font-semibold text-xs mb-1"
                        style={{ color: POS_COLORS[p.pos] ?? "hsl(var(--foreground))" }}
                      >
                        {p.pos}
                      </p>
                      <p className={cn(
                        "text-base font-mono font-bold",
                        p.profit >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {p.wr !== null ? `${p.wr >= 0 ? "+" : ""}${p.wr}` : "—"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">BB/100</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{p.hands} mãos</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session log */}
            <div className="rounded-xl bg-card border border-border p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">
                Log de Sessões ({sessions.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Posição", "Resultado", "Mãos", "BB/100", "VPIP", "PFR", "3-Bet", ""].map(h => (
                        <th
                          key={h}
                          className="text-left text-[11px] text-muted-foreground font-medium py-2 px-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 15).map(s => {
                      const wr =
                        s.hands_played > 0
                          ? Math.round((s.result_bb / s.hands_played) * 1000) / 10
                          : 0;
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <span
                              className="text-xs font-semibold px-1.5 py-0.5 rounded"
                              style={{
                                color: POS_COLORS[s.position] ?? "hsl(var(--foreground))",
                                background: `${POS_COLORS[s.position] ?? "hsl(var(--foreground))"}18`,
                              }}
                            >
                              {s.position}
                            </span>
                          </td>
                          <td className={cn(
                            "py-2.5 px-3 font-mono text-xs font-medium",
                            s.result_bb >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {s.result_bb >= 0 ? "+" : ""}{s.result_bb}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">
                            {s.hands_played}
                          </td>
                          <td className={cn(
                            "py-2.5 px-3 font-mono text-xs",
                            wr >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {wr >= 0 ? "+" : ""}{wr}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{s.vpip}%</td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{s.pfr}%</td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{s.three_bet}%</td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors"
                              aria-label="Remover sessão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
