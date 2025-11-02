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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  CheckCircle2,
  Globe,
  Users,
  Database,
  Crosshair,
  Sparkles,
  Shield,
  Rocket,
  Activity,
  Code,
  MapPin,
  Layers,
  Inbox,
  ListChecks,
  Repeat,
  LineChart,
  Award,
  DollarSign,
  History,
  XCircle
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
  SidebarTrigger,
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

// Estrutura de tipos para melhor type-safety
type MenuItem = {
  title: string;
  icon: any;
  url: string;
  description: string;
  highlighted?: boolean;
  special?: boolean;
  competitive?: boolean;
  submenu?: Array<{
    title: string;
    icon: any;
    url: string;
    description: string;
  }>;
};

type MenuGroup = {
  label: string;
  icon: any;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Comando",
    icon: LayoutDashboard,
    items: [
      {
        title: "Dashboard Executivo",
        icon: LayoutDashboard,
        url: "/dashboard",
        description: "Visão geral consolidada de métricas e performance de vendas"
      },
      {
        title: "Busca Global",
        icon: Search,
        url: "/search",
        description: "Busca unificada de empresas, contatos e inteligência competitiva"
      }
    ]
  },
  {
    label: "Prospecção",
    icon: Crosshair,
    items: [
      {
        title: "Base de Empresas",
        icon: Building2,
        url: "/companies",
        description: "Gestão completa da base de prospectos e qualificação inicial"
      },
      {
        title: "Intelligence 360°",
        icon: Brain,
        url: "/intelligence-360",
        highlighted: true,
        description: "Análise completa automatizada com IA de múltiplas dimensões",
        submenu: [
          { title: "Visão Geral 360°", icon: Brain, url: "/intelligence-360", description: "Dashboard consolidado de inteligência estratégica" },
          { title: "Fit TOTVS Score", icon: Target, url: "/fit-totvs", description: "Score de aderência aos produtos TOTVS" },
          { title: "Maturidade Digital", icon: TrendingUp, url: "/maturity", description: "Nível de transformação digital da empresa" },
          { title: "Digital Health", icon: Activity, url: "/digital-presence", description: "Saúde da presença digital e engajamento" },
          { title: "Tech Stack", icon: Code, url: "/tech-stack", description: "Tecnologias em uso: ERP, CRM, e-commerce" },
          { title: "Análise Geográfica", icon: MapPin, url: "/geographic-analysis", description: "Distribuição territorial e insights regionais" },
          { title: "Benchmark Setorial", icon: Award, url: "/benchmark", description: "Comparação com mercado e concorrentes diretos" },
        ],
      },
    ]
  },
  {
    label: "ICP",
    icon: Target,
    items: [
      {
        title: "Central ICP Home",
        icon: Target,
        url: "/central-icp",
        description: "Painel central de qualificação de leads ICP"
      },
      {
        title: "Descoberta de Empresas",
        icon: Search,
        url: "/company-discovery",
        description: "Buscar e descobrir novas empresas no seu ICP ideal"
      },
      {
        title: "Análise Individual",
        icon: FileText,
        url: "/central-icp/individual",
        description: "Qualifique empresas uma por vez com análise detalhada"
      },
      {
        title: "Análise em Massa",
        icon: Zap,
        url: "/central-icp/batch",
        description: "Processe centenas de empresas automaticamente"
      },
      {
        title: "Empresas em Quarentena",
        icon: Inbox,
        url: "/leads/icp-quarantine",
        description: "Aprove empresas analisadas antes de movê-las para o pool de leads"
      },
      {
        title: "Empresas Descartadas",
        icon: XCircle,
        url: "/leads/discarded",
        description: "Histórico de empresas descartadas com motivos e analytics"
      },
      {
        title: "Histórico STC",
        icon: Target,
        url: "/leads/stc-history",
        description: "Registro completo de todas as verificações TOTVS realizadas"
      },
      {
        title: "Dashboard de Resultados",
        icon: BarChart3,
        url: "/central-icp/dashboard",
        description: "Visualize empresas qualificadas e desqualificadas"
      },
      {
        title: "Auditoria e Compliance",
        icon: Shield,
        url: "/central-icp/audit",
        description: "Logs de validação e checkpoints de qualidade"
      },
      {
        title: "Inteligência Competitiva",
        icon: TrendingUp,
        url: "/competitive-intelligence",
        competitive: true,
        description: "Battle Cards, Win-Loss Analysis e Monitoramento"
      },
    ]
  },
  {
    label: "Execução",
    icon: Rocket,
    items: [
      {
        title: "SDR Sales Suite",
        icon: MessageSquare,
        url: "/sdr/workspace",
        highlighted: true,
        description: "Plataforma completa de automação de prospecção e vendas",
        submenu: [
          { title: "Sales Workspace", icon: Activity, url: "/sdr/workspace", description: "Centro de comando unificado do vendedor" },
          { title: "Inbox Unificado", icon: Inbox, url: "/sdr/inbox", description: "Central de mensagens multi-canal consolidada" },
          { title: "Sequências", icon: Repeat, url: "/sdr/sequences", description: "Cadências automatizadas de follow-up" },
          { title: "Tarefas", icon: ListChecks, url: "/sdr/tasks", description: "Gestão de tarefas e lembretes inteligentes" },
          { title: "Integrações", icon: Zap, url: "/sdr/integrations", description: "Conecte com CRM, e-mail e ferramentas externas" },
        ],
      },
    ]
  },
  {
    label: "Estratégia",
    icon: Target,
    items: [
      {
        title: "ROI-Labs",
        icon: Target,
        url: "/account-strategy",
        special: true,
        description: "Central estratégica unificada: ROI, CPQ, Cenários, Propostas e Valor",
        submenu: [
          { title: "Overview Estratégico", icon: LayoutDashboard, url: "/account-strategy?tab=overview", description: "Visão geral da conta e estratégia de abordagem" },
          { title: "ROI & TCO Calculator", icon: DollarSign, url: "/account-strategy?tab=roi", description: "Calculadora interativa de retorno sobre investimento" },
          { title: "CPQ & Pricing Intelligence", icon: Sparkles, url: "/account-strategy?tab=cpq", description: "Configure-Price-Quote com inteligência artificial" },
          { title: "Cenários & Propostas", icon: Layers, url: "/account-strategy?tab=scenarios", description: "Análise Best/Expected/Worst case scenarios" },
          { title: "Propostas Visuais", icon: FileText, url: "/account-strategy?tab=proposals", description: "Geração automatizada de propostas comerciais" },
          { title: "Value Realization", icon: TrendingUp, url: "/account-strategy?tab=value", description: "Acompanhamento de valor entregue ao cliente" },
          { title: "Histórico de Estratégias", icon: History, url: "/account-strategy/history", description: "Todas as estratégias criadas e seus resultados" },
        ],
      },
      {
        title: "Canvas (War Room)",
        icon: Layers,
        url: "/canvas",
        description: "Planejamento colaborativo visual em tempo real para grandes contas"
      },
      {
        title: "Playbooks de Vendas",
        icon: BookOpen,
        url: "/playbooks",
        description: "Guias de abordagem, melhores práticas e scripts aprovados"
      },
      {
        title: "Biblioteca de Personas",
        icon: Users,
        url: "/personas-library",
        description: "Perfis comportamentais de decisores e estratégias de abordagem"
      }
    ]
  },
  {
    label: "Métricas",
    icon: BarChart3,
    items: [
      {
        title: "Metas de Vendas",
        icon: Target,
        url: "/goals",
        description: "Acompanhamento de metas individuais e coletivas de performance"
      },
      {
        title: "Analytics SDR",
        icon: LineChart,
        url: "/sdr/analytics",
        description: "Métricas detalhadas de conversão e análise preditiva"
      },
      {
        title: "Relatórios Executivos",
        icon: FileText,
        url: "/reports",
        description: "Biblioteca completa de relatórios executivos e análises"
      }
    ]
  },
  {
    label: "Governança",
    icon: Settings,
    items: [
      {
        title: "Transformação Digital",
        icon: Zap,
        url: "/governance",
        description: "Análise de gaps de governança e roadmap de consultoria"
      },
      {
        title: "Migração de Dados",
        icon: Database,
        url: "/data-migration",
        description: "Limpeza, preparação e importação de dados legados"
      },
      {
        title: "Consultoria OLV Premium",
        icon: Award,
        url: "/consultoria-olv",
        description: "Catálogo e simulador de serviços de consultoria especializada"
      },
      {
        title: "Configurações",
        icon: Settings,
        url: "/settings",
        description: "Integrações, preferências do sistema e gerenciamento de usuários"
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
    >
      <SidebarHeader className="border-b border-sidebar-border p-3 md:p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity touch-manipulation active:scale-95 group-data-[collapsible=icon]:justify-center">
          <Building2 className="h-8 w-8 text-sidebar-primary flex-shrink-0" />
          {(open || isMobile) && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">STRATEVO Intelligence</h1>
              <p className="text-sm text-sidebar-foreground/70 truncate">A Plataforma Definitiva de Inteligência de Vendas</p>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1 py-1">
        <TooltipProvider delayDuration={200}>
          {menuGroups.map((group) => {
            const isGroupActive = group.items.some(item => 
              location.pathname === item.url || 
              (item as any).submenu?.some((sub: any) => location.pathname === sub.url)
            );
            
            return (
            <Collapsible key={group.label} className="group/group mb-0.5" defaultOpen={isGroupActive}>
              <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-primary transition-all cursor-pointer w-full touch-manipulation active:scale-95 py-1.5 px-2 mb-0.5 rounded-lg bg-primary/10 hover:bg-primary/15 group-data-[collapsible=icon]:justify-center">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/10 group-hover:from-sidebar-primary/30 group-hover:to-sidebar-primary/20 transition-all flex-shrink-0">
                          <group.icon className="h-4 w-4 text-sidebar-primary" />
                        </div>
                        <span className="flex-1 group-data-[collapsible=icon]:hidden text-left">{group.label}</span>
                        <ChevronRight className="h-4 w-4 text-sidebar-foreground/50 transition-transform duration-200 group-data-[state=open]/group:rotate-90 group-data-[collapsible=icon]:hidden flex-shrink-0" />
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[300px] z-[100]">
                      <p className="font-semibold text-sm mb-1">{group.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.label === "Comando" && "Visão executiva e busca global de inteligência comercial"}
                        {group.label === "Prospecção" && "Gestão de base de empresas e análise 360° com IA"}
                        {group.label === "ICP" && "Qualificação de leads, análise individual, em massa e inteligência competitiva"}
                        {group.label === "Estratégia" && "ROI, CPQ, cenários, propostas e canvas colaborativo"}
                        {group.label === "Execução" && "Suite completa de automação de vendas e outbound"}
                        {group.label === "Métricas" && "Dashboards, metas e analytics de conversão"}
                        {group.label === "Governança" && "Transformação digital, migração de dados e consultoria"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarGroupLabel>
                <CollapsibleContent className="mt-0.5">
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5">
                      {group.items.map((item) => {
                    const isActive = location.pathname === item.url;
                    const hasSubmenu = (item as any).submenu;
                    
                    if (hasSubmenu) {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                 <Collapsible 
                                   className="group/collapsible" 
                                   defaultOpen={(item as any).submenu?.some((sub: any) => location.pathname === sub.url)}
                                 >
                                   <SidebarMenuButton 
                                     asChild
                                     className={cn(
                                       "touch-manipulation active:scale-95 py-3 px-3 mb-1",
                                       item.special && "relative overflow-hidden bg-[hsl(var(--accent-gold))]/15 border-l-4 border-[hsl(var(--accent-gold))] shadow-lg shadow-[hsl(var(--accent-gold))]/20 hover:shadow-[hsl(var(--accent-gold))]/40 transition-all duration-300",
                                       item.competitive && "relative overflow-hidden bg-red-500/10 border-l-4 border-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 animate-pulse-subtle",
                                       item.highlighted && !item.special && !item.competitive && "font-semibold bg-primary/5 border-l-2 border-primary"
                                     )}
                                   >
                                     <CollapsibleTrigger className="w-full">
                                         <div className="flex items-center gap-3 py-1 group-data-[collapsible=icon]:justify-center">
                                           <div className="relative flex-shrink-0">
                                             <item.icon className={cn(
                                               "h-5 w-5",
                                               item.special && "text-[hsl(var(--accent-gold))]",
                                               item.competitive && "text-red-500"
                                             )} />
                                             {item.special && (
                                               <div className="absolute -top-1 -right-1 h-2 w-2 bg-[hsl(var(--accent-gold))] rounded-full animate-pulse shadow-lg shadow-[hsl(var(--accent-gold))]/50" />
                                             )}
                                             {item.competitive && (
                                               <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                                             )}
                                           </div>
                                           {(open || isMobile) && (
                                              <span className={cn(
                                                "font-normal text-sm flex-1 text-left",
                                                item.special && "text-[hsl(var(--accent-gold))]",
                                                item.competitive && "text-red-500 font-bold"
                                              )}>
                                               {item.title}
                                             </span>
                                           )}
                                         </div>
                                       {(open || isMobile) && (
                                         <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                       )}
                                     </CollapsibleTrigger>
                                   </SidebarMenuButton>
                                  <CollapsibleContent className="mt-1 ml-8">
                                    <SidebarMenuSub className="space-y-1 border-l-2 border-sidebar-border/30 ml-2 pl-4">
                                      {(item as any).submenu.map((subItem: any) => (
                                         <SidebarMenuSubItem key={subItem.title}>
                                           <Tooltip>
                                             <TooltipTrigger asChild>
                                               <div>
                                                   <SidebarMenuSubButton 
                                                     asChild 
                                                     isActive={
                                                       location.pathname === subItem.url.split('?')[0] && 
                                                       (!subItem.url.includes('?tab=') || location.search.includes(subItem.url.split('?tab=')[1]))
                                                     } 
                                                     className="touch-manipulation active:scale-95 py-3 px-3"
                                                   >
                                                     {(() => {
                                                       const sp = new URLSearchParams(location.search);
                                                       const company = sp.get('company');
                                                       const base = subItem.url as string;
                                                       const isAS = base.startsWith('/account-strategy');
                                                       const url = isAS && company ? `${base}${base.includes('?') ? '&' : '?'}company=${company}` : base;
                                                        return (
                                                          <Link to={url}>
                                                            <subItem.icon className="h-5 w-5" />
                                                            <span className="text-sm">{subItem.title}</span>
                                                          </Link>
                                                        );
                                                     })()}
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
                                 "touch-manipulation active:scale-95 py-3 px-3",
                                 item.competitive && "relative overflow-hidden bg-red-500/10 border-l-4 border-red-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 animate-pulse-subtle",
                                 item.highlighted && !item.competitive && "font-semibold bg-primary/5 border-l-2 border-primary"
                               )}
                             >
                               <Link to={item.url} className="flex items-center gap-3">
                                 <div className="relative flex-shrink-0">
                                   <item.icon className={cn(
                                     "h-5 w-5",
                                     item.competitive && "text-red-500"
                                   )} />
                                   {item.competitive && (
                                     <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                                   )}
                                 </div>
                                 {(open || isMobile) && (
                                   <span className={cn(
                                     "text-sm flex-1 text-left",
                                     item.competitive && "text-red-500 font-bold"
                                   )}>
                                     {item.title}
                                   </span>
                                 )}
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
          )})}
        </TooltipProvider>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 md:p-4 group-data-[collapsible=icon]:p-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-2 text-sm text-sidebar-foreground/70 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <User className="h-5 w-5 flex-shrink-0" />
            {(open || isMobile) && <span className="truncate whitespace-nowrap text-sm">{user?.email}</span>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 touch-manipulation active:scale-95 h-11"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {(open || isMobile) && <span className="ml-2 whitespace-nowrap text-sm">Sair</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden md:block">
              <p>Sair da plataforma</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Marca registrada */}
          {(open || isMobile) && (
            <div className="px-3 py-2 text-center">
              <p className="text-[10px] text-sidebar-foreground/40">
                Powered by OLV Internacional + IA Intelligence 2025 *
              </p>
            </div>
          )}
          
          {/* Toggle button - sempre visível */}
          <div className="pt-2 border-t border-sidebar-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(!open)}
              className="w-full h-11 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary font-semibold transition-all"
            >
              {open ? (
                <>
                  <ChevronsLeft className="h-5 w-5" />
                  {!isMobile && <span className="text-sm">Recolher</span>}
                </>
              ) : (
                <ChevronsRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
