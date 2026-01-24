import { 
  Percent, 
  TrendingUp, 
  Target, 
  DollarSign,
  Eye,
  Crosshair,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";

const trendData = [
  { date: "Semana 1", vpip: 26, pfr: 20, threeBet: 7 },
  { date: "Semana 2", vpip: 25, pfr: 19, threeBet: 8 },
  { date: "Semana 3", vpip: 24, pfr: 19, threeBet: 8 },
  { date: "Semana 4", vpip: 24.5, pfr: 19.2, threeBet: 8.7 },
];

const positionData = [
  { position: "UTG", winRate: 2.1, hands: 1240, profit: 260 },
  { position: "UTG+1", winRate: 1.8, hands: 1180, profit: 212 },
  { position: "MP", winRate: 3.2, hands: 1320, profit: 422 },
  { position: "HJ", winRate: 4.5, hands: 1450, profit: 653 },
  { position: "CO", winRate: 6.8, hands: 1580, profit: 1074 },
  { position: "BTN", winRate: 12.4, hands: 1620, profit: 2009 },
  { position: "SB", winRate: -8.2, hands: 890, profit: -730 },
  { position: "BB", winRate: -4.1, hands: 920, profit: -377 },
];

const benchmarks = [
  { stat: "VPIP", current: 24.5, optimal: 22, unit: "%" },
  { stat: "PFR", current: 19.2, optimal: 18, unit: "%" },
  { stat: "3-Bet", current: 8.7, optimal: 8, unit: "%" },
  { stat: "WTSD", current: 28, optimal: 26, unit: "%" },
  { stat: "W$SD", current: 52, optimal: 54, unit: "%" },
  { stat: "Agg%", current: 42, optimal: 45, unit: "%" },
];

export default function Statistics() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
        <p className="text-muted-foreground">Análise detalhada do seu perfil de jogo</p>
      </div>

      {/* Main HUD Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: "VPIP", value: "24.5%", icon: Percent },
          { label: "PFR", value: "19.2%", icon: TrendingUp },
          { label: "3-Bet", value: "8.7%", icon: Target },
          { label: "AF", value: "3.2", icon: Crosshair },
          { label: "WTSD", value: "28%", icon: Eye },
          { label: "W$SD", value: "52%", icon: DollarSign },
          { label: "Mãos", value: "10.2k", icon: Layers },
          { label: "BB/100", value: "+5.2", icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="card-glass rounded-xl p-4 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-lg font-bold font-mono text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="card-glass rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Tendência das Estatísticas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
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
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="vpip" 
                  stroke="hsl(158 64% 42%)" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="pfr" 
                  stroke="hsl(43 96% 56%)" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="threeBet" 
                  stroke="hsl(210 90% 55%)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">VPIP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gold" />
              <span className="text-muted-foreground">PFR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-call" />
              <span className="text-muted-foreground">3-Bet</span>
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="card-glass rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Comparação com GTO</h3>
          <div className="space-y-3">
            {benchmarks.map((b) => {
              const diff = b.current - b.optimal;
              const isGood = Math.abs(diff) < 2;
              return (
                <div key={b.stat} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{b.stat}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-foreground">{b.current}{b.unit}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
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
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        isGood ? "bg-success" : "bg-warning"
                      )}
                      style={{ width: `${Math.min(100, (b.current / (b.optimal * 1.5)) * 100)}%` }}
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
      <div className="card-glass rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Desempenho por Posição</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {positionData.map((pos) => (
            <div 
              key={pos.position}
              className={cn(
                "rounded-lg p-4 text-center border transition-all hover:scale-105",
                pos.winRate >= 0 
                  ? "bg-success/5 border-success/20" 
                  : "bg-destructive/5 border-destructive/20"
              )}
            >
              <p className="font-semibold text-foreground mb-1">{pos.position}</p>
              <p className={cn(
                "text-lg font-mono font-bold",
                pos.winRate >= 0 ? "text-success" : "text-destructive"
              )}>
                {pos.winRate >= 0 ? "+" : ""}{pos.winRate}
              </p>
              <p className="text-[10px] text-muted-foreground">BB/100</p>
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">{pos.hands} mãos</p>
                <p className={cn(
                  "text-xs font-mono",
                  pos.profit >= 0 ? "text-success" : "text-destructive"
                )}>
                  {pos.profit >= 0 ? "+" : ""}{pos.profit} BB
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
