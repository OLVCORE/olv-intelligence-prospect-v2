import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ValueTracking {
  id: string;
  company_id: string;
  account_strategy_id: string;
  
  // Prometido
  promised_roi: number;
  promised_payback_months: number;
  promised_annual_savings: number;
  promised_efficiency_gain: number;
  promised_revenue_growth: number;
  baseline_date: string;
  
  // Realizado
  realized_roi: number;
  realized_payback_months: number;
  realized_annual_savings: number;
  realized_efficiency_gain: number;
  realized_revenue_growth: number;
  last_measured_at?: string;
  
  tracking_status: string;
  health_score: number;
  variance_analysis: any;
  risk_flags: any[];
  next_review_date?: string;
  review_frequency?: string;
}

export function useValueTracking(accountStrategyId?: string) {
  return useQuery({
    queryKey: ['value-tracking', accountStrategyId],
    queryFn: async () => {
      let query = supabase
        .from('value_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (accountStrategyId) {
        query = query.eq('account_strategy_id', accountStrategyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ValueTracking[];
    },
    enabled: !!accountStrategyId,
  });
}

export function useCreateValueTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tracking: {
      company_id: string;
      account_strategy_id: string;
      promised_roi: number;
      promised_payback_months: number;
      promised_annual_savings: number;
      promised_efficiency_gain?: number;
      promised_revenue_growth?: number;
    }) => {
      const { data, error } = await supabase
        .from('value_tracking')
        .insert(tracking)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['value-tracking'] });
      toast.success('Tracking iniciado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useUpdateValueRealization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackingId, realized }: {
      trackingId: string;
      realized: {
        realized_roi?: number;
        realized_payback_months?: number;
        realized_annual_savings?: number;
        realized_efficiency_gain?: number;
        realized_revenue_growth?: number;
      };
    }) => {
      const { data, error } = await supabase
        .from('value_tracking')
        .update({
          ...realized,
          last_measured_at: new Date().toISOString(),
        })
        .eq('id', trackingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['value-tracking'] });
      toast.success('Valores atualizados!');
    },
  });
}
