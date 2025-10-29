import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Search, Target, CheckCircle2, XCircle, Download, Plus, RefreshCw } from "lucide-react";
import { useSectors } from "@/hooks/useSectors";
import { useNichesBySector } from "@/hooks/useNichesBySector";
import { useDiscoverCompanies, useSuggestedCompanies, useValidateEnrichCompany, useAddCompaniesToBank } from "@/hooks/useCompanyDiscovery";
import { useBrazilStates, useMunicipalitiesByState } from "@/hooks/useBrazilGeography";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MunicipalityCombobox } from "@/components/discovery/MunicipalityCombobox";
import { CompanyCombobox } from "@/components/discovery/CompanyCombobox";

export default function CompanyDiscoveryPage() {
  const [searchMode, setSearchMode] = useState<'new' | 'similar'>('new');
  const [sectorCode, setSectorCode] = useState<string>('');
  const [nicheCode, setNicheCode] = useState<string>('');
  const [region, setRegion] = useState<string>('all');
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [sourceCompanyId, setSourceCompanyId] = useState<string>('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const { data: sectors } = useSectors();
  const { data: niches } = useNichesBySector(sectorCode);
  const { data: brazilStates } = useBrazilStates();
  const { data: municipalities } = useMunicipalitiesByState(state);
  const discoverMutation = useDiscoverCompanies();
  const validateMutation = useValidateEnrichCompany();
  const addToBankMutation = useAddCompaniesToBank();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: suggestedCompanies, isLoading } = useSuggestedCompanies(user?.id);

  const { data: companies } = useQuery({
    queryKey: ['companies-for-discovery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleDiscover = () => {
    if (!user?.id || !nicheCode || !state) {
      return;
    }

    discoverMutation.mutate({
      userId: user.id,
      sectorCode,
      nicheCode,
      state,
      city: city && city !== 'all' ? city : undefined,
      searchMode,
      sourceCompanyId: searchMode === 'similar' ? sourceCompanyId : undefined,
    });
  };

  const handleValidate = (suggestedId: string) => {
    validateMutation.mutate(suggestedId);
  };

  const handleAddToBank = () => {
    if (selectedCompanies.length === 0) return;
    addToBankMutation.mutate(selectedCompanies);
    setSelectedCompanies([]);
  };

  const handleDownloadCSV = () => {
    if (!suggestedCompanies || selectedCompanies.length === 0) return;

    const selected = suggestedCompanies.filter(c => selectedCompanies.includes(c.id));
    const csv = [
      ['Nome', 'CNPJ', 'Domínio', 'Estado', 'Cidade', 'Validado', 'Fonte'].join(','),
      ...selected.map(c => [
        c.company_name,
        c.cnpj || '',
        c.domain || '',
        c.state || '',
        c.city || '',
        c.cnpj_validated ? 'Sim' : 'Não',
        c.source
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empresas-descobertas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === suggestedCompanies?.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(suggestedCompanies?.map(c => c.id) || []);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-8 w-8" />
            Descoberta de Empresas
          </h1>
          <p className="text-muted-foreground">
            Busque e descubra novas empresas para expandir sua base de prospecção
          </p>
        </div>

        {/* Modo de Descoberta */}
        <Card>
          <CardHeader>
            <CardTitle>Modo de Descoberta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as 'new' | 'similar')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Empresas Novas
                </TabsTrigger>
                <TabsTrigger value="similar">
                  <Target className="h-4 w-4 mr-2" />
                  Buscar Similares
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Critérios de Busca */}
        <Card>
          <CardHeader>
            <CardTitle>Critérios de Busca</CardTitle>
            <CardDescription>
              {searchMode === 'new' 
                ? 'Defina o nicho e localização para descobrir novas empresas'
                : 'Escolha uma empresa base para encontrar similares'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Setor</label>
                <Select value={sectorCode} onValueChange={setSectorCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors?.map((sector) => (
                      <SelectItem key={sector.sector_code} value={sector.sector_code}>
                        {sector.sector_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nicho *</label>
                <Select value={nicheCode} onValueChange={setNicheCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches?.map((niche) => (
                      <SelectItem key={niche.niche_code} value={niche.niche_code}>
                        {niche.niche_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Região</label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as regiões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as regiões</SelectItem>
                    <SelectItem value="Norte">Norte</SelectItem>
                    <SelectItem value="Nordeste">Nordeste</SelectItem>
                    <SelectItem value="Centro-Oeste">Centro-Oeste</SelectItem>
                    <SelectItem value="Sudeste">Sudeste</SelectItem>
                    <SelectItem value="Sul">Sul</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estado *</label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {brazilStates?.filter(s => !region || region === 'all' || s.region === region).map((s) => (
                      <SelectItem key={s.state_code} value={s.state_code}>
                        {s.state_name} ({s.state_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Município (opcional)</label>
                <MunicipalityCombobox
                  municipalities={municipalities}
                  value={city}
                  onChange={setCity}
                  disabled={!state}
                />
              </div>
            </div>

            {searchMode === 'similar' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa Base *</label>
                <CompanyCombobox
                  companies={companies}
                  value={sourceCompanyId}
                  onChange={setSourceCompanyId}
                />
              </div>
            )}

            <Button 
              onClick={handleDiscover}
              disabled={!nicheCode || !state || (searchMode === 'similar' && !sourceCompanyId) || discoverMutation.isPending}
              className="w-full"
            >
              {discoverMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Iniciar Descoberta
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Empresas Descobertas */}
        {suggestedCompanies && suggestedCompanies.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Empresas Descobertas ({suggestedCompanies.length})</span>
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    {selectedCompanies.length === suggestedCompanies.length ? 'Limpar Seleção' : 'Selecionar Todas'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedCompanies.map((company) => (
                  <div key={company.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCompanies([...selectedCompanies, company.id]);
                            } else {
                              setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{company.company_name}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {company.cnpj && (
                              <Badge variant={company.cnpj_validated ? "default" : "secondary"}>
                                CNPJ: {company.cnpj} {company.cnpj_validated ? '✅' : '⏳'}
                              </Badge>
                            )}
                            {company.state && (
                              <Badge variant="outline">
                                {company.state}{company.city ? ` - ${company.city}` : ''}
                              </Badge>
                            )}
                            <Badge variant="outline">{company.source}</Badge>
                            {company.similarity_score && (
                              <Badge variant="secondary">
                                {Math.round(company.similarity_score * 100)}% similar
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pl-8">
                      {!company.cnpj_validated && company.cnpj && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleValidate(company.id)}
                          disabled={validateMutation.isPending}
                        >
                          Validar CNPJ
                        </Button>
                      )}
                      {company.apollo_data && (
                        <Badge variant="default">Apollo ✅</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
                <CardDescription>
                  {selectedCompanies.length} empresa(s) selecionada(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleDownloadCSV}
                  disabled={selectedCompanies.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar CSV ({selectedCompanies.length})
                </Button>
                <Button
                  onClick={handleAddToBank}
                  disabled={selectedCompanies.length === 0 || addToBankMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar ao Banco + Executar ICP
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
