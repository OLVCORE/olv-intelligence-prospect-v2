import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Clock, Award, BarChart3 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Analytics() {
  const { data: companies } = useQuery({
    queryKey: ['analytics-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .not('deal_stage', 'is', null);

      if (error) throw error;
      return data;
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
  const avgDaysInStage = companies?.reduce((sum, c) => sum + (c.days_in_stage || 0), 0) / (totalDeals || 1);

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
    const conversionRate = index === 0 ? 100 : ((dealsInStage.length / (previousStageDeals || 1)) * 100);

    return {
      ...stage,
      totalDeals: dealsInStage.length,
      totalValue,
      conversionRate
    };
  });

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
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">+12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total de Deals</p>
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{totalDeals}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">+8% vs mês anterior</span>
            </div>
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
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">-3 dias vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">32%</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">+5% vs mês anterior</span>
            </div>
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
