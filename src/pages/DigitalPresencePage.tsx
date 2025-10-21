import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { CompanySelector } from '@/components/intelligence/CompanySelector';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Linkedin, Scale, DollarSign, Star, Building2 } from 'lucide-react';
import { toast } from 'sonner';
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

      // Calcular health score
      // Em produção, isso viria do backend
      const mockScore: DigitalHealthScore = {
        overall: 76.8,
        components: {
          digitalPresence: {
            score: presenceData?.overall_score || 75,
            weight: 0.25,
            details: {
              linkedin: presenceData?.social_score || 82,
              social: 70,
              web: 78,
              engagement: presenceData?.engagement_score || 65
            }
          },
          legalHealth: {
            score: legalDataResult?.legal_health_score || 68,
            weight: 0.30,
            details: {
              totalProcesses: legalDataResult?.total_processes || 0,
              activeProcesses: legalDataResult?.active_processes || 0,
              riskLevel: legalDataResult?.risk_level || 'baixo'
            }
          },
          financialHealth: {
            score: financialDataResult?.predictive_risk_score || 72,
            weight: 0.35,
            details: {
              creditScore: financialDataResult?.credit_score || 0,
              riskClassification: financialDataResult?.risk_classification || 'B',
              predictiveRisk: financialDataResult?.predictive_risk_score || 72
            }
          },
          reputation: {
            score: reputationDataResult?.reputation_score || 85,
            weight: 0.10,
            details: {
              sentiment: reputationDataResult?.sentiment_score || 78,
              reviews: reputationDataResult?.total_reviews || 0
            }
          }
        },
        classification: 'Bom',
        recommendations: [
          'Fortalecer presença digital no LinkedIn com posts regulares',
          'Resolver processos jurídicos ativos para reduzir risco',
          'Manter boa reputação com atendimento de qualidade'
        ],
        risks: [
          {
            type: 'Jurídico',
            severity: 'media',
            description: '3 processos ativos requerem atenção'
          }
        ],
        opportunities: [
          'Boa reputação online indica momento para expansão',
          'Score financeiro estável permite negociações'
        ]
      };

      setHealthScore(mockScore);
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
      <div>
        <h1 className="text-3xl font-bold mb-2">Presença Digital 360°</h1>
        <p className="text-muted-foreground">{company.name}</p>
      </div>

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
          {healthScore.risks.map((risk, index) => (
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
                  <p className="text-sm text-muted-foreground">{risk.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {healthScore.recommendations.map((rec, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-0.5 text-blue-500" />
                <p className="text-sm flex-1">{rec}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {healthScore.opportunities.map((opp, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 mt-0.5 text-green-500" />
                <p className="text-sm flex-1">{opp}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
