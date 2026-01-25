import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, Loader2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading until layout is determined
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar">
              <Sidebar onNavigate={() => setSidebarOpen(false)} isMobile />
            </SheetContent>
          </Sheet>
          <Logo variant="full" size="md" />
        </header>

        {/* Main Content with top padding for header */}
        <main className="pt-14 min-h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapse={setSidebarCollapsed} 
      />
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarCollapsed ? "pl-16" : "pl-64"
      )}>
        <Outlet />
      </main>
    </div>
  );
}