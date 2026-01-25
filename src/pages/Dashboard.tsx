import { 
  Grid3X3, 
  Calculator, 
  TrendingUp, 
  PlayCircle,
  Upload,
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubscriptionStatusBanner } from "@/components/subscription/SubscriptionStatusBanner";

const stats = [
  { label: "VPIP", value: "24.5%", icon: Percent, color: "text-primary" },
  { label: "PFR", value: "19.2%", icon: TrendingUp, color: "text-gold" },
  { label: "3-Bet", value: "8.7%", icon: Target, color: "text-call" },
  { label: "AF", value: "3.2", icon: Crosshair, color: "text-muted-foreground" },
  { label: "WTSD", value: "28%", icon: Eye, color: "text-primary" },
  { label: "W$SD", value: "52%", icon: DollarSign, color: "text-success" },
  { label: "Mãos", value: "10.2k", icon: Layers, color: "text-muted-foreground" },
  { label: "BB/100", value: "+5.2", icon: TrendingUp, color: "text-success" },
];

const quickActions = [
  { 
    title: "Ranges 8-Max", 
    description: "Estude ranges GTO para todas as posições",
    href: "/ranges", 
    icon: Grid3X3 
  },
  { 
    title: "Calculadora Equity", 
    description: "Calcule equity mão vs range",
    href: "/equity", 
    icon: Calculator 
  },
  { 
    title: "Calculadora EV", 
    description: "Analise decisões de valor esperado",
    href: "/ev-calculator", 
    icon: TrendingUp 
  },
  { 
    title: "Análise de Mãos", 
    description: "Revise e analise suas sessões",
    href: "/hand-analysis/import", 
    icon: PlayCircle 
  },
];

const alerts = [
  {
    type: "success",
    title: "Sessão Importada",
    description: "247 mãos processadas com sucesso",
    icon: CheckCircle,
  },
  {
    type: "warning",
    title: "Leak Detectado",
    description: "Foldando demais contra 3-bets no CO",
    icon: AlertTriangle,
  },
  {
    type: "info",
    title: "Nova Funcionalidade",
    description: "Assistente de apostas agora disponível",
    icon: Sparkles,
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Subscription Status Banner */}
        <SubscriptionStatusBanner />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Principal</h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo de volta. Aqui está seu resumo de desempenho.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-1 p-1 rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)]">
          {stats.map((stat) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Ferramentas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] hover:border-primary/40 transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
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
              <div className="space-y-4">
                {/* Win rate by position */}
                <div className="grid grid-cols-8 gap-2">
                  {[
                    { pos: "UTG", value: "+2.1" },
                    { pos: "UTG+1", value: "+1.8" },
                    { pos: "MP", value: "+3.2" },
                    { pos: "HJ", value: "+4.5" },
                    { pos: "CO", value: "+6.8" },
                    { pos: "BTN", value: "+12.4" },
                    { pos: "SB", value: "-8.2" },
                    { pos: "BB", value: "-4.1" },
                  ].map((item) => (
                    <div 
                      key={item.pos}
                      className={cn(
                        "text-center p-3 rounded-lg border transition-colors",
                        item.value.startsWith("+") 
                          ? "bg-success/5 border-success/20" 
                          : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      <p className="text-xs text-muted-foreground mb-1">{item.pos}</p>
                      <p className={cn(
                        "font-mono font-bold text-sm",
                        item.value.startsWith("+") ? "text-success" : "text-destructive"
                      )}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <p className="text-xs text-muted-foreground text-center">
                  Win Rate (BB/100) por posição • Últimas 10.000 mãos
                </p>
              </div>
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
              <div className="space-y-2">
                {[
                  { date: "Hoje", hands: 247, result: "+156 BB" },
                  { date: "Ontem", hands: 412, result: "+89 BB" },
                  { date: "22/01", hands: 189, result: "-45 BB" },
                ].map((session, i) => (
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
                      session.result.startsWith("+") ? "text-success" : "text-destructive"
                    )}>
                      {session.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
