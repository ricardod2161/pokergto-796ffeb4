import { Link, useLocation } from "react-router-dom";
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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ranges 8-Max", href: "/ranges", icon: Grid3X3 },
  { name: "Treinamento", href: "/training", icon: Target },
  { name: "Calculadora Equity", href: "/equity", icon: Calculator },
  { name: "Calculadora EV", href: "/ev-calculator", icon: TrendingUp },
  { name: "Análise de Mãos", href: "/hand-analysis/import", icon: PlayCircle },
  { name: "Estatísticas", href: "/statistics", icon: BarChart3 },
  { name: "Assistente de Bet", href: "/betting-assistant", icon: Crosshair },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
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
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </Button>
        </div>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-2">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sair</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}
