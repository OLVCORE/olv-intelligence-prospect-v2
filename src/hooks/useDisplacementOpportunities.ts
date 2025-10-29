import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DisplacementStatus = 'open' | 'in_progress' | 'won' | 'lost' | 'ignored';

export interface DisplacementOpportunity {
  id: string;
  company_id: string;
  competitor_name: string;
  competitor_type: string | null;
  displacement_reason: string;
  evidence: string | null;
  opportunity_score: number | null;
  estimated_revenue: number | null;
  detected_at: string;
  status: DisplacementStatus;
  assigned_to: string | null;
  next_action: string | null;
  next_action_date: string | null;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export function useDisplacementOpportunities(companyId?: string, options?: {
  status?: DisplacementStatus;
  minScore?: number;
}) {
  return useQuery({
    queryKey: ['displacement-opportunities', companyId, options],
    queryFn: async () => {
      let query = supabase
        .from('displacement_opportunities')
        .select('*')
        .order('opportunity_score', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.minScore) {
        query = query.gte('opportunity_score', options.minScore);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching displacement opportunities:', error);
        throw error;
      }

      return (data || []) as DisplacementOpportunity[];
    },
    staleTime: 30000,
  });
}

export function useAnalyzeDisplacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      company_id,
      company_name,
      competitors,
    }: {
      company_id: string;
      company_name: string;
      competitors?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('analyze-displacement-opportunities', {
        body: { company_id, company_name, competitors },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['displacement-opportunities'] });
      toast.success('🎯 Oportunidades de Displacement Detectadas', {
        description: `${data.opportunities_detected} oportunidades encontradas`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao analisar displacement', {
        description: error.message,
      });
    },
  });
}

export function useUpdateOpportunityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      opportunity_id,
      status,
      next_action,
      next_action_date,
    }: {
      opportunity_id: string;
      status: DisplacementStatus;
      next_action?: string;
      next_action_date?: string;
    }) => {
      const { error } = await supabase
        .from('displacement_opportunities')
        .update({
          status,
          next_action: next_action || null,
          next_action_date: next_action_date || null,
        })
        .eq('id', opportunity_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displacement-opportunities'] });
      toast.success('Status atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status', {
        description: error.message,
      });
    },
  });
}
