import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Deal {
  id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  company_id: string | null;
  contact_id: string | null;
  assigned_to: string | null;
  pipeline_id: string | null;
  stage: string;
  stage_order: number;
  value: number;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  lost_reason: string | null;
  won_date: string | null;
  source: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  bitrix24_synced_at: string | null;
  bitrix24_data: any;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  key: string;
  order_index: number;
  color: string;
  probability_default: number;
  is_closed: boolean;
  is_won: boolean;
  automation_rules: any[];
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: string;
  description: string | null;
  old_value: any;
  new_value: any;
  created_by: string | null;
  created_at: string;
}

const DEALS_QUERY_KEY = ['deals'];
const STAGES_QUERY_KEY = ['pipeline-stages'];

// Hook para buscar todos os deals
export function useDeals(filters?: {
  stage?: string;
  status?: string;
  assigned_to?: string;
}) {
  return useQuery({
    queryKey: [...DEALS_QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('sdr_deals')
        .select('*')
        .order('stage_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Deal[];
    },
    staleTime: 30 * 1000,
  });
}

// Hook para buscar um deal específico
export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Deal;
    },
    enabled: !!id,
  });
}

// Hook para buscar estágios do pipeline
export function usePipelineStages() {
  return useQuery({
    queryKey: STAGES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_pipeline_stages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as PipelineStage[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos (estágios mudam raramente)
  });
}

// Hook para criar deal
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deal: Record<string, any>) => {
      const { data, error } = await supabase
        .from('sdr_deals')
        .insert([deal as any])
        .select()
        .single();

      if (error) throw error;
      return data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
  });
}

// Hook para atualizar deal
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('sdr_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Deal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
    },
  });
}

// Hook para mover deal para outro estágio
export function useMoveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { data, error } = await supabase
        .from('sdr_deals')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
  });
}

// Hook para deletar deal
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sdr_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
    },
  });
}

// Hook para buscar atividades do deal
export function useDealActivities(dealId: string) {
  return useQuery({
    queryKey: ['deal-activities', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_deal_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DealActivity[];
    },
    enabled: !!dealId,
  });
}

// Hook para bulk update
export function useBulkUpdateDeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const promises = ids.map(id =>
        supabase
          .from('sdr_deals')
          .update(updates)
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`${errors.length} deals failed to update`);
      }

      return { updated: ids.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
  });
}
