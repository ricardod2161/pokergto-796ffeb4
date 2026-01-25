import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Check, 
  Apple, 
  Chrome,
  Zap,
  Wifi,
  Maximize2,
  Rocket,
  ArrowRight,
  Share2,
  Plus,
  MoreVertical,
  MousePointer,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const benefits = [
  {
    icon: Zap,
    title: "Acesso Instantâneo",
    description: "Abra direto da tela inicial"
  },
  {
    icon: Wifi,
    title: "Funciona Offline",
    description: "Sem necessidade de internet"
  },
  {
    icon: Maximize2,
    title: "Tela Cheia",
    description: "Experiência imersiva"
  },
  {
    icon: Rocket,
    title: "Super Rápido",
    description: "Carregamento otimizado"
  }
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Detectar navegador
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Edg")) return { name: "Edge", icon: "edge" };
  if (userAgent.includes("Chrome")) return { name: "Chrome", icon: "chrome" };
  if (userAgent.includes("Firefox")) return { name: "Firefox", icon: "firefox" };
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return { name: "Safari", icon: "safari" };
  return { name: "Navegador", icon: "browser" };
};

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ name: "Chrome", icon: "chrome" });

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobileDevice = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    setIsIOS(isIOSDevice);
    setIsMobile(isMobileDevice);
    setBrowserInfo(getBrowserInfo());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        animate={{ 
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, -30, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <Logo variant="icon" size="xl" className="mx-auto w-24 h-24 rounded-2xl shadow-2xl shadow-primary/30" />
          </motion.div>
          
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary">
            <Smartphone className="w-3.5 h-3.5 mr-1.5" />
            Aplicativo Móvel
          </Badge>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Instale o <span className="text-primary">PokerGTO</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Tenha acesso ao melhor assistente de poker diretamente no seu dispositivo
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-lg"
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-6 space-y-6">
              {isInstalled ? (
                <motion.div 
                  className="text-center space-y-4 py-4"
                  {...fadeInUp}
                >
                  <motion.div 
                    className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    <Check className="w-10 h-10 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">App Instalado!</h3>
                    <p className="text-muted-foreground mt-1">
                      O PokerGTO está pronto para uso
                    </p>
                  </div>
                  <Button asChild size="lg" className="w-full gap-2">
                    <Link to="/dashboard">
                      Abrir Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </motion.div>
              ) : isIOS ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                      <Apple className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">iPhone / iPad</p>
                      <p className="text-sm text-muted-foreground">Siga os passos abaixo</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { icon: Share2, text: 'Toque no botão "Compartilhar"', highlight: "ícone de seta para cima" },
                      { icon: Plus, text: 'Toque em "Adicionar à Tela de Início"', highlight: "role para baixo" },
                      { icon: Check, text: 'Toque em "Adicionar"', highlight: "canto superior direito" }
                    ].map((step, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border/30"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground font-medium">{step.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.highlight}</p>
                        </div>
                        <step.icon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : deferredPrompt ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      {isMobile ? <Smartphone className="w-6 h-6 text-primary" /> : <Monitor className="w-6 h-6 text-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{isMobile ? "Android" : "Desktop"}</p>
                      <p className="text-sm text-muted-foreground">Instalação com um clique</p>
                    </div>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleInstall} 
                      size="lg" 
                      className="w-full gap-3 h-14 text-lg shadow-lg shadow-primary/20"
                    >
                      <Download className="w-5 h-5" />
                      Instalar Agora
                    </Button>
                  </motion.div>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Clique no botão acima e confirme a instalação
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Header Desktop */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Instalação no {browserInfo.name}</p>
                      <p className="text-sm text-muted-foreground">Siga os passos simples abaixo</p>
                    </div>
                  </div>

                  {/* Passos para Desktop */}
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">
                          Olhe na barra de endereço do navegador
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Procure o ícone <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-foreground"><Download className="w-3 h-3" /></span> ou <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-foreground"><Plus className="w-3 h-3" /></span> no lado direito
                        </p>
                      </div>
                      <MousePointer className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    </motion.div>

                    <motion.div 
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">
                          Clique em "Instalar" ou "Adicionar"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Um popup vai aparecer pedindo confirmação
                        </p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    </motion.div>

                    <motion.div 
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">
                          Confirme a instalação
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          O app será adicionado ao seu desktop/menu
                        </p>
                      </div>
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    </motion.div>
                  </div>

                  {/* Alternativa via menu */}
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Alternativa: Menu do Navegador</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Clique nos <span className="text-foreground font-medium">3 pontos ⋮</span> no canto superior direito → 
                      <span className="text-foreground font-medium"> "Instalar Poker GTO"</span> ou 
                      <span className="text-foreground font-medium"> "Salvar e compartilhar" → "Instalar como app"</span>
                    </p>
                  </div>

                  {/* Dica visual */}
                  <motion.div 
                    className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <p className="text-xs text-primary font-medium flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Procure este ícone na barra de endereço ↑
                    </p>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div 
          className="w-full max-w-lg mt-8"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">
            Benefícios do app instalado
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                className="p-4 rounded-xl bg-card/50 backdrop-blur border border-border/30 text-center hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                whileHover={{ y: -2 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{benefit.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back Link */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              ← Voltar para Home
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Install;
