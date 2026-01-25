import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Crown, 
  Sparkles, 
  Zap, 
  BarChart3, 
  History,
  X,
  Heart,
  Gift,
  ArrowDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CancelConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "pro" | "premium";
  periodEnd: string | null;
}

const proFeatures = [
  { icon: Sparkles, label: "Análises de IA ilimitadas" },
  { icon: BarChart3, label: "Estatísticas avançadas" },
  { icon: History, label: "Histórico completo de mãos" },
];

const premiumFeatures = [
  { icon: Crown, label: "Acesso prioritário a novidades" },
  { icon: Zap, label: "Suporte prioritário" },
  ...proFeatures,
];

type Step = "retention" | "confirm";

export function CancelConfirmationModal({
  open,
  onOpenChange,
  plan,
  periodEnd,
}: CancelConfirmationModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("retention");
  const [isLoading, setIsLoading] = useState(false);
  const features = plan === "premium" ? premiumFeatures : proFeatures;

  const formattedEndDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const handleDowngradeToPro = async () => {
    if (plan !== "premium") return;
    
    setIsLoading(true);
    try {
      // Open checkout for Pro plan
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "price_1RVjW9CO2KAH6fJa5QmjGLgB" },
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
        toast.success("Redirecionando para o checkout do plano Pro");
      }
    } catch (error) {
      console.error("Error downgrading:", error);
      toast.error("Erro ao processar downgrade");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) {
        const errorMessage = error.message || "";
        if (errorMessage.includes("No Stripe customer")) {
          toast.error("Você precisa ter uma assinatura ativa para gerenciar");
          onOpenChange(false);
          return;
        }
        throw error;
      }

      if (data?.code === "NO_STRIPE_CUSTOMER") {
        toast.error("Nenhum registro encontrado no Stripe", {
          description: "Complete um checkout primeiro para gerenciar sua assinatura."
        });
        navigate("/pricing");
        onOpenChange(false);
        return;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("retention");
    onOpenChange(false);
  };

  // Step 1: Retention offers
  if (step === "retention") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <Gift className="h-7 w-7 text-amber-500" />
            </div>
            <DialogTitle className="text-xl text-center">
              Antes de ir, que tal...
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Temos algumas opções especiais para você
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Downgrade offer for Premium users */}
            {plan === "premium" && (
              <button
                onClick={handleDowngradeToPro}
                disabled={isLoading}
                className="w-full text-left rounded-lg border-2 border-blue-500/30 bg-blue-500/5 p-4 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <ArrowDown className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">Fazer downgrade para Pro</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Continue com análises ilimitadas por apenas <strong className="text-blue-500">R$ 29,90/mês</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Economize R$ 30/mês mantendo os recursos essenciais
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Keep subscription button */}
            <button
              onClick={handleClose}
              className="w-full text-left rounded-lg border-2 border-green-500/30 bg-green-500/5 p-4 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                  <Heart className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Manter minha assinatura</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Continuar aproveitando todos os benefícios do plano {plan === "premium" ? "Premium" : "Pro"}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-destructive"
              onClick={() => setStep("confirm")}
            >
              Quero mesmo cancelar →
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2: Final confirmation with features lost
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <DialogTitle className="text-xl text-center">
            Confirmar cancelamento
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Ao cancelar, você perderá acesso a:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <feature.icon className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <X className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm text-foreground">{feature.label}</span>
              </div>
            </div>
          ))}
        </div>

        {formattedEndDate && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-sm text-amber-500">
              Seu acesso continuará ativo até <strong>{formattedEndDate}</strong>
            </p>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="default"
            className="w-full"
            onClick={() => setStep("retention")}
          >
            ← Voltar
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleOpenPortal}
            disabled={isLoading}
          >
            {isLoading ? "Abrindo portal..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
