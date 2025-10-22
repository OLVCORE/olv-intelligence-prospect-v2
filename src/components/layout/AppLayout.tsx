import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { FloatingInsightsButton } from "@/components/insights/FloatingInsightsButton";
import { InsightsDock } from "@/components/insights/InsightsDock";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        {/* Top Bar - Fixo no topo */}
        <header className="fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-3 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger />
            <h2 className="font-semibold text-sm md:text-lg hidden sm:block">OLV Intelligence Prospect</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-2xl mx-2 md:mx-4">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <NotificationBell />
            <ModeToggle />
          </div>
        </header>

        {/* Sidebar - Começa após o header */}
        <AppSidebar />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col pt-16 transition-all duration-300 ${insightsOpen ? 'mr-[600px] md:mr-[700px] lg:mr-[800px]' : ''}`}>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>

        <FloatingInsightsButton onClick={() => setInsightsOpen(true)} />
        <InsightsDock open={insightsOpen} onOpenChange={setInsightsOpen} />
      </div>
    </SidebarProvider>
  );
}
