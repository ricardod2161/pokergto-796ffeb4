import { useState } from "react";
import { AlertTriangle, Clock, RefreshCw, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function SubscriptionStatusBanner() {
  const { subscription, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for canceled subscriptions
  if (!subscription || subscription.status !== "canceled") {
    return null;
  }

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  const formattedEndDate = periodEnd
    ? periodEnd.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const daysRemaining = periodEnd
    ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleReactivate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) {
        const errorMessage = error.message || "";
        if (errorMessage.includes("No Stripe customer")) {
          toast.error("Erro: registro Stripe não encontrado");
          navigate("/pricing");
          return;
        }
        throw error;
      }
      if (data?.error) {
        if (data.error.includes("No Stripe customer")) {
          toast.error("Erro: registro Stripe não encontrado");
          navigate("/pricing");
          return;
        }
        throw new Error(data.error);
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsLoading(true);
    try {
      await supabase.functions.invoke("check-subscription");
      await refreshProfile();
      toast.success("Status atualizado");
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const planLabel = subscription.plan === "premium" ? "Premium" : "Pro";
  const PlanIcon = subscription.plan === "premium" ? Crown : Zap;

  return (
    <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">
                Sua assinatura foi cancelada
              </p>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">
                <PlanIcon className="h-3 w-3" />
                {planLabel}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Seu acesso {planLabel} continua ativo até{" "}
              <strong className="text-warning">{formattedEndDate}</strong>
              {daysRemaining > 0 && (
                <span className="ml-1">
                  ({daysRemaining} {daysRemaining === 1 ? "dia restante" : "dias restantes"})
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Após essa data, você voltará ao plano Free com 5 análises/dia.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <Button
            variant="gold"
            size="sm"
            onClick={handleReactivate}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reativar Assinatura
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheckStatus}
            disabled={isLoading}
            className="text-xs text-muted-foreground"
          >
            Atualizar Status
          </Button>
        </div>
      </div>
    </div>
  );
}
