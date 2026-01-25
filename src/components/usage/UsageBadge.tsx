import { Sparkles, Infinity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UsageBadgeProps {
  currentCount: number;
  dailyLimit: number;
  remaining: number;
  isUnlimited: boolean;
  planName: string;
  className?: string;
}

export function UsageBadge({
  currentCount,
  dailyLimit,
  remaining,
  isUnlimited,
  planName,
  className,
}: UsageBadgeProps) {
  const isLow = !isUnlimited && remaining <= 2;
  const isExhausted = !isUnlimited && remaining === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 cursor-default transition-colors",
              isUnlimited && "border-primary/50 bg-primary/10 text-primary",
              isLow && !isExhausted && "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
              isExhausted && "border-destructive/50 bg-destructive/10 text-destructive",
              !isUnlimited && !isLow && "border-muted-foreground/30",
              className
            )}
          >
            {isUnlimited ? (
              <>
                <Infinity className="h-3 w-3" />
                <span>Ilimitado</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                <span>{remaining}/{dailyLimit}</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Zap className="h-3.5 w-3.5" />
              Plano {planName}
            </div>
            {isUnlimited ? (
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
