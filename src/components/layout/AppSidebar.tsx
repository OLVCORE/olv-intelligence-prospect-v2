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
  CheckCircle2,
  Globe,
  Users,
  Database
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// 🎯 ARQUITETURA OTIMIZADA - 4 GRUPOS PRINCIPAIS
// De 24 módulos → 15 itens visíveis
// ============================================

const menuGroups = [
  {
    label: "🎯 Prospecção",
    items: [
      {
        title: "Buscar Empresas",
        icon: Search,
        url: "/search",
        highlighted: true,
        description: "Busque e enriqueça dados de empresas brasileiras com CNPJ, faturamento e tecnologias"
      },
      {
        title: "Base de Empresas",
        icon: Building2,
        url: "/companies",
        description: "Gerencie sua carteira com histórico de enriquecimento e interações"
      },
      {
        title: "SDR Suite",
        icon: MessageSquare,
        url: "/sdr/dashboard",
        special: true,
        description: "Automação completa de prospecção: sequências, inbox multicanal e pipeline",
        submenu: [
          { title: "Dashboard", icon: LayoutDashboard, url: "/sdr/dashboard", description: "Visão geral de performance SDR" },
          { title: "Pipeline", icon: TrendingUp, url: "/sdr/pipeline", description: "Acompanhe leads em cada etapa" },
          { title: "Inbox", icon: MessageSquare, url: "/sdr/inbox", description: "Central unificada de mensagens" },
          { title: "Sequências", icon: Zap, url: "/sdr/sequences", description: "Cadências automatizadas" },
          { title: "Tarefas", icon: CheckCircle2, url: "/sdr/tasks", description: "Gestão de atividades" },
          { title: "Analytics", icon: BarChart3, url: "/sdr/analytics", description: "Métricas de conversão" },
          { title: "Integrações", icon: Zap, url: "/sdr/integrations", description: "Conecte CRM e ferramentas" },
        ],
      },
    ]
  },
  {
    label: "🧠 Inteligência",
    items: [
      {
        title: "Hub 360º",
        icon: Brain,
        url: "/intelligence-360",
        highlighted: true,
        description: "Central de inteligência com IA: maturidade, sinais de compra e análises preditivas",
        submenu: [
          { title: "Visão Geral", icon: Brain, url: "/intelligence-360", description: "Dashboard consolidado de inteligência" },
          { title: "Tech Stack", icon: Server, url: "/tech-stack", description: "Tecnologias: ERP, CRM, e-commerce" },
          { title: "Decisores", icon: Users, url: "/intelligence", description: "Mapeamento de tomadores de decisão" },
          { title: "Maturidade Digital", icon: TrendingUp, url: "/maturity", description: "Score de maturidade digital" },
          { title: "Benchmark", icon: BarChart3, url: "/benchmark", description: "Compare empresas por setor" },
          { title: "Fit TOTVS", icon: Target, url: "/fit-totvs", description: "Aderência aos produtos TOTVS" },
          { title: "Presença Digital", icon: Radio, url: "/analysis-360", description: "Análise de presença online completa" },
          { title: "Mapa Geográfico", icon: Globe, url: "/geographic-analysis", description: "Distribuição territorial" },
        ],
      },
    ]
  },
  {
    label: "📋 Estratégia & Vendas",
    items: [
      {
        title: "Dashboard Executivo",
        icon: LayoutDashboard,
        url: "/dashboard",
        highlighted: true,
        description: "Métricas consolidadas de prospecção, conversão e performance"
      },
      {
        title: "Canvas (War Room)",
        icon: PenTool,
        url: "/canvas",
        description: "Planejamento colaborativo com IA em tempo real"
      },
      {
        title: "Playbooks",
        icon: BookOpen,
        url: "/playbooks",
        description: "Scripts de abordagem personalizados por perfil"
      },
      {
        title: "Biblioteca de Personas",
        icon: Users,
        url: "/personas-library",
        description: "Perfis comportamentais e estratégias de abordagem"
      },
      {
        title: "Metas de Vendas",
        icon: Target,
        url: "/goals",
        description: "Acompanhamento de metas e resultados"
      },
      {
        title: "Relatórios",
        icon: FileText,
        url: "/reports",
        description: "Insights executivos e recomendações de IA"
      },
    ]
  },
  {
    label: "⚙️ Governança & Admin",
    items: [
      {
        title: "Transformação Digital",
        icon: Zap,
        url: "/governance",
        description: "Gaps de governança e oportunidades de consultoria"
      },
      {
        title: "Migração de Dados",
        icon: Database,
        url: "/data-migration",
        description: "Limpeza e preparação de dados"
      },
      {
        title: "Configurações",
        icon: Settings,
        url: "/settings",
        description: "Integrações e preferências do sistema"
      },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { open, isMobile, setOpen } = useSidebar();
  
  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r pt-16"
      onMouseEnter={() => !isMobile && setOpen(true)}
      onMouseLeave={() => !isMobile && setOpen(false)}
    >
      <SidebarHeader className="border-b border-sidebar-border p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:justify-center">
          <Building2 className="h-6 w-6 md:h-8 md:w-8 text-sidebar-primary flex-shrink-0" />
          {(open || isMobile) && (
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-sidebar-foreground truncate">OLV Intelligence</h1>
              <p className="text-xs text-sidebar-foreground/70 truncate">Sistema de Prospecção</p>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <TooltipProvider delayDuration={200}>
          {menuGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.url;
                    const hasSubmenu = (item as any).submenu;
                    
                    if (hasSubmenu) {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Collapsible className="group/collapsible" defaultOpen={location.pathname.startsWith(item.url.split('/')[1])}>
                                  <SidebarMenuButton 
                                    asChild
                                    className={cn(
                                      (item as any).special && "relative overflow-hidden bg-[hsl(var(--accent-gold))]/15 border-l-4 border-[hsl(var(--accent-gold))] shadow-lg shadow-[hsl(var(--accent-gold))]/20 hover:shadow-[hsl(var(--accent-gold))]/40 transition-all duration-300",
                                      (item as any).highlighted && !((item as any).special) && "font-semibold bg-primary/5 border-l-2 border-primary"
                                    )}
                                  >
                                    <CollapsibleTrigger className="w-full">
                                      <div className="flex items-center gap-2 py-1 group-data-[collapsible=icon]:justify-center">
                                        <div className="relative">
                                          <item.icon className={cn(
                                            "h-4 w-4",
                                            (item as any).special && "text-[hsl(var(--accent-gold))]"
                                          )} />
                                          {(item as any).special && (
                                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-[hsl(var(--accent-gold))] rounded-full animate-pulse shadow-lg shadow-[hsl(var(--accent-gold))]/50" />
                                          )}
                                        </div>
                                        {(open || isMobile) && (
                                          <span className={cn(
                                            "font-medium",
                                            (item as any).special && "text-[hsl(var(--accent-gold))]"
                                          )}>
                                            {item.title}
                                          </span>
                                        )}
                                      </div>
                                      {(open || isMobile) && (
                                        <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                      )}
                                    </CollapsibleTrigger>
                                  </SidebarMenuButton>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {(item as any).submenu.map((subItem: any) => (
                                        <SidebarMenuSubItem key={subItem.title}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div>
                                                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                                                  <Link to={subItem.url}>
                                                    <subItem.icon className="h-3.5 w-3.5" />
                                                    <span className="text-xs">{subItem.title}</span>
                                                  </Link>
                                                </SidebarMenuSubButton>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="max-w-[250px]">
                                              <p className="text-xs">{subItem.description}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[280px]">
                              <p className="text-xs">{(item as any).description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuItem>
                      );
                    }
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <SidebarMenuButton 
                                asChild 
                                isActive={isActive}
                                className={cn(
                                  (item as any).highlighted && "font-semibold bg-primary/5 border-l-2 border-primary"
                                )}
                              >
                                <Link to={item.url} className="flex items-center gap-2">
                                  <item.icon className="h-4 w-4" />
                                  {(open || isMobile) && <span className="text-sm">{item.title}</span>}
                                </Link>
                              </SidebarMenuButton>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[280px]">
                            <p className="text-xs">{(item as any).description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </TooltipProvider>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2 md:p-4 group-data-[collapsible=icon]:p-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs md:text-sm text-sidebar-foreground/70 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <User className="h-4 w-4 flex-shrink-0" />
            {(open || isMobile) && <span className="truncate whitespace-nowrap">{user?.email}</span>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {(open || isMobile) && <span className="ml-2 whitespace-nowrap">Sair</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Sair da plataforma</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
