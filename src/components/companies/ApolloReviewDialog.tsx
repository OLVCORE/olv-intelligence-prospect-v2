// ==========================================
// Apollo Review Dialog - Revisão com Matching CNPJ
// Restaura fluxo: Apollo → CNPJ Discovery → Capa Receita → Confirmação
// ==========================================

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Building2, MapPin, Globe, Users, DollarSign, AlertCircle, Search, XCircle, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ApolloOrganization {
  id: string;
  name: string;
  primary_domain?: string;
  website_url?: string;
  industry?: string;
  estimated_num_employees?: number;
  revenue_range?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  technologies?: string[];
  account_score?: number;
  [key: string]: any;
}

interface CNPJCandidate {
  cnpj: string;
  confidence: number;
  source: string;
  validation: {
    name_match: number;
    domain_match: number;
    location_match: number;
  };
  data?: any;
}

interface CompanyReviewItem {
  apolloOrg: ApolloOrganization;
  cnpjCandidates?: CNPJCandidate[];
  selectedCNPJ?: string;
  status: 'pending' | 'searching' | 'reviewed' | 'imported' | 'skipped';
  error?: string;
}

interface ApolloReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: ApolloOrganization[];
  onImportComplete?: () => void;
}

export function ApolloReviewDialog({ open, onOpenChange, organizations, onImportComplete }: ApolloReviewDialogProps) {
  const [reviewItems, setReviewItems] = useState<CompanyReviewItem[]>(
    organizations.map(org => ({
      apolloOrg: org,
      status: 'pending'
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [importing, setImporting] = useState(false);
  const [coverExpanded, setCoverExpanded] = useState(false);

  const currentItem = reviewItems[currentIndex];
  const progress = ((currentIndex + 1) / reviewItems.length) * 100;

  // Buscar CNPJ para empresa atual
  const handleSearchCNPJ = async () => {
    if (!currentItem) return;

    setReviewItems(prev => {
      const arr = [...prev];
      arr[currentIndex] = { ...arr[currentIndex], status: 'searching' };
      return arr;
    });

    try {
      console.log('[Apollo Review] 🔍 Buscando CNPJ para:', currentItem.apolloOrg.name);

      const { data, error } = await supabase.functions.invoke('discover-cnpj', {
        body: {
          companyId: null, // Não salva ainda
          companyName: currentItem.apolloOrg.name,
          domain: currentItem.apolloOrg.primary_domain || currentItem.apolloOrg.website_url
        }
      });

      if (error) throw error;

      console.log('[Apollo Review] 📊 Candidatos encontrados:', data);

      if (data.candidates && data.candidates.length > 0) {
        setReviewItems(prev => {
          const arr = [...prev];
          const base = arr[currentIndex];
          arr[currentIndex] = {
            ...base,
            cnpjCandidates: data.candidates,
            selectedCNPJ: data.candidates[0].cnpj,
            status: 'reviewed'
          };
          return arr;
        });
        toast.success(`${data.candidates.length} candidato(s) encontrado(s)`, {
          description: `Melhor match: ${data.candidates[0].confidence}%`
        });
      } else {
        setReviewItems(prev => {
          const arr = [...prev];
          const base = arr[currentIndex];
          arr[currentIndex] = {
            ...base,
            cnpjCandidates: [],
            status: 'reviewed'
          };
          return arr;
        });
        toast.info('Nenhum CNPJ encontrado', {
          description: 'Empresa será importada sem CNPJ'
        });
      }

    } catch (error: any) {
      console.error('[Apollo Review] ❌ Erro na busca:', error);
      setReviewItems(prev => {
        const arr = [...prev];
        arr[currentIndex] = {
          ...arr[currentIndex],
          status: 'pending',
          error: (error as any)?.message || 'Erro desconhecido'
        };
        return arr;
      });
      toast.error('Erro ao buscar CNPJ');
    }
  };

  // Selecionar CNPJ específico
  const handleSelectCNPJ = (cnpj: string) => {
    const updated = [...reviewItems];
    updated[currentIndex] = {
      ...updated[currentIndex],
      selectedCNPJ: cnpj
    };
    setReviewItems(updated);
  };

  // Abrir verificação oficial na Receita Federal
  const handleOpenReceita = async () => {
    const cnpj = reviewItems[currentIndex]?.selectedCNPJ;
    if (!cnpj) {
      toast.message('Selecione um CNPJ para verificar', {
        description: 'Escolha um candidato antes de abrir a Receita.'
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(cnpj.replace(/\D/g, ''));
      toast.success('CNPJ copiado', {
        description: 'Cole na página da Receita Federal para validar.'
      });
    } catch (e) {
      // Ignorar erro de clipboard em navegadores sem permissão
    }
    window.open('https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp', '_blank', 'noopener,noreferrer');
  };

  // Importar empresa atual
  const handleImportCurrent = async (cnpjOverride?: string) => {
    if (!currentItem || currentItem.status === 'imported') return;

    setImporting(true);
    const updated = [...reviewItems];

    try {
      const org = currentItem.apolloOrg;
      const selectedCandidate = currentItem.cnpjCandidates?.find(c => c.cnpj === (cnpjOverride || currentItem.selectedCNPJ));

      console.log('[Apollo Review] 💾 Importando:', org.name);

      // Montar dados da empresa
      const companyData: any = {
        name: org.name,
        domain: org.primary_domain,
        website: org.website_url,
        industry: org.industry,
        employees: org.estimated_num_employees,
        employee_count_from_apollo: org.estimated_num_employees,
        revenue_range_from_apollo: org.revenue_range,
        apollo_id: org.id,
        location: {
          city: org.city,
          state: org.state,
          country: org.country
        },
        linkedin_url: org.linkedin_url,
        technologies: org.technologies || [],
        account_score: org.account_score || 0,
        apollo_metadata: org,
        apollo_last_enriched_at: new Date().toISOString()
      };

      // Se tem CNPJ selecionado, adicionar
      if (currentItem.selectedCNPJ) {
        companyData.cnpj = currentItem.selectedCNPJ.replace(/\D/g, '');
        companyData.cnpj_status = 'ativo';
        
        // Se tem dados da Receita, enriquecer
        if (selectedCandidate?.data) {
          companyData.raw_data = {
            apollo: org,
            receita: selectedCandidate.data
          };
        }
      }

      const { data: company, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;

      console.log('[Apollo Review] ✅ Empresa importada:', company.name);

      updated[currentIndex] = { ...currentItem, status: 'imported' };
      setReviewItems(updated);

      toast.success(`✅ ${org.name} importada com sucesso!`);

      // Avançar para próxima
      if (currentIndex < reviewItems.length - 1) {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 800);
      } else {
        // Última empresa
        setTimeout(() => {
          onImportComplete?.();
          onOpenChange(false);
        }, 1000);
      }

    } catch (error: any) {
      console.error('[Apollo Review] ❌ Erro ao importar:', error);
      updated[currentIndex] = {
        ...currentItem,
        status: 'pending',
        error: error.message
      };
      setReviewItems(updated);
      toast.error('Erro ao importar empresa');
    } finally {
      setImporting(false);
    }
  };

  // Pular empresa atual
  const handleSkip = () => {
    const updated = [...reviewItems];
    updated[currentIndex] = { ...updated[currentIndex], status: 'skipped' };
    setReviewItems(updated);

    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onImportComplete?.();
      onOpenChange(false);
    }
  };

  // Estatísticas
  const stats = {
    imported: reviewItems.filter(i => i.status === 'imported').length,
    skipped: reviewItems.filter(i => i.status === 'skipped').length,
    pending: reviewItems.filter(i => i.status === 'pending' || i.status === 'searching').length
  };

  if (!currentItem) {
    return null;
  }

  const org = currentItem.apolloOrg;
  const bestCandidate = currentItem.cnpjCandidates?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Revisar Empresas do Apollo
            </span>
            <Badge variant="outline" className="ml-auto">
              {currentIndex + 1} de {reviewItems.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            <Progress value={progress} className="mt-2" />
            <div className="flex gap-4 mt-2 text-xs">
              <span>✅ Importadas: {stats.imported}</span>
              <span>⏭️ Puladas: {stats.skipped}</span>
              <span>⏳ Pendentes: {stats.pending}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[calc(90vh-220px)] overflow-y-auto">
          <div className="space-y-4 py-4">
            {/* Dados do Apollo */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{org.name}</h3>
                    {org.industry && (
                      <p className="text-sm text-muted-foreground">{org.industry}</p>
                    )}
                  </div>
                  {org.account_score && (
                    <Badge variant="default" className="text-lg px-3 py-1">
                      Score: {org.account_score}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {org.primary_domain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{org.primary_domain}</span>
                    </div>
                  )}
                  {org.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{org.city}, {org.state} - {org.country}</span>
                    </div>
                  )}
                  {org.estimated_num_employees && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{org.estimated_num_employees} funcionários</span>
                    </div>
                  )}
                  {org.revenue_range && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{org.revenue_range}</span>
                    </div>
                  )}
                </div>

                {org.technologies && org.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {org.technologies.slice(0, 8).map((tech: string) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Buscar CNPJ */}
            {currentItem.status === 'pending' && (
              <Button
                onClick={handleSearchCNPJ}
                className="w-full"
                size="lg"
                variant="outline"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar CNPJ na Receita Federal
              </Button>
            )}

            {currentItem.status === 'searching' && (
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Buscando CNPJ...</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Consultando Receita Federal e bases públicas</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Candidatos CNPJ Encontrados */}
            {currentItem.status === 'reviewed' && currentItem.cnpjCandidates && currentItem.cnpjCandidates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">📋 Receita Federal do Brasil</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden md:inline">Clique para selecionar; duplo clique para importar</span>
                    <Badge variant="outline">{currentItem.cnpjCandidates.length} candidato(s)</Badge>
                  </div>
                </div>

                {currentItem.cnpjCandidates.map((candidate, idx) => {
                  const isSelected = candidate.cnpj === currentItem.selectedCNPJ;
                  const isBestMatch = idx === 0;
                  const receitaData = candidate.data;

                  return (
                    <Card 
                      key={candidate.cnpj}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20' 
                          : 'border hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectCNPJ(candidate.cnpj)}
                      onDoubleClick={() => handleImportCurrent(candidate.cnpj)}
                      title={isSelected ? 'Duplo clique para importar' : 'Clique para selecionar; duplo clique para importar'}
                    >
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg">
                                {candidate.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                              </span>
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {isBestMatch && (
                                <Badge variant="default" className="text-xs">
                                  🏆 Melhor Match
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm font-medium text-foreground">
                              {candidate.data?.nome || candidate.data?.razao_social || candidate.data?.razaoSocial || candidate.data?.name}
                            </p>
                            
                            {candidate.data?.fantasia && candidate.data.fantasia !== (candidate.data?.nome || candidate.data?.razao_social || candidate.data?.razaoSocial || candidate.data?.name) && (
                              <p className="text-xs text-muted-foreground">
                                Nome Fantasia: {candidate.data.fantasia}
                              </p>
                            )}
                          </div>

                          <div className="text-right space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${
                                candidate.confidence >= 80 ? 'bg-green-500' :
                                candidate.confidence >= 60 ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }`} />
                              <span className="text-lg font-bold">{candidate.confidence}%</span>
                            </div>
                            <Badge variant={candidate.confidence >= 80 ? "default" : "secondary"}>
                              {candidate.confidence >= 80 ? 'Alta' : candidate.confidence >= 60 ? 'Média' : 'Baixa'}
                            </Badge>
                          </div>
                        </div>

                        {/* CAPA DA RECEITA FEDERAL */}
                        {candidate.data && isSelected && (
                          <div
                            className={`space-y-3 pt-3 border-t-2 bg-gradient-to-br from-green-50/80 to-blue-50/80 dark:from-green-950/30 dark:to-blue-950/30 ${coverExpanded ? "fixed inset-0 z-50 bg-background px-4 md:px-8 py-4 md:py-8 rounded-none mx-0" : "-mx-4 px-4 py-4 rounded-lg"}`}
                          >
                            <div className="flex items-center justify-between border-b-2 border-green-600/30 pb-2">
                              <div className="flex flex-col">
                                <p className="text-base font-bold text-foreground">
                                  {candidate.data?.nome || candidate.data?.razao_social || candidate.data?.razaoSocial || candidate.data?.name}
                                </p>
                                <p className="text-xs font-semibold text-primary uppercase">
                                  📄 Comprovante de Inscrição e Situação Cadastral
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {candidate.data.situacao && (
                                  <Badge 
                                    variant={candidate.data.situacao === 'ATIVA' ? 'default' : 'destructive'}
                                    className="font-semibold"
                                  >
                                    {candidate.data.situacao}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setCoverExpanded(!coverExpanded)}
                                  aria-label={coverExpanded ? "Minimizar capa" : "Expandir capa em tela cheia"}
                                  title={coverExpanded ? "Minimizar" : "Expandir"}
                                >
                                  {coverExpanded ? (
                                    <Minimize2 className="h-4 w-4" />
                                  ) : (
                                    <Maximize2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className={coverExpanded ? "h-[calc(100vh-160px)] overflow-y-auto pr-2" : ""}>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Número de Inscrição</p>
                                  <p className="font-mono font-bold text-base">
                                    {candidate.cnpj.replace(/(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})/, '$1.$2.$3/$4-$5')}
                                  </p>
                                </div>
                                
                                {candidate.data.abertura && (
                                  <div className="text-sm space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Data de Abertura</p>
                                    <p className="font-medium">{candidate.data.abertura}</p>
                                  </div>
                                )}
                              </div>

                              {(candidate.data?.nome || candidate.data?.razao_social || candidate.data?.razaoSocial || candidate.data?.name) && (
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Nome Empresarial</p>
                                  <p className="font-bold">{candidate.data?.nome || candidate.data?.razao_social || candidate.data?.razaoSocial || candidate.data?.name}</p>
                                </div>
                              )}

                              {candidate.data.fantasia && candidate.data.fantasia !== candidate.data.nome && (
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Nome Fantasia</p>
                                  <p className="font-medium">{candidate.data.fantasia}</p>
                                </div>
                              )}

                              {(candidate.data.logradouro || candidate.data.municipio) && (
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Endereço Completo</p>
                                  <p className="font-medium text-xs leading-relaxed">
                                    {candidate.data.logradouro && `${candidate.data.logradouro}`}
                                    {candidate.data.numero && `, ${candidate.data.numero}`}
                                    {candidate.data.complemento && ` - ${candidate.data.complemento}`}
                                    {candidate.data.bairro && <><br />{candidate.data.bairro}</>}
                                    {candidate.data.municipio && <><br />{candidate.data.municipio}</>}
                                    {candidate.data.uf && `-${candidate.data.uf}`}
                                    {candidate.data.cep && ` - CEP: ${candidate.data.cep}`}
                                  </p>
                                </div>
                              )}

                              {candidate.data.atividade_principal && (
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Atividade Principal</p>
                                  {Array.isArray(candidate.data.atividade_principal) ? (
                                    candidate.data.atividade_principal.map((ativ: any, i: number) => (
                                      <p key={i} className="text-xs bg-primary/10 px-2 py-1 rounded font-medium">
                                        {ativ.code} - {ativ.text}
                                      </p>
                                    ))
                                  ) : (
                                    <p className="text-xs bg-primary/10 px-2 py-1 rounded font-medium">
                                      {candidate.data.atividade_principal}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3">
                                {candidate.data.porte && (
                                  <div className="text-sm space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Porte</p>
                                    <p className="font-medium">{candidate.data.porte}</p>
                                  </div>
                                )}

                                {candidate.data.capital_social && (
                                  <div className="text-sm space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Capital Social</p>
                                    <p className="font-bold text-green-600">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(candidate.data.capital_social))}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {candidate.data.natureza_juridica && (
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Natureza Jurídica</p>
                                  <p className="font-medium text-xs">{candidate.data.natureza_juridica}</p>
                                </div>
                              )}

                              {candidate.data.email && (
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">E-mail</p>
                                  <p className="font-medium text-xs">{candidate.data.email}</p>
                                </div>
                              )}

                              {candidate.data.telefone && (
                                <div className="text-sm space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Telefone</p>
                                  <p className="font-medium">{candidate.data.telefone}</p>
                                </div>
                              )}

                              <div className="pt-2 border-t border-green-600/20">
                                <p className="text-xs text-muted-foreground italic">
                                  ✓ Dados validados via {candidate.source === 'receitaws' ? 'ReceitaWS - API Oficial da Receita Federal' : candidate.source}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Match Details */}
                        <div className="flex gap-2 text-xs">
                          <Badge variant="outline">
                            Nome: {candidate.validation.name_match}%
                          </Badge>
                          <Badge variant="outline">
                            Domínio: {candidate.validation.domain_match}%
                          </Badge>
                          <Badge variant="outline">
                            Local: {candidate.validation.location_match}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Sem CNPJ encontrado */}
            {currentItem.status === 'reviewed' && (!currentItem.cnpjCandidates || currentItem.cnpjCandidates.length === 0) && (
              <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardContent className="pt-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">CNPJ não encontrado</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      A empresa será importada apenas com dados do Apollo. Você poderá adicionar o CNPJ manualmente depois.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Ações */}
        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={importing || currentItem.status === 'imported'}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Pular
          </Button>

          <div className="flex gap-2">
            {currentItem.status === 'pending' && (
              <Button
                onClick={handleSearchCNPJ}
                variant="outline"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar CNPJ
              </Button>
            )}

            {currentItem.selectedCNPJ && (
              <Button
                variant="outline"
                onClick={handleOpenReceita}
                title="Abrir verificação oficial (abre em nova aba)"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Verificar na Receita Federal
              </Button>
            )}
            
            {(currentItem.status === 'reviewed' || currentItem.status === 'pending') && (
              <Button
                onClick={() => handleImportCurrent()}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {currentItem.selectedCNPJ ? 'Confirmar e Importar' : 'Importar sem CNPJ'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
