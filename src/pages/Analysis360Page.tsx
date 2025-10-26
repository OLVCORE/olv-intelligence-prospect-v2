import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackButton } from '@/components/common/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { CompanySelector } from '@/components/intelligence/CompanySelector';
import { LinkedInEnrichButton } from '@/components/common/LinkedInEnrichButton';
import { 
  Loader2, Building2, TrendingUp, AlertTriangle, CheckCircle, 
  Linkedin, Scale, DollarSign, Star, ShoppingCart, Server, 
  Newspaper, Target, Zap, Users, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Analysis360Page() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('company');
  
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [lang, setLang] = useState<'pt-BR' | 'en' | 'es'>('pt-BR');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedInsights, setTranslatedInsights] = useState<any[] | null>(null);
  const [translatedPitch, setTranslatedPitch] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      loadCompanyData();
    }
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Carregar dados de enrichment
      await loadEnrichmentData(companyId);
    } catch (error) {
      console.error('Error loading company:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrichmentData = async (companyId: string) => {
    try {
      const [digitalData, legalData, financialData, reputationData, insights, pitches] = await Promise.all([
        supabase.from('digital_presence').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('legal_data').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('financial_data').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('reputation_data').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('insights').select('*').eq('company_id', companyId).eq('generated_by', 'enrichment_360'),
        supabase.from('pitches').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1)
      ]);

      setEnrichmentData({
        digital: digitalData.data,
        legal: legalData.data,
        financial: financialData.data,
        reputation: reputationData.data,
        insights: insights.data || [],
        pitch: pitches.data?.[0]
      });
    } catch (error) {
      console.error('Error loading enrichment data:', error);
    }
  };

  const runEnrichment = async () => {
    if (!companyId) return;

    try {
      setEnriching(true);
      toast.info('Iniciando análise 360°...');

      const { data, error } = await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      toast.success('Análise 360° concluída com sucesso!');
      
      // Recarregar dados
      await loadEnrichmentData(companyId);
    } catch (error) {
      console.error('Error running enrichment:', error);
      toast.error('Erro ao executar análise 360°');
    } finally {
      setEnriching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Análise 360° Completa</h1>
          <p className="text-muted-foreground">
            Análise detalhada de presença digital, jurídica, financeira e reputação
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Selecione uma Empresa
            </CardTitle>
            <CardDescription>
              Escolha uma empresa da base para visualizar a análise 360° completa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanySelector redirectTo="/analysis-360" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasEnrichmentData = enrichmentData?.digital || enrichmentData?.legal || enrichmentData?.financial;

  // Calcular score geral 360°
  const overall360Score = hasEnrichmentData
    ? Math.round(
        ((enrichmentData?.digital?.overall_score || 0) * 0.2 +
          (enrichmentData?.legal?.legal_health_score || 0) * 0.25 +
          (enrichmentData?.financial?.predictive_risk_score || 0) * 0.3 +
          (enrichmentData?.reputation?.reputation_score || 0) * 0.25)
      )
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-green-500">Excelente</Badge>;
    if (score >= 70) return <Badge className="bg-blue-500">Bom</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-500">Regular</Badge>;
    if (score >= 30) return <Badge className="bg-orange-500">Ruim</Badge>;
    return <Badge className="bg-red-500">Crítico</Badge>;
  };

  const handleLanguageChange = async (value: string) => {
    const nextLang = value as 'pt-BR' | 'en' | 'es';
    setLang(nextLang);

    if (nextLang === 'pt-BR') {
      setTranslatedInsights(null);
      setTranslatedPitch(null);
      return;
    }

    if (!enrichmentData) return;

    try {
      setIsTranslating(true);
      const insights = enrichmentData?.insights || [];
      const texts: string[] = [];
      insights.forEach((i: any) => {
        texts.push(i.title || '');
        texts.push(i.description || '');
      });
      if (enrichmentData?.pitch?.content) texts.push(enrichmentData.pitch.content);

      const { data, error } = await supabase.functions.invoke('translate', {
        body: { texts, target: nextLang }
      });
      if (error) throw error;

      const translations: string[] = data?.translations || [];
      let idx = 0;
      const newInsights = insights.map((i: any) => ({
        ...i,
        title: translations[idx++] || i.title,
        description: translations[idx++] || i.description,
      }));
      let newPitch = enrichmentData?.pitch?.content || null;
      if (enrichmentData?.pitch?.content) {
        newPitch = translations[idx] || newPitch;
      }
      setTranslatedInsights(newInsights);
      setTranslatedPitch(newPitch);
    } catch (e) {
      console.error('Translation error', e);
      toast.error('Falha ao traduzir conteúdo');
    } finally {
      setIsTranslating(false);
    }
  };
  const insightsList = lang === 'pt-BR' ? (enrichmentData?.insights || []) : (translatedInsights || enrichmentData?.insights || []);
  const pitchContent = lang === 'pt-BR' ? enrichmentData?.pitch?.content : (translatedPitch ?? enrichmentData?.pitch?.content);
  return (
    <div className="p-8 space-y-6">
      <BackButton className="mb-4" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Análise 360° Completa</h1>
          <p className="text-muted-foreground">{company.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={lang} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={runEnrichment} 
            disabled={enriching || isTranslating}
            size="lg"
            className="gap-2"
          >
            {enriching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executando Análise...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Executar Análise 360°
              </>
            )}
          </Button>
        </div>
      </div>

      {!hasEnrichmentData ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma análise disponível</h3>
            <p className="text-muted-foreground mb-6">
              Execute a análise 360° para obter um perfil completo desta empresa
            </p>
            <Button onClick={runEnrichment} size="lg" disabled={enriching}>
              {enriching ? 'Analisando...' : 'Iniciar Análise 360°'}
            </Button>
            
            {company?.linkedin_url && (
              <LinkedInEnrichButton
                companyId={companyId!}
                linkedinUrl={company.linkedin_url}
                size="lg"
                onSuccess={loadCompanyData}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score Geral 360° */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Score 360° Geral
                  </CardTitle>
                  <CardDescription>Análise consolidada de todos os indicadores</CardDescription>
                </div>
                {getScoreBadge(overall360Score)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className={`text-7xl font-bold ${getScoreColor(overall360Score)}`}>
                  {overall360Score}
                </div>
                <div className="flex-1 space-y-2">
                  <Progress value={overall360Score} className="h-4" />
                  <p className="text-sm text-muted-foreground">
                    Baseado em presença digital, saúde jurídica, financeira e reputação
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  Presença Digital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(enrichmentData?.digital?.overall_score || 0)}`}>
                  {enrichmentData?.digital?.overall_score || 0}
                </div>
                <Progress value={enrichmentData?.digital?.overall_score || 0} className="mt-2 h-2" />
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
                <div className={`text-4xl font-bold ${getScoreColor(enrichmentData?.legal?.legal_health_score || 0)}`}>
                  {enrichmentData?.legal?.legal_health_score || 0}
                </div>
                <Progress value={enrichmentData?.legal?.legal_health_score || 0} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {enrichmentData?.legal?.active_processes || 0} processos ativos
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
                <div className={`text-4xl font-bold ${getScoreColor(enrichmentData?.financial?.predictive_risk_score || 0)}`}>
                  {enrichmentData?.financial?.predictive_risk_score || 0}
                </div>
                <Progress value={enrichmentData?.financial?.predictive_risk_score || 0} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Score: {enrichmentData?.financial?.credit_score || 0} | Classe {enrichmentData?.financial?.risk_classification || 'N/A'}
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
                <div className={`text-4xl font-bold ${getScoreColor(enrichmentData?.reputation?.reputation_score || 0)}`}>
                  {enrichmentData?.reputation?.reputation_score || 0}
                </div>
                <Progress value={enrichmentData?.reputation?.reputation_score || 0} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {enrichmentData?.reputation?.total_reviews || 0} avaliações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs com detalhes */}
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">Insights ({enrichmentData?.insights?.length || 0})</TabsTrigger>
              <TabsTrigger value="pitch">Pitch TOTVS</TabsTrigger>
              <TabsTrigger value="tech">Stack Tecnológico</TabsTrigger>
              <TabsTrigger value="campaign">Campanha</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              {enrichmentData?.insights?.length > 0 ? (
                enrichmentData.insights.map((insight: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4 flex items-start gap-3">
                      {insight.insight_type === 'opportunity' ? (
                        <TrendingUp className="w-5 h-5 mt-0.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 mt-0.5 text-yellow-500" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">{insight.priority}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((insight.confidence_score || 0) * 100)}% confiança
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhum insight gerado ainda
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pitch">
              {enrichmentData?.pitch ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Pitch Personalizado TOTVS
                    </CardTitle>
                    <CardDescription>
                      Gerado automaticamente baseado na análise 360°
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Badge>{enrichmentData.pitch.pitch_type}</Badge>
                      <Badge variant="outline">
                        Persona: {enrichmentData.pitch.target_persona}
                      </Badge>
                      <Badge variant="outline">
                        Valor estimado: {enrichmentData.pitch.metadata?.estimated_value || 'N/A'}
                      </Badge>
                    </div>
                    <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {enrichmentData.pitch.content}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhum pitch gerado ainda
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tech">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Parque Tecnológico
                  </CardTitle>
                  <CardDescription>
                    Stack tecnológico identificado e oportunidades TOTVS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Tecnologias Detectadas (Mock)</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">SAP ERP</Badge>
                        <Badge variant="secondary">Oracle Database</Badge>
                        <Badge variant="secondary">Salesforce CRM</Badge>
                        <Badge variant="secondary">AWS Cloud</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Oportunidades TOTVS</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                          <span>Migração SAP → TOTVS Protheus (economia de 60%)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                          <span>Substituir Oracle Database (redução de custos)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                          <span>Integração TOTVS CRM + Fluig BPM</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaign">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Estratégia de Campanha Multidimensional
                  </CardTitle>
                  <CardDescription>
                    Plano de abordagem personalizado baseado na análise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Canais Recomendados</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>LinkedIn Ads (Target: C-Level)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span>Executivo TOTVS dedicado</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Newspaper className="w-4 h-4 text-blue-500" />
                        <span>Email Marketing Personalizado</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Mensagens-Chave</h4>
                    <ul className="space-y-2">
                      <li className="text-sm">• Reduza custos de TI em até 60% migrando de SAP para TOTVS</li>
                      <li className="text-sm">• Consultoria Premium ULV Internacional - especialistas em migração</li>
                      <li className="text-sm">• Cases de sucesso de empresas similares do seu segmento</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm font-semibold">Timeline</p>
                      <p className="text-2xl font-bold text-primary">30 dias</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Budget Sugerido</p>
                      <p className="text-2xl font-bold text-primary">R$ 75K</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
