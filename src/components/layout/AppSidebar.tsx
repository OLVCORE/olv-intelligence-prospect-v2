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
  Database,
  Crosshair,
  Sparkles,
  Shield
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
    label: "Prospecção",
    icon: Crosshair,
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
    label: "Inteligência",
    icon: Sparkles,
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
    label: "Estratégia & Vendas",
    icon: TrendingUp,
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
        title: "Inteligência Competitiva",
        icon: Shield,
        url: "/competitive-intelligence",
        description: "Battle cards, win/loss analysis e estratégias contra competidores"
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
    label: "Governança & Admin",
    icon: Shield,
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
      className="border-r pt-12 md:pt-16"
      onMouseEnter={() => !isMobile && setOpen(true)}
      onMouseLeave={() => !isMobile && setOpen(false)}
    >
      <SidebarHeader className="border-b border-sidebar-border p-3 md:p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity group-data-[collapsible=icon]:justify-center touch-manipulation active:scale-95">
          <Building2 className="h-7 w-7 md:h-8 md:w-8 text-sidebar-primary flex-shrink-0" />
          {(open || isMobile) && (
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-sidebar-foreground truncate">OLV Intelligence</h1>
              <p className="text-[10px] md:text-xs text-sidebar-foreground/70 truncate">Sistema de Prospecção</p>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <TooltipProvider delayDuration={200}>
          {menuGroups.map((group) => (
            <Collapsible key={group.label} className="group/group" defaultOpen>
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex items-center gap-3 text-[11px] md:text-xs font-bold text-sidebar-foreground hover:text-sidebar-primary transition-all cursor-pointer w-full touch-manipulation active:scale-95 py-4 md:py-3 px-2 rounded-lg hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center">
                    <div className="flex items-center justify-center w-9 h-9 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/10 group-hover:from-sidebar-primary/30 group-hover:to-sidebar-primary/20 transition-all">
                      <group.icon className="h-5 w-5 md:h-4 md:w-4 text-sidebar-primary" />
                    </div>
                    <span className="flex-1 group-data-[collapsible=icon]:hidden">{group.label}</span>
                    <ChevronRight className="h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/group:rotate-90 group-data-[collapsible=icon]:hidden" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
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
                                       "touch-manipulation active:scale-95 py-3 md:py-2",
                                       (item as any).special && "relative overflow-hidden bg-[hsl(var(--accent-gold))]/15 border-l-4 border-[hsl(var(--accent-gold))] shadow-lg shadow-[hsl(var(--accent-gold))]/20 hover:shadow-[hsl(var(--accent-gold))]/40 transition-all duration-300",
                                       (item as any).highlighted && !((item as any).special) && "font-semibold bg-primary/5 border-l-2 border-primary"
                                     )}
                                   >
                                     <CollapsibleTrigger className="w-full">
                                       <div className="flex items-center gap-2 py-1 group-data-[collapsible=icon]:justify-center">
                                         <div className="relative">
                                           <item.icon className={cn(
                                             "h-5 w-5 md:h-4 md:w-4",
                                             (item as any).special && "text-[hsl(var(--accent-gold))]"
                                           )} />
                                           {(item as any).special && (
                                             <div className="absolute -top-1 -right-1 h-2 w-2 bg-[hsl(var(--accent-gold))] rounded-full animate-pulse shadow-lg shadow-[hsl(var(--accent-gold))]/50" />
                                           )}
                                         </div>
                                         {(open || isMobile) && (
                                           <span className={cn(
                                             "font-medium text-sm md:text-sm",
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
                                                 <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url} className="touch-manipulation active:scale-95 py-2.5 md:py-2">
                                                   <Link to={subItem.url}>
                                                     <subItem.icon className="h-4 w-4 md:h-3.5 md:w-3.5" />
                                                     <span className="text-xs md:text-xs">{subItem.title}</span>
                                                   </Link>
                                                 </SidebarMenuSubButton>
                                               </div>
                                             </TooltipTrigger>
                                             <TooltipContent side="right" className="max-w-[250px] hidden md:block">
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
                                  "touch-manipulation active:scale-95 py-3 md:py-2",
                                  (item as any).highlighted && "font-semibold bg-primary/5 border-l-2 border-primary"
                                )}
                              >
                                <Link to={item.url} className="flex items-center gap-2">
                                  <item.icon className="h-5 w-5 md:h-4 md:w-4" />
                                  {(open || isMobile) && <span className="text-sm md:text-sm">{item.title}</span>}
                                </Link>
                              </SidebarMenuButton>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[280px] hidden md:block">
                            <p className="text-xs">{(item as any).description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </TooltipProvider>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 md:p-4 group-data-[collapsible=icon]:p-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-2 md:py-1.5 text-xs md:text-sm text-sidebar-foreground/70 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <User className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0" />
            {(open || isMobile) && <span className="truncate whitespace-nowrap text-xs md:text-sm">{user?.email}</span>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 touch-manipulation active:scale-95 h-11 md:h-9"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0" />
                {(open || isMobile) && <span className="ml-2 whitespace-nowrap text-sm">Sair</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden md:block">
              <p>Sair da plataforma</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
