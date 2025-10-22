import { useState, useEffect } from "react";
import { Search, Building2, PenTool, Brain, Target, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  metadata?: any;
  score?: number;
}

const typeIcons: Record<string, any> = {
  empresa: Building2,
  canvas: PenTool,
  decisor: Brain,
  insight: Sparkles,
  sinal: Target,
  'fit-totvs': TrendingUp,
};

const typeLabels: Record<string, string> = {
  empresa: "Empresa",
  canvas: "Canvas",
  decisor: "Decisor",
  insight: "Insight",
  sinal: "Sinal de Compra",
  'fit-totvs': "Fit TOTVS",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchGlobal = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('global-search', {
          body: { query }
        });

        if (error) throw error;

        setResults(data.results || []);
      } catch (error) {
        console.error('[GlobalSearch] Error:', error);
        toast.error("Erro ao buscar");
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchGlobal, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQuery("");
    toast.success(`Navegando para ${typeLabels[result.type]}: ${result.title}`);
  };

  const groupedResults = results.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-start text-muted-foreground hover:text-foreground"
        >
          <Search className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">Buscar em tudo (empresas, canvas, insights...)</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0 bg-background border shadow-lg z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Digite para buscar na plataforma..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[400px]">
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            
            {!loading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}

            {!loading && query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}

            {!loading && Object.keys(groupedResults).map((type) => {
              const Icon = typeIcons[type] || Building2;
              return (
                <CommandGroup key={type} heading={typeLabels[type] || type}>
                  {groupedResults[type].map((result) => (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{result.title}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </span>
                      </div>
                      {result.score && (
                        <span className="ml-2 text-xs font-semibold text-primary">
                          {result.score}%
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
