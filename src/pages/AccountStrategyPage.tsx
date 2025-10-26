import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/common/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAccountStrategies, useGenerateBusinessCase, useSuggestNextAction } from '@/hooks/useAccountStrategies';
import { useBuyerPersonas } from '@/hooks/useBuyerPersonas';
import { useDecisionMakers } from '@/hooks/useDecisionMakers';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, TrendingUp, Users, FileText, Lightbulb, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerateAccountStrategy } from '@/hooks/useAccountStrategies';
import { InteractiveROICalculator } from '@/components/roi/InteractiveROICalculator';
import { QuoteConfigurator } from '@/components/cpq/QuoteConfigurator';
import { ProductCatalogManager } from '@/components/cpq/ProductCatalogManager';
import { ScenarioComparison } from '@/components/scenarios/ScenarioComparison';
import { ProposalManager } from '@/components/proposals/ProposalManager';
import { BattleCardViewer } from '@/components/competitive/BattleCardViewer';
import { ValueRealizationDashboard } from '@/components/value/ValueRealizationDashboard';
import { CompanySelectDialog } from '@/components/common/CompanySelectDialog';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import { CompanyStrategyHeader } from '@/components/common/CompanyStrategyHeader';

export default function AccountStrategyPage() {
  const params = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = params.companyId || searchParams.get('company') || undefined;
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [selectedDecisionMakerId, setSelectedDecisionMakerId] = useState<string>('none');
  const [tab, setTab] = useState<string>(searchParams.get('tab') || 'overview');
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Callback para verificar se há mudanças não salvas (será fornecido pelos componentes filhos)
  const [hasUnsavedChangesCallback, setHasUnsavedChangesCallback] = useState<(() => boolean) | null>(null);
  const [saveCallback, setSaveCallback] = useState<(() => Promise<void>) | null>(null);

  // Sync tab with URL query param changes (fixes sidebar navigation to tabs)
  React.useEffect(() => {
    const t = searchParams.get('tab') || 'roi';
    if (t !== tab) setTab(t);
  }, [searchParams, tab]);
  const { data: strategies, isLoading } = useAccountStrategies(companyId);
  const { data: personas } = useBuyerPersonas();
  const { data: decisionMakers } = useDecisionMakers(companyId);
  
  const generateStrategy = useGenerateAccountStrategy();
  const generateBusinessCase = useGenerateBusinessCase();
  const suggestNextAction = useSuggestNextAction();

  const activeStrategy = strategies?.[0];

  const getPriorityColor = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    return colors[priority] || 'secondary';
  };

  const getStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      cold_outreach: 'Cold Outreach',
      first_meeting: 'Primeira Reunião',
      diagnosis: 'Diagnóstico',
      proposal: 'Proposta',
      negotiation: 'Negociação',
      closing: 'Fechamento',
    };
    return stages[stage] || stage;
  };

  const handleGenerateStrategy = async () => {
    if (!companyId || !selectedPersonaId) return;
    
    await generateStrategy.mutateAsync({
      companyId,
      personaId: selectedPersonaId,
      decisionMakerId: selectedDecisionMakerId === 'none' ? undefined : selectedDecisionMakerId,
    });
  };

  // Handler para mudança de tab com verificação de mudanças não salvas
  const handleTabChange = (newTab: string) => {
    // Verifica se há mudanças não salvas
    const hasUnsaved = hasUnsavedChangesCallback?.() || false;
    
    if (hasUnsaved) {
      setPendingTab(newTab);
      setShowUnsavedDialog(true);
      return;
    }
    
    // Se não há mudanças, muda a tab normalmente
    changeTab(newTab);
  };

  const changeTab = (newTab: string) => {
    setTab(newTab);
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', newTab);
    if (companyId) sp.set('company', companyId);
    setSearchParams(sp, { replace: true });
  };

  const handleConfirmTabChange = () => {
    if (pendingTab) {
      changeTab(pendingTab);
      setPendingTab(null);
    }
    setShowUnsavedDialog(false);
  };

  const handleSaveAndChangeTab = async () => {
    if (saveCallback) {
      await saveCallback();
    }
    handleConfirmTabChange();
  };

  const handleCancelTabChange = () => {
    setPendingTab(null);
    setShowUnsavedDialog(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!companyId) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecione uma empresa</CardTitle>
              <CardDescription>Abra a estratégia de uma empresa específica para acessar ROI, CPQ, Cenários e mais.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => setCompanyDialogOpen(true)}>Selecionar Empresa</Button>
              <Button variant="outline" onClick={() => navigate(`/companies?selectFor=account-strategy&tab=${tab}`)}>
                Ir para Base de Empresas
              </Button>
            </CardContent>
          </Card>

          <CompanySelectDialog
            open={companyDialogOpen}
            onOpenChange={setCompanyDialogOpen}
            mode="single"
            title="Escolha a empresa para analisar"
            confirmLabel="Usar nesta estratégia"
            onConfirm={async (ids) => {
              const id = ids[0];
              const sp = new URLSearchParams(searchParams);
              sp.set('company', id);
              if (tab) sp.set('tab', tab);
              setSearchParams(sp, { replace: true });
              navigate(`/account-strategy?company=${id}&tab=${tab || 'roi'}`);
            }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <BackButton />
        
        {/* Company Header */}
        <CompanyStrategyHeader companyId={companyId} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Account Strategy</h1>
            <p className="text-muted-foreground">
              Estratégia comercial completa orientada por IA
            </p>
          </div>
          
          {!activeStrategy && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Target className="mr-2 h-4 w-4" />
                  Criar Estratégia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Account Strategy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Persona-Alvo</label>
                    <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {personas?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Decision Maker (Opcional)</label>
                    <Select value={selectedDecisionMakerId} onValueChange={setSelectedDecisionMakerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um decisor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {decisionMakers?.map((dm) => (
                          <SelectItem key={dm.id} value={dm.id}>
                            {dm.name} - {dm.title} {dm.email ? `(${dm.email})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleGenerateStrategy} 
                    disabled={!selectedPersonaId || generateStrategy.isPending}
                    className="w-full"
                  >
                    {generateStrategy.isPending ? 'Gerando...' : 'Gerar Estratégia com IA'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!activeStrategy ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma estratégia criada</CardTitle>
                <CardDescription>
                  Você já pode usar ROI e CPQ para esta empresa. Gere a estratégia a qualquer momento.
                </CardDescription>
              </CardHeader>
            </Card>
            <Tabs 
              value={tab} 
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 gap-1">
                <TabsTrigger value="roi">ROI</TabsTrigger>
                <TabsTrigger value="cpq">CPQ</TabsTrigger>
                <TabsTrigger value="scenarios">Cenários</TabsTrigger>
                <TabsTrigger value="proposals">Propostas</TabsTrigger>
                <TabsTrigger value="value">Valor</TabsTrigger>
              </TabsList>
              <TabsContent value="roi" className="space-y-4">
                <InteractiveROICalculator
                  companyId={companyId!}
                  accountStrategyId={activeStrategy?.id}
                  initialData={{}}
                  onUnsavedChangesMount={(hasChanges, save) => {
                    setHasUnsavedChangesCallback(() => hasChanges);
                    setSaveCallback(() => save);
                  }}
                />
              </TabsContent>
              <TabsContent value="cpq" className="space-y-4">
                <ProductCatalogManager />
                <QuoteConfigurator
                  companyId={companyId!}
                  accountStrategyId={activeStrategy?.id}
                  onUnsavedChangesMount={(hasChanges, save) => {
                    setHasUnsavedChangesCallback(() => hasChanges);
                    setSaveCallback(() => save);
                  }}
                />
              </TabsContent>
              <TabsContent value="scenarios" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Cenários</CardTitle>
                    <CardDescription>Crie uma estratégia para habilitar geração automática de cenários com IA.</CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
              <TabsContent value="proposals" className="space-y-4">
                <ProposalManager companyId={companyId!} />
              </TabsContent>
              <TabsContent value="value" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Value Realization</CardTitle>
                    <CardDescription>Crie uma estratégia para iniciar o tracking de valor.</CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (

          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="gaps">Gaps</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="roi">ROI</TabsTrigger>
              <TabsTrigger value="cpq">CPQ</TabsTrigger>
              <TabsTrigger value="scenarios">Cenários</TabsTrigger>
              <TabsTrigger value="value">Valor</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Etapa Atual</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getStageLabel(activeStrategy.current_stage)}</div>
                    <Badge variant={getPriorityColor(activeStrategy.priority)} className="mt-2">
                      Prioridade: {activeStrategy.priority.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">{activeStrategy.engagement_level}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Score: {activeStrategy.relationship_score}/100
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROI Projetado</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeStrategy.projected_roi}%</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Payback: {activeStrategy.payback_period}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Proposta de Valor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{activeStrategy.value_proposition}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estratégia de Abordagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{activeStrategy.approach_strategy}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gaps Tab */}
            <TabsContent value="gaps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gaps Identificados</CardTitle>
                  <CardDescription>Oportunidades de transformação organizacional</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(activeStrategy.identified_gaps) && activeStrategy.identified_gaps.map((gap: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">{gap.title || gap.category}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Problema:</strong> {gap.problem}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Impacto:</strong> {gap.impact}
                        </p>
                        <p className="text-sm text-accent-foreground mt-1">
                          <strong>Solução:</strong> {gap.solution}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produtos TOTVS Recomendados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(activeStrategy.recommended_products) && activeStrategy.recommended_products.map((product: any, idx: number) => (
                      <div key={idx} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{product.product}</h4>
                            <Badge variant={getPriorityColor(product.priority)}>{product.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{product.reason}</p>
                          {product.implementation && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <strong>Implementação:</strong> {product.implementation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Roadmap Tab */}
            <TabsContent value="roadmap" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Roadmap de Transformação</CardTitle>
                  <CardDescription>Plano estratégico por fases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activeStrategy.transformation_roadmap && typeof activeStrategy.transformation_roadmap === 'object' && (
                      <>
                        {Object.entries(activeStrategy.transformation_roadmap).map(([phase, actions]: [string, any]) => (
                          <div key={phase}>
                            <h4 className="font-semibold mb-3 capitalize">
                              {phase.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <ul className="space-y-2 ml-4">
                              {Array.isArray(actions) && actions.map((action: string, idx: number) => (
                                <li key={idx} className="text-sm flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ROI Interativo Tab */}
            <TabsContent value="roi" className="space-y-4">
              <InteractiveROICalculator
                companyId={companyId!}
                accountStrategyId={activeStrategy.id}
                initialData={activeStrategy.ai_insights as any}
                onUnsavedChangesMount={(hasChanges, save) => {
                  setHasUnsavedChangesCallback(() => hasChanges);
                  setSaveCallback(() => save);
                }}
              />
            </TabsContent>

            {/* CPQ Tab */}
            <TabsContent value="cpq" className="space-y-4">
              <ProductCatalogManager />
              <QuoteConfigurator
                companyId={companyId!}
                accountStrategyId={activeStrategy.id}
                onUnsavedChangesMount={(hasChanges, save) => {
                  setHasUnsavedChangesCallback(() => hasChanges);
                  setSaveCallback(() => save);
                }}
              />
            </TabsContent>

            {/* Scenarios Tab */}
            <TabsContent value="scenarios" className="space-y-4">
              <ScenarioComparison
                companyId={companyId!}
                accountStrategyId={activeStrategy.id}
                baseInvestment={Number(activeStrategy.investment_required) || 50000}
                baseAnnualBenefit={Number(activeStrategy.annual_value) || 100000}
              />
            </TabsContent>

            {/* Competitive Tab */}
            <TabsContent value="competitive" className="space-y-4">
              <BattleCardViewer />
            </TabsContent>

            {/* Value Tracking Tab */}
            <TabsContent value="value" className="space-y-4">
              <ValueRealizationDashboard
                companyId={companyId!}
                accountStrategyId={activeStrategy.id}
                promisedROI={Number(activeStrategy.projected_roi) || 0}
                promisedPayback={Number(activeStrategy.payback_period?.replace(/[^0-9]/g, '')) || 12}
                promisedSavings={Number(activeStrategy.annual_value) || 0}
              />
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4">
              <ProposalManager
                companyId={companyId!}
                accountStrategyId={activeStrategy.id}
              />
              <Separator className="my-6" />
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Investimento Necessário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(activeStrategy.investment_required) || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Payback esperado: {activeStrategy.payback_period}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Retorno Anual Projetado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(activeStrategy.annual_value) || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      ROI: {activeStrategy.projected_roi}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Gerar Business Case Completo</CardTitle>
                  <CardDescription>
                    Crie uma proposta comercial detalhada pronta para apresentação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => generateBusinessCase.mutate({ accountStrategyId: activeStrategy.id })}
                    disabled={generateBusinessCase.isPending}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {generateBusinessCase.isPending ? 'Gerando...' : 'Gerar Business Case'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Próximas Ações Recomendadas</CardTitle>
                      <CardDescription>Sugestões inteligentes da IA</CardDescription>
                    </div>
                    <Button
                      onClick={() => suggestNextAction.mutate({ accountStrategyId: activeStrategy.id })}
                      disabled={suggestNextAction.isPending}
                      variant="outline"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      {suggestNextAction.isPending ? 'Analisando...' : 'Sugerir Ação'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {suggestNextAction.data?.suggestion ? (
                    <div className="space-y-4">
                      <div className="border-l-4 border-primary pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{suggestNextAction.data.suggestion.action}</h4>
                          <Badge variant={getPriorityColor(suggestNextAction.data.suggestion.priority)}>
                            {suggestNextAction.data.suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Canal:</strong> {suggestNextAction.data.suggestion.channel} • 
                          <strong> Quando:</strong> {suggestNextAction.data.suggestion.timing}
                        </p>
                        <p className="text-sm mb-3">{suggestNextAction.data.suggestion.rationale}</p>
                        
                        <div className="bg-muted p-3 rounded-lg">
                          <h5 className="text-sm font-semibold mb-2">Pontos-chave para abordar:</h5>
                          <ul className="space-y-1">
                            {suggestNextAction.data.suggestion.talking_points?.map((point: string, idx: number) => (
                              <li key={idx} className="text-sm">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Array.isArray(activeStrategy.ai_recommendations) && activeStrategy.ai_recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mapa de Stakeholders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(activeStrategy.stakeholder_map) && activeStrategy.stakeholder_map.map((stakeholder: any, idx: number) => (
                      <div key={idx} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{stakeholder.name || stakeholder.role}</h4>
                          <p className="text-sm text-muted-foreground">{stakeholder.strategy || stakeholder.approach}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Alert Dialog para mudanças não salvas */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja salvar suas alterações antes de mudar de aba? Se você continuar sem salvar, as alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTabChange}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTabChange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continuar sem salvar
            </AlertDialogAction>
            {saveCallback && (
              <AlertDialogAction onClick={handleSaveAndChangeTab}>
                Salvar e continuar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ScrollToTopButton />
    </AppLayout>
  );
}
