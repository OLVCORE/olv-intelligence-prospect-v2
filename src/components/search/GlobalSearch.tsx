import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, BarChart3, Cpu, Users, TrendingUp, Target, Zap, FileText, Globe, PieChart, Layout, Settings } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useCompanies } from "@/hooks/useCompanies";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  route: string;
  icon: any;
  keywords: string[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: companies } = useCompanies();

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const allSearchItems: SearchItem[] = useMemo(() => {
    const moduleItems: SearchItem[] = [
      {
        id: "dashboard",
        title: "Dashboard",
        description: "Visão geral executiva e métricas principais",
        category: "Módulos Inteligentes",
        route: "/dashboard",
        icon: BarChart3,
        keywords: ["dashboard", "painel", "métricas", "kpi", "overview", "visão geral"],
      },
      {
        id: "search",
        title: "Buscar Empresas",
        description: "Busca avançada de empresas com filtros inteligentes",
        category: "Módulos Inteligentes",
        route: "/search",
        icon: Search,
        keywords: ["buscar", "pesquisar", "empresas", "filtros", "search"],
      },
      {
        id: "intelligence-360",
        title: "Inteligência 360º",
        description: "Análise completa e inteligente de empresas",
        category: "Módulos Inteligentes",
        route: "/intelligence-360",
        icon: Target,
        keywords: ["inteligência", "360", "análise", "completa", "intelligence"],
      },
      {
        id: "tech-stack",
        title: "Tech Stack",
        description: "Análise de tecnologias e stack tecnológico",
        category: "Módulos Inteligentes",
        route: "/tech-stack",
        icon: Cpu,
        keywords: ["tech", "stack", "tecnologia", "ferramentas", "software"],
      },
      {
        id: "maturity",
        title: "Maturidade Digital",
        description: "Score de maturidade digital das empresas",
        category: "Módulos Inteligentes",
        route: "/maturity",
        icon: TrendingUp,
        keywords: ["maturidade", "digital", "score", "evolução"],
      },
      {
        id: "benchmark",
        title: "Benchmark",
        description: "Comparação e benchmark de empresas",
        category: "Módulos Inteligentes",
        route: "/benchmark",
        icon: BarChart3,
        keywords: ["benchmark", "comparação", "análise comparativa"],
      },
      {
        id: "fit-totvs",
        title: "Fit TOTVS",
        description: "Análise de fit com soluções TOTVS",
        category: "Módulos Inteligentes",
        route: "/fit-totvs",
        icon: Zap,
        keywords: ["fit", "totvs", "adequação", "solução"],
      },
      {
        id: "playbooks",
        title: "Playbooks",
        description: "Guias e estratégias de vendas",
        category: "Módulos Inteligentes",
        route: "/playbooks",
        icon: FileText,
        keywords: ["playbooks", "guias", "estratégias", "vendas"],
      },
      {
        id: "reports",
        title: "Relatórios",
        description: "Relatórios detalhados e exportação de dados",
        category: "Módulos Inteligentes",
        route: "/reports",
        icon: FileText,
        keywords: ["relatórios", "reports", "exportar", "dados"],
      },
      {
        id: "digital-presence",
        title: "Presença Digital",
        description: "Análise de presença digital e redes sociais",
        category: "Módulos Inteligentes",
        route: "/digital-presence",
        icon: Globe,
        keywords: ["presença", "digital", "redes sociais", "online"],
      },
      {
        id: "analysis-360",
        title: "Análise 360°",
        description: "Análise completa de empresas",
        category: "Módulos Inteligentes",
        route: "/analysis-360",
        icon: PieChart,
        keywords: ["análise", "360", "completa", "visão geral"],
      },
      {
        id: "canvas",
        title: "Canvas",
        description: "Canvas estratégico e colaborativo",
        category: "Módulos Inteligentes",
        route: "/canvas",
        icon: Layout,
        keywords: ["canvas", "estratégico", "colaborativo", "planejamento"],
      },
      {
        id: "sdr-dashboard",
        title: "SDR Dashboard",
        description: "Dashboard SDR com métricas de vendas",
        category: "SDR (OLV)",
        route: "/sdr/dashboard",
        icon: BarChart3,
        keywords: ["sdr", "vendas", "dashboard", "métricas"],
      },
      {
        id: "sdr-inbox",
        title: "SDR Inbox",
        description: "Inbox unificado de mensagens",
        category: "SDR (OLV)",
        route: "/sdr/inbox",
        icon: Users,
        keywords: ["inbox", "mensagens", "comunicação", "sdr"],
      },
      {
        id: "sdr-pipeline",
        title: "SDR Pipeline",
        description: "Pipeline de vendas e oportunidades",
        category: "SDR (OLV)",
        route: "/sdr/pipeline",
        icon: Target,
        keywords: ["pipeline", "vendas", "oportunidades", "sdr"],
      },
      {
        id: "settings",
        title: "Configurações",
        description: "Configurações da plataforma",
        category: "Sistema",
        route: "/settings",
        icon: Settings,
        keywords: ["configurações", "settings", "preferências"],
      },
    ];

    // Add companies to search
    const companyItems: SearchItem[] = (companies || []).map((company) => {
      const location = company.location as any;
      const city = location?.city || "Localização não especificada";
      
      return {
        id: `company-${company.id}`,
        title: company.name,
        description: `${company.industry || "Indústria não especificada"} • ${city}`,
        category: "Empresas",
        route: `/company/${company.id}`,
        icon: Building2,
        keywords: [
          company.name.toLowerCase(),
          company.industry?.toLowerCase() || "",
          typeof city === 'string' ? city.toLowerCase() : "",
          company.cnpj || "",
        ],
      };
    });

    return [...moduleItems, ...companyItems];
  }, [companies]);

  const filteredItems = useMemo(() => {
    if (!search) return allSearchItems.slice(0, 10);

    const searchLower = search.toLowerCase();
    return allSearchItems.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(searchLower);
      const descriptionMatch = item.description.toLowerCase().includes(searchLower);
      const keywordsMatch = item.keywords.some((keyword) =>
        keyword.includes(searchLower)
      );
      return titleMatch || descriptionMatch || keywordsMatch;
    });
  }, [search, allSearchItems]);

  const handleSelect = (route: string) => {
    setOpen(false);
    setSearch("");
    navigate(route);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary/30 text-primary font-semibold rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full max-w-sm justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Buscar em toda plataforma...</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Digite para buscar..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {Object.entries(groupedItems).map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.description} ${item.keywords.join(" ")}`}
                    onSelect={() => handleSelect(item.route)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4 text-primary" />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">
                        {highlightText(item.title, search)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {highlightText(item.description, search)}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
