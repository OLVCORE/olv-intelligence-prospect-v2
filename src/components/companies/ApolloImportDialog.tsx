import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Building2, Users } from "lucide-react";
import { ApolloReviewDialog } from "./ApolloReviewDialog";

interface ApolloImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function ApolloImportDialog({ open, onOpenChange, onImportComplete }: ApolloImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'companies' | 'people'>('companies');
  const [foundOrganizations, setFoundOrganizations] = useState<any[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  // Parâmetros de busca para Companies
  const [companyParams, setCompanyParams] = useState({
    q_organization_name: '',
    q_organization_domains: '',
    q_organization_locations: '',
    q_organization_industry_tag_ids: '',
    q_organization_num_employees_ranges: '',
    q_organization_keyword_tags: '',
    organization_id: '',
    per_page: '100'
  });
  
  // Parâmetros de busca para People
  const [peopleParams, setPeopleParams] = useState({
    q_organization_name: '',
    q_organization_domains: '',
    person_titles: '',
    person_seniorities: '',
    person_locations: '',
    contact_email_status: '',
    per_page: '50'
  });

  const handleImport = async () => {
    setLoading(true);
    
    try {
      console.log('[Apollo Import] 🚀 Iniciando importação:', activeTab);
      // Garantir cabeçalho de autorização
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      
      // Montar parâmetros baseado na aba ativa
      const apolloParams: any = {};
      
      if (activeTab === 'companies') {
        // Validação mínima: exigir nome OU domínio
        const name = companyParams.q_organization_name?.trim();
        const domain = companyParams.q_organization_domains?.trim();
        if (!name && !domain) {
          toast.error('Informe Nome da Organização ou Domínio', {
            description: 'Preencha pelo menos um dos campos para buscar no Apollo.io'
          });
          setLoading(false);
          return;
        }

        Object.entries(companyParams).forEach(([key, value]) => {
          if (value && value.trim()) {
            apolloParams[key] = value.trim();
          }
        });
        
        // Para companies: buscar sem salvar, mostrar tela de revisão
        console.log('[Apollo Import] 📦 Parâmetros finais:', apolloParams);
        
        const { data, error } = await supabase.functions.invoke('enrich-apollo', { 
          body: { type: 'search_organizations', searchParams: apolloParams },
          headers
        });
        
        if (error) throw error;
        
        const orgs = data.organizations || [];
        console.log('[Apollo Import] 🔍 Empresas encontradas:', orgs.length);
        
        if (orgs.length === 0) {
          toast.info('Nenhuma empresa encontrada', {
            description: 'Tente ajustar os filtros de busca (nome, domínio, localização)'
          });
          setLoading(false);
          return;
        }
        
        // Mostrar tela de revisão com matching CNPJ
        setFoundOrganizations(orgs);
        setShowReviewDialog(true);
        onOpenChange(false); // Fecha o diálogo de busca
        
      } else {
        // Para people: fluxo direto (sem revisão)
        Object.entries(peopleParams).forEach(([key, value]) => {
          if (value && value.trim()) {
            apolloParams[key] = value.trim();
          }
        });
        
        const body = {
          type: 'people',
          organizationName: apolloParams.q_organization_name,
          domain: apolloParams.q_organization_domains,
          titles: (apolloParams.person_titles || '')
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        };

        const { data, error } = await supabase.functions.invoke('enrich-apollo', { body, headers });
        
        if (error) throw error;
        
        console.log('[Apollo Import] ✅ Pessoas importadas:', data);
        
        toast.success(`🎉 ${data.imported} de ${data.total} contatos importados do Apollo!`, {
          description: 'Dados adicionados com sucesso à plataforma'
        });
        
        onImportComplete?.();
        onOpenChange(false);
      }
      
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Importar Leads do Apollo.io
          </DialogTitle>
          <DialogDescription>
            Busque e importe empresas ou contatos diretamente do Apollo
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'companies' | 'people')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pessoas
            </TabsTrigger>
          </TabsList>

          {/* TAB: COMPANIES */}
          <TabsContent value="companies" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org_name">Nome da Organização</Label>
                <Input
                  id="org_name"
                  placeholder="Ex: Microsoft"
                  value={companyParams.q_organization_name}
                  onChange={(e) => setCompanyParams(prev => ({ ...prev, q_organization_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_domains">Domínio(s)</Label>
                <Input
                  id="org_domains"
                  placeholder="Ex: microsoft.com"
                  value={companyParams.q_organization_domains}
                  onChange={(e) => setCompanyParams(prev => ({ ...prev, q_organization_domains: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Separe múltiplos domínios por vírgula</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org_location">Localização</Label>
                <Input
                  id="org_location"
                  placeholder="Ex: Brazil, São Paulo"
                  value={companyParams.q_organization_locations}
                  onChange={(e) => setCompanyParams(prev => ({ ...prev, q_organization_locations: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_industry">Indústria / Setor</Label>
                <Input
                  id="org_industry"
                  placeholder="Ex: Software, Retail"
                  value={companyParams.q_organization_industry_tag_ids}
                  onChange={(e) => setCompanyParams(prev => ({ ...prev, q_organization_industry_tag_ids: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org_employees">Faixa de Funcionários</Label>
                <Select
                  value={companyParams.q_organization_num_employees_ranges}
                  onValueChange={(value) => setCompanyParams(prev => ({ ...prev, q_organization_num_employees_ranges: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 funcionários</SelectItem>
                    <SelectItem value="11-50">11-50 funcionários</SelectItem>
                    <SelectItem value="51-200">51-200 funcionários</SelectItem>
                    <SelectItem value="201-500">201-500 funcionários</SelectItem>
                    <SelectItem value="501-1000">501-1000 funcionários</SelectItem>
                    <SelectItem value="1001-5000">1001-5000 funcionários</SelectItem>
                    <SelectItem value="5001-10000">5001-10000 funcionários</SelectItem>
                    <SelectItem value="10001-max">10001+ funcionários</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_keywords">Palavras-chave / Tecnologias</Label>
                <Input
                  id="org_keywords"
                  placeholder="Ex: ERP, CRM, SaaS"
                  value={companyParams.q_organization_keyword_tags}
                  onChange={(e) => setCompanyParams(prev => ({ ...prev, q_organization_keyword_tags: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium">📋 Busca até 100 empresas com revisão</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Você revisará cada empresa com matching % de CNPJ da Receita Federal antes de importar
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB: PEOPLE */}
          <TabsContent value="people" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="people_org_name">Nome da Organização</Label>
                <Input
                  id="people_org_name"
                  placeholder="Ex: Microsoft"
                  value={peopleParams.q_organization_name}
                  onChange={(e) => setPeopleParams(prev => ({ ...prev, q_organization_name: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Obrigatório para busca de pessoas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="people_org_domains">Domínio</Label>
                <Input
                  id="people_org_domains"
                  placeholder="Ex: microsoft.com"
                  value={peopleParams.q_organization_domains}
                  onChange={(e) => setPeopleParams(prev => ({ ...prev, q_organization_domains: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="person_titles">Cargos (Titles)</Label>
                <Input
                  id="person_titles"
                  placeholder="Ex: CEO,CTO,Diretor,VP"
                  value={peopleParams.person_titles}
                  onChange={(e) => setPeopleParams(prev => ({ ...prev, person_titles: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Separe por vírgula</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="person_seniorities">Senioridade</Label>
                <Select
                  value={peopleParams.person_seniorities}
                  onValueChange={(value) => setPeopleParams(prev => ({ ...prev, person_seniorities: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="c_suite">C-Level (CEO, CTO, etc)</SelectItem>
                    <SelectItem value="vp">Vice President</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="person_locations">Localização</Label>
                <Input
                  id="person_locations"
                  placeholder="Ex: Brazil, São Paulo"
                  value={peopleParams.person_locations}
                  onChange={(e) => setPeopleParams(prev => ({ ...prev, person_locations: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_status">Status do E-mail</Label>
                <Select
                  value={peopleParams.contact_email_status || "all"}
                  onValueChange={(value) => setPeopleParams(prev => ({ 
                    ...prev, 
                    contact_email_status: value === "all" ? "" : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="verified">Verificado</SelectItem>
                    <SelectItem value="guessed">Estimado</SelectItem>
                    <SelectItem value="unavailable">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="text-sm text-purple-900 dark:text-purple-100">
                <p className="font-medium">Importa até 50 contatos por busca</p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Contatos serão vinculados às empresas automaticamente
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2 border-t">
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
            {loading ? 'Buscando...' : (activeTab === 'companies' ? '🔍 Buscar e Revisar' : 'Buscar Contatos')}
          </Button>
        </div>
      </DialogContent>
      
      {/* 🎯 Dialog de Revisão com Matching CNPJ + Capa Receita Federal */}
      {showReviewDialog && (
        <ApolloReviewDialog 
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          organizations={foundOrganizations}
          onImportComplete={() => {
            setShowReviewDialog(false);
            setFoundOrganizations([]);
            onImportComplete?.();
          }}
        />
      )}
    </Dialog>
  );
}
