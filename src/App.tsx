import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import IntelligencePage from "./pages/IntelligencePage";
import MaturityPage from "./pages/MaturityPage";
import TechStackPage from "./pages/TechStackPage";
import FitTOTVSPage from "./pages/FitTOTVSPage";
import BenchmarkPage from "./pages/BenchmarkPage";
import PlaybooksPage from "./pages/PlaybooksPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import CanvasPage from "./pages/CanvasPage";
import CanvasListPage from "./pages/CanvasListPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Index />} />
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/search"
            element={
              <AppLayout>
                <SearchPage />
              </AppLayout>
            }
          />
          <Route
            path="/tech-stack"
            element={
              <AppLayout>
                <TechStackPage />
              </AppLayout>
            }
          />
          <Route
            path="/intelligence"
            element={
              <AppLayout>
                <IntelligencePage />
              </AppLayout>
            }
          />
          <Route
            path="/maturity"
            element={
              <AppLayout>
                <MaturityPage />
              </AppLayout>
            }
          />
          <Route
            path="/benchmark"
            element={
              <AppLayout>
                <BenchmarkPage />
              </AppLayout>
            }
          />
          <Route
            path="/fit-totvs"
            element={
              <AppLayout>
                <FitTOTVSPage />
              </AppLayout>
            }
          />
          <Route
            path="/playbooks"
            element={
              <AppLayout>
                <PlaybooksPage />
              </AppLayout>
            }
          />
          <Route
            path="/company/:id"
            element={
              <AppLayout>
                <CompanyDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/canvas"
            element={
              <AppLayout>
                <CanvasListPage />
              </AppLayout>
            }
          />
          <Route
            path="/canvas/:id"
            element={
              <AppLayout>
                <CanvasPage />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
