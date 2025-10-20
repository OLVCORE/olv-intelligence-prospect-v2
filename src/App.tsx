import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import IntelligencePage from "./pages/IntelligencePage";
import MaturityPage from "./pages/MaturityPage";
import TechStackPage from "./pages/TechStackPage";
import FitTOTVSPage from "./pages/FitTOTVSPage";
import BenchmarkPage from "./pages/BenchmarkPage";
import PlaybooksPage from "./pages/PlaybooksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tech-stack" element={<TechStackPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/maturity" element={<MaturityPage />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route path="/fit-totvs" element={<FitTOTVSPage />} />
            <Route path="/playbooks" element={<PlaybooksPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
