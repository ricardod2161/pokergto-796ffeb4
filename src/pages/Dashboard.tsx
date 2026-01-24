import { 
  Grid3X3, 
  Calculator, 
  TrendingUp, 
  PlayCircle,
  Upload,
  Bell,
  Target,
  Percent,
  DollarSign
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentHandsTable } from "@/components/dashboard/RecentHandsTable";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Principal</h1>
          <p className="text-muted-foreground">Bem-vindo de volta. Aqui está seu resumo de desempenho.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </Button>
          <Button variant="gold" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar Mãos
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="VPIP"
          value="24.5%"
          subtitle="Voluntariamente no Pote"
          icon={Percent}
          trend={{ value: 2.3, isPositive: false }}
        />
        <StatCard
          title="PFR"
          value="19.2%"
          subtitle="Raise Pré-Flop"
          icon={TrendingUp}
          trend={{ value: 1.8, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="3-Bet"
          value="8.7%"
          subtitle="Frequência de 3-Bet"
          icon={Target}
          variant="warning"
        />
        <StatCard
          title="Win Rate"
          value="+5.2 BB/100"
          subtitle="Últimas 10k mãos"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          variant="gold"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Analisador de Ranges"
            description="Estude ranges GTO para mesas 8-max"
            href="/ranges"
            icon={Grid3X3}
          />
          <QuickActionCard
            title="Calculadora de Equity"
            description="Calcule equity mão vs range"
            href="/equity"
            icon={Calculator}
          />
          <QuickActionCard
            title="Calculadora de EV"
            description="Analise decisões de valor esperado"
            href="/ev-calculator"
            icon={TrendingUp}
          />
          <QuickActionCard
            title="Replayer de Mãos"
            description="Revise e analise suas sessões"
            href="/hand-analysis/import"
            icon={PlayCircle}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 card-glass rounded-xl p-6">
          <PerformanceChart />
        </div>

        {/* Alerts Panel */}
        <div className="card-glass rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Alertas e Atualizações</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Sessão Importada</p>
                <p className="text-xs text-muted-foreground">247 mãos processadas com sucesso</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="w-2 h-2 rounded-full bg-warning mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Leak Detectado</p>
                <p className="text-xs text-muted-foreground">Foldando demais contra 3-bets no CO</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Nova Funcionalidade</p>
                <p className="text-xs text-muted-foreground">Assistente de apostas agora disponível</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Hands */}
      <div className="card-glass rounded-xl p-6">
        <RecentHandsTable />
      </div>
    </div>
  );
}
