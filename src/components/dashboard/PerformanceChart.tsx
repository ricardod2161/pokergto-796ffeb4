import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const mockData = [
  { date: "1 Jan", ev: 120, actual: 95 },
  { date: "5 Jan", ev: 280, actual: 310 },
  { date: "10 Jan", ev: 190, actual: 145 },
  { date: "15 Jan", ev: 420, actual: 480 },
  { date: "20 Jan", ev: 380, actual: 350 },
  { date: "25 Jan", ev: 520, actual: 590 },
  { date: "30 Jan", ev: 680, actual: 720 },
];

export function PerformanceChart() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Tendência de Performance</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Valor Esperado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-muted-foreground">Resultados Reais</span>
          </div>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="evGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(158 64% 42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(158 64% 42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(43 96% 56%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(43 96% 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220 18% 10%)",
                border: "1px solid hsl(220 15% 18%)",
                borderRadius: "8px",
                boxShadow: "0 4px 24px -4px hsla(0 0% 0% / 0.5)",
              }}
              labelStyle={{ color: "hsl(210 20% 95%)" }}
            />
            <Area
              type="monotone"
              dataKey="ev"
              stroke="hsl(158 64% 42%)"
              strokeWidth={2}
              fill="url(#evGradient)"
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(43 96% 56%)"
              strokeWidth={2}
              fill="url(#actualGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
