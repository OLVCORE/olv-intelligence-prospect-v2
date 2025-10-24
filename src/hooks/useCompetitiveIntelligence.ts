import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Competitor {
  id: string;
  name: string;
  category: string;
  market_position: string;
  strengths: string[];
  weaknesses: string[];
  totvs_advantages: string[];
}

export interface BattleCard {
  id: string;
  competitor_id: string;
  totvs_product_sku: string;
  feature_comparison: any;
  pricing_comparison: any;
  win_strategy: string;
  objection_handling: any[];
  proof_points: any[];
}

export interface WinLossAnalysis {
  id: string;
  company_id: string;
  outcome: 'won' | 'lost' | 'ongoing';
  deal_value: number;
  competitors_faced: string[];
  primary_competitor: string;
  win_reasons: string[];
  loss_reasons: string[];
  key_differentiators: string[];
  competitive_intensity: string;
}

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('active', true)
        .order('market_position');

      if (error) throw error;
      return data as unknown as Competitor[];
    },
  });
}

export function useBattleCards(competitorId?: string) {
  return useQuery({
    queryKey: ['battle-cards', competitorId],
    queryFn: async () => {
      let query = supabase
        .from('battle_cards')
        .select('*, competitor:competitors(name, category)');

      if (competitorId) {
        query = query.eq('competitor_id', competitorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as BattleCard[];
    },
  });
}

export function useWinLossAnalysis(companyId?: string) {
  return useQuery({
    queryKey: ['win-loss', companyId],
    queryFn: async () => {
      let query = supabase
        .from('win_loss_analysis')
        .select('*')
        .order('closed_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as WinLossAnalysis[];
    },
  });
}

export function useCreateWinLossAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysis: {
      company_id: string;
      account_strategy_id?: string;
      outcome: 'won' | 'lost' | 'ongoing';
      deal_value: number;
      competitors_faced: string[];
      primary_competitor: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-competitive-deal', {
        body: analysis,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['win-loss'] });
      toast.success('Análise registrada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
