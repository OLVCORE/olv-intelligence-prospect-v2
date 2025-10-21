import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Eager load only critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load auth pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Lazy load all dashboard pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const Intelligence360Page = lazy(() => import("./pages/Intelligence360Page"));
const CompaniesManagementPage = lazy(() => import("./pages/CompaniesManagementPage"));
const MaturityPage = lazy(() => import("./pages/MaturityPage"));
const TechStackPage = lazy(() => import("./pages/TechStackPage"));
const FitTOTVSPage = lazy(() => import("./pages/FitTOTVSPage"));
const EnhancedBenchmarkPage = lazy(() => import("./pages/EnhancedBenchmarkPage"));
const PlaybooksPage = lazy(() => import("./pages/PlaybooksPage"));
const CompanyDetailPage = lazy(() => import("./pages/CompanyDetailPage"));
const CanvasPage = lazy(() => import("./pages/CanvasPage"));
const CanvasListPage = lazy(() => import("./pages/CanvasListPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const DigitalPresencePage = lazy(() => import("./pages/DigitalPresencePage"));
const Analysis360Page = lazy(() => import("./pages/Analysis360Page"));
const SDRInboxPage = lazy(() => import("./pages/SDRInboxPage"));
const SDRDashboardPage = lazy(() => import("./pages/SDRDashboardPage"));
const SDRPipelinePage = lazy(() => import("./pages/SDRPipelinePage"));
const SDRSequencesPage = lazy(() => import("./pages/SDRSequencesPage"));
const SDRTasksPage = lazy(() => import("./pages/SDRTasksPage"));
const SDRIntegrationsPage = lazy(() => import("./pages/SDRIntegrationsPage"));
const SDRAnalyticsPage = lazy(() => import("./pages/SDRAnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
              path="/companies"
              element={
                <ProtectedRoute>
                  <CompaniesManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/intelligence-360"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Intelligence360Page />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/benchmark"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EnhancedBenchmarkPage />
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
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReportsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/digital-presence"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DigitalPresencePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis-360"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analysis360Page />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/dashboard"
              element={
                <ProtectedRoute>
                  <SDRDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/pipeline"
              element={
                <ProtectedRoute>
                  <SDRPipelinePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/inbox"
              element={
                <ProtectedRoute>
                  <SDRInboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/sequences"
              element={
                <ProtectedRoute>
                  <SDRSequencesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/tasks"
              element={
                <ProtectedRoute>
                  <SDRTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/integrations"
              element={
                <ProtectedRoute>
                  <SDRIntegrationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/analytics"
              element={
                <ProtectedRoute>
                  <SDRAnalyticsPage />
                </ProtectedRoute>
              }
            />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
