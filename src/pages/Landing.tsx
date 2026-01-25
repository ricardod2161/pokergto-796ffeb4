import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  Check, 
  BarChart3, 
  Brain, 
  Target, 
  TrendingUp,
  Zap,
  Shield,
  Users,
  Star,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Brain,
    title: "Análise GTO com IA",
    description: "Inteligência artificial avançada analisa suas mãos e fornece recomendações baseadas em teoria de jogos otimizada."
  },
  {
    icon: Target,
    title: "Ranges Pré-Flop Completos",
    description: "Acesse ranges de open, 3-bet, 4-bet, squeeze e defesa de blinds para todas as posições em 8-Max."
  },
  {
    icon: BarChart3,
    title: "Calculadoras Profissionais",
    description: "Calculadoras de equity e EV com precisão de solver para tomar decisões +EV em tempo real."
  },
  {
    icon: TrendingUp,
    title: "Análise de Performance",
    description: "Acompanhe sua evolução com estatísticas detalhadas e identifique leaks no seu jogo."
  },
  {
    icon: Zap,
    title: "Assistente de Apostas",
    description: "Receba sizing otimizado e análise de textura de board para maximizar seu valor."
  },
  {
    icon: Shield,
    title: "Treinamento Personalizado",
    description: "Pratique situações específicas com feedback em tempo real para acelerar seu aprendizado."
  }
];

const testimonials = [
  {
    name: "Carlos M.",
    role: "Jogador NL200",
    content: "Meu winrate subiu de 3bb/100 para 7bb/100 em 2 meses usando o PokerGTO Pro. As análises de IA são incríveis.",
    avatar: "CM"
  },
  {
    name: "Ana P.",
    role: "Jogadora NL50",
    content: "Finalmente entendi ranges de forma visual e intuitiva. A ferramenta mais completa que já usei.",
    avatar: "AP"
  },
  {
    name: "Roberto S.",
    role: "Coach de Poker",
    content: "Uso com meus alunos diariamente. A qualidade das análises rivaliza com solvers muito mais caros.",
    avatar: "RS"
  }
];

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para começar a estudar GTO",
    features: [
      "Ranges básicos pré-flop",
      "5 análises de mãos/dia",
      "Calculadora de equity",
      "Calculadora de EV básica"
    ],
    cta: "Começar Grátis",
    variant: "outline" as const
  },
  {
    name: "Pro",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para jogadores sérios",
    popular: true,
    features: [
      "Todos os ranges 8-Max",
      "Análises de mãos ilimitadas",
      "Análises de IA completas",
      "Histórico de mãos (30 dias)",
      "Assistente de apostas",
      "Suporte por email"
    ],
    cta: "Assinar Pro",
    variant: "default" as const
  },
  {
    name: "Premium",
    price: "R$ 59,90",
    period: "/mês",
    description: "Para profissionais",
    features: [
      "Tudo do Pro, mais:",
      "Análises de IA ilimitadas",
      "Histórico permanente",
      "Relatórios de performance",
      "Treinamento personalizado",
      "Suporte prioritário 24/7"
    ],
    cta: "Assinar Premium",
    variant: "gold" as const
  }
];

const stats = [
  { value: "10.000+", label: "Jogadores Ativos" },
  { value: "1M+", label: "Mãos Analisadas" },
  { value: "98%", label: "Satisfação" },
  { value: "24/7", label: "Suporte" }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">PokerGTO Pro</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button onClick={() => navigate("/auth")} className="hidden sm:flex">
              Começar Grátis
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Plataforma #1 de Análise GTO no Brasil
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Domine o Poker com
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-gold">
              Inteligência Artificial GTO
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Análises profissionais de mãos, ranges otimizados e calculadoras de precisão. 
            Tudo que você precisa para subir de stakes e maximizar seu winrate.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="xl" onClick={() => navigate("/auth")} className="w-full sm:w-auto">
              Começar Grátis Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="xl" variant="outline" onClick={() => navigate("/auth")} className="w-full sm:w-auto">
              Ver Demonstração
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Recursos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ferramentas Profissionais de Análise
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tudo que jogadores profissionais usam para estudar e melhorar, agora acessível para você.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Preços
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Escolha Seu Plano
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e evolua conforme seu jogo melhora. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={cn(
                  "relative rounded-2xl border p-6 lg:p-8 transition-all duration-300",
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-105"
                    : "border-border bg-card"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4">
                    Mais Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check className={cn(
                        "w-5 h-5 shrink-0 mt-0.5",
                        plan.variant === "gold" ? "text-gold" : 
                        plan.variant === "default" ? "text-primary" : "text-success"
                      )} />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.variant}
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O Que Nossos Usuários Dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-gold/10 border border-primary/20 p-8 md:p-12 lg:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-20" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Pronto para Evoluir seu Jogo?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Junte-se a milhares de jogadores que já estão usando IA para dominar o poker. 
                Comece grátis hoje mesmo.
              </p>
              <Button size="xl" onClick={() => navigate("/auth")}>
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">PokerGTO Pro</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="/privacy" className="hover:text-foreground transition-colors">
                Privacidade
              </a>
              <a href="mailto:suporte@pokergto.pro" className="hover:text-foreground transition-colors">
                Contato
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 PokerGTO Pro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
