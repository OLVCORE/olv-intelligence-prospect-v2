import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DecisionMaker, Inserts } from '@/lib/db';

export function useDecisionMakers(companyId?: string) {
  return useQuery({
    queryKey: ['decision_makers', companyId],
    queryFn: async () => {
      let query = supabase
        .from('decision_makers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DecisionMaker[];
    },
    enabled: companyId !== undefined,
  });
}

export function useCreateDecisionMaker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (decisor: Inserts<'decision_makers'>) => {
      const { data, error } = await supabase
        .from('decision_makers')
        .insert([decisor])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['decision_makers', data.company_id] 
      });
    },
  });
}

export function useUpdateDecisionMaker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DecisionMaker> }) => {
      const { data, error } = await supabase
        .from('decision_makers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['decision_makers', data.company_id] 
      });
    },
  });
}
