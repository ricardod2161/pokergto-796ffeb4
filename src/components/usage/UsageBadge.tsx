import { Sparkles, Infinity, Zap, Crown, Star, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { useAuth } from "@/contexts/AuthContext";

interface UsageBadgeProps {
  className?: string;
  compact?: boolean;
}

export function UsageBadge({ className, compact = false }: UsageBadgeProps) {
  const { usage, planName } = useUsageLimits();
  const { isAdmin } = useAuth();
  
  const { currentCount, dailyLimit, remaining, isUnlimited } = usage;
  const isLow = !isUnlimited && !isAdmin && remaining <= 2;
  const isExhausted = !isUnlimited && !isAdmin && remaining === 0;
  const effectiveUnlimited = isUnlimited || isAdmin;

  const getPlanIcon = () => {
    if (isAdmin) return <Shield className="h-3 w-3" />;
    switch (planName) {
      case "Premium":
        return <Crown className="h-3 w-3" />;
      case "Pro":
        return <Star className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getDisplayName = () => {
    if (isAdmin) return "Admin";
    return planName;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 cursor-default transition-colors",
              effectiveUnlimited && "border-primary/50 bg-primary/10 text-primary",
              isAdmin && "border-primary bg-primary/20 text-primary",
              isLow && !isExhausted && "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
              isExhausted && "border-destructive/50 bg-destructive/10 text-destructive",
              !effectiveUnlimited && !isLow && "border-muted-foreground/30",
              className
            )}
          >
            {effectiveUnlimited ? (
              <>
                {getPlanIcon()}
                {!compact && (
                  <>
                    <span className="hidden sm:inline">{getDisplayName()}</span>
                    <span className="sm:hidden"><Infinity className="h-3 w-3" /></span>
                  </>
                )}
                {compact && <Infinity className="h-3 w-3" />}
              </>
            ) : (
              <>
                {getPlanIcon()}
                <span>{remaining}/{dailyLimit}</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Zap className="h-3.5 w-3.5" />
              {isAdmin ? "Acesso Admin" : `Plano ${planName}`}
            </div>
            {effectiveUnlimited ? (
              <p className="text-xs text-muted-foreground">
                Análises de IA ilimitadas
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {currentCount} de {dailyLimit} análises usadas hoje
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
