import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Crown, Zap, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanPricing {
  monthly: {
    price: string;
    priceId: string | null;
  };
  yearly: {
    price: string;
    priceId: string | null;
    monthlyEquivalent: string;
    savings: string;
  };
}

interface PlanInfo {
  name: string;
  description: string;
  pricing: PlanPricing;
  popular?: boolean;
  features: string[];
  limitations?: string[];
}

// Stripe price IDs - Production
const PLANS: Record<string, PlanInfo> = {
  free: {
    name: "Free",
    description: "Para iniciantes explorando GTO",
    pricing: {
      monthly: { price: "R$ 0", priceId: null },
      yearly: { price: "R$ 0", priceId: null, monthlyEquivalent: "R$ 0", savings: "R$ 0" },
    },
    features: [
      "Ranges básicos pré-flop",
      "5 análises de mãos/dia",
      "Calculadora de equity",
      "Calculadora de EV básica",
    ],
    limitations: [
      "Análises de IA limitadas",
      "Sem histórico de mãos",
      "Sem suporte prioritário",
    ],
  },
  pro: {
    name: "Pro",
    description: "Para jogadores sérios em evolução",
    pricing: {
      monthly: { price: "R$ 29,90", priceId: "price_1StKFpKBKtRrb6BSNGea1zhp" },
      yearly: { 
        price: "R$ 287,04", 
        priceId: "price_1StKK9KBKtRrb6BSXvmEROGB",
        monthlyEquivalent: "R$ 23,92",
        savings: "R$ 71,76"
      },
    },
    popular: true,
    features: [
      "Todos os ranges 8-Max",
      "Análises de mãos ilimitadas",
      "Análises de IA completas",
      "Histórico de mãos (30 dias)",
      "Assistente de apostas",
      "Suporte por email",
    ],
  },
  premium: {
    name: "Premium",
    description: "Para profissionais e high stakes",
    pricing: {
      monthly: { price: "R$ 59,90", priceId: "price_1StKGKKBKtRrb6BSd0DLRljf" },
      yearly: { 
        price: "R$ 575,04", 
        priceId: "price_1StKKTKBKtRrb6BS0TTJInAj",
        monthlyEquivalent: "R$ 47,92",
        savings: "R$ 143,76"
      },
    },
    features: [
      "Tudo do Pro, mais:",
      "Análises de IA ilimitadas",
      "Histórico de mãos permanente",
      "Relatórios de performance",
      "Treinamento personalizado",
      "Suporte prioritário 24/7",
      "Acesso antecipado a novidades",
    ],
  },
};

export default function Pricing() {
  const { user, subscription, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [isYearly, setIsYearly] = useState(true);

  // Handle checkout result
  useEffect(() => {
    const checkoutResult = searchParams.get("checkout");
    if (checkoutResult === "success") {
      toast.success("Pagamento realizado com sucesso!", {
        description: "Sua assinatura está sendo processada...",
      });
      handleCheckSubscription();
    } else if (checkoutResult === "canceled") {
      toast.info("Checkout cancelado");
    }
  }, [searchParams]);

  const handleCheckSubscription = async () => {
    if (!user) return;
    
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      
      await refreshProfile();
      
      if (data?.subscribed) {
        toast.success(`Plano ${data.plan.toUpperCase()} ativado!`);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleSubscribe = async (planKey: string) => {
    const plan = PLANS[planKey as keyof typeof PLANS];
    const priceId = isYearly ? plan.pricing.yearly.priceId : plan.pricing.monthly.priceId;
    
    if (!priceId) {
      toast.info("Você já está no plano Free!");
      return;
    }

    if (!user) {
      toast.error("Faça login para assinar");
      navigate("/auth");
      return;
    }

    setIsLoading(planKey);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setIsLoading("manage");

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) {
        const errorMessage = error.message || "";
        if (errorMessage.includes("No Stripe customer")) {
          toast.error("Você ainda não tem uma assinatura ativa no Stripe", {
            description: "Complete um checkout primeiro para gerenciar sua assinatura.",
          });
          setIsLoading(null);
          return;
        }
        throw error;
      }

      if (data?.error) {
        if (data.error.includes("No Stripe customer")) {
          toast.error("Você ainda não tem uma assinatura ativa no Stripe", {
            description: "Complete um checkout primeiro para gerenciar sua assinatura.",
          });
          setIsLoading(null);
          return;
        }
        throw new Error(data.error);
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao abrir portal. Tente novamente.");
    } finally {
      setIsLoading(null);
    }
  };

  const currentPlan = subscription?.plan || "free";

  const PlanCard = ({ planKey, plan }: { planKey: string; plan: PlanInfo }) => {
    const isCurrentPlan = currentPlan === planKey;
    const isPremium = planKey === "premium";
    const isPro = planKey === "pro";
    const isFree = planKey === "free";

    const displayPrice = isYearly ? plan.pricing.yearly.monthlyEquivalent : plan.pricing.monthly.price;
    const totalPrice = isYearly ? plan.pricing.yearly.price : null;

    return (
      <div
        className={cn(
          "relative rounded-2xl border p-6 lg:p-8 transition-all duration-300",
          plan.popular
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border bg-card",
          isCurrentPlan && "ring-2 ring-primary"
        )}
      >
        {plan.popular && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4">
            Mais Popular
          </Badge>
        )}

        {isCurrentPlan && (
          <Badge className="absolute -top-3 right-4 bg-success">
            Seu Plano
          </Badge>
        )}

        {isYearly && !isFree && (
          <Badge className="absolute top-4 right-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
            -20%
          </Badge>
        )}

        <div className="text-center mb-6">
          <div className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4",
            isPremium ? "bg-gradient-to-br from-amber-500 to-yellow-500" :
            isPro ? "bg-primary" : "bg-muted"
          )}>
            {isPremium ? (
              <Crown className="w-6 h-6 text-black" />
            ) : isPro ? (
              <Zap className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

          <div className="mt-4">
            <span className="text-4xl font-bold text-foreground">{displayPrice}</span>
            <span className="text-muted-foreground">/mês</span>
          </div>

          {isYearly && !isFree && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                Cobrado {totalPrice}/ano
              </p>
              <p className="text-xs text-success font-medium">
                Economize {plan.pricing.yearly.savings}/ano
              </p>
            </div>
          )}
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className={cn(
                "w-5 h-5 shrink-0 mt-0.5",
                isPremium ? "text-amber-500" : isPro ? "text-primary" : "text-success"
              )} />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
          {plan.limitations?.map((limitation, i) => (
            <li key={`lim-${i}`} className="flex items-start gap-3 opacity-50">
              <span className="w-5 h-5 shrink-0 text-center text-muted-foreground">—</span>
              <span className="text-sm text-muted-foreground">{limitation}</span>
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          currentPlan !== "free" ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageSubscription}
              disabled={isLoading === "manage"}
            >
              {isLoading === "manage" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Gerenciar Assinatura
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Plano Atual
            </Button>
          )
        ) : (
          <Button
            variant={isPremium ? "gold" : isPro ? "default" : "outline"}
            className="w-full"
            onClick={() => handleSubscribe(planKey)}
            disabled={isLoading === planKey}
          >
            {isLoading === planKey ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : planKey === "free" ? (
              "Plano Atual"
            ) : (
              `Assinar ${plan.name}`
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 lg:p-6 xl:p-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
            Escolha seu Plano
          </h1>
          <p className="text-muted-foreground mt-3">
            Desbloqueie todo o potencial do seu jogo com análises GTO avançadas
          </p>

          {isCheckingSubscription && (
            <div className="mt-4 flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verificando assinatura...</span>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <span className={cn(
              "text-sm font-medium transition-colors",
              !isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Mensal
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn(
              "text-sm font-medium transition-colors",
              isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Anual
            </span>
            {isYearly && (
              <Badge className="bg-success/20 text-success border-success/30 ml-2">
                Economize 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Object.entries(PLANS).map(([key, plan]) => (
            <PlanCard key={key} planKey={key} plan={plan} />
          ))}
        </div>

        {/* FAQ or Trust badges */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Pagamento seguro via Stripe • Cancele a qualquer momento • Garantia de 7 dias
          </p>
        </div>
      </div>
    </div>
  );
}
