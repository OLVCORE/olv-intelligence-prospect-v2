import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SearchPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tech-stack"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TechStackPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/intelligence"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <IntelligencePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/maturity"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MaturityPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/benchmark"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BenchmarkPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fit-totvs"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FitTOTVSPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/playbooks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlaybooksPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CompanyDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/canvas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CanvasListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/canvas/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CanvasPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
