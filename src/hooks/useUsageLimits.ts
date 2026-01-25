import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UsageInfo {
  currentCount: number;
  dailyLimit: number;
  remaining: number;
  isUnlimited: boolean;
}

export function useUsageLimits() {
  const { user, subscription } = useAuth();
  const [usage, setUsage] = useState<UsageInfo>({
    currentCount: 0,
    dailyLimit: 5,
    remaining: 5,
    isUnlimited: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage({ currentCount: 0, dailyLimit: 5, remaining: 5, isUnlimited: false });
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_daily_usage", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const row = data[0];
        setUsage({
          currentCount: row.current_count,
          dailyLimit: row.daily_limit,
          remaining: row.remaining,
          isUnlimited: row.daily_limit === -1,
        });
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  }, [user]);

  const checkAndIncrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error("Faça login para usar análises de IA");
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("increment_daily_usage", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const row = data[0];
        const newUsage = {
          currentCount: row.current_count,
          dailyLimit: row.daily_limit,
          remaining: row.daily_limit === -1 ? -1 : Math.max(0, row.daily_limit - row.current_count),
          isUnlimited: row.daily_limit === -1,
        };
        setUsage(newUsage);

        if (!row.can_use) {
          toast.error("Limite diário atingido", {
            description: "Faça upgrade para Pro ou Premium para análises ilimitadas!",
            action: {
              label: "Ver planos",
              onClick: () => window.location.href = "/pricing",
            },
          });
          return false;
        }

        // Show warning when approaching limit
        if (!newUsage.isUnlimited && newUsage.remaining <= 2 && newUsage.remaining > 0) {
          toast.warning(`Restam apenas ${newUsage.remaining} análises hoje`);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error incrementing usage:", error);
      toast.error("Erro ao verificar limite de uso");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const canUseAnalysis = useCallback((): boolean => {
    if (!user) return false;
    if (usage.isUnlimited) return true;
    return usage.remaining > 0;
  }, [user, usage]);

  // Fetch usage on mount and when user/subscription changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage, subscription]);

  const planName = subscription?.plan === "premium" 
    ? "Premium" 
    : subscription?.plan === "pro" 
      ? "Pro" 
      : "Free";

  return {
    usage,
    isLoading,
    planName,
    fetchUsage,
    checkAndIncrementUsage,
    canUseAnalysis,
  };
}
