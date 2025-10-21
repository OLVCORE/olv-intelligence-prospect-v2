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
  User
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
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    title: "Buscar Empresas",
    icon: Search,
    url: "/search",
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
    title: "Canvas",
    icon: PenTool,
    url: "/canvas",
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
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
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
