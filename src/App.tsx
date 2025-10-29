import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Eager load only critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

// Lazy load auth pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PWAInstallPage = lazy(() => import("./pages/PWAInstallPage"));

// Lazy load all dashboard pages for code splitting
// Dashboard eagerly loaded via direct import above
const SearchPage = lazy(() => import("./pages/SearchPage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const Intelligence360Page = lazy(() => import("./pages/Intelligence360Page"));
const CompaniesManagementPage = lazy(() => import("./pages/CompaniesManagementPage"));
const MaturityPage = lazy(() => import("./pages/MaturityPage"));
const TechStackPage = lazy(() => import("./pages/TechStackPage"));
const FitTOTVSPage = lazy(() => import("./pages/FitTOTVSPage"));
const GovernancePage = lazy(() => import("./pages/GovernancePage"));
const AccountStrategyPage = lazy(() => import("./pages/AccountStrategyPage"));
const StrategyHistoryPage = lazy(() => import("./pages/StrategyHistoryPage"));
const CompetitiveIntelligencePage = lazy(() => import("./pages/CompetitiveIntelligencePage"));
const CompanyDiscoveryPage = lazy(() => import("./pages/CompanyDiscoveryPage"));
// Central ICP Pages
const CentralICPHome = lazy(() => import("./pages/CentralICP/Home"));
const IndividualAnalysis = lazy(() => import("./pages/CentralICP/IndividualAnalysis"));
const BatchAnalysis = lazy(() => import("./pages/CentralICP/BatchAnalysis"));
const ResultsDashboard = lazy(() => import("./pages/CentralICP/ResultsDashboard"));
const AuditCompliance = lazy(() => import("./pages/CentralICP/AuditCompliance"));
const SalesIntelligenceFeed = lazy(() => import("./pages/SalesIntelligence/Feed"));
const MonitoringConfig = lazy(() => import("./pages/SalesIntelligence/MonitoringConfig"));
const MonitoredCompanies = lazy(() => import("./pages/SalesIntelligence/MonitoredCompanies"));
const PersonasLibraryPage = lazy(() => import("./pages/PersonasLibraryPage"));
const DataMigrationPage = lazy(() => import("./pages/DataMigrationPage"));
const EnhancedBenchmarkPage = lazy(() => import("./pages/EnhancedBenchmarkPage"));
const PlaybooksPage = lazy(() => import("./pages/PlaybooksPage"));
const CompanyDetailPage = lazy(() => import("./pages/CompanyDetailPage"));
const CanvasPage = lazy(() => import("./pages/CanvasPage"));
const ConsultoriaOLVPage = lazy(() => import("./pages/ConsultoriaOLVPage"));
const CanvasListPage = lazy(() => import("./pages/CanvasListPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const DigitalPresencePage = lazy(() => import("./pages/DigitalPresencePage"));
const Analysis360Page = lazy(() => import("./pages/Analysis360Page"));
const SDRWorkspacePage = lazy(() => import("./pages/SDRWorkspacePage"));
const SDRInboxPage = lazy(() => import("./pages/SDRInboxPage"));
const SDRDashboardPage = lazy(() => import("./pages/SDRDashboardPage"));
const SDRSequencesPage = lazy(() => import("./pages/SDRSequencesPage"));
const SDRTasksPage = lazy(() => import("./pages/SDRTasksPage"));
const SDRIntegrationsPage = lazy(() => import("./pages/SDRIntegrationsPage"));
const SDRBitrixConfigPage = lazy(() => import("./pages/SDRBitrixConfigPage"));
const SDRWhatsAppConfigPage = lazy(() => import("./pages/SDRWhatsAppConfigPage"));
const SDRAnalyticsPage = lazy(() => import("./pages/SDRAnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const EmailSettingsPage = lazy(() => import("./pages/EmailSettingsPage"));
const GeographicAnalysisPage = lazy(() => import("./pages/GeographicAnalysisPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const RegionalExpansionPage = lazy(() => import("./pages/insights/RegionalExpansionPage"));
const ChurnAlertPage = lazy(() => import("./pages/insights/ChurnAlertPage"));
const CloudMigrationPage = lazy(() => import("./pages/insights/CloudMigrationPage"));
const LeadsCapture = lazy(() => import("./pages/Leads/Capture"));
const LeadsQuarantine = lazy(() => import("./pages/Leads/Quarantine"));
const ICPAnalysis = lazy(() => import("./pages/Leads/ICPAnalysis"));
const Pipeline = lazy(() => import("./pages/Leads/Pipeline"));
const Analytics = lazy(() => import("./pages/Leads/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Error500 = lazy(() => import("./pages/Error500"));
const OfflinePage = lazy(() => import("./pages/OfflinePage"));

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
            <Route path="/install" element={<PWAInstallPage />} />
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
              path="/governance"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GovernancePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/account-strategy/:companyId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AccountStrategyPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/personas-library"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PersonasLibraryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-migration"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DataMigrationPage />
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
              path="/geographic-analysis"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GeographicAnalysisPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/workspace"
              element={
                <ProtectedRoute>
                  <SDRWorkspacePage />
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
              path="/sdr/integrations/bitrix24"
              element={
                <ProtectedRoute>
                  <SDRBitrixConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/integrations/whatsapp"
              element={
                <ProtectedRoute>
                  <SDRWhatsAppConfigPage />
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
            <Route
              path="/sdr/pipeline"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Pipeline />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <SDRInboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-settings"
              element={
                <ProtectedRoute>
                  <EmailSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GoalsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Rota /activities removida - atividades agora são contextuais */}
            {/* Central ICP Routes */}
            <Route
              path="/central-icp"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CentralICPHome />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/central-icp/individual"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <IndividualAnalysis />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/central-icp/batch"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BatchAnalysis />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/central-icp/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ResultsDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/central-icp/audit"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AuditCompliance />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-intelligence/feed"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SalesIntelligenceFeed />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-intelligence/config"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MonitoringConfig />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales-intelligence/companies"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MonitoredCompanies />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Keep existing Competitive Intelligence routes */}
            <Route
              path="/competitive-intelligence"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CompetitiveIntelligencePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-discovery"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CompanyDiscoveryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/account-strategy"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AccountStrategyPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/account-strategy/history"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <StrategyHistoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultoria-olv"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ConsultoriaOLVPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights/regional-expansion"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RegionalExpansionPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights/churn-alert"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ChurnAlertPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights/cloud-migration"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CloudMigrationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/capture"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeadsCapture />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/quarantine"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeadsQuarantine />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/icp-analysis"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ICPAnalysis />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/pipeline"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Pipeline />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/error-500" element={<Error500 />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
