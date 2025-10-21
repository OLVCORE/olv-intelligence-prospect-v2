import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { CompanySelector } from '@/components/intelligence/CompanySelector';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Linkedin, Scale, DollarSign, Star, Building2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { DigitalHealthScore } from '@/lib/engines/intelligence/digitalHealthScore';

export default function DigitalPresencePage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('company');
  
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<DigitalHealthScore | null>(null);
  const [digitalPresence, setDigitalPresence] = useState<any>(null);
  const [legalData, setLegalData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [reputationData, setReputationData] = useState<any>(null);

  useEffect(() => {
    if (companyId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar dados da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Carregar dados de presença digital
      const { data: presenceData } = await supabase
        .from('digital_presence')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      setDigitalPresence(presenceData);

      // Carregar dados jurídicos
      const { data: legalDataResult } = await supabase
        .from('legal_data')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      setLegalData(legalDataResult);

      // Carregar dados financeiros
      const { data: financialDataResult } = await supabase
        .from('financial_data')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      setFinancialData(financialDataResult);

      // Carregar dados de reputação
      const { data: reputationDataResult } = await supabase
        .from('reputation_data')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      setReputationData(reputationDataResult);

      // Chamar IA para gerar análise em tempo real
      const { data: aiAnalysis } = await supabase.functions.invoke('ai-contextual-analysis', {
        body: {
          company_id: companyId,
          analysis_type: 'digital_health'
        }
      });

      // Calcular scores reais baseados nos dados
      const digitalScore = presenceData?.overall_score || 0;
      const legalScore = legalDataResult?.legal_health_score || 0;
      const financialScore = financialDataResult?.predictive_risk_score || 0;
      const reputationScore = reputationDataResult?.reputation_score || 0;

      // Calcular overall score ponderado
      const overallScore = (
        (digitalScore * 0.25) +
        (legalScore * 0.30) +
        (financialScore * 0.35) +
        (reputationScore * 0.10)
      );

      // Classificação baseada no score
      let classification: 'Excelente' | 'Bom' | 'Regular' | 'Ruim' | 'Crítico' = 'Crítico';
      if (overallScore >= 85) classification = 'Excelente';
      else if (overallScore >= 70) classification = 'Bom';
      else if (overallScore >= 50) classification = 'Regular';
      else if (overallScore >= 30) classification = 'Ruim';

      const realScore: DigitalHealthScore = {
        overall: Math.round(overallScore * 10) / 10,
        components: {
          digitalPresence: {
            score: digitalScore,
            weight: 0.25,
            details: {
              linkedin: (presenceData?.linkedin_data as any)?.score || 0,
              social: presenceData?.social_score || 0,
              web: presenceData?.web_score || 0,
              engagement: presenceData?.engagement_score || 0
            }
          },
          legalHealth: {
            score: legalScore,
            weight: 0.30,
            details: {
              totalProcesses: legalDataResult?.total_processes || 0,
              activeProcesses: legalDataResult?.active_processes || 0,
              riskLevel: legalDataResult?.risk_level || 'baixo'
            }
          },
          financialHealth: {
            score: financialScore,
            weight: 0.35,
            details: {
              creditScore: financialDataResult?.credit_score || 0,
              riskClassification: financialDataResult?.risk_classification || 'N/A',
              predictiveRisk: financialScore
            }
          },
          reputation: {
            score: reputationScore,
            weight: 0.10,
            details: {
              sentiment: reputationDataResult?.sentiment_score || 0,
              reviews: reputationDataResult?.total_reviews || 0
            }
          }
        },
        classification,
        recommendations: aiAnalysis?.recommendations || [],
        risks: aiAnalysis?.risks || [],
        opportunities: aiAnalysis?.opportunities || []
      };

      setHealthScore(realScore);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company || !healthScore) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Painel de Presença Digital</h1>
          <p className="text-muted-foreground">
            Análise completa de saúde digital, jurídica, financeira e reputação
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Selecione uma Empresa
            </CardTitle>
            <CardDescription>
              Escolha uma empresa da base para visualizar o painel de presença digital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanySelector redirectTo="/digital-presence" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasNoData = !digitalPresence && !legalData && !financialData && !reputationData;

  const handleEnrich = async () => {
    try {
      toast.loading('Iniciando enriquecimento 360°...');
      const { data, error } = await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      toast.success('Enriquecimento concluído! Recarregando dados...');
      setTimeout(() => loadData(), 2000);
    } catch (error) {
      console.error('Error enriching:', error);
      toast.error('Erro ao enriquecer dados');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getClassificationBadge = (classification: string) => {
    const colors: Record<string, string> = {
      'Excelente': 'bg-green-500',
      'Bom': 'bg-blue-500',
      'Regular': 'bg-yellow-500',
      'Ruim': 'bg-orange-500',
      'Crítico': 'bg-red-500'
    };
    return <Badge className={colors[classification] || 'bg-gray-500'}>{classification}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Presença Digital 360°</h1>
          <p className="text-muted-foreground">{company.name}</p>
        </div>
        {hasNoData && (
          <Button onClick={handleEnrich} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Enriquecer com Dados Reais
          </Button>
        )}
      </div>

      {hasNoData ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Dados Não Enriquecidos</h3>
            <p className="text-muted-foreground mb-6">
              Esta empresa ainda não possui dados de presença digital, jurídicos, financeiros ou de reputação.
            </p>
            <Button onClick={handleEnrich} size="lg" className="gap-2">
              <RefreshCw className="w-5 h-5" />
              Enriquecer Agora com APIs Reais
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score Geral */}
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Digital Health Score</CardTitle>
              <CardDescription>Score consolidado de saúde digital da empresa</CardDescription>
            </div>
            {getClassificationBadge(healthScore.classification)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`text-6xl font-bold ${getScoreColor(healthScore.overall)}`}>
                {healthScore.overall}
              </div>
              <div className="flex-1">
                <Progress value={healthScore.overall} className="h-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componentes do Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              Presença Digital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(healthScore.components.digitalPresence.score)}`}>
              {healthScore.components.digitalPresence.score}
            </div>
            <Progress value={healthScore.components.digitalPresence.score} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Peso: {(healthScore.components.digitalPresence.weight * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Saúde Jurídica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(healthScore.components.legalHealth.score)}`}>
              {healthScore.components.legalHealth.score}
            </div>
            <Progress value={healthScore.components.legalHealth.score} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Peso: {(healthScore.components.legalHealth.weight * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(healthScore.components.financialHealth.score)}`}>
              {healthScore.components.financialHealth.score}
            </div>
            <Progress value={healthScore.components.financialHealth.score} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Peso: {(healthScore.components.financialHealth.weight * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reputação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(healthScore.components.reputation.score)}`}>
              {healthScore.components.reputation.score}
            </div>
            <Progress value={healthScore.components.reputation.score} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Peso: {(healthScore.components.reputation.weight * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="risks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="risks">Riscos ({healthScore.risks.length})</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações ({healthScore.recommendations.length})</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades ({healthScore.opportunities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="space-y-4">
          {healthScore.risks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-lg mb-2">Nenhum Risco Detectado</h3>
                <p className="text-sm text-muted-foreground">
                  Não foram identificados riscos significativos para esta empresa.
                </p>
              </CardContent>
            </Card>
          ) : (
            healthScore.risks.map((risk, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    risk.severity === 'critica' ? 'text-red-500' :
                    risk.severity === 'alta' ? 'text-orange-500' :
                    risk.severity === 'media' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{risk.type}</h4>
                      <Badge variant="outline" className="text-xs">
                        {risk.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                    {risk.source && (
                      <a 
                        href={risk.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        🔗 Ver fonte
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {healthScore.recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold text-lg mb-2">Dados Insuficientes</h3>
                <p className="text-sm text-muted-foreground">
                  Execute o enriquecimento 360° para gerar recomendações baseadas em IA.
                </p>
              </CardContent>
            </Card>
          ) : (
            healthScore.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 mt-0.5 text-blue-500" />
                  <p className="text-sm flex-1">{rec}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {healthScore.opportunities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-lg mb-2">Dados Insuficientes</h3>
                <p className="text-sm text-muted-foreground">
                  Execute o enriquecimento 360° para identificar oportunidades baseadas em IA.
                </p>
              </CardContent>
            </Card>
          ) : (
            healthScore.opportunities.map((opp, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 mt-0.5 text-green-500" />
                  <p className="text-sm flex-1">{opp}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
}
