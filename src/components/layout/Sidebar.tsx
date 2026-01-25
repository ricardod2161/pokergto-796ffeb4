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
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user, profile, subscription, isAdmin, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
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

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">♠</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Poker GTO</span>
              <span className="text-xs text-muted-foreground">Motor de Estratégia</span>
            </div>
          )}
        </div>

        {/* User Info */}
        {user && !collapsed && (
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
                </div>
              </div>
            </div>
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mt-4 border-t border-sidebar-border pt-4",
                location.pathname === "/admin"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Shield className={cn("h-5 w-5 shrink-0", location.pathname === "/admin" && "text-primary")} />
              {!collapsed && <span>Admin</span>}
            </Link>
          )}
        </nav>

        {/* Collapse button */}
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

        {/* Logout */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive w-full",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
