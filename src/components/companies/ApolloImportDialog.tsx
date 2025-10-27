import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Building2, Users } from "lucide-react";

interface ApolloImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function ApolloImportDialog({ open, onOpenChange, onImportComplete }: ApolloImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    location: '',
    industry: '',
    employees_range: '',
    keywords: ''
  });

  const handleImport = async () => {
    setLoading(true);
    
    try {
      console.log('[Apollo Import] 🚀 Iniciando importação com parâmetros:', searchParams);
      
      // Montar parâmetros de busca
      const apolloParams: any = {};
      
      if (searchParams.location) {
        apolloParams.q_organization_locations = searchParams.location;
      }
      
      if (searchParams.industry) {
        apolloParams.q_organization_industry_tag_ids = searchParams.industry;
      }
      
      if (searchParams.employees_range) {
        apolloParams.q_organization_num_employees_ranges = searchParams.employees_range;
      }
      
      if (searchParams.keywords) {
        apolloParams.q_organization_keyword_tags = searchParams.keywords;
      }
      
      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'import_leads',
          searchParams: apolloParams
        }
      });
      
      if (error) throw error;
      
      console.log('[Apollo Import] ✅ Importação concluída:', data);
      
      toast.success(`🎉 ${data.imported} de ${data.total} empresas importadas do Apollo!`, {
        description: 'Leads adicionados com sucesso à plataforma'
      });
      
      onImportComplete?.();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('[Apollo Import] ❌ Erro:', error);
      toast.error('Erro ao importar do Apollo', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Importar Leads do Apollo.io
          </DialogTitle>
          <DialogDescription>
            Busque e importe empresas diretamente do Apollo para sua plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              placeholder="Ex: Brazil, São Paulo, Rio de Janeiro"
              value={searchParams.location}
              onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              País, estado ou cidade separados por vírgula
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Indústria</Label>
            <Input
              id="industry"
              placeholder="Ex: Software, Retail, Healthcare"
              value={searchParams.industry}
              onChange={(e) => setSearchParams(prev => ({ ...prev, industry: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Setor de atuação da empresa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employees">Faixa de Funcionários</Label>
            <Select
              value={searchParams.employees_range}
              onValueChange={(value) => setSearchParams(prev => ({ ...prev, employees_range: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1,10">1-10 funcionários</SelectItem>
                <SelectItem value="11,50">11-50 funcionários</SelectItem>
                <SelectItem value="51,200">51-200 funcionários</SelectItem>
                <SelectItem value="201,500">201-500 funcionários</SelectItem>
                <SelectItem value="501,1000">501-1000 funcionários</SelectItem>
                <SelectItem value="1001,5000">1001-5000 funcionários</SelectItem>
                <SelectItem value="5001,10000">5001-10000 funcionários</SelectItem>
                <SelectItem value="10001,max">10001+ funcionários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave</Label>
            <Input
              id="keywords"
              placeholder="Ex: ERP, CRM, Cloud Computing"
              value={searchParams.keywords}
              onChange={(e) => setSearchParams(prev => ({ ...prev, keywords: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Tecnologias ou palavras-chave relacionadas
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium">Apollo.io importa até 100 empresas por busca</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Empresas duplicadas serão ignoradas automaticamente
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Importando...' : 'Importar Leads'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
