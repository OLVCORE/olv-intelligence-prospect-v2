import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, CheckCircle, Database, Zap, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";

export default function SystemHealth() {
  // Health check das principais funcionalidades
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // 1. Pipeline Health
      const { count: quarantineCount } = await supabase
        .from('icp_analysis_results')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      const { count: leadsPoolCount } = await supabase
        .from('leads_pool')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: dealsCount } = await supabase
        .from('sdr_deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // 2. Processing Health (últimas 24h)
      const { count: recentAnalysis } = await supabase
        .from('icp_analysis_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo.toISOString());

      const { count: recentEnrichments } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', oneDayAgo.toISOString())
        .not('digital_maturity_score', 'is', null);

      // 3. Automation Health
      const { count: autoCreatedDeals } = await supabase
        .from('sdr_deals')
        .select('*', { count: 'exact', head: true })
        .in('source', ['icp_hot_lead_auto', 'icp_auto_approval', 'enrichment_auto'])
        .gte('created_at', oneDayAgo.toISOString());

      // 4. Data Quality
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, cnpj, domain, employees, icp_score')
        .limit(1000);

      const totalCompanies = companiesData?.length || 0;
      const withCNPJ = companiesData?.filter(c => c.cnpj).length || 0;
      const withDomain = companiesData?.filter(c => c.domain).length || 0;
      const withEmployees = companiesData?.filter(c => c.employees).length || 0;
      const withICPScore = companiesData?.filter(c => c.icp_score).length || 0;

      const dataQualityScore = totalCompanies > 0
        ? Math.round(((withCNPJ + withDomain + withEmployees + withICPScore) / (totalCompanies * 4)) * 100)
        : 0;

      // 5. Performance Metrics
      const { count: hotLeads } = await supabase
        .from('leads_pool')
        .select('*', { count: 'exact', head: true })
        .eq('temperatura', 'hot')
        .eq('status', 'active');

      const { data: conversionData } = await supabase
        .from('sdr_deals')
        .select('status, created_at')
        .gte('created_at', oneDayAgo.toISOString());

      const wonDeals = conversionData?.filter(d => d.status === 'won').length || 0;
      const totalDealsCreated = conversionData?.length || 0;
      const conversionRate = totalDealsCreated > 0 
        ? Math.round((wonDeals / totalDealsCreated) * 100) 
        : 0;

      return {
        pipeline: {
          quarantine: quarantineCount || 0,
          leadsPool: leadsPoolCount || 0,
          deals: dealsCount || 0,
          health: quarantineCount && quarantineCount > 50 ? 'warning' : 'healthy',
        },
        processing: {
          recentAnalysis: recentAnalysis || 0,
          recentEnrichments: recentEnrichments || 0,
          health: (recentAnalysis || 0) > 0 ? 'healthy' : 'idle',
        },
        automation: {
          autoDealsCreated: autoCreatedDeals || 0,
          health: (autoCreatedDeals || 0) > 0 ? 'healthy' : 'idle',
        },
        dataQuality: {
          score: dataQualityScore,
          totalCompanies,
          withCNPJ,
          withDomain,
          withEmployees,
          withICPScore,
          health: dataQualityScore >= 70 ? 'healthy' : dataQualityScore >= 50 ? 'warning' : 'critical',
        },
        performance: {
          hotLeads: hotLeads || 0,
          conversionRate,
          health: conversionRate >= 20 ? 'healthy' : conversionRate >= 10 ? 'warning' : 'critical',
        },
      };
    },
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'idle': return <Clock className="h-5 w-5 text-gray-500" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getHealthBadge = (health: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      healthy: { label: 'Saudável', variant: 'default' },
      warning: { label: 'Atenção', variant: 'secondary' },
      critical: { label: 'Crítico', variant: 'destructive' },
      idle: { label: 'Ocioso', variant: 'outline' },
    };
    return config[health] || { label: 'Desconhecido', variant: 'outline' };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Carregando status do sistema...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saúde do Sistema</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do pipeline de vendas
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overview Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{healthData?.pipeline.quarantine || 0}</div>
                <p className="text-sm text-muted-foreground">Em Quarentena</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{healthData?.pipeline.leadsPool || 0}</div>
                <p className="text-sm text-muted-foreground">No Pool de Leads</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{healthData?.pipeline.deals || 0}</div>
                <p className="text-sm text-muted-foreground">Deals Ativos</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getHealthIcon(healthData?.pipeline.health || 'idle')}
                Pipeline
              </CardTitle>
              <Badge variant={getHealthBadge(healthData?.pipeline.health || 'idle').variant}>
                {getHealthBadge(healthData?.pipeline.health || 'idle').label}
              </Badge>
            </div>
            <CardDescription>Fluxo de leads do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Quarentena</span>
              <span className="font-bold">{healthData?.pipeline.quarantine}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Leads Pool</span>
              <span className="font-bold">{healthData?.pipeline.leadsPool}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Deals Abertos</span>
              <span className="font-bold">{healthData?.pipeline.deals}</span>
            </div>
          </CardContent>
        </Card>

        {/* Processing Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getHealthIcon(healthData?.processing.health || 'idle')}
                Processamento (24h)
              </CardTitle>
              <Badge variant={getHealthBadge(healthData?.processing.health || 'idle').variant}>
                {getHealthBadge(healthData?.processing.health || 'idle').label}
              </Badge>
            </div>
            <CardDescription>Atividade de enriquecimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Análises ICP</span>
              <span className="font-bold">{healthData?.processing.recentAnalysis}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Enriquecimentos 360°</span>
              <span className="font-bold">{healthData?.processing.recentEnrichments}</span>
            </div>
          </CardContent>
        </Card>

        {/* Automation Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getHealthIcon(healthData?.automation.health || 'idle')}
                Automação (24h)
              </CardTitle>
              <Badge variant={getHealthBadge(healthData?.automation.health || 'idle').variant}>
                {getHealthBadge(healthData?.automation.health || 'idle').label}
              </Badge>
            </div>
            <CardDescription>Deals criados automaticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm">Deals Auto-criados</span>
              <span className="font-bold">{healthData?.automation.autoDealsCreated}</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Quality */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getHealthIcon(healthData?.dataQuality.health || 'idle')}
                Qualidade dos Dados
              </CardTitle>
              <Badge variant={getHealthBadge(healthData?.dataQuality.health || 'idle').variant}>
                {healthData?.dataQuality.score}%
              </Badge>
            </div>
            <CardDescription>Completude das informações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Com CNPJ</span>
                <span className="text-sm font-medium">
                  {healthData?.dataQuality.withCNPJ}/{healthData?.dataQuality.totalCompanies}
                </span>
              </div>
              <Progress value={(healthData?.dataQuality.withCNPJ || 0) / (healthData?.dataQuality.totalCompanies || 1) * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Com Score ICP</span>
                <span className="text-sm font-medium">
                  {healthData?.dataQuality.withICPScore}/{healthData?.dataQuality.totalCompanies}
                </span>
              </div>
              <Progress value={(healthData?.dataQuality.withICPScore || 0) / (healthData?.dataQuality.totalCompanies || 1) * 100} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getHealthIcon(healthData?.performance.health || 'idle')}
              Performance
            </CardTitle>
            <Badge variant={getHealthBadge(healthData?.performance.health || 'idle').variant}>
              {getHealthBadge(healthData?.performance.health || 'idle').label}
            </Badge>
          </div>
          <CardDescription>Métricas de conversão e qualidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold">{healthData?.performance.hotLeads}</div>
              <p className="text-sm text-muted-foreground">Hot Leads Ativos</p>
            </div>
            <div>
              <div className="text-3xl font-bold">{healthData?.performance.conversionRate}%</div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão (24h)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
