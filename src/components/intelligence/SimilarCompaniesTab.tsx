import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, MapPin, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SimilarCompaniesTabProps {
  companyId: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  state?: string;
  size?: string;
}

interface SimilarCompany {
  id: string;
  name: string;
  cnpj: string;
  setor: string;
  uf: string;
  employees: number;
  revenue: string;
  totvs_status: string;
  totvs_confidence: string;
  totvs_score: number;
  uses_totvs: boolean;
}

interface SimilarCompaniesData {
  similar_companies: SimilarCompany[];
  statistics: {
    total: number;
    using_totvs: number;
    percentage_totvs: number;
    not_using_totvs: number;
  };
  insights: string[];
  search_criteria: {
    sector?: string;
    state?: string;
    size?: string;
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
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['similar-companies-direct', companyId, sector, state, size],
    queryFn: async () => {
      console.log('[SIMILAR] ===== BUSCA DIRETA NO BANCO =====');
      console.log('[SIMILAR] Parâmetros:', { companyId, companyName, sector, state, size });

      // 1) Definir tabela e tentar obter empresa alvo para critérios (setor/uf/employees)
      const sb = supabase as any;
      let useTable = 'quarantine_companies';
      let selectColumns = 'id, name, cnpj, setor, uf, employees, revenue, is_disqualified';

      let targetCompany: any = null;
      try {
        const { data: t, error: te } = await sb
          .from(useTable)
          .select(selectColumns)
          .eq('id', companyId)
          .maybeSingle();
        if (te) throw te;
        targetCompany = t;
      } catch (err: any) {
        if (err?.code === 'PGRST205' || String(err?.message || '').includes('Could not find the table')) {
          console.warn('[SIMILAR] Tabela quarantine_companies ausente. Usando fallback: companies');
          useTable = 'companies';
          // Mapear colunas para os mesmos aliases esperados pelo front
          selectColumns = 'id, name, cnpj, setor:industry, uf:headquarters_state, employees, revenue, is_disqualified';
          const { data: t2 } = await sb
            .from(useTable)
            .select(selectColumns)
            .eq('id', companyId)
            .maybeSingle();
          targetCompany = t2;
        } else {
          console.warn('[SIMILAR] Empresa alvo não encontrada, seguindo com busca ampla.', err?.message);
        }
      }

      const filterSectorField = useTable === 'companies' ? 'industry' : 'setor';
      const filterStateField = useTable === 'companies' ? 'headquarters_state' : 'uf';

      // 2) Buscar candidatas
      let query: any = sb
        .from(useTable as any)
        .select(selectColumns)
        .neq('id', companyId)
        .eq('is_disqualified', false);

      const useSector = sector || targetCompany?.setor;
      const useState = state || targetCompany?.uf;
      const targetEmployees = targetCompany?.employees as number | undefined;

      if (useSector) query = query.eq(filterSectorField, useSector);
      if (useState) query = query.eq(filterStateField, useState);

      const { data: companies, error: companiesError } = await query.limit(50);
      if (companiesError) {
        console.error('[SIMILAR] Erro na query:', companiesError);
        throw companiesError;
      }

      if (!companies || companies.length === 0) {
        console.log('[SIMILAR] Nenhuma empresa encontrada mesmo com filtros. Tentando fallback com filtro de setor...');
        let alt: any = sb
          .from(useTable as any)
          .select(selectColumns)
          .neq('id', companyId)
          .eq('is_disqualified', false);
        if (useSector) alt = alt.eq(filterSectorField, useSector);
        const { data: altCompanies } = await alt.limit(50);
        if (!altCompanies || altCompanies.length === 0) {
          return {
            similar_companies: [],
            statistics: { total: 0, using_totvs: 0, percentage_totvs: 0, not_using_totvs: 0 },
            insights: ['⚠️ Nenhuma empresa similar encontrada no banco de dados.'],
            search_criteria: { sector: useSector, state: useState, size }
          } as SimilarCompaniesData;
        }
        // usar resultado alternativo como base
        (companies as any) = altCompanies;
      }

      // 3) Score de similaridade
      const employeeRange = targetEmployees ? { min: Math.floor(targetEmployees * 0.5), max: Math.ceil(targetEmployees * 2) } : null;
      const scored = (companies || []).map((company: any) => {
        let similarity_score = 0;
        if (useSector && company.setor === useSector) similarity_score += 40;
        if (useState && company.uf === useState) similarity_score += 20;
        if (employeeRange && company.employees && targetEmployees) {
          const diff = Math.abs(company.employees - targetEmployees);
          const pct = diff / targetEmployees;
          if (pct <= 0.3) similarity_score += 20; else if (pct <= 0.5) similarity_score += 15; else if (pct <= 1) similarity_score += 10;
        }
        return { ...company, similarity_score };
      }).sort((a: any, b: any) => b.similarity_score - a.similarity_score).slice(0, 10);

      // 4) Enriquecer com status TOTVS
      const enriched = await Promise.all(scored.map(async (company: any) => {
        const { data: report } = await supabase
          .from('totvs_detection_reports')
          .select('detection_status, confidence, score')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const uses_totvs = report?.detection_status === 'no-go' || (report?.score && report.score >= 70);
        return { ...company, totvs_status: report?.detection_status || 'desconhecido', totvs_confidence: report?.confidence || 'baixa', totvs_score: report?.score || 0, uses_totvs };
      }));

      // 5) Estatísticas + insights
      const total = enriched.length;
      const using_totvs = enriched.filter(c => c.uses_totvs).length;
      const percentage = total > 0 ? (using_totvs / total * 100) : 0;

      const insights: string[] = [];
      if (percentage >= 60) insights.push(`🔥 ${percentage.toFixed(0)}% dos concorrentes JÁ USAM TOTVS. Alta pressão competitiva.`);
      else if (percentage >= 40) insights.push(`⚡ ${percentage.toFixed(0)}% do mercado usa TOTVS. Janela de oportunidade aberta.`);
      else if (percentage >= 20) insights.push(`💡 ${percentage.toFixed(0)}% já usa TOTVS. Mercado em expansão.`);
      else insights.push(`🆕 Apenas ${percentage.toFixed(0)}% usa TOTVS. Oceano azul para explorar.`);

      if (using_totvs > 0) {
        const names = enriched.filter(c => c.uses_totvs).slice(0, 3).map(c => c.name).join(', ');
        insights.push(`📊 Prova social: ${names}${using_totvs > 3 ? ` e mais ${using_totvs - 3}` : ''}.`);
      }

      return {
        similar_companies: enriched,
        statistics: { total, using_totvs, percentage_totvs: parseFloat(percentage.toFixed(1)), not_using_totvs: total - using_totvs },
        insights,
        search_criteria: { sector: useSector, state: useState, size }
      } as SimilarCompaniesData;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Atualizando...',
      description: 'Buscando empresas similares atualizadas.',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando empresas similares...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-lg">Erro ao carregar análise</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
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

  const { similar_companies, statistics, insights, search_criteria } = data;

  const getPenetrationColor = (percentage: number) => {
    if (percentage >= 50) return 'destructive';
    if (percentage >= 30) return 'default';
    return 'secondary';
  };

  const getTotvsStatusBadge = (company: SimilarCompany) => {
    if (company.uses_totvs) {
      return <Badge variant="destructive">Cliente TOTVS</Badge>;
    }
    return <Badge variant="secondary">Não Cliente</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise de Mercado
          </CardTitle>
          <CardDescription>
            Empresas similares no segmento de {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-primary">{statistics.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Empresas Similares</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-destructive">{statistics.using_totvs}</p>
              <p className="text-sm text-muted-foreground mt-1">Usando TOTVS</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-green-600">{statistics.not_using_totvs}</p>
              <p className="text-sm text-muted-foreground mt-1">Não Usando TOTVS</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{statistics.percentage_totvs}%</p>
              <p className="text-sm text-muted-foreground mt-1">Penetração TOTVS</p>
            </div>
          </div>

          {/* Critérios de Busca */}
          <div className="flex flex-wrap gap-2 mb-4">
            {search_criteria.sector && (
              <Badge variant="outline">
                Setor: {search_criteria.sector}
              </Badge>
            )}
            {search_criteria.state && (
              <Badge variant="outline">
                Estado: {search_criteria.state}
              </Badge>
            )}
            {search_criteria.size && (
              <Badge variant="outline">
                Porte: {search_criteria.size}
              </Badge>
            )}
          </div>

          {/* Insights */}
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10"
              >
                <span className="text-lg">{insight.charAt(0)}</span>
                <p className="text-sm flex-1">{insight.slice(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Atualizar Análise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas Similares */}
      {similar_companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Empresas Similares Identificadas</CardTitle>
            <CardDescription>
              {similar_companies.length} empresa{similar_companies.length > 1 ? 's' : ''} com perfil similar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {similar_companies.map((company) => (
                <div 
                  key={company.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-base">{company.name}</h4>
                        <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>
                      </div>
                      {getTotvsStatusBadge(company)}
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.uf}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company.employees} funcionários
                      </div>
                      {company.setor && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {company.setor}
                        </div>
                      )}
                    </div>

                    {company.uses_totvs && company.totvs_score > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Score TOTVS: {company.totvs_score} | Confiança: {company.totvs_confidence}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {similar_companies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma empresa similar encontrada com os critérios atuais.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
