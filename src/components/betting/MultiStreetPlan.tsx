import { StreetPlan } from "@/lib/pokerAnalysis";
import { cn } from "@/lib/utils";
import { Map, ChevronRight } from "lucide-react";

interface MultiStreetPlanProps {
  plans: StreetPlan[];
  currentStreet: "flop" | "turn" | "river";
}

const streetLabels = {
  flop: "Flop",
  turn: "Turn",
  river: "River"
};

const actionColors: Record<string, string> = {
  bet: "bg-success/20 text-success border-success/40",
  raise: "bg-success/20 text-success border-success/40",
  call: "bg-primary/20 text-primary border-primary/40",
  check: "bg-warning/20 text-warning border-warning/40",
  fold: "bg-destructive/20 text-destructive border-destructive/40"
};

export function MultiStreetPlan({ plans, currentStreet }: MultiStreetPlanProps) {
  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Map className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Plano Multi-Street</h3>
      </div>
      
      <div className="space-y-2">
        {plans.map((plan, index) => {
          const isCurrent = plan.street === currentStreet;
          const isPast = ["flop", "turn", "river"].indexOf(plan.street) < 
                        ["flop", "turn", "river"].indexOf(currentStreet);
          
          return (
            <div 
              key={plan.street}
              className={cn(
                "relative p-3 rounded-lg border transition-all",
                isCurrent 
                  ? "bg-primary/10 border-primary/30" 
                  : isPast
                    ? "bg-[hsl(220,15%,8%)] border-[hsl(220,15%,12%)] opacity-50"
                    : "bg-[hsl(220,15%,10%)] border-[hsl(220,15%,15%)]"
              )}
            >
              {/* Street header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                  <span className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {streetLabels[plan.street]}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  SPR: {plan.spr.toFixed(1)}
                </span>
              </div>
              
              {/* Action */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border",
                  actionColors[plan.action]
                )}>
                  <span className="capitalize">{plan.action}</span>
                  {plan.sizing && <span>{plan.sizing}</span>}
                </div>
              </div>
              
              {/* Reasoning */}
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {plan.reasoning}
              </p>
              
              {/* Connector arrow */}
              {index < plans.length - 1 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
