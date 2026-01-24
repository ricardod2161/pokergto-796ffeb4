import { BettingRecommendation, BettingAction } from "@/lib/pokerAnalysis";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, Target, Zap } from "lucide-react";

interface RecommendationPanelProps {
  recommendation: BettingRecommendation | null;
  equity: number;
}

const actionConfig: Record<BettingAction, { 
  label: string; 
  emoji: string; 
  colors: string 
}> = {
  bet: { label: "APOSTAR", emoji: "🎯", colors: "bg-success/20 text-success border-success/30" },
  raise: { label: "RAISE", emoji: "⚡", colors: "bg-success/20 text-success border-success/30" },
  call: { label: "CALL", emoji: "📞", colors: "bg-primary/20 text-primary border-primary/30" },
  check: { label: "CHECK", emoji: "⏸", colors: "bg-warning/20 text-warning border-warning/30" },
  fold: { label: "FOLD", emoji: "✗", colors: "bg-destructive/20 text-destructive border-destructive/30" }
};

export function RecommendationPanel({ recommendation, equity }: RecommendationPanelProps) {
  if (!recommendation) {
    return (
      <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Recomendação</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            Selecione sua mão e o board para receber recomendações
          </p>
        </div>
      </div>
    );
  }

  const config = actionConfig[recommendation.primaryAction];
  const sizingOptions = ["33%", "50%", "66%", "75%", "100%", "all-in"];

  return (
    <div className="rounded-xl bg-[hsl(220,18%,8%)] border border-[hsl(220,15%,15%)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Recomendação</h3>
      </div>
      
      {/* Main action */}
      <div className={cn(
        "flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border mb-4",
        config.colors
      )}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
        {recommendation.sizing && (
          <span className="ml-1 px-2 py-0.5 bg-black/20 rounded text-xs">
            {recommendation.sizing}
          </span>
        )}
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-[hsl(220,15%,10%)]">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs text-muted-foreground">Confiança</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-[hsl(220,15%,15%)] rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                recommendation.confidence >= 70 ? "bg-success" :
                recommendation.confidence >= 50 ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${recommendation.confidence}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            {recommendation.confidence}%
          </span>
        </div>
      </div>

      {/* Sizing options */}
      {(recommendation.primaryAction === "bet" || recommendation.primaryAction === "raise") && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">Sizing Sugerido</p>
          <div className="grid grid-cols-3 gap-1.5">
            {sizingOptions.map((size) => (
              <button
                key={size}
                className={cn(
                  "py-1.5 rounded-lg text-xs font-medium transition-all",
                  size === recommendation.sizing
                    ? "bg-primary text-primary-foreground"
                    : "bg-[hsl(220,15%,12%)] text-muted-foreground hover:text-foreground"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Equity and EV */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-[hsl(220,15%,10%)]">
          <p className="text-xs text-muted-foreground mb-0.5">Equity</p>
          <div className="flex items-center gap-1">
            {equity >= 50 ? (
              <TrendingUp className="w-3.5 h-3.5 text-success" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
            )}
            <span className={cn(
              "font-mono font-bold text-sm",
              equity >= 50 ? "text-success" : "text-destructive"
            )}>
              {equity.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {recommendation.evEstimate !== undefined && (
          <div className="p-2 rounded-lg bg-[hsl(220,15%,10%)]">
            <p className="text-xs text-muted-foreground mb-0.5">EV Estimado</p>
            <span className={cn(
              "font-mono font-bold text-sm",
              recommendation.evEstimate >= 0 ? "text-success" : "text-destructive"
            )}>
              {recommendation.evEstimate >= 0 ? "+" : ""}
              {recommendation.evEstimate.toFixed(1)} bb
            </span>
          </div>
        )}
      </div>

      {/* Pot odds if facing bet */}
      {recommendation.equityNeeded !== undefined && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(220,15%,10%)] mb-3">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Precisa de <span className="text-foreground font-bold">{recommendation.equityNeeded}%</span> equity para call
          </span>
        </div>
      )}

      {/* Alternative actions */}
      {recommendation.alternativeActions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1.5">Ações Alternativas</p>
          <div className="flex flex-wrap gap-1.5">
            {recommendation.alternativeActions.map((alt, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[hsl(220,15%,12%)] text-xs"
              >
                <span className="text-muted-foreground capitalize">{alt.action}</span>
                {alt.sizing && <span className="text-foreground">{alt.sizing}</span>}
                <span className="text-muted-foreground/70">{alt.frequency}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="pt-2 border-t border-[hsl(220,15%,15%)]">
        <p className="text-xs text-muted-foreground mb-1">Análise</p>
        <p className="text-xs text-foreground leading-relaxed">{recommendation.reason}</p>
      </div>
    </div>
  );
}
