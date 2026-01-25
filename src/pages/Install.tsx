import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Check, Apple, Chrome } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Instalar Poker GTO</CardTitle>
          <CardDescription>
            Instale o app no seu dispositivo para acesso rápido e experiência offline
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="text-muted-foreground">
                O app já está instalado no seu dispositivo!
              </p>
              <Button asChild className="w-full">
                <Link to="/dashboard">Abrir Dashboard</Link>
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Apple className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">iPhone/iPad</p>
                  <p className="text-sm text-muted-foreground">Siga os passos abaixo</p>
                </div>
              </div>
              
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span>Toque no botão <strong>Compartilhar</strong> (ícone de seta para cima)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Chrome className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Android/Desktop</p>
                  <p className="text-sm text-muted-foreground">Clique para instalar</p>
                </div>
              </div>
              
              <Button onClick={handleInstall} className="w-full gap-2" size="lg">
                <Download className="w-5 h-5" />
                Instalar Agora
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Monitor className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Instalação Manual</p>
                  <p className="text-sm text-muted-foreground">Use o menu do navegador</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Procure por <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong> no menu do seu navegador (⋮ ou ⋯).
              </p>
            </div>
          )}
          
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium mb-3">Benefícios do app instalado:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Acesso rápido pela tela inicial
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Funciona offline
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Experiência em tela cheia
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                Carregamento mais rápido
              </li>
            </ul>
          </div>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/">Voltar para Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
