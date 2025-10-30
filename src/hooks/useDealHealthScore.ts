import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const DEAL_HEALTH_QUERY_KEY = ['deal-health-scores'];

export interface DealHealthScore {
  id: string;
  company_id: string;
  health_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  engagement_score: number;
  velocity_score: number;
  stakeholder_score: number;
  activity_score: number;
  risk_factors: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: string;
    description: string;
  }>;
  calculated_at: string;
  metadata: any;
}

export function useDealHealthScore(companyId: string | null) {
  return useQuery({
    queryKey: [...DEAL_HEALTH_QUERY_KEY, companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('deal_health_scores')
        .select('*')
        .eq('company_id', companyId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as DealHealthScore | null;
    },
    enabled: !!companyId,
  });
}

export function useCompaniesAtRisk() {
  return useQuery({
    queryKey: [...DEAL_HEALTH_QUERY_KEY, 'at-risk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_health_scores')
        .select(`
          *,
          companies (
            id,
            name,
            deal_value,
            deal_stage,
            assigned_to
          )
        `)
        .in('risk_level', ['high', 'critical'])
        .order('calculated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCalculateDealHealth() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyId: string) => {
      // Aqui vamos calcular o health score baseado em várias métricas
      // Por enquanto, vamos fazer um cálculo simples
      
      // 1. Buscar atividades recentes
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('company_id', companyId)
        .gte('activity_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      // 2. Buscar empresa
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (!company) throw new Error('Company not found');
      
      // 3. Calcular scores
      const activityScore = Math.min(100, (activities?.length || 0) * 10);
      const velocityScore = calculateVelocityScore(company);
      const stakeholderScore = 70; // Placeholder
      const engagementScore = Math.round((activityScore + velocityScore) / 2);
      
      const healthScore = Math.round(
        (activityScore * 0.3) + 
        (velocityScore * 0.3) + 
        (stakeholderScore * 0.2) + 
        (engagementScore * 0.2)
      );
      
      const riskLevel = getRiskLevel(healthScore);
      const riskFactors = calculateRiskFactors(company, activities || []);
      const recommendations = generateRecommendations(riskLevel, riskFactors);
      
      // 4. Salvar no banco
      const { data: healthData, error } = await supabase
        .from('deal_health_scores')
        .insert({
          company_id: companyId,
          health_score: healthScore,
          risk_level: riskLevel,
          engagement_score: engagementScore,
          velocity_score: velocityScore,
          stakeholder_score: stakeholderScore,
          activity_score: activityScore,
          risk_factors: riskFactors,
          recommendations: recommendations,
        })
        .select()
        .single();
      
      if (error) throw error;
      return healthData;
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: [...DEAL_HEALTH_QUERY_KEY, companyId] });
      queryClient.invalidateQueries({ queryKey: [...DEAL_HEALTH_QUERY_KEY, 'at-risk'] });
    },
  });
}

function calculateVelocityScore(company: any): number {
  if (!company.stage_changed_at) return 50;
  
  const daysSinceStageChange = Math.floor(
    (Date.now() - new Date(company.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Quanto menor o tempo, melhor o score
  if (daysSinceStageChange < 7) return 100;
  if (daysSinceStageChange < 14) return 80;
  if (daysSinceStageChange < 30) return 60;
  if (daysSinceStageChange < 60) return 40;
  return 20;
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function calculateRiskFactors(company: any, activities: any[]) {
  const factors = [];
  
  if (activities.length === 0) {
    factors.push({
      type: 'no_activity',
      description: 'Nenhuma atividade registrada nos últimos 30 dias',
      severity: 'high',
    });
  } else if (activities.length < 3) {
    factors.push({
      type: 'low_activity',
      description: 'Baixo engajamento - menos de 3 atividades no mês',
      severity: 'medium',
    });
  }
  
  if (company.days_in_stage > 45) {
    factors.push({
      type: 'stalled',
      description: `Deal estagnado há ${company.days_in_stage} dias no mesmo estágio`,
      severity: 'high',
    });
  }
  
  if (!company.next_action_date) {
    factors.push({
      type: 'no_next_action',
      description: 'Nenhuma próxima ação agendada',
      severity: 'medium',
    });
  }
  
  return factors;
}

function generateRecommendations(riskLevel: string, riskFactors: any[]) {
  const recommendations = [];
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push({
      action: 'immediate_follow_up',
      priority: 'urgent',
      description: 'Agendar reunião urgente com stakeholder principal',
    });
  }
  
  const hasNoActivity = riskFactors.some(f => f.type === 'no_activity');
  if (hasNoActivity) {
    recommendations.push({
      action: 'schedule_call',
      priority: 'high',
      description: 'Realizar ligação de check-in para reengajar',
    });
  }
  
  const hasStalled = riskFactors.some(f => f.type === 'stalled');
  if (hasStalled) {
    recommendations.push({
      action: 'send_value_prop',
      priority: 'high',
      description: 'Enviar novo business case ou proposta de valor',
    });
  }
  
  return recommendations;
}
