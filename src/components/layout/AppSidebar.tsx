import { 
  LayoutDashboard, 
  Search, 
  Brain, 
  Target, 
  Server,
  TrendingUp,
  BookOpen,
  BarChart3,
  Building2,
  PenTool,
  LogOut,
  Settings,
  User,
  FileText,
  Radio,
  MessageSquare,
  ChevronRight,
  Zap,
  CheckCircle2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Buscar Empresas",
    icon: Search,
    url: "/search",
    highlighted: true,
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
    highlighted: true,
  },
  {
    title: "SDR (OLV)",
    icon: MessageSquare,
    url: "/sdr/dashboard",
    highlighted: true,
    special: true,
    submenu: [
      { title: "Dashboard", icon: LayoutDashboard, url: "/sdr/dashboard" },
      { title: "Pipeline", icon: TrendingUp, url: "/sdr/pipeline" },
      { title: "Inbox", icon: MessageSquare, url: "/sdr/inbox" },
      { title: "Sequências", icon: Zap, url: "/sdr/sequences" },
      { title: "Tarefas", icon: CheckCircle2, url: "/sdr/tasks" },
      { title: "Analytics", icon: BarChart3, url: "/sdr/analytics" },
      { title: "Integrações", icon: Zap, url: "/sdr/integrations" },
    ],
  },
  {
    title: "Empresas",
    icon: Building2,
    url: "/companies",
  },
  {
    title: "Inteligência 360º",
    icon: Brain,
    url: "/intelligence-360",
  },
  {
    title: "Tech Stack",
    icon: Server,
    url: "/tech-stack",
  },
  {
    title: "Decisores",
    icon: Brain,
    url: "/intelligence",
  },
  {
    title: "Maturidade",
    icon: Target,
    url: "/maturity",
  },
  {
    title: "Benchmark",
    icon: BarChart3,
    url: "/benchmark",
  },
  {
    title: "Fit TOTVS",
    icon: TrendingUp,
    url: "/fit-totvs",
  },
  {
    title: "Playbooks",
    icon: BookOpen,
    url: "/playbooks",
  },
  {
    title: "Relatórios",
    icon: FileText,
    url: "/reports",
  },
  {
    title: "Presença Digital",
    icon: Radio,
    url: "/digital-presence",
  },
  {
    title: "Análise 360°",
    icon: Target,
    url: "/analysis-360",
  },
  {
    title: "Canvas",
    icon: PenTool,
    url: "/canvas",
  },
  {
    title: "Configurações",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Building2 className="h-8 w-8 text-sidebar-primary" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">OLV Intelligence</h1>
            <p className="text-xs text-sidebar-foreground/70">Sistema de Prospecção</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos Inteligentes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                const hasSubmenu = (item as any).submenu;
                
                if (hasSubmenu) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Collapsible className="group/collapsible">
                        <SidebarMenuButton asChild>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center gap-2 py-1">
                              <div className="relative">
                                <item.icon className="h-5 w-5" />
                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                              </div>
                              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {item.title}
                              </span>
                            </div>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </CollapsibleTrigger>
                        </SidebarMenuButton>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {(item as any).submenu.map((subItem: any) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                                  <Link to={subItem.url}>
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        (item as any).highlighted && "font-semibold bg-primary/5 border-l-2 border-primary",
                        (item as any).special && "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-l-2 border-purple-500 font-bold"
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/70">
            <User className="h-4 w-4" />
            <span className="truncate">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
