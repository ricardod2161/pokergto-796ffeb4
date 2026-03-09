import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePlan?: ("free" | "pro" | "premium")[];
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requirePlan 
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, subscription } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requirePlan) {
    const userPlan = subscription?.plan;
    if (!userPlan || !requirePlan.includes(userPlan)) {
      return <Navigate to="/pricing" replace />;
    }
  }

  return <>{children}</>;
}
