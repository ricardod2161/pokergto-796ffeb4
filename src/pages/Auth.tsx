import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Spade, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user } = useAuth();

  // Redirect if already logged in - show loading instead of null
  if (user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message === "Invalid login credentials" 
            ? "Email ou senha incorretos" 
            : error.message);
        } else {
          toast.success("Login realizado com sucesso!");
          const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Conta criada com sucesso!");
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (err) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 glow-primary">
            <Spade className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Poker GTO</h1>
          <p className="text-muted-foreground mt-2">Motor de Estratégia para Jogadores Sérios</p>
        </div>

        {/* Auth Card */}
        <div className="card-glass rounded-2xl p-8 animate-slide-up">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {isLogin ? "Bem-vindo de Volta" : "Criar Conta"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin 
                  ? "Entre para continuar sua sessão" 
                  : "Comece sua jornada para o jogo ótimo"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 bg-input border-border"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-input border-border"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-input border-border pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 bg-input border-border"
                    disabled={isLoading}
                  />
                </div>
              )}

              <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Entrando..." : "Criando conta..."}
                  </>
                ) : (
                  isLogin ? "Entrar" : "Criar Conta"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setFullName("");
                }}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                {isLogin ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos{" "}
          <a href="/terms" className="text-primary hover:underline">Termos de Uso</a>
          {" "}e{" "}
          <a href="/privacy" className="text-primary hover:underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
}
