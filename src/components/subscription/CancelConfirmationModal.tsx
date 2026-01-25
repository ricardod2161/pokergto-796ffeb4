import { useState } from "react";
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
  Heart
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

export function CancelConfirmationModal({
  open,
  onOpenChange,
  plan,
  periodEnd,
}: CancelConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const features = plan === "premium" ? premiumFeatures : proFeatures;

  const formattedEndDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const handleContinueCancellation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) {
        // Check if error is because no Stripe customer exists
        const errorMessage = error.message || "";
        if (errorMessage.includes("No Stripe customer")) {
          toast.error("Você precisa ter uma assinatura ativa para gerenciar");
          onOpenChange(false);
          return;
        }
        throw error;
      }
      if (data?.error) {
        if (data.error.includes("No Stripe customer")) {
          toast.error("Você precisa ter uma assinatura ativa para gerenciar");
          onOpenChange(false);
          return;
        }
        throw new Error(data.error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(220,18%,10%)] border-[hsl(220,15%,18%)]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <Heart className="h-7 w-7 text-destructive" />
          </div>
          <DialogTitle className="text-xl text-center">
            Tem certeza que quer cancelar?
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sentiremos sua falta! Ao cancelar, você perderá acesso a:
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
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
            <p className="text-sm text-warning">
              Seu acesso {plan === "premium" ? "Premium" : "Pro"} continuará ativo até{" "}
              <strong>{formattedEndDate}</strong>
            </p>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="default"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Manter Assinatura
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleContinueCancellation}
            disabled={isLoading}
          >
            {isLoading ? "Abrindo portal..." : "Continuar com Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
