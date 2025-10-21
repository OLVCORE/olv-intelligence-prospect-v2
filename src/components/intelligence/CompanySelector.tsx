import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Building2, Loader2 } from 'lucide-react';
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

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    (company.cnpj && company.cnpj.includes(search)) ||
    (company.domain && company.domain.toLowerCase().includes(search.toLowerCase()))
  );

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
      <PopoverContent className="w-[600px] p-0 bg-popover z-50" align="start">
        <Command>
          <CommandInput 
            placeholder="Digite o nome, CNPJ ou website da empresa..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                "Nenhuma empresa encontrada."
              )}
            </CommandEmpty>
            <CommandGroup heading={`${filteredCompanies.length} empresas encontradas`}>
              {filteredCompanies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.id}
                  onSelect={() => handleSelect(company)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCompany?.id === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{company.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {company.cnpj && <span>CNPJ: {company.cnpj}</span>}
                        {company.industry && <span>• {company.industry}</span>}
                      </div>
                    </div>
                    {company.domain && (
                      <Badge variant="outline" className="text-xs">
                        {company.domain}
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}