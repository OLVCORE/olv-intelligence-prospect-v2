import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScenarioCase {
  roi: number;
  npv: number;
  payback_months: number;
  total_investment: number;
  annual_benefit: number;
  cumulative_5y: number;
}

export interface Scenario {
  id: string;
  company_id: string;
  account_strategy_id?: string;
  quote_id?: string;
  best_case: ScenarioCase;
  expected_case: ScenarioCase;
  worst_case: ScenarioCase;
  sensitivity_analysis: any[];
  risk_factors: any[];
  assumptions: any[];
  probability_best: number;
  probability_expected: number;
  probability_worst: number;
  recommended_scenario: string;
  confidence_level: number;
  key_insights: any[];
  created_at: string;
}

export function useScenarios(accountStrategyId?: string) {
  return useQuery({
    queryKey: ['scenarios', accountStrategyId],
    queryFn: async () => {
      let query = supabase
        .from('scenario_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (accountStrategyId) {
        query = query.eq('account_strategy_id', accountStrategyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Scenario[];
    },
    enabled: !!accountStrategyId,
  });
}

export function useGenerateScenarios() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      company_id: string;
      account_strategy_id?: string;
      quote_id?: string;
      base_investment: number;
      base_annual_benefit: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-scenario-analysis', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Análise de cenários gerada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar cenários: ${error.message}`);
    },
  });
}
