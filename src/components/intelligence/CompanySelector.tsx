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

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company: any) => {
    setSelectedCompany(company);
    setOpen(false);
    
    if (onSelect) {
      onSelect(company.id);
    }
    
    if (redirectTo) {
      navigate(`${redirectTo}?${queryParamName}=${company.id}`);
    }
  };

  // Filtro refinado que busca em qualquer parte do nome
  const filteredCompanies = companies.filter(company => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return true;
    
    const nameMatch = company.name.toLowerCase().includes(searchTerm);
    const cnpjMatch = company.cnpj?.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''));
    const domainMatch = company.domain?.toLowerCase().includes(searchTerm);
    const industryMatch = company.industry?.toLowerCase().includes(searchTerm);
    
    return nameMatch || cnpjMatch || domainMatch || industryMatch;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCompany ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{selectedCompany.name}</span>
              {selectedCompany.cnpj && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCompany.cnpj}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[700px] p-0 bg-popover border-border shadow-lg z-50" align="start">
        <div className="border-b border-border p-3 bg-muted/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite qualquer parte do nome, CNPJ, website ou setor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{filteredCompanies.length} empresas encontradas</span>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="h-6 text-xs"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Nenhuma empresa encontrada com esses critérios' : 'Nenhuma empresa cadastrada'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelect(company)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    selectedCompany?.id === company.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium truncate">{company.name}</span>
                        {selectedCompany?.id === company.id && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
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