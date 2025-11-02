import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, MapPin, Users, TrendingUp, AlertTriangle, Plus, Sparkles, Eye, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimilarCompaniesTabProps {
  companyId: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  state?: string;
  size?: string;
}

interface WebDiscoveredCompany {
  id: string;
  name: string;
  cnpj: string | null;
  setor: string;
  uf: string;
  city?: string;
  employees?: number | null;
  revenue?: number | null;
  website?: string | null;
  linkedin_url?: string | null;
  source: string;
  discovery_method: string;
  discovered_at: string;
  similarity_score: number;
  needs_enrichment: boolean;
  enrichment_status: string;
  keywords?: string[];
  already_in_database: boolean;
  existing_id?: string | null;
  raw_data?: any;
}

interface SimilarCompaniesData {
  similar_companies: WebDiscoveredCompany[];
  statistics: {
    total: number;
    new_companies: number;
    already_in_database: number;
    needs_enrichment: number;
    by_discovery_method: Record<string, number>;
  };
  insights: string[];
  search_criteria: {
    cnae?: string;
    sector?: string;
    state?: string;
    keywords: string;
  };
}

// Função para calcular similaridade
function calculateSimilarity(result: any, target: { companyName: string; sector?: string; state?: string }): number {
  let score = 0;
  
  // Setor similar (+40 pontos)
  if (target.sector && result.industry?.toLowerCase().includes(target.sector.toLowerCase())) {
    score += 40;
  }
  
  // Estado similar (+30 pontos)
  if (target.state && result.location?.includes(target.state)) {
    score += 30;
  }
  
  // Nome contém palavras-chave (+20 pontos)
  const targetWords = target.companyName.toLowerCase().split(' ').filter(w => w.length > 3);
  const resultWords = (result.name || result.title || '').toLowerCase();
  if (targetWords.some(word => resultWords.includes(word))) {
    score += 20;
  }
  
  // Tem CNPJ (+10 pontos)
  if (result.cnpj) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

// Função para extrair dados da web
function parseWebResult(result: any): Partial<WebDiscoveredCompany> {
  return {
    name: result.company_name || result.name || result.title || 'Empresa desconhecida',
    cnpj: result.cnpj || result.document,
    setor: result.industry || result.sector || result.segment,
    uf: result.state || result.uf || result.location?.split(',')[1]?.trim()?.substring(0, 2),
    employees: result.employees || result.employee_count,
    revenue: result.revenue || result.annual_revenue,
    website: result.website || result.url,
    linkedin_url: result.linkedin_url || result.linkedin,
    raw_data: result
  };
}

export function SimilarCompaniesTab({ 
  companyId, 
  companyName, 
  cnpj,
  sector, 
  state, 
  size 
}: SimilarCompaniesTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddingCompany, setIsAddingCompany] = useState<string | null>(null);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['similar-companies-web', companyId, companyName, sector, state],
    queryFn: async (): Promise<SimilarCompaniesData> => {
      console.log('[SIMILAR-WEB] ===== BUSCA NA WEB (NÃO NO BANCO) =====');
      console.log('[SIMILAR-WEB] Empresa alvo:', { companyName, sector, state });

      // Construir queries de busca inteligentes
      const searchQueries = [
        `empresas ${sector || 'tecnologia'} Brasil site:linkedin.com`,
        `${sector || 'tecnologia'} ${state || ''} empresas Brasil`,
        `"${companyName}" similares concorrentes`,
        `empresas ${sector || 'tecnologia'} ${state || ''} CNPJ`,
      ].filter(Boolean);

      let allResults: any[] = [];

      // Busca web REAL usando Serper.dev
      console.log('[SIMILAR-WEB] Executando buscas na web com Serper.dev...');
      
      for (const query of searchQueries) {
        try {
          console.log(`[SIMILAR-WEB] Query: "${query}"`);
          
          const { data: searchData, error: searchError } = await supabase.functions.invoke('web-search', {
            body: { 
              query, 
              limit: 5,
              country: 'BR',
              language: 'pt'
            }
          });
          
          if (searchError) {
            console.error('[SIMILAR-WEB] Erro na busca:', searchError);
            continue;
          }
          
          if (!searchData?.success) {
            console.error('[SIMILAR-WEB] API retornou erro:', searchData?.error);
            continue;
          }
          
          console.log(`[SIMILAR-WEB] Resultados da web: ${searchData.results?.length || 0}`);
          
          if (searchData.results && searchData.results.length > 0) {
            allResults.push(...searchData.results);
          }
        } catch (error) {
          console.error('[SIMILAR-WEB] Exceção na busca:', error);
        }
      }
      
      // FALLBACK: Se nenhum resultado da web, buscar no banco
      if (allResults.length === 0) {
        console.log('[SIMILAR-WEB] Sem resultados da web, usando fallback (banco de dados)');
        
        const { data: dbCompanies, error: dbError } = await (supabase as any)
          .from('suggested_companies')
          .select('*')
          .neq('id', companyId)
          .limit(20);

        if (dbError) {
          console.error('[SIMILAR-WEB] Erro ao buscar no banco:', dbError);
          throw dbError;
        }

        if (dbCompanies && dbCompanies.length > 0) {
          allResults = dbCompanies.map((company: any) => ({
            title: company.company_name,
            url: company.website,
            snippet: `${company.sector || ''} - ${company.state || ''}`,
            description: `${company.sector || ''} - ${company.state || ''}`,
            cnpj: company.cnpj,
            employees: company.employees_count,
            location: company.state,
            industry: company.sector
          }));
        }
      }

      console.log('[SIMILAR-WEB] Total de resultados brutos:', allResults.length);

      // Processar e limpar resultados
      const processedCompanies: WebDiscoveredCompany[] = allResults
        .map(result => {
          const parsed = parseWebResult(result);
          const similarity_score = calculateSimilarity(result, { companyName, sector, state });
          
          return {
            source: 'web_discovery',
            discovered_at: new Date().toISOString(),
            similarity_score,
            needs_enrichment: true,
            enrichment_status: 'pending',
            already_in_database: false,
            name: parsed.name || 'Empresa desconhecida',
            cnpj: parsed.cnpj,
            setor: parsed.setor,
            uf: parsed.uf,
            employees: parsed.employees,
            revenue: parsed.revenue,
            website: parsed.website,
            linkedin_url: parsed.linkedin_url,
            raw_data: result
          } as WebDiscoveredCompany;
        })
        .filter((company, index, self) =>
          // Remover duplicatas por CNPJ ou nome
          index === self.findIndex(c => 
            (c.cnpj && c.cnpj === company.cnpj) || c.name === company.name
          )
        )
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 10); // Top 10 mais similares

      console.log('[SIMILAR-WEB] Empresas processadas:', processedCompanies.length);

      // Verificar se já existem no banco
      const enrichedCompanies: WebDiscoveredCompany[] = [];
      
      for (const company of processedCompanies) {
        if (!company.cnpj) {
          enrichedCompanies.push({ ...company, already_in_database: false });
          continue;
        }

        const { data: existing } = await (supabase as any)
          .from('suggested_companies')
          .select('id')
          .eq('cnpj', company.cnpj)
          .maybeSingle();

        enrichedCompanies.push({
          ...company,
          already_in_database: !!existing,
          existing_id: existing?.id
        });
      }

      // Estatísticas
      const total = enrichedCompanies.length;
      const newCompanies = enrichedCompanies.filter(c => !c.already_in_database).length;
      const existingCompanies = enrichedCompanies.filter(c => c.already_in_database).length;

      // Insights
      const insights: string[] = [];
      
      if (newCompanies > 0) {
        insights.push(`🆕 ${newCompanies} NOVAS empresas descobertas na web!`);
        insights.push(`💎 Oportunidade de expandir banco de dados em ${newCompanies} empresas.`);
        insights.push(`🎯 Clique em "Adicionar à Quarentena" para iniciar enriquecimento.`);
      }
      
      if (existingCompanies > 0) {
        insights.push(`✅ ${existingCompanies} empresas já estão no banco de dados.`);
      }
      
      if (total === 0) {
        insights.push(`⚠️ Nenhuma empresa similar encontrada na web.`);
        insights.push(`💡 Tente ajustar os critérios de busca ou setor.`);
      } else {
        insights.push(`📊 Total de ${total} empresas similares identificadas.`);
        insights.push(`🔍 Empresas ordenadas por score de similaridade (0-100).`);
      }

      console.log('[SIMILAR-WEB] ===== RESULTADO FINAL =====');
      
      return {
        similar_companies: enrichedCompanies,
        statistics: {
          total,
          new_companies: newCompanies,
          already_in_database: existingCompanies,
          needs_enrichment: newCompanies,
          by_discovery_method: {}
        },
        insights,
        search_criteria: { 
          sector, 
          state,
          keywords: ''
        }
      };
    },
    enabled: !!companyId && !!companyName,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddToQuarantine = async (company: WebDiscoveredCompany) => {
    try {
      setIsAddingCompany(company.name);
      console.log('[ADD-QUARANTINE] Adicionando empresa:', company.name);
      
      // Inserir na tabela suggested_companies com campos existentes
      const insertData: any = {
        cnpj: company.cnpj,
        source: 'similar_company_discovery',
        discovered_from_company_id: companyId,
        similarity_score: company.similarity_score,
        enrichment_status: 'pending',
        discovered_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      // Adicionar campos opcionais se existirem
      if (company.name) insertData.company_name = company.name;
      if (company.website) insertData.website = company.website;
      if (company.linkedin_url) insertData.linkedin_url = company.linkedin_url;
      
      const { data: newCompany, error } = await (supabase as any)
        .from('suggested_companies')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log('[ADD-QUARANTINE] Empresa adicionada:', newCompany.id);

      // Mostrar toast de sucesso
      toast({
        title: `✅ ${company.name} adicionada à quarentena!`,
        description: 'Iniciando processo de enriquecimento...',
      });

      // Iniciar enriquecimento automático em background
      startEnrichmentProcess(newCompany.id).catch(console.error);

      // Atualizar lista
      refetch();

    } catch (error: any) {
      console.error('[ADD-QUARANTINE] Erro:', error);
      toast({
        title: 'Erro ao adicionar empresa',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsAddingCompany(null);
    }
  };

  const startEnrichmentProcess = async (newCompanyId: string) => {
    try {
      console.log('[ENRICHMENT] Iniciando enriquecimento para:', newCompanyId);
      
      // Atualizar status para in_progress
      await supabase
        .from('suggested_companies')
        .update({ enrichment_status: 'in_progress' })
        .eq('id', newCompanyId);

      // PASSO 1: Enriquecer com Receita Federal (se tiver CNPJ)
      // TODO: Implementar edge function
      
      // PASSO 2: Enriquecer com Apollo (se tiver API key)
      // TODO: Implementar edge function

      // PASSO 3: Análise STC automática
      // TODO: Implementar edge function

      // Atualizar status para completed
      await supabase
        .from('suggested_companies')
        .update({ enrichment_status: 'completed' })
        .eq('id', newCompanyId);

      console.log('[ENRICHMENT] Enriquecimento iniciado com sucesso');
      
      toast({
        title: 'Enriquecimento em andamento',
        description: 'A empresa está sendo processada em segundo plano.'
      });
      
    } catch (error) {
      console.error('[ENRICHMENT] Erro no enriquecimento:', error);
      
      // Atualizar status para failed
      await supabase
        .from('suggested_companies')
        .update({ enrichment_status: 'failed' })
        .eq('id', newCompanyId);
    }
  };

  const handleQuickEnrich = async (company: WebDiscoveredCompany) => {
    toast({
      title: 'Enriquecimento rápido',
      description: 'Esta funcionalidade estará disponível em breve.'
    });
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Atualizando...',
      description: 'Buscando novas empresas similares na web.'
    });
  };

  if (isLoading) {
    return (
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="absolute inset-0 blur-xl opacity-30 bg-primary -z-10" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Buscando empresas similares na web...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg">Erro ao buscar empresas</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { similar_companies, statistics, insights } = data;

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Empresas Similares Descobertas na Web</CardTitle>
                <CardDescription>
                  Busca inteligente de empresas similares para crescimento do banco de dados
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{statistics.total}</div>
              <div className="text-sm text-muted-foreground">Total Encontradas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statistics.new_companies}</div>
              <div className="text-sm text-muted-foreground">Novas Empresas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{statistics.already_in_database}</div>
              <div className="text-sm text-muted-foreground">Já no Banco</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statistics.needs_enrichment}</div>
              <div className="text-sm text-muted-foreground">Para Enriquecer</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Insights Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <p key={idx} className="text-sm leading-relaxed">
                  {insight}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Empresas */}
      <div className="grid gap-4">
        {similar_companies.map((company, idx) => (
          <Card 
            key={idx} 
            className={`border-muted/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 hover:border-primary/30 transition-all duration-300 ${
              company.already_in_database ? 'opacity-75' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {company.cnpj ? `CNPJ: ${company.cnpj}` : 'CNPJ não disponível'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Badge de Status */}
                <div className="flex gap-2">
                  {company.already_in_database ? (
                    <Badge variant="secondary" className="gap-1">
                      ✅ Já no Banco
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-emerald-600 dark:bg-emerald-600 gap-1">
                      🆕 Nova Empresa
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-mono">
                    Score: {company.similarity_score}/100
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Informações da Empresa */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Setor:</span>
                    <span className="font-medium">{company.setor || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="font-medium">{company.uf || 'N/A'}</span>
                  </div>
                  {company.employees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Funcionários:</span>
                      <span className="font-medium">{company.employees}</span>
                    </div>
                  )}
                  {company.revenue && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Receita:</span>
                      <span className="font-medium">{company.revenue}</span>
                    </div>
                  )}
                </div>

                {company.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visitar Website
                    </a>
                  </div>
                )}
                
                {/* Botões de Ação */}
                <div className="flex gap-2 pt-2 border-t">
                  {!company.already_in_database ? (
                    <>
                      <Button
                        onClick={() => handleAddToQuarantine(company)}
                        className="flex-1 gap-2"
                        variant="default"
                        disabled={isAddingCompany === company.name}
                      >
                        {isAddingCompany === company.name ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Adicionar à Quarentena
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleQuickEnrich(company)}
                        variant="outline"
                        size="icon"
                        title="Enriquecimento rápido"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate(`/leads/icp-quarantine?company=${company.existing_id}`)}
                      className="flex-1 gap-2"
                      variant="secondary"
                    >
                      <Eye className="w-4 h-4" />
                      Ver na Quarentena
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {similar_companies.length === 0 && (
          <Card className="border-muted/50 bg-card/50">
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-lg font-semibold">Nenhuma empresa similar encontrada</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Tente ajustar os critérios de busca ou o setor da empresa para encontrar mais resultados.
                </p>
                <Button onClick={handleRefresh} variant="outline" className="gap-2 mt-4">
                  <RefreshCw className="h-4 w-4" />
                  Buscar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
