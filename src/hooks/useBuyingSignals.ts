import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SignalType = 
  | 'funding_round'
  | 'leadership_change'
  | 'expansion'
  | 'technology_adoption'
  | 'partnership'
  | 'market_entry'
  | 'digital_transformation'
  | 'linkedin_activity'
  | 'job_posting'
  | 'competitor_mention'
  | 'negative_review';

export type SignalPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SignalStatus = 'new' | 'in_progress' | 'contacted' | 'closed' | 'ignored';

export interface BuyingSignal {
  id: string;
  company_id: string;
  signal_type: SignalType;
  signal_title: string;
  signal_description: string | null;
  confidence_score: number | null;
  source_url: string | null;
  source_type: string | null;
  detected_at: string;
  is_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: SignalStatus;
  priority: SignalPriority;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export function useBuyingSignals(companyId?: string, options?: {
  status?: SignalStatus;
  priority?: SignalPriority;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['buying-signals', companyId, options],
    queryFn: async () => {
      let query = supabase
        .from('buying_signals')
        .select('*')
        .order('detected_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching buying signals:', error);
        throw error;
      }

      return (data || []) as BuyingSignal[];
    },
    staleTime: 30000, // 30 segundos
  });
}

export function useDetectBuyingSignals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      company_id,
      company_name,
      domain,
    }: {
      company_id: string;
      company_name: string;
      domain?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('detect-buying-signals', {
        body: { company_id, company_name, domain },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buying-signals'] });
      toast.success('🎯 Sinais de Compra Detectados', {
        description: `${data.signals_detected} sinais encontrados`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao detectar sinais', {
        description: error.message,
      });
    },
  });
}

export function useUpdateSignalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      signal_id,
      status,
    }: {
      signal_id: string;
      status: SignalStatus;
    }) => {
      const { error } = await supabase
        .from('buying_signals')
        .update({
          status,
          is_reviewed: true,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', signal_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buying-signals'] });
      toast.success('Status atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status', {
        description: error.message,
      });
    },
  });
}

export function useSignalsSummary(companyId: string) {
  return useQuery({
    queryKey: ['signals-summary', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buying_signals_summary')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching signals summary:', error);
        throw error;
      }

      return data || null;
    },
    enabled: !!companyId,
  });
}
