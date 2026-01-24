import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ranges" element={<Ranges />} />
            <Route path="/equity" element={<EquityCalculator />} />
            <Route path="/ev-calculator" element={<EVCalculator />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/hand-analysis/import" element={<HandAnalysis />} />
            <Route path="/betting-assistant" element={<BettingAssistant />} />
            <Route path="/training" element={<Training />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
