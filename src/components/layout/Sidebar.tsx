import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Grid3X3, 
  Calculator, 
  TrendingUp, 
  PlayCircle, 
  BarChart3,
  Crosshair,
  Target,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  CreditCard,
  Crown,
  FileText,
  Settings,
  AlertTriangle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CancelConfirmationModal } from "@/components/subscription/CancelConfirmationModal";

const navigation = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ranges 8-Max", href: "/ranges", icon: Grid3X3 },
  { name: "Treinamento", href: "/training", icon: Target },
  { name: "Calculadora Equity", href: "/equity", icon: Calculator },
  { name: "Calculadora EV", href: "/ev-calculator", icon: TrendingUp },
  { name: "Análise de Mãos", href: "/hand-analysis/import", icon: PlayCircle },
  { name: "Estatísticas", href: "/statistics", icon: BarChart3 },
  { name: "Assistente de Bet", href: "/betting-assistant", icon: Crosshair },
  { name: "Planos", href: "/pricing", icon: CreditCard },
];

const legalLinks = [
  { name: "Termos de Uso", href: "/terms", icon: FileText },
  { name: "Privacidade", href: "/privacy", icon: Shield },
];

interface SidebarProps {
  onNavigate?: () => void;
  isMobile?: boolean;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ onNavigate, isMobile = false, collapsed: controlledCollapsed, onCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isManageLoading, setIsManageLoading] = useState(false);
  const { user, profile, subscription, isAdmin, signOut } = useAuth();
  
  // Use controlled state if provided, otherwise use internal state
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = (value: boolean) => {
    if (onCollapse) {
      onCollapse(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onNavigate?.();
    navigate("/auth");
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  // Check if user has Stripe customer link
  const hasStripeCustomer = subscription?.stripe_customer_id != null;

  const handleManageSubscription = async () => {
    if (!subscription || subscription.plan === "free") {
      onNavigate?.();
      navigate("/pricing");
      return;
    }

    // If no Stripe customer, redirect to pricing to link properly
    if (!hasStripeCustomer) {
      toast.info("Para gerenciar sua assinatura, vincule ao Stripe", {
        description: "Acesse a página de planos para sincronizar."
      });
      onNavigate?.();
      navigate("/pricing");
      return;
    }

    // If subscription is active (not canceled), show cancel confirmation modal
    if (subscription.status === "active") {
      setShowCancelModal(true);
      return;
    }

    // If already canceled, go directly to portal to reactivate
    setIsManageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      
      if (data?.code === "NO_STRIPE_CUSTOMER") {
        toast.error("Nenhum registro encontrado no Stripe");
        onNavigate?.();
        navigate("/pricing");
        return;
      }
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setIsManageLoading(false);
    }
  };

  const getPlanBadge = () => {
    if (!subscription) return null;
    switch (subscription.plan) {
      case "premium":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] px-1.5">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        );
      case "pro":
        return <Badge className="bg-primary text-[10px] px-1.5">Pro</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5">Free</Badge>;
    }
  };

  // In mobile mode (inside Sheet), don't use fixed positioning
  // On desktop, use fixed positioning
  const sidebarClasses = cn(
    "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
    !isMobile && "fixed left-0 top-0 z-40",
    isMobile ? "w-full" : (collapsed ? "w-16" : "w-64")
  );

  return (
    <aside className={sidebarClasses}>
      <div className="flex h-full flex-col">
        {/* Logo - Only show on desktop */}
        {!isMobile && (
          <div className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center" : "gap-3"
          )}>
            {collapsed ? (
              <Logo variant="icon" size="md" className="rounded-lg" />
            ) : (
              <Logo variant="full" size="lg" />
            )}
          </div>
        )}

        {/* User Info */}
        {user && (isMobile || !collapsed) && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {profile?.full_name || "Usuário"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getPlanBadge()}
                  {subscription?.status === "canceled" && (
                    <Badge variant="outline" className="text-[9px] px-1 text-amber-500 border-amber-500/30">
                      Cancelado
                    </Badge>
                  )}
                  {subscription && subscription.plan !== "free" && !hasStripeCustomer && (
                    <Badge variant="outline" className="text-[9px] px-1 text-blue-500 border-blue-500/30">
                      Cortesia
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Billing Info */}
            {subscription && subscription.plan !== "free" && subscription.current_period_end && (
              <div className="mt-2 px-2">
                {subscription.status === "canceled" ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>
                      Expira em {Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Próx. cobrança: {new Date(subscription.current_period_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </p>
                )}
              </div>
            )}
            
            {/* Manage Subscription Button */}
            {subscription && subscription.plan !== "free" && (
              <button
                onClick={handleManageSubscription}
                disabled={isManageLoading}
                className={cn(
                  "w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  subscription.status === "canceled" 
                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                {subscription.status === "canceled" ? (
                  <>
                    <Zap className="h-3 w-3" />
                    Reativar Plano
                  </>
                ) : (
                  <>
                    <Settings className="h-3 w-3" />
                    Gerenciar Plano
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  !isMobile && collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {(isMobile || !collapsed) && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mt-4 border-t border-sidebar-border pt-4",
                location.pathname === "/admin"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                !isMobile && collapsed && "justify-center px-2"
              )}
            >
              <Shield className={cn("h-5 w-5 shrink-0", location.pathname === "/admin" && "text-primary")} />
              {(isMobile || !collapsed) && <span>Admin</span>}
            </Link>
          )}
        </nav>

        {/* Collapse button - Only on desktop */}
        {!isMobile && (
          <div className="border-t border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn("w-full", collapsed ? "px-2" : "justify-start")}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Recolher</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Legal Links */}
        <div className="border-t border-sidebar-border p-2">
          {legalLinks.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground",
                !isMobile && collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {(isMobile || !collapsed) && <span>{item.name}</span>}
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive w-full",
              !isMobile && collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5" />
            {(isMobile || !collapsed) && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {subscription && (subscription.plan === "pro" || subscription.plan === "premium") && (
        <CancelConfirmationModal
          open={showCancelModal}
          onOpenChange={setShowCancelModal}
          plan={subscription.plan}
          periodEnd={subscription.current_period_end}
          hasStripeCustomer={hasStripeCustomer}
        />
      )}
    </aside>
  );
}
