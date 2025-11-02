import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import TOTVSCheckReport from "@/pages/Leads/TOTVSCheckReport";
import { Loader2 } from "lucide-react";
import { TrevoAssistant } from "./components/trevo/TrevoAssistant";

// Eager load only critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";

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
const DocumentationPage = lazy(() => import("./pages/DocumentationPage"));
const CanvasPage = lazy(() => import("./pages/CanvasPage"));
const ConsultoriaOLVPage = lazy(() => import("./pages/ConsultoriaOLVPage"));
const CanvasListPage = lazy(() => import("./pages/CanvasListPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const DigitalPresencePage = lazy(() => import("./pages/DigitalPresencePage"));
const Analysis360Page = lazy(() => import("./pages/Analysis360Page"));
const SDRWorkspacePage = lazy(() => import("./pages/SDRWorkspacePage"));
const SDRInboxPage = lazy(() => import("./pages/SDRInboxPage"));
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
const LeadsPoolPage = lazy(() => import("./pages/LeadsPoolPage"));
const LeadsQualifiedPage = lazy(() => import("./pages/LeadsQualifiedPage"));
const ICPQuarantinePage = lazy(() => import("./pages/Leads/ICPQuarantine"));
const DiscardedCompaniesPage = lazy(() => import("./pages/Leads/DiscardedCompanies"));
const STCHistoryPage = lazy(() => import("./pages/Leads/STCHistory"));
const SystemHealthPage = lazy(() => import("./pages/Leads/SystemHealth"));
const EmailSequencesPage = lazy(() => import("./pages/EmailSequencesPage"));
const SmartTasksPage = lazy(() => import("./pages/SmartTasksPage"));
const CSVUploadWithMapping = lazy(() => import("./components/leads/CSVUploadWithMapping"));
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

// Wrapper component que tem acesso ao location
function TrevoAssistantWrapper() {
  const location = useLocation();
  
  // Não mostrar em páginas de auth
  if (location.pathname === '/login' || 
      location.pathname === '/forgot-password' || 
      location.pathname === '/reset-password' ||
      location.pathname === '/') {
    return null;
  }
  
  return (
    <TrevoAssistant 
      context={{
        currentPage: location.pathname
      }}
    />
  );
}

// Componente de fallback quando há erro
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Algo deu errado
        </h1>
        
        <p className="text-gray-600 mb-6">
          Nosso time foi notificado automaticamente e já está trabalhando na correção.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-xs font-mono text-gray-700 break-all">
            {error.message}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={resetError}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Tentar Novamente
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}

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
            <Route path="/onboarding" element={<Onboarding />} />
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
            <Route path="/sdr" element={<Navigate to="/sdr/workspace" replace />} />
            <Route path="/sdr/dashboard" element={<Navigate to="/sdr/workspace" replace />} />
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
                  <SmartTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sdr/sequences"
              element={
                <ProtectedRoute>
                  <EmailSequencesPage />
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
              path="/central-icp/batch-analysis"
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
              path="/central-icp/discovery"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CompanyDiscoveryPage />
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
            <Route path="/leads" element={<Navigate to="/leads/capture" replace />} />
            <Route
              path="/leads/import"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CSVUploadWithMapping />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/pool"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeadsPoolPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/qualified"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeadsQualifiedPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/icp-quarantine"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ICPQuarantinePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/icp-quarantine/report"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TOTVSCheckReport />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/icp-quarantine/report/:companyId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TOTVSCheckReport />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/discarded"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DiscardedCompaniesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/stc-history"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <STCHistoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/system-health"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SystemHealthPage />
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
            <Route
              path="/documentation"
              element={
                <ProtectedRoute>
                  <DocumentationPage />
                </ProtectedRoute>
              }
            />
            <Route path="/error-500" element={<Error500 />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* TREVO Assistant - disponível em todas as páginas protegidas */}
            <TrevoAssistantWrapper />
          </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
