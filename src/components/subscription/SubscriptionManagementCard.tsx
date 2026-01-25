import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, 
  Receipt, 
  ArrowUpRight, 
  Crown, 
  Zap, 
  Calendar,
  AlertTriangle,
  RefreshCw,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlanChangeModal } from "./PlanChangeModal";
import { CancelConfirmationModal } from "./CancelConfirmationModal";

interface SubscriptionManagementCardProps {
  onRefresh?: () => void;
}

export function SubscriptionManagementCard({ onRefresh }: SubscriptionManagementCardProps) {
  const { subscription, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const plan = subscription?.plan || "free";
  const status = subscription?.status || "active";
  const periodEnd = subscription?.current_period_end;
  const billingPeriod = subscription?.billing_period || "monthly";

  const getPlanIcon = () => {
    if (plan === "premium") return <Crown className="h-6 w-6 text-amber-500" />;
    if (plan === "pro") return <Zap className="h-6 w-6 text-blue-500" />;
    return <Settings className="h-6 w-6 text-muted-foreground" />;
  };

  const getPlanName = () => {
    if (plan === "premium") return "Premium";
    if (plan === "pro") return "Pro";
    return "Gratuito";
  };

  const getStatusBadge = () => {
    if (status === "canceled") {
      return <Badge variant="destructive">Cancelado</Badge>;
    }
    if (status === "active") {
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getNextBillingInfo = () => {
    if (!periodEnd || plan === "free") return null;
    
    const endDate = new Date(periodEnd);
    const formattedDate = endDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    
    const price = plan === "premium" 
      ? (billingPeriod === "yearly" ? "R$ 575,04" : "R$ 59,90")
      : (billingPeriod === "yearly" ? "R$ 287,04" : "R$ 29,90");
    
    if (status === "canceled") {
      const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        label: "Acesso até",
        value: formattedDate,
        sublabel: `${daysRemaining} dias restantes`,
        isWarning: true
      };
    }
    
    return {
      label: "Próxima cobrança",
      value: `${price} em ${formattedDate}`,
      sublabel: billingPeriod === "yearly" ? "Ciclo anual" : "Ciclo mensal",
      isWarning: false
    };
  };

  const openPortal = async (section?: string) => {
    setIsLoading(section || "portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.code === "NO_STRIPE_CUSTOMER") {
        toast.error("Nenhum registro encontrado no Stripe", {
          description: "Complete um checkout primeiro para gerenciar sua assinatura."
        });
        setIsLoading(null);
        return;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setIsLoading(null);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading("refresh");
    try {
      await supabase.functions.invoke("check-subscription");
      await refreshProfile();
      toast.success("Status atualizado com sucesso!");
      onRefresh?.();
    } catch (error) {
      console.error("Error refreshing status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setIsLoading(null);
    }
  };

  const billingInfo = getNextBillingInfo();

  // Free plan - show upgrade prompt
  if (plan === "free") {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getPlanIcon()}
            Plano {getPlanName()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Você está no plano gratuito com 5 análises por dia.
          </p>
          <Button 
            className="w-full" 
            onClick={() => navigate("/pricing")}
          >
            <Zap className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getPlanIcon()}
              Plano {getPlanName()}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Billing Info */}
          {billingInfo && (
            <div className={`rounded-lg p-3 ${billingInfo.isWarning ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/50"}`}>
              <div className="flex items-start gap-2">
                {billingInfo.isWarning ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                ) : (
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">{billingInfo.label}</p>
                  <p className={`text-sm ${billingInfo.isWarning ? "text-amber-500" : "text-muted-foreground"}`}>
                    {billingInfo.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{billingInfo.sublabel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPlanChangeModal(true)}
              className="justify-start"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Alterar Plano
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPortal("payment")}
              disabled={isLoading === "payment"}
              className="justify-start"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isLoading === "payment" ? "..." : "Pagamento"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPortal("invoices")}
              disabled={isLoading === "invoices"}
              className="justify-start"
            >
              <Receipt className="mr-2 h-4 w-4" />
              {isLoading === "invoices" ? "..." : "Faturas"}
            </Button>
            {status === "canceled" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPortal("reactivate")}
                disabled={isLoading === "reactivate"}
                className="justify-start text-green-600 hover:text-green-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isLoading === "reactivate" ? "..." : "Reativar"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="justify-start text-destructive hover:text-destructive"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={isLoading === "refresh"}
            className="w-full text-muted-foreground"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading === "refresh" ? "animate-spin" : ""}`} />
            Atualizar Status
          </Button>
        </CardContent>
      </Card>

      <PlanChangeModal
        open={showPlanChangeModal}
        onOpenChange={setShowPlanChangeModal}
        currentPlan={plan as "pro" | "premium"}
      />

      {(plan === "pro" || plan === "premium") && (
        <CancelConfirmationModal
          open={showCancelModal}
          onOpenChange={setShowCancelModal}
          plan={plan}
          periodEnd={periodEnd || null}
        />
      )}
    </>
  );
}