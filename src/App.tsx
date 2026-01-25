import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Ranges from "./pages/Ranges";
import EquityCalculator from "./pages/EquityCalculator";
import EVCalculator from "./pages/EVCalculator";
import Statistics from "./pages/Statistics";
import HandAnalysis from "./pages/HandAnalysis";
import BettingAssistant from "./pages/BettingAssistant";
import Training from "./pages/Training";
import Admin from "./pages/Admin";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ranges" element={<Ranges />} />
              <Route path="/equity" element={<EquityCalculator />} />
              <Route path="/ev-calculator" element={<EVCalculator />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/hand-analysis/import" element={<HandAnalysis />} />
              <Route path="/betting-assistant" element={<BettingAssistant />} />
              <Route path="/training" element={<Training />} />
              <Route path="/pricing" element={<Pricing />} />
            </Route>
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
