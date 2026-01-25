import { useState } from "react";
import { Crown, Zap, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: "pro" | "premium";
}

const PLANS = {
  free: {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    icon: Zap,
    iconColor: "text-muted-foreground",
    features: ["5 análises por dia", "Ferramentas básicas"],
    priceId: null,
  },
  pro: {
    name: "Pro",
    price: "R$ 29,90",
    period: "/mês",
    icon: Zap,
    iconColor: "text-blue-500",
    features: ["Análises ilimitadas", "Todas as ferramentas", "Histórico completo"],
    priceId: "price_1RVjW9CO2KAH6fJa5QmjGLgB",
  },
  premium: {
    name: "Premium",
    price: "R$ 59,90",
    period: "/mês",
    icon: Crown,
    iconColor: "text-amber-500",
    features: ["Tudo do Pro", "Suporte prioritário", "Recursos exclusivos", "Acesso antecipado"],
    priceId: "price_1RVjWWCO2KAH6fJaUWxcgcNe",
  },
};

export function PlanChangeModal({ open, onOpenChange, currentPlan }: PlanChangeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>(currentPlan);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanChange = async () => {
    if (selectedPlan === currentPlan) {
      onOpenChange(false);
      return;
    }

    if (selectedPlan === "free") {
      // For downgrade to free, open customer portal to cancel
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("customer-portal");
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
          onOpenChange(false);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Erro ao abrir portal de gerenciamento");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For plan change (upgrade or switch between paid plans)
    setIsLoading(true);
    try {
      const priceId = PLANS[selectedPlan].priceId;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao iniciar alteração de plano");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionLabel = () => {
    if (selectedPlan === currentPlan) return "Manter Plano Atual";
    if (selectedPlan === "free") return "Fazer Downgrade";
    if (selectedPlan === "premium" && currentPlan === "pro") return "Fazer Upgrade";
    if (selectedPlan === "pro" && currentPlan === "premium") return "Fazer Downgrade";
    return "Alterar Plano";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Plano</DialogTitle>
          <DialogDescription>
            Selecione o plano desejado. A alteração será aplicada imediatamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
            const plan = PLANS[planKey];
            const Icon = plan.icon;
            const isCurrentPlan = planKey === currentPlan;
            const isSelected = planKey === selectedPlan;
            const isRecommended = planKey === "premium" && currentPlan === "pro";

            return (
              <button
                key={planKey}
                onClick={() => setSelectedPlan(planKey)}
                className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{plan.name}</span>
                        {isCurrentPlan && (
                          <Badge variant="secondary" className="text-xs">
                            Atual
                          </Badge>
                        )}
                        {isRecommended && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Recomendado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.price}
                        <span className="text-xs">{plan.period}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>

                <ul className="mt-3 space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePlanChange}
            disabled={isLoading || selectedPlan === currentPlan}
            className={selectedPlan === "premium" ? "bg-gradient-to-r from-amber-500 to-orange-500" : ""}
          >
            {isLoading ? "Processando..." : getActionLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}