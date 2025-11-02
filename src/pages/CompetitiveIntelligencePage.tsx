import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BattleCardViewer } from "@/components/competitive/BattleCardViewer";
import { CompanyBattleCard } from "@/components/competitive/CompanyBattleCard";
import { WinProbabilityCard } from "@/components/competitive/WinProbabilityCard";
import { NegotiationAssistantPanel } from "@/components/competitive/NegotiationAssistantPanel";
import { AutoSearchCompetitors } from "@/components/competitive/AutoSearchCompetitors";
import { CompetitorInsightsIntegration } from "@/components/competitive/CompetitorInsightsIntegration";
import { useState } from "react";
import { CompetitorFormDialog } from "@/components/competitive/CompetitorFormDialog";
import { IntentSignalsCardV3 } from "@/components/competitive/IntentSignalsCardV3";
import TOTVSCheckCard from "@/components/totvs/TOTVSCheckCard";
import { SimilarCompaniesCard } from "@/components/competitive/SimilarCompaniesCard";
import { QualificationRecommendation } from "@/components/competitive/QualificationRecommendation";
import { ICPFilters } from "@/components/competitive/ICPFilters";
import { MonitoringToggleButton } from "@/components/competitive/MonitoringToggleButton";
import { MonitoringDashboard } from "@/components/competitive/MonitoringDashboard";
import { Badge } from "@/components/ui/badge";
import { useCalculateIntentScore } from "@/hooks/useIntentSignals";
import { Shield, TrendingUp, TrendingDown, Award, BarChart3, Search, Plus, Target, AlertCircle } from "lucide-react";
import { useWinLossAnalysis } from "@/hooks/useCompetitiveIntelligence";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompetitiveIntelligencePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = searchParams.get('company');
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [filters, setFilters] = useState({
    region: 'all',
    sector: 'all',
    niche: 'all',
    status: 'all',
    temperature: 'all',
  });
  
  const { data: winLossData } = useWinLossAnalysis();
  
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
      return data as any; // Cast to avoid JSON type issues with detection sources
    },
    enabled: !!companyId,
  });

  const { data: intentScore = 0 } = useCalculateIntentScore(companyId || undefined);

  // Check if intent signals have been checked
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

  const wonDeals = winLossData?.filter(d => d.outcome === 'won').length || 0;
  const lostDeals = winLossData?.filter(d => d.outcome === 'lost').length || 0;
  const totalDeals = wonDeals + lostDeals;
  const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Qualificação de Leads ICP
          </h1>
          <p className="text-muted-foreground">
            Detecte uso de TOTVS e sinais de intenção para qualificar empresas-alvo
          </p>
        </div>

        {/* Company Selector */}
        {!companyId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Selecione uma empresa para iniciar a qualificação de lead</span>
              <Button size="sm" onClick={() => setShowCompanySelector(true)}>
                <Target className="mr-2 h-4 w-4" />
                Selecionar Empresa
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <CompanySelectDialog
          open={showCompanySelector}
          onOpenChange={setShowCompanySelector}
          mode="single"
          title="Selecione uma Empresa para Qualificar"
          confirmLabel="Qualificar"
          onConfirm={(ids) => {
            navigate(`/competitive-intelligence?company=${ids[0]}`);
          }}
        />

        {company && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{company.name}</CardTitle>
                  <CardDescription>{company.domain || company.city}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <MonitoringToggleButton 
                    companyId={company.id}
                    companyName={company.name}
                    variant="outline"
                    size="sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCompanySelector(true)}
                  >
                    Trocar Empresa
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {wonDeals} vitórias / {totalDeals} deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deals Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{wonDeals}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de vitórias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deals Perdidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{lostDeals}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de perdas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {winLossData?.filter(d => d.outcome === 'ongoing').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Deals ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {company ? (
          <Tabs defaultValue="lead-qualification" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="lead-qualification">
                <Target className="mr-2 h-4 w-4" />
                Qualificação
              </TabsTrigger>
              <TabsTrigger value="battle-cards">
                <Shield className="mr-2 h-4 w-4" />
                Battle Cards
              </TabsTrigger>
              <TabsTrigger value="auto-search">
                <Search className="mr-2 h-4 w-4" />
                Busca Auto
              </TabsTrigger>
              <TabsTrigger value="manage">
                <Plus className="mr-2 h-4 w-4" />
                Gerenciar
              </TabsTrigger>
              <TabsTrigger value="win-loss">
                <BarChart3 className="mr-2 h-4 w-4" />
                Win/Loss
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lead-qualification" className="space-y-6">
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

              {/* Filtros ICP */}
              <ICPFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
              />

              {/* Debug Info */}
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <strong>🔍 Debug Info:</strong> Empresa selecionada: {company.name} | ID: {company.id?.slice(0, 8)}
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-2">
                <TOTVSCheckCard
                  companyId={company.id}
                  companyName={company.name}
                  cnpj={company.cnpj}
                  domain={company.domain}
                  autoVerify={false}
                />
                <IntentSignalsCardV3 company={company} />
              </div>

              {/* Empresas Similares */}
              <SimilarCompaniesCard 
                companyId={company.id}
                companyName={company.name}
              />

              {/* AI Recommendation */}
              <QualificationRecommendation 
                company={company}
                intentScore={intentScore}
                hasIntentCheck={hasIntentCheck}
              />
            </TabsContent>

            <TabsContent value="battle-cards" className="space-y-6">
              {company ? (
                <>
                  <CompanyBattleCard companyId={company.id} companyName={company.name} />
                  
                  <div className="grid lg:grid-cols-2 gap-6">
                    <WinProbabilityCard 
                      companyId={company.id} 
                      companyName={company.name}
                    />
                    
                    <NegotiationAssistantPanel
                      companyId={company.id}
                      companyName={company.name}
                    />
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Selecione uma empresa para gerar o Battle Card personalizado</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="auto-search" className="space-y-4">
              {companyId && company ? (
                <AutoSearchCompetitors
                  companyName={company.name}
                  sector={company.sector || company.vertical}
                  totvsProduct="TOTVS Protheus"
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Selecione uma empresa para buscar concorrentes</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <MonitoringDashboard />
              
              <div className="flex justify-end">
                <CompetitorFormDialog />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de Concorrentes</CardTitle>
                  <CardDescription>
                    Adicione concorrentes manualmente ou através da busca automática
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Use o botão "Adicionar Concorrente" acima para cadastrar manualmente,
                    ou vá para a aba "Busca Auto" para encontrar concorrentes automaticamente na web.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="win-loss" className="space-y-4">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{winRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {wonDeals} vitórias / {totalDeals} deals
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Deals Ganhos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{wonDeals}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total de vitórias</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Deals Perdidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{lostDeals}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total de perdas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {winLossData?.filter(d => d.outcome === 'ongoing').length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Deals ativos</p>
                  </CardContent>
                </Card>
              </div>

              {winLossData && winLossData.length > 0 ? (
                <div className="grid gap-4">
                  {winLossData.map((analysis) => (
                    <Card key={analysis.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Deal #{analysis.id.slice(0, 8)}
                          </CardTitle>
                          <Badge variant={
                            analysis.outcome === 'won' ? 'default' :
                            analysis.outcome === 'lost' ? 'destructive' : 'secondary'
                          }>
                            {analysis.outcome === 'won' ? 'Ganho' :
                             analysis.outcome === 'lost' ? 'Perdido' : 'Em Andamento'}
                          </Badge>
                        </div>
                        <CardDescription>
                          Valor: {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(analysis.deal_value || 0)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-2">Competidores Enfrentados</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.competitors_faced?.map((comp, idx) => (
                              <Badge key={idx} variant="outline">{comp}</Badge>
                            ))}
                          </div>
                        </div>

                        {analysis.win_reasons && analysis.win_reasons.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-600">
                              <TrendingUp className="h-4 w-4" />
                              Razões de Vitória
                            </p>
                            <ul className="space-y-1">
                              {analysis.win_reasons.map((reason, idx) => (
                                <li key={idx} className="text-sm flex items-start">
                                  <span className="mr-2">✓</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.loss_reasons && analysis.loss_reasons.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-600">
                              <TrendingDown className="h-4 w-4" />
                              Razões de Perda
                            </p>
                            <ul className="space-y-1">
                              {analysis.loss_reasons.map((reason, idx) => (
                                <li key={idx} className="text-sm flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.key_differentiators && analysis.key_differentiators.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Diferenciais-Chave
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.key_differentiators.map((diff, idx) => (
                                <Badge key={idx}>{diff}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma análise Win/Loss registrada ainda</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground mb-4">
                Selecione uma empresa acima para iniciar a qualificação
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
