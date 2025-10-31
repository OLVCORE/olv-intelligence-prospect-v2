import { useState } from 'react';
import { FileText, ArrowLeft, Target, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { TOTVSDetectionCardV3 } from "@/components/competitive/TOTVSDetectionCardV3";
import { IntentSignalsCardV3 } from "@/components/competitive/IntentSignalsCardV3";
import { QualificationRecommendation } from "@/components/competitive/QualificationRecommendation";
import { useCalculateIntentScore } from "@/hooks/useIntentSignals";
import { useAutoEnrichCompany } from "@/hooks/useAutoEnrichCompany";
import { CompanyEnrichmentDialog } from "@/components/icp/CompanyEnrichmentDialog";
import { CompanyActionsMenu } from "@/components/companies/CompanyActionsMenu";
import { toast } from "sonner";

export default function IndividualAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('company');
  const [showCompanySelector, setShowCompanySelector] = useState(!companyId);
  const [showEnrichmentDialog, setShowEnrichmentDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!companyId,
  });

  const { data: intentScore = 0 } = useCalculateIntentScore(companyId || undefined);

  // Enriquecimento automático com ReceitaWS (apenas se dados estiverem faltando)
  useAutoEnrichCompany(company);

  const { data: intentSignals } = useQuery({
    queryKey: ['intent-signals', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('intent_signals')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const hasIntentCheck = (intentSignals?.length ?? 0) > 0;

  const handleSelectCompany = (ids: string[]) => {
    const newCompanyId = ids[0];
    navigate(`/central-icp/individual?company=${newCompanyId}`);
    setShowCompanySelector(false);
  };

  const handleRefresh = async () => {
    if (!companyId) return;
    
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-company-receita', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Dados atualizados com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      } else {
        toast.info(data?.message || 'Dados já atualizados');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados da empresa');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEnrich = async () => {
    setShowEnrichmentDialog(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-green-600" />
            Análise Individual
          </h1>
          <p className="text-muted-foreground">
            Qualifique empresas uma por vez com análise detalhada ICP
          </p>
        </div>
        <div className="flex items-center gap-2">
          {company && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompanySelector(true)}
              >
                Trocar Empresa
              </Button>
              <CompanyActionsMenu
                companyId={company.id}
                companyName={company.name}
                isLoading={isRefreshing}
                onRefresh={handleRefresh}
                onEnrich={handleEnrich}
              />
            </>
          )}
        </div>
      </div>

      <CompanySelectDialog
        open={showCompanySelector}
        onOpenChange={setShowCompanySelector}
        mode="single"
        title="Selecione uma Empresa para Analisar"
        confirmLabel="Analisar"
        onConfirm={handleSelectCompany}
      />

      {/* Company Selector Alert */}
      {!companyId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Selecione uma empresa para iniciar a análise ICP individual</span>
            <Button size="sm" onClick={() => setShowCompanySelector(true)}>
              <Target className="mr-2 h-4 w-4" />
              Selecionar Empresa
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Company Info */}
      {company && (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{company.name}</CardTitle>
                  <CardDescription>
                    {company.cnpj && `CNPJ: ${company.cnpj} • `}
                    {(company.domain || company.website) && (company.domain || company.website)}
                    {(company.headquarters_city || company.headquarters_state) && ` • ${company.headquarters_city || ''}${company.headquarters_city && company.headquarters_state ? ' - ' : ''}${company.headquarters_state || ''}`}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEnrichmentDialog(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Enriquecer Dados
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">Razão Social:</span> <span className="font-medium">{company.name}</span></div>
                <div><span className="text-muted-foreground">CNPJ:</span> <span className="font-medium">{company.cnpj || '—'}</span></div>
                <div><span className="text-muted-foreground">Domínio:</span> <span className="font-medium">{company.domain || company.website || '—'}</span></div>
                <div><span className="text-muted-foreground">Estado (UF):</span> <span className="font-medium">{company.headquarters_state || '—'}</span></div>
                <div><span className="text-muted-foreground">Município:</span> <span className="font-medium">{company.headquarters_city || '—'}</span></div>
                <div><span className="text-muted-foreground">País:</span> <span className="font-medium">{company.headquarters_country || '—'}</span></div>
              </div>

              {/* Seção CNAEs (se disponível) */}
              {company.raw_data?.atividade_principal && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="text-sm font-semibold text-muted-foreground">CNAEs (Receita Federal)</div>
                  
                  {/* CNAE Primário */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">CNAE Principal:</div>
                    <div className="text-sm">
                      <span className="font-mono font-semibold">{company.raw_data.atividade_principal[0]?.code}</span>
                      {' - '}
                      <span>{company.raw_data.atividade_principal[0]?.text}</span>
                    </div>
                  </div>

                  {/* CNAEs Secundários */}
                  {company.raw_data.atividades_secundarias?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">CNAEs Secundários:</div>
                      <div className="space-y-1">
                        {company.raw_data.atividades_secundarias.slice(0, 3).map((atividade: any, idx: number) => (
                          <div key={idx} className="text-xs">
                            <span className="font-mono font-semibold">{atividade.code}</span>
                            {' - '}
                            <span className="text-muted-foreground">{atividade.text}</span>
                          </div>
                        ))}
                        {company.raw_data.atividades_secundarias.length > 3 && (
                          <div className="text-xs text-muted-foreground italic">
                            + {company.raw_data.atividades_secundarias.length - 3} outros CNAEs
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(!company.headquarters_state || !company.headquarters_city) && (
                <div className="mt-3 text-xs text-amber-600">
                  ⚠️ Dados de localização ausentes. Use o botão "Enriquecer Dados" para completar.
                </div>
              )}
            </CardContent>
          </Card>

          <CompanyEnrichmentDialog
            open={showEnrichmentDialog}
            onOpenChange={setShowEnrichmentDialog}
            company={company}
          />
        </>
      )}

      {company && (
        <>
          {/* Instrução de uso */}
          <Alert className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <Target className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-bold text-base">📋 Como Gerar a Análise 360° com IA</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li><strong>ETAPA 1:</strong> Execute a "Detecção de Uso de TOTVS" no card abaixo</li>
                  <li><strong>ETAPA 2:</strong> Execute a "Detecção de Sinais de Intenção" no card abaixo</li>
                  <li><strong>ETAPA 3:</strong> Role a página até o final e clique no botão "Gerar Qualificação 360° Powered by IA"</li>
                </ol>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <AlertCircle className="h-3 w-3" />
                  <span>⚡ O relatório completo de análise 360° está localizado no final desta página</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Critérios de Qualificação */}
          <Alert className="bg-muted/50">
            <Target className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Estratégia de Qualificação ICP</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li><strong>Detecção TOTVS:</strong> Score &ge; 70 = Desqualificar (já usa TOTVS)</li>
                <li><strong>Sinais de Intenção:</strong> Score &ge; 70 = HOT LEAD (prospectar agora!)</li>
                <li><strong>Combinação Ideal:</strong> TOTVS &lt; 70 + Intenção &ge; 70 = PROSPECT NOW!</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Análise Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <TOTVSDetectionCardV3 
              company={{
                id: company.id,
                name: company.name,
                cnpj: company.cnpj,
                domain: company.domain,
                state: company.headquarters_state,
                city: company.headquarters_city,
                sector_code: company.sector_code,
                niche_code: company.niche_code,
              }}
            />
            <IntentSignalsCardV3 company={{
              id: company.id,
              name: company.name,
              cnpj: company.cnpj,
              domain: company.domain || company.website,
              region: company.headquarters_state,
              sector: company.sector_code,
              niche: company.niche_code,
            }} />
          </div>

          {/* AI Recommendation */}
          <QualificationRecommendation 
            company={company}
            intentScore={intentScore}
            hasIntentCheck={hasIntentCheck}
          />
        </>
      )}
    </div>
  );
}
