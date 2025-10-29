import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useToggleCompanyMonitoring } from '@/hooks/useCompanyMonitoring';
import { handleSupabaseError } from '@/lib/errorHandler';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCompanyDialog({ open, onOpenChange }: AddCompanyDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const toggleMonitoring = useToggleCompanyMonitoring();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies-for-monitoring', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('id, name, cnpj, headquarters_state, industry, employees')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const handleToggleCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleAddToMonitoring = async () => {
    try {
      for (const companyId of selectedCompanies) {
        await toggleMonitoring.mutateAsync({ companyId, isActive: true });
      }

      toast({
        title: 'Empresas adicionadas',
        description: `${selectedCompanies.length} empresa(s) adicionada(s) ao monitoramento`,
      });

      onOpenChange(false);
      setSelectedCompanies([]);
      setSearchTerm('');

    } catch (error) {
      handleSupabaseError(error, 'Adicionar Empresas ao Monitoramento');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Empresas ao Monitoramento</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o nome da empresa..."
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] border rounded-lg p-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando empresas...
            </div>
          ) : companies && companies.length > 0 ? (
            <div className="space-y-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleCompany(company.id)}
                >
                  <Checkbox
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={() => handleToggleCompany(company.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{company.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {company.headquarters_state && <span>{company.headquarters_state}</span>}
                      {company.industry && <span>{company.industry}</span>}
                      {company.employees && (
                        <span>{company.employees.toLocaleString()} funcionários</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? 'Nenhuma empresa encontrada'
                : 'Digite para buscar empresas'}
            </div>
          )}
        </ScrollArea>

        {selectedCompanies.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedCompanies.length} empresa(s) selecionada(s)
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddToMonitoring}
            disabled={selectedCompanies.length === 0 || toggleMonitoring.isPending}
          >
            Adicionar ao Monitoramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}