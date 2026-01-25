import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Monitor, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const BANNER_STORAGE_KEY = "pokergto_install_banner_dismissed";

export function InstallBanner() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if banner was dismissed
    const dismissed = localStorage.getItem(BANNER_STORAGE_KEY);
    if (dismissed) {
      return;
    }

    // Detect mobile
    setIsMobile(/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    // Show banner after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_STORAGE_KEY, "true");
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsVisible(false);
        localStorage.setItem(BANNER_STORAGE_KEY, "true");
      }
      setDeferredPrompt(null);
    } else {
      navigate("/install");
    }
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[420px] z-50"
        >
          <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5">
              <div className="flex gap-4">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="shrink-0"
                >
                  <div className="relative">
                    <Logo variant="icon" size="lg" className="w-14 h-14 rounded-xl shadow-lg" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isMobile ? (
                      <Smartphone className="w-4 h-4 text-primary" />
                    ) : (
                      <Monitor className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs font-medium text-primary">
                      {isMobile ? "App Mobile" : "App Desktop"}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground text-base mb-1">
                    Instale o PokerGTO
                  </h3>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {isMobile 
                      ? "Acesse rápido pela tela inicial e use offline!"
                      : "Tenha acesso rápido direto do seu desktop!"
                    }
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleInstall}
                  className="flex-1 gap-2 shadow-lg shadow-primary/20"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  Instalar Agora
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Depois
                </Button>
              </div>

              {/* Benefits */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Offline
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Rápido
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Grátis
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
