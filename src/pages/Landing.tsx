import { useNavigate } from "react-router-dom";
import { motion, type Easing } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ChevronRight, 
  Check, 
  BarChart3, 
  Brain, 
  Target, 
  TrendingUp,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Sparkles,
  Quote,
  Trophy,
  Users,
  Clock,
  Award,
  Rocket,
  Crown,
  Gift,
  Download,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { InstallBanner } from "@/components/pwa/InstallBanner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const easeOut: Easing = [0.0, 0.0, 0.2, 1];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: easeOut }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.1 }
  },
  viewport: { once: true }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: easeOut }
};

const features = [
  {
    icon: Brain,
    title: "Análise GTO com IA",
    description: "Inteligência artificial avançada analisa suas mãos e fornece recomendações baseadas em teoria de jogos otimizada.",
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-500/10 to-purple-600/5"
  },
  {
    icon: Target,
    title: "Ranges Pré-Flop Completos",
    description: "Acesse ranges de open, 3-bet, 4-bet, squeeze e defesa de blinds para todas as posições em 8-Max.",
    gradient: "from-emerald-500 to-teal-600",
    bgGradient: "from-emerald-500/10 to-teal-600/5"
  },
  {
    icon: BarChart3,
    title: "Calculadoras Profissionais",
    description: "Calculadoras de equity e EV com precisão de solver para tomar decisões +EV em tempo real.",
    gradient: "from-blue-500 to-cyan-600",
    bgGradient: "from-blue-500/10 to-cyan-600/5"
  },
  {
    icon: TrendingUp,
    title: "Análise de Performance",
    description: "Acompanhe sua evolução com estatísticas detalhadas e identifique leaks no seu jogo.",
    gradient: "from-orange-500 to-amber-600",
    bgGradient: "from-orange-500/10 to-amber-600/5"
  },
  {
    icon: Zap,
    title: "Assistente de Apostas",
    description: "Receba sizing otimizado e análise de textura de board para maximizar seu valor.",
    gradient: "from-yellow-500 to-orange-600",
    bgGradient: "from-yellow-500/10 to-orange-600/5"
  },
  {
    icon: Shield,
    title: "Treinamento Personalizado",
    description: "Pratique situações específicas com feedback em tempo real para acelerar seu aprendizado.",
    gradient: "from-pink-500 to-rose-600",
    bgGradient: "from-pink-500/10 to-rose-600/5"
  }
];

const testimonials = [
  {
    name: "Carlos Mendonça",
    role: "Jogador Profissional NL200",
    content: "Meu winrate subiu de 3bb/100 para 7bb/100 em 2 meses usando o PokerGTO Pro. As análises de IA são incríveis e me ajudaram a identificar leaks que eu nem sabia que tinha.",
    avatar: "CM",
    gradient: "from-violet-500 to-purple-600",
    stats: { value: "+133%", label: "Winrate" }
  },
  {
    name: "Ana Paula Silva",
    role: "Jogadora Semi-Pro NL50",
    content: "Finalmente entendi ranges de forma visual e intuitiva. A ferramenta mais completa que já usei. Consegui subir do NL25 para NL50 em apenas 3 meses.",
    avatar: "AP",
    gradient: "from-emerald-500 to-teal-600",
    stats: { value: "2x", label: "Stakes" }
  },
  {
    name: "Roberto Santos",
    role: "Coach de Poker",
    content: "Uso com meus alunos diariamente. A qualidade das análises rivaliza com solvers muito mais caros. Já indiquei para mais de 50 jogadores.",
    avatar: "RS",
    gradient: "from-blue-500 to-cyan-600",
    stats: { value: "50+", label: "Alunos" }
  },
  {
    name: "Fernanda Lima",
    role: "Jogadora NL100",
    content: "O assistente de apostas mudou meu jogo completamente. Agora sei exatamente quanto apostar em cada situação. ROI disparou!",
    avatar: "FL",
    gradient: "from-orange-500 to-amber-600",
    stats: { value: "+45%", label: "ROI" }
  }
];

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para começar a estudar GTO",
    icon: Gift,
    features: [
      "Ranges básicos pré-flop",
      "5 análises de mãos/dia",
      "Calculadora de equity",
      "Calculadora de EV básica"
    ],
    cta: "Começar Grátis",
    variant: "outline" as const,
    gradient: "from-slate-500 to-slate-600"
  },
  {
    name: "Pro",
    price: "R$ 29,90",
    period: "/mês",
    yearlyPrice: "R$ 299",
    yearlySaving: "Economize R$ 59",
    description: "Para jogadores sérios",
    icon: Rocket,
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
    variant: "default" as const,
    gradient: "from-primary to-primary/80"
  },
  {
    name: "Premium",
    price: "R$ 59,90",
    period: "/mês",
    yearlyPrice: "R$ 599",
    yearlySaving: "Economize R$ 119",
    description: "Para profissionais",
    icon: Crown,
    features: [
      "Tudo do Pro, mais:",
      "Análises de IA ilimitadas",
      "Histórico permanente",
      "Relatórios de performance",
      "Treinamento personalizado",
      "Suporte prioritário 24/7"
    ],
    cta: "Assinar Premium",
    variant: "gold" as const,
    gradient: "from-gold to-amber-500"
  }
];

const stats = [
  { value: "10.000+", label: "Jogadores Ativos", icon: Users },
  { value: "1M+", label: "Mãos Analisadas", icon: BarChart3 },
  { value: "98%", label: "Satisfação", icon: Trophy },
  { value: "24/7", label: "Suporte", icon: Clock }
];

export default function Landing() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      navigate("/install");
    }
  };
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header/Nav */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Logo variant="full" size="lg" />
          </motion.div>
          
          <nav className="hidden md:flex items-center gap-8">
            {[
              { id: "recursos", label: "Recursos" },
              { id: "precos", label: "Preços" },
              { id: "depoimentos", label: "Depoimentos" }
            ].map((item, i) => (
              <motion.a 
                key={i}
                href={`#${item.id}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleInstall}
                className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hidden sm:flex"
              >
                <Download className="w-4 h-4" />
                Instalar App
              </Button>
            </motion.div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="hidden md:flex">
              Entrar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate("/auth")} size="sm">
                Começar Grátis
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Sparkles className="w-3 h-3 mr-2" />
              Plataforma #1 de Análise GTO no Brasil
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Domine o Poker com
            <motion.span 
              className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-gold"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Inteligência Artificial GTO
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Análises profissionais de mãos, ranges otimizados e calculadoras de precisão. 
            Tudo que você precisa para subir de stakes e maximizar seu winrate.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="xl" onClick={() => navigate("/auth")} className="w-full sm:w-auto shadow-lg shadow-primary/25">
                Começar Grátis Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="xl" variant="outline" onClick={() => navigate("/auth")} className="w-full sm:w-auto">
                Ver Demonstração
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            animate="whileInView"
          >
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-4 md:p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
                  <stat.icon className="w-5 h-5 text-primary mb-2 mx-auto" />
                  <motion.div 
                    className="text-2xl md:text-3xl font-bold text-foreground"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 1 + i * 0.1 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-muted/30 to-background" />
        <div className="container mx-auto relative">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Zap className="w-3 h-3 mr-2" />
              Recursos Avançados
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Ferramentas Profissionais de
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">
                Análise GTO
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Tudo que jogadores profissionais usam para estudar e melhorar, agora acessível para você.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className={cn(
                  "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                  feature.bgGradient
                )} />
                <div className="relative p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 h-full">
                  <motion.div 
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg",
                      feature.gradient
                    )}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="container mx-auto relative">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <Badge className="mb-4 bg-gold/10 text-gold border-gold/20 px-4 py-2">
              <Award className="w-3 h-3 mr-2" />
              Planos e Preços
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Escolha o Plano Ideal
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">
                Para Seu Nível
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Comece grátis e evolua conforme seu jogo melhora. Cancele quando quiser, sem multas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                className={cn(
                  "relative rounded-3xl border p-6 lg:p-8 transition-all duration-500",
                  plan.popular
                    ? "border-primary bg-gradient-to-b from-primary/10 via-primary/5 to-transparent shadow-2xl shadow-primary/20 scale-[1.02] lg:scale-105"
                    : "border-border bg-card hover:border-primary/30"
                )}
                {...scaleIn}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ 
                  y: -10, 
                  transition: { duration: 0.3 }
                }}
              >
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2"
                  >
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-1.5 text-sm font-semibold shadow-lg">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Mais Popular
                    </Badge>
                  </motion.div>
                )}

                <div className="text-center mb-8">
                  <motion.div 
                    className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4",
                      plan.gradient
                    )}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <plan.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <motion.div 
                    className="mt-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                  >
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </motion.div>
                  {plan.yearlyPrice && (
                    <motion.p 
                      className="text-sm text-success mt-2 font-medium"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                    >
                      ou {plan.yearlyPrice}/ano • {plan.yearlySaving}
                    </motion.p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <motion.li 
                      key={j} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + j * 0.05 }}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        plan.variant === "gold" ? "bg-gold/20" : 
                        plan.variant === "default" ? "bg-primary/20" : "bg-success/20"
                      )}>
                        <Check className={cn(
                          "w-3 h-3",
                          plan.variant === "gold" ? "text-gold" : 
                          plan.variant === "default" ? "text-primary" : "text-success"
                        )} />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant={plan.variant}
                    className={cn(
                      "w-full h-12 text-base font-semibold",
                      plan.popular && "shadow-lg shadow-primary/25"
                    )}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.p 
            className="text-center text-muted-foreground mt-12 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            💳 Pagamento seguro via Stripe • Cancele a qualquer momento • Garantia de 7 dias
          </motion.p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div className="container mx-auto relative">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Users className="w-3 h-3 mr-2" />
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              O Que Nossos Jogadores
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">
                Dizem Sobre Nós
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Milhares de jogadores já transformaram seu jogo com o PokerGTO Pro
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div 
                key={i}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className={cn(
                  "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                  `${testimonial.gradient.replace('from-', 'from-').replace('to-', 'to-')}/10`
                )} />
                <div className="relative p-6 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                  {/* Quote Icon */}
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  
                  {/* Stars */}
                  <motion.div 
                    className="flex items-center gap-1 mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    {[...Array(5)].map((_, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + j * 0.05, type: "spring" }}
                      >
                        <Star className="w-4 h-4 fill-gold text-gold" />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Content */}
                  <p className="text-foreground text-sm leading-relaxed flex-grow mb-6">
                    "{testimonial.content}"
                  </p>

                  {/* Stats Badge */}
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r text-white text-xs font-semibold w-fit mb-4",
                    testimonial.gradient
                  )}>
                    <TrendingUp className="w-3 h-3" />
                    {testimonial.stats.value} {testimonial.stats.label}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <motion.div 
                      className={cn(
                        "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm",
                        testimonial.gradient
                      )}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="relative rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/10 to-gold/10 border border-primary/20 p-8 md:p-12 lg:p-20 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-grid opacity-20" />
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-gold flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <motion.h2 
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Pronto para Dominar
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">
                  o Poker?
                </span>
              </motion.h2>
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Junte-se a milhares de jogadores que já estão usando IA para maximizar seu winrate. 
                Comece grátis hoje mesmo.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="xl" onClick={() => navigate("/auth")} className="shadow-2xl shadow-primary/30">
                    Criar Conta Grátis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="xl" variant="outline" onClick={() => navigate("/pricing")}>
                    Ver Planos
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        className="py-12 px-4 border-t border-border bg-muted/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">PokerGTO Pro</span>
            </motion.div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {[
                { href: "/terms", label: "Termos de Uso" },
                { href: "/privacy", label: "Privacidade" },
                { href: "mailto:suporte@pokergto.pro", label: "Contato" }
              ].map((link, i) => (
                <motion.a 
                  key={i}
                  href={link.href} 
                  className="hover:text-foreground transition-colors"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 PokerGTO Pro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </motion.footer>

      {/* Install Banner */}
      <InstallBanner />
    </div>
  );
}
