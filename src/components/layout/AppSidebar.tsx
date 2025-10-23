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
  Globe
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

const menuItems = [
  {
    title: "Buscar Empresas",
    icon: Search,
    url: "/search",
    highlighted: true,
    description: "Busque e enriqueça dados de empresas brasileiras com informações completas de CNPJ, faturamento e tecnologias"
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
    highlighted: true,
    description: "Visão executiva consolidada com métricas de prospecção, conversão e performance de vendas"
  },
  {
    title: "SDR (OLV)",
    icon: MessageSquare,
    url: "/sdr/dashboard",
    highlighted: true,
    special: true,
    description: "Suite completa de SDR com automação de sequências, inbox multicanal e gestão de pipeline de prospecção",
    submenu: [
      { title: "Dashboard", icon: LayoutDashboard, url: "/sdr/dashboard", description: "Visão geral das atividades de SDR" },
      { title: "Pipeline", icon: TrendingUp, url: "/sdr/pipeline", description: "Acompanhe leads em cada etapa do funil" },
      { title: "Inbox", icon: MessageSquare, url: "/sdr/inbox", description: "Central de mensagens unificada multi-canal" },
      { title: "Sequências", icon: Zap, url: "/sdr/sequences", description: "Automação de cadências e follow-ups" },
      { title: "Tarefas", icon: CheckCircle2, url: "/sdr/tasks", description: "Gestão de tarefas e atividades diárias" },
      { title: "Analytics", icon: BarChart3, url: "/sdr/analytics", description: "Análise de performance e conversão" },
      { title: "Integrações", icon: Zap, url: "/sdr/integrations", description: "Conecte com CRM, e-mail e outras ferramentas" },
    ],
  },
  {
    title: "Empresas",
    icon: Building2,
    url: "/companies",
    description: "Gerencie sua base de empresas cadastradas com histórico completo de enriquecimento e interações"
  },
  {
    title: "Inteligência 360º",
    icon: Brain,
    url: "/intelligence-360",
    description: "Análise profunda e automatizada de empresas com IA: maturidade digital, sinais de compra e tecnologias"
  },
  {
    title: "Tech Stack",
    icon: Server,
    url: "/tech-stack",
    description: "Identifique as tecnologias usadas pelas empresas: ERP, CRM, e-commerce e infraestrutura"
  },
  {
    title: "Decisores",
    icon: Brain,
    url: "/intelligence",
    description: "Encontre e mapeie tomadores de decisão com dados de LinkedIn, e-mails e telefones validados"
  },
  {
    title: "Maturidade",
    icon: Target,
    url: "/maturity",
    description: "Score de maturidade digital baseado em presença online, tecnologias e engajamento digital"
  },
  {
    title: "Benchmark",
    icon: BarChart3,
    url: "/benchmark",
    description: "Compare empresas por setor, porte e maturidade digital para identificar melhores oportunidades"
  },
  {
    title: "Fit TOTVS",
    icon: TrendingUp,
    url: "/fit-totvs",
    description: "Score de aderência TOTVS com base em perfil da empresa, tecnologias atuais e potencial de upsell"
  },
  {
    title: "Playbooks",
    icon: BookOpen,
    url: "/playbooks",
    description: "Scripts e estratégias de abordagem personalizadas por perfil de empresa e estágio do funil"
  },
  {
    title: "Relatórios",
    icon: FileText,
    url: "/reports",
    description: "Relatórios executivos e operacionais com insights acionáveis e recomendações de IA"
  },
  {
    title: "Presença Digital",
    icon: Radio,
    url: "/digital-presence",
    description: "Análise de presença online: site, redes sociais, SEO e reputação digital da empresa"
  },
  {
    title: "Análise 360°",
    icon: Target,
    url: "/analysis-360",
    description: "Visão completa e consolidada de todos os dados e inteligências disponíveis sobre uma empresa"
  },
  {
    title: "Distribuição Geográfica",
    icon: Globe,
    url: "/geographic-analysis",
    description: "Mapa interativo e análises de distribuição territorial das empresas com geocodificação automática"
  },
  {
    title: "Canvas",
    icon: PenTool,
    url: "/canvas",
    description: "War Room colaborativo com IA para planejar estratégias de venda e documentar decisões em tempo real"
  },
  {
    title: "Configurações",
    icon: Settings,
    url: "/settings",
    description: "Configure integrações, preferências e permissões do sistema"
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
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Módulos Inteligentes</SidebarGroupLabel>
          <SidebarGroupContent>
            <TooltipProvider delayDuration={200}>
              <SidebarMenu>
                {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                const hasSubmenu = (item as any).submenu;
                
                if (hasSubmenu) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Collapsible className="group/collapsible">
                              <SidebarMenuButton 
                                asChild
                                className={cn(
                                  (item as any).special && "relative overflow-hidden bg-gradient-to-r from-purple-600/15 via-pink-600/15 to-indigo-600/15 border-l-4 border-purple-600 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
                                )}
                              >
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center gap-2 py-1 group-data-[collapsible=icon]:justify-center">
                                    <div className="relative">
                                      <item.icon className={cn(
                                        "h-5 w-5",
                                        (item as any).special && "text-purple-600 dark:text-purple-400"
                                      )} />
                                      {(item as any).special && (
                                        <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
                                      )}
                                    </div>
                                    {(open || isMobile) && (
                                      <span className={cn(
                                        "font-semibold",
                                        (item as any).special && "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400"
                                      )}>
                                        {item.title}
                                      </span>
                                    )}
                                  </div>
                                  {(open || isMobile) && (
                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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
                                                <subItem.icon className="h-4 w-4" />
                                                <span>{subItem.title}</span>
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
                              (item as any).highlighted && !((item as any).special) && "font-semibold bg-primary/5 border-l-2 border-primary"
                            )}
                          >
                            <Link to={item.url} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              {(open || isMobile) && <span>{item.title}</span>}
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
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
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
