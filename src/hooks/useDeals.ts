import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';
import { toastMessages } from '@/lib/utils/toastMessages';

export interface Deal {
  id: string;
  title: string;
  description?: string | null;
  company_id?: string | null;
  stage: string;
  value: number;
  probability: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_close_date?: string | null;
  created_at: string;
  companies?: { name: string };
}

const DEALS_QUERY_KEY = ['sdr_deals'];

export function useDeals(filters?: { stage?: string; status?: string }) {
  return useQuery({
    queryKey: [...DEALS_QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('sdr_deals')
        .select('*, companies:companies(name)')
        .order('created_at', { ascending: false });
      
      if (filters?.stage) query = query.eq('stage', filters.stage);
      if (filters?.status) query = query.eq('status', filters.status);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Deal[];
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: { title: string; description?: string; company_id?: string; stage?: string; value?: number; priority?: string }) => {
      const { data, error} = await supabase.from('sdr_deals').insert([deal]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.success.created();
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, updates }: { dealId: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase.from('sdr_deals').update(updates).eq('id', dealId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.success.updated();
    },
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, newStage }: { dealId: string; newStage: string }) => {
      const { data, error } = await supabase.from('sdr_deals').update({ stage: newStage }).eq('id', dealId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.sdr.dealMoved();
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase.from('sdr_deals').delete().eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.success.deleted();
    },
  });
}

export function useBulkUpdateDeals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealIds, updates }: { dealIds: string[]; updates: Record<string, any> }) => {
      const promises = dealIds.map(id => 
        supabase.from('sdr_deals').update(updates).eq('id', id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
  });
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: string;
  description: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
  created_by?: string;
}

export function useDealActivities(dealId: string) {
  return useQuery({
    queryKey: ['sdr_deal_activities', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_deal_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DealActivity[];
    },
    enabled: !!dealId,
  });
}
