import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Clock, Award, BarChart3, ArrowRight, Users 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Analytics() {
  const navigate = useNavigate();

  const { data: companies } = useQuery({
    queryKey: ['analytics-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .not('deal_stage', 'is', null);

      if (error) throw error;
      return data || [];
    }
  });

  const { data: previousMonthData } = useQuery({
    queryKey: ['previous-month-comparison'],
    queryFn: async () => {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [thisMonth, lastMonth] = await Promise.all([
        supabase
          .from('companies')
          .select('deal_value, deal_stage, created_at')
          .gte('created_at', firstDayThisMonth.toISOString()),
        supabase
          .from('companies')
          .select('deal_value, deal_stage, created_at')
          .gte('created_at', firstDayLastMonth.toISOString())
          .lte('created_at', lastDayLastMonth.toISOString())
      ]);

      const thisMonthValue = thisMonth.data?.reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0;
      const lastMonthValue = lastMonth.data?.reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0;
      const thisMonthDeals = thisMonth.data?.length || 0;
      const lastMonthDeals = lastMonth.data?.length || 0;

      return {
        thisMonthValue,
        lastMonthValue,
        thisMonthDeals,
        lastMonthDeals,
        valueGrowth: lastMonthValue > 0 ? ((thisMonthValue - lastMonthValue) / lastMonthValue) * 100 : 0,
        dealsGrowth: lastMonthDeals > 0 ? ((thisMonthDeals - lastMonthDeals) / lastMonthDeals) * 100 : 0
      };
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const totalPipelineValue = companies?.reduce((sum, c) => sum + (c.deal_value || 0), 0) || 0;
  const totalDeals = companies?.length || 0;
  const avgDaysInStage = totalDeals > 0 
    ? companies?.reduce((sum, c) => sum + (c.days_in_stage || 0), 0) / totalDeals
    : 0;

  const discoveryDeals = companies?.filter(c => c.deal_stage === 'discovery').length || 0;
  const closedWonDeals = companies?.filter(c => c.deal_stage === 'closed_won').length || 0;
  const conversionRate = discoveryDeals > 0 ? (closedWonDeals / discoveryDeals) * 100 : 0;

  const stages = [
    { id: 'discovery', label: 'Descoberta' },
    { id: 'qualification', label: 'Qualificação' },
    { id: 'proposal', label: 'Proposta' },
    { id: 'negotiation', label: 'Negociação' },
    { id: 'closed_won', label: 'Fechado (Ganho)' },
  ];

  const stageMetrics = stages.map((stage, index) => {
    const dealsInStage = companies?.filter(c => c.deal_stage === stage.id) || [];
    const totalValue = dealsInStage.reduce((sum, d) => sum + (d.deal_value || 0), 0);
    const previousStageDeals = index === 0 ? totalDeals : (companies?.filter(c => c.deal_stage === stages[index - 1].id).length || 0);
    const conversionRateCalc = index === 0 ? 100 : ((dealsInStage.length / (previousStageDeals || 1)) * 100);

    return {
      ...stage,
      totalDeals: dealsInStage.length,
      totalValue,
      conversionRate: conversionRateCalc
    };
  });

  if (totalDeals === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Conversão</h1>
          <p className="text-muted-foreground mt-1">Métricas e insights do pipeline de vendas</p>
        </div>

        <Card className="p-12 text-center">
          <BarChart3 className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">
            Nenhum dado disponível
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Capture e qualifique leads para visualizar métricas de conversão e analytics do pipeline.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/leads/capture')} size="lg">
              <ArrowRight className="w-5 h-5 mr-2" />
              Capturar Leads
            </Button>
            <Button onClick={() => navigate('/leads/pipeline')} variant="outline" size="lg">
              Ver Pipeline
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Conversão</h1>
        <p className="text-muted-foreground mt-1">
          Métricas e insights do pipeline de vendas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Valor Total Pipeline</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(totalPipelineValue)}
            </p>
            {previousMonthData && previousMonthData.lastMonthValue > 0 ? (
              <div className="flex items-center gap-1 mt-2">
                {previousMonthData.valueGrowth >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      +{previousMonthData.valueGrowth.toFixed(1)}% vs mês anterior
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      {previousMonthData.valueGrowth.toFixed(1)}% vs mês anterior
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground mt-2 block">
                Dados do mês atual
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total de Deals</p>
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{totalDeals}</p>
            {previousMonthData && previousMonthData.lastMonthDeals > 0 ? (
              <div className="flex items-center gap-1 mt-2">
                {previousMonthData.dealsGrowth >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      +{previousMonthData.dealsGrowth.toFixed(1)}% vs mês anterior
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      {previousMonthData.dealsGrowth.toFixed(1)}% vs mês anterior
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground mt-2 block">
                Dados do mês atual
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Tempo Médio por Estágio</p>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold">
              {Math.round(avgDaysInStage)} dias
            </p>
            <span className="text-sm text-muted-foreground mt-2 block">
              Média atual
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">
              {conversionRate.toFixed(1)}%
            </p>
            <span className="text-sm text-muted-foreground mt-2 block">
              Descoberta → Fechado
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Funil de Conversão
          </CardTitle>
          <CardDescription>Taxa de conversão por estágio do pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stageMetrics.map((stage) => (
              <div key={stage.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold capitalize">
                      {stage.label}
                    </span>
                    <Badge variant="outline">
                      {stage.totalDeals} deals
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(stage.totalValue)}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {stage.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${stage.conversionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
