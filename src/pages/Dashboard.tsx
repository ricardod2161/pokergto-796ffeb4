import { 
  Grid3X3, 
  Calculator, 
  TrendingUp, 
  PlayCircle,
  Target,
  Percent,
  DollarSign,
  Eye,
  Crosshair,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SubscriptionStatusBanner } from "@/components/subscription/SubscriptionStatusBanner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HandSession {
  id: string;
  position: string;
  result_bb: number;
  vpip: boolean;
  pfr: boolean;
  three_bet: boolean;
  session_date: string;
}

const POSITIONS = ["UTG", "UTG+1", "MP", "HJ", "CO", "BTN", "SB", "BB"];

function aggregateDashboardStats(sessions: HandSession[]) {
  if (!sessions.length) return null;
  const total = sessions.length;
  const vpip = Math.round((sessions.filter(s => s.vpip).length / total) * 1000) / 10;
  const pfr = Math.round((sessions.filter(s => s.pfr).length / total) * 1000) / 10;
  const threeBet = Math.round((sessions.filter(s => s.three_bet).length / total) * 1000) / 10;
  const totalProfit = sessions.reduce((sum, s) => sum + s.result_bb, 0);
  const bbPer100 = Math.round((totalProfit / total) * 100 * 10) / 10;

  const byPos: Record<string, { profit: number; hands: number }> = {};
  for (const s of sessions) {
    if (!byPos[s.position]) byPos[s.position] = { profit: 0, hands: 0 };
    byPos[s.position].profit += s.result_bb;
    byPos[s.position].hands += 1;
  }

  const positionData = POSITIONS.map(pos => {
    const d = byPos[pos] || { profit: 0, hands: 0 };
    return {
      pos,
      value: d.hands > 0 ? (Math.round((d.profit / d.hands) * 100 * 10) / 10).toFixed(1) : null,
    };
  });

  return { vpip, pfr, threeBet, bbPer100, totalHands: total, positionData };
}

const quickActions = [
  { title: "Ranges 8-Max", description: "Estude ranges GTO para todas as posições", href: "/ranges", icon: Grid3X3 },
  { title: "Calculadora Equity", description: "Calcule equity mão vs range", href: "/equity", icon: Calculator },
  { title: "Calculadora EV", description: "Analise decisões de valor esperado", href: "/ev-calculator", icon: TrendingUp },
  { title: "Análise de Mãos", description: "Revise e analise suas sessões", href: "/hand-analysis/import", icon: PlayCircle },
];

const alerts = [
  { type: "success", title: "Sessão Importada", description: "247 mãos processadas com sucesso", icon: CheckCircle },
  { type: "warning", title: "Leak Detectado", description: "Foldando demais contra 3-bets no CO", icon: AlertTriangle },
  { type: "info", title: "Nova Funcionalidade", description: "Assistente de apostas agora disponível", icon: Sparkles },
];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: sessions = [] } = useQuery<HandSession[]>({
    queryKey: ["hand_sessions_dashboard", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("hand_sessions")
        .select("id, position, result_bb, vpip, pfr, three_bet, session_date")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data as HandSession[]) ?? [];
    },
    enabled: !!user,
  });

  const agg = aggregateDashboardStats(sessions);
  const hasData = !!agg;

  // Recent sessions: group by date, take last 3 unique dates
  const recentSessions = (() => {
    const byDate: Record<string, { hands: number; result: number }> = {};
    for (const s of sessions) {
      if (!byDate[s.session_date]) byDate[s.session_date] = { hands: 0, result: 0 };
      byDate[s.session_date].hands += 1;
      byDate[s.session_date].result += s.result_bb;
    }
    return Object.entries(byDate)
      .slice(0, 3)
      .map(([date, d]) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        hands: d.hands,
        result: d.result >= 0 ? `+${Math.round(d.result)} BB` : `${Math.round(d.result)} BB`,
        positive: d.result >= 0,
      }));
  })();

  const statItems = [
    { label: "VPIP", value: hasData ? `${agg.vpip}%` : "—", icon: Percent, color: "text-primary" },
    { label: "PFR", value: hasData ? `${agg.pfr}%` : "—", icon: TrendingUp, color: "text-[hsl(var(--gold,45_100%_51%))]" },
    { label: "3-Bet", value: hasData ? `${agg.threeBet}%` : "—", icon: Target, color: "text-[hsl(var(--call,150_60%_55%))]" },
    { label: "AF", value: "—", icon: Crosshair, color: "text-muted-foreground" },
    { label: "WTSD", value: "—", icon: Eye, color: "text-primary" },
    { label: "W$SD", value: "—", icon: DollarSign, color: "text-[hsl(var(--success,142_71%_45%))]" },
    { label: "Mãos", value: hasData ? (agg.totalHands >= 1000 ? `${(agg.totalHands / 1000).toFixed(1)}k` : String(agg.totalHands)) : "—", icon: Layers, color: "text-muted-foreground" },
    { label: "BB/100", value: hasData ? (agg.bbPer100 >= 0 ? `+${agg.bbPer100}` : String(agg.bbPer100)) : "—", icon: TrendingUp, color: hasData ? (agg.bbPer100 >= 0 ? "text-[hsl(var(--success,142_71%_45%))]" : "text-destructive") : "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <SubscriptionStatusBanner />

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel Principal</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Bem-vindo de volta. Aqui está seu resumo de desempenho.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 p-1 rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)]">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-3 sm:py-4 px-2 rounded-lg hover:bg-[hsl(220,15%,12%)] transition-colors"
            >
              <span className={cn("text-base sm:text-lg lg:text-xl font-bold font-mono", stat.color)}>
                {stat.value}
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Ferramentas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] hover:border-primary/40 transition-all"
                  >
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-xs sm:text-sm group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-6">
              <h3 className="font-semibold text-foreground mb-4">Resumo de Desempenho</h3>
              {!hasData ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                  <p className="text-sm text-muted-foreground">Sem dados de sessões ainda.</p>
                  <Link
                    to="/hand-analysis/import"
                    className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    Importe mãos para ver seu desempenho por posição →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 sm:gap-2">
                    {agg.positionData.map((item) => (
                      <div
                        key={item.pos}
                        className={cn(
                          "text-center p-2 sm:p-3 rounded-lg border transition-colors",
                          item.value === null
                            ? "bg-[hsl(220,15%,10%)] border-[hsl(220,15%,15%)]"
                            : parseFloat(item.value) >= 0
                              ? "bg-success/5 border-success/20"
                              : "bg-destructive/5 border-destructive/20"
                        )}
                      >
                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{item.pos}</p>
                        <p className={cn(
                          "font-mono font-bold text-xs sm:text-sm",
                          item.value === null
                            ? "text-muted-foreground"
                            : parseFloat(item.value) >= 0
                              ? "text-success"
                              : "text-destructive"
                        )}>
                          {item.value !== null ? (parseFloat(item.value) >= 0 ? `+${item.value}` : item.value) : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Win Rate (BB/100) por posição • {agg.totalHands.toLocaleString()} mãos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alerts */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <h3 className="font-semibold text-foreground mb-4">Alertas</h3>
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      alert.type === "success" && "bg-success/5 border-success/20",
                      alert.type === "warning" && "bg-warning/5 border-warning/20",
                      alert.type === "info" && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <alert.icon className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      alert.type === "success" && "text-success",
                      alert.type === "warning" && "text-warning",
                      alert.type === "info" && "text-primary"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-5">
              <h3 className="font-semibold text-foreground mb-4">Sessões Recentes</h3>
              {recentSessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma sessão registrada ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220,15%,10%)] hover:bg-[hsl(220,15%,12%)] transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{session.date}</p>
                        <p className="text-xs text-muted-foreground">{session.hands} mãos</p>
                      </div>
                      <span className={cn(
                        "font-mono font-bold text-sm",
                        session.positive ? "text-success" : "text-destructive"
                      )}>
                        {session.result}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
