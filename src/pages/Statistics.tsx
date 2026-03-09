import { 
  Percent, 
  TrendingUp, 
  Target, 
  DollarSign,
  Eye,
  Crosshair,
  Layers,
  BarChart2,
  Import,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HandSession {
  id: string;
  position: string;
  result_bb: number;
  vpip: boolean;
  pfr: boolean;
  three_bet: boolean;
  session_date: string;
}

interface PositionStat {
  position: string;
  winRate: number;
  hands: number;
  profit: number;
}

interface TrendPoint {
  date: string;
  vpip: number;
  pfr: number;
  threeBet: number;
}

const STAT_POSITIONS = ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB"];

function aggregateStats(sessions: HandSession[]) {
  if (!sessions.length) return null;

  // VPIP: voluntarily put in preflop
  const vpipCount = sessions.filter(s => s.vpip).length;
  const pfrCount = sessions.filter(s => s.pfr).length;
  const threeBetCount = sessions.filter(s => s.three_bet).length;
  const totalHands = sessions.length;

  const vpip = Math.round((vpipCount / totalHands) * 1000) / 10;
  const pfr = Math.round((pfrCount / totalHands) * 1000) / 10;
  const threeBet = Math.round((threeBetCount / totalHands) * 1000) / 10;
  const totalProfit = sessions.reduce((sum, s) => sum + s.result_bb, 0);
  const bbPer100 = Math.round((totalProfit / totalHands) * 100 * 10) / 10;

  // Position breakdown
  const byPosition: Record<string, { profit: number; hands: number }> = {};
  for (const s of sessions) {
    if (!byPosition[s.position]) byPosition[s.position] = { profit: 0, hands: 0 };
    byPosition[s.position].profit += s.result_bb;
    byPosition[s.position].hands += 1;
  }

  const positionData: PositionStat[] = STAT_POSITIONS.map(pos => {
    const data = byPosition[pos] || { profit: 0, hands: 0 };
    return {
      position: pos,
      winRate: data.hands > 0 ? Math.round((data.profit / data.hands) * 100 * 10) / 10 : 0,
      hands: data.hands,
      profit: Math.round(data.profit * 10) / 10,
    };
  });

  // Weekly trend (last 4 weeks)
  const now = new Date();
  const trendData: TrendPoint[] = Array.from({ length: 4 }, (_, week) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (3 - week) * 7 - 6);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (3 - week) * 7);

    const weekSessions = sessions.filter(s => {
      const d = new Date(s.session_date);
      return d >= weekStart && d <= weekEnd;
    });

    const wTotal = weekSessions.length || 1;
    return {
      date: `Semana ${week + 1}`,
      vpip: Math.round((weekSessions.filter(s => s.vpip).length / wTotal) * 1000) / 10,
      pfr: Math.round((weekSessions.filter(s => s.pfr).length / wTotal) * 1000) / 10,
      threeBet: Math.round((weekSessions.filter(s => s.three_bet).length / wTotal) * 1000) / 10,
    };
  });

  return { vpip, pfr, threeBet, bbPer100, totalHands, positionData, trendData, totalProfit };
}

const GTO_BENCHMARKS = [
  { stat: "VPIP", optimal: 22, unit: "%" },
  { stat: "PFR", optimal: 18, unit: "%" },
  { stat: "3-Bet", optimal: 8, unit: "%" },
];

export default function Statistics() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["hand_sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("hand_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data || []) as HandSession[];
    },
    enabled: !!user,
  });

  const stats = sessions ? aggregateStats(sessions) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(220,20%,6%)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state
  if (!sessions || sessions.length === 0) {
    return (
      <div className="min-h-screen bg-[hsl(220,20%,6%)]">
        <div className="p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
            <p className="text-sm text-muted-foreground">Análise detalhada do seu perfil de jogo</p>
          </div>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6">
              <BarChart2 className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhum dado disponível</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Importe mãos via Análise de Mãos para ver suas estatísticas reais de jogo aqui.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/hand-analysis/import")}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Import className="w-4 h-4 mr-2" />
              Ir para Análise de Mãos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Stat bar items from real data
  const statItems = [
    { label: "VPIP", value: `${stats!.vpip}%`, color: "text-primary" },
    { label: "PFR", value: `${stats!.pfr}%`, color: "text-[hsl(43,96%,56%)]" },
    { label: "3-Bet", value: `${stats!.threeBet}%`, color: "text-[hsl(210,90%,55%)]" },
    { label: "Mãos", value: stats!.totalHands >= 1000 ? `${(stats!.totalHands / 1000).toFixed(1)}k` : String(stats!.totalHands), color: "text-muted-foreground" },
    { label: "BB/100", value: `${stats!.bbPer100 >= 0 ? "+" : ""}${stats!.bbPer100}`, color: stats!.bbPer100 >= 0 ? "text-success" : "text-destructive" },
    { label: "Lucro", value: `${stats!.totalProfit >= 0 ? "+" : ""}${stats!.totalProfit.toFixed(0)}`, color: stats!.totalProfit >= 0 ? "text-success" : "text-destructive" },
  ];

  const benchmarkCurrent: Record<string, number> = {
    VPIP: stats!.vpip,
    PFR: stats!.pfr,
    "3-Bet": stats!.threeBet,
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
          <p className="text-sm text-muted-foreground">Análise detalhada do seu perfil de jogo ({stats!.totalHands} mãos)</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-1 p-1 rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)]">
          {statItems.map((stat) => (
            <div 
              key={stat.label}
              className="flex flex-col items-center justify-center py-4 px-2 rounded-lg hover:bg-[hsl(220,15%,12%)] transition-colors"
            >
              <span className={cn("text-lg lg:text-xl font-bold font-mono", stat.color)}>
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-6">
            <h3 className="font-semibold text-foreground mb-4">Tendência das Estatísticas</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats!.trendData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 18% 10%)",
                      border: "1px solid hsl(220 15% 18%)",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vpip" 
                    name="VPIP"
                    stroke="hsl(158 64% 42%)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pfr" 
                    name="PFR"
                    stroke="hsl(43 96% 56%)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="threeBet" 
                    name="3-Bet"
                    stroke="hsl(210 90% 55%)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">VPIP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(43 96% 56%)" }} />
                <span className="text-muted-foreground">PFR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(210 90% 55%)" }} />
                <span className="text-muted-foreground">3-Bet</span>
              </div>
            </div>
          </div>

          {/* Benchmark Comparison */}
          <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-6">
            <h3 className="font-semibold text-foreground mb-4">Comparação com GTO</h3>
            <div className="space-y-3">
              {GTO_BENCHMARKS.map((b) => {
                const current = benchmarkCurrent[b.stat] ?? 0;
                const diff = current - b.optimal;
                const isGood = Math.abs(diff) < 2;
                return (
                  <div key={b.stat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{b.stat}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-foreground">{current}{b.unit}</span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-mono",
                          isGood 
                            ? "bg-success/20 text-success" 
                            : diff > 0 
                              ? "bg-warning/20 text-warning"
                              : "bg-destructive/20 text-destructive"
                        )}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-[hsl(220,15%,12%)] rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          isGood ? "bg-success" : "bg-warning"
                        )}
                        style={{ width: `${Math.min(100, (current / (b.optimal * 1.5)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Ótimo: {b.optimal}{b.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Position Performance */}
        <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-6">
          <h3 className="font-semibold text-foreground mb-4">Desempenho por Posição</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {stats!.positionData.map((pos) => (
              <div 
                key={pos.position}
                className={cn(
                  "rounded-lg p-4 text-center border transition-all hover:scale-105",
                  pos.hands === 0
                    ? "bg-muted/5 border-muted/20 opacity-40"
                    : pos.winRate >= 0 
                      ? "bg-success/5 border-success/20" 
                      : "bg-destructive/5 border-destructive/20"
                )}
              >
                <p className="font-semibold text-foreground mb-1">{pos.position}</p>
                {pos.hands > 0 ? (
                  <>
                    <p className={cn(
                      "text-lg font-mono font-bold",
                      pos.winRate >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {pos.winRate >= 0 ? "+" : ""}{pos.winRate}
                    </p>
                    <p className="text-[10px] text-muted-foreground">BB/100</p>
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">{pos.hands} mãos</p>
                      <p className={cn(
                        "text-xs font-mono",
                        pos.profit >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {pos.profit >= 0 ? "+" : ""}{pos.profit} BB
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">—</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
