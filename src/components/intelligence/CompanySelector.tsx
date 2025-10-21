import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronsUpDown, Building2, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanySelectorProps {
  onSelect?: (companyId: string) => void;
  redirectTo?: string;
  placeholder?: string;
  className?: string;
  queryParamName?: string; // Nome do parâmetro na URL (default: 'company')
}

export function CompanySelector({ 
  onSelect, 
  redirectTo, 
  placeholder = "Buscar empresa...",
  className,
  queryParamName = "company"
}: CompanySelectorProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, cnpj, industry, domain')
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      // Não mostra toast de erro para não poluir a UX
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company: any) => {
    setSelectedCompany(company);
    setOpen(false);
    setSearch(''); // Limpa a busca ao selecionar
    
    if (onSelect) {
      onSelect(company.id);
    }
    
    if (redirectTo) {
      navigate(`${redirectTo}?${queryParamName}=${company.id}`);
    }
  };

  // Filtro progressivo instantâneo - estilo Google/LinkedIn
  const filteredCompanies = companies.filter(company => {
    const searchTerm = search.toLowerCase().trim();
    
    // Se não há busca, mostra todas as empresas
    if (!searchTerm) return true;
    
    // Busca em múltiplos campos simultaneamente
    const searchableText = [
      company.name,
      company.cnpj,
      company.domain,
      company.industry
    ]
      .filter(Boolean) // Remove valores null/undefined
      .join(' ')
      .toLowerCase();
    
    // Suporta busca por múltiplas palavras (ex: "tech são paulo")
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    // Todas as palavras devem estar presentes em algum lugar
    return searchWords.every(word => searchableText.includes(word));
  });

  // Função para destacar texto que corresponde à busca
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={i} className="bg-primary/20 text-foreground font-medium">{part}</mark>
        : part
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between hover:bg-accent", className)}
          size="lg"
        >
          {selectedCompany ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">{selectedCompany.name}</span>
              {selectedCompany.cnpj && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {selectedCompany.cnpj}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[700px] p-0 bg-popover border-border shadow-lg z-50" 
        align="start"
      >
        <div className="border-b border-border p-3 bg-muted/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite para buscar (ex: nome, CNPJ, setor, website)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={cn(
              "font-medium",
              filteredCompanies.length === 0 && search ? "text-destructive" : "text-muted-foreground"
            )}>
              {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
            </span>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="h-6 text-xs hover:text-destructive"
              >
                Limpar busca
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Carregando empresas...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              {search ? (
                <>
                  <p className="text-sm font-medium mb-1">Nenhuma empresa encontrada</p>
                  <p className="text-xs text-muted-foreground max-w-[300px]">
                    Não encontramos empresas que correspondam a "<span className="font-medium">{search}</span>".
                    Tente outros termos de busca.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">Nenhuma empresa cadastrada</p>
                  <p className="text-xs text-muted-foreground">
                    Adicione empresas para começar a usar o sistema.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelect(company)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-all duration-150",
                    "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "active:scale-[0.98]",
                    selectedCompany?.id === company.id && "bg-accent text-accent-foreground ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium truncate">{company.name}</span>
                        {selectedCompany?.id === company.id && (
                          <Check className="h-4 w-4 shrink-0 text-primary animate-in zoom-in-50" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {company.cnpj && (
                          <Badge variant="outline" className="text-xs font-normal">
                            CNPJ: {company.cnpj}
                          </Badge>
                        )}
                        {company.industry && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {company.industry}
                          </Badge>
                        )}
                        {company.domain && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {company.domain}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}