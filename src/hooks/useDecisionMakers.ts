import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DecisionMaker, Inserts } from '@/lib/db';

// CICLO 3: Ordenação padrão conforme especificação (seção 9)
const SENIORITY_RANK = {
  'C-Level': 5,
  'VP': 4,
  'Director': 3,
  'Head': 2,
  'Manager': 1,
};

export function useDecisionMakers(companyId?: string) {
  return useQuery({
    queryKey: ['decision_makers', companyId],
    queryFn: async () => {
      let query = supabase
        .from('decision_makers')
        .select('*')
        .eq('is_decision_maker', true)
        .eq('validation_status', 'valid');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // CICLO 3: Ordenação local (recommendations_score → seniority → updated_at)
      const sorted = (data as DecisionMaker[]).sort((a, b) => {
        // 1. recommendations_score desc
        const scoreA = a.recommendations_score || 0;
        const scoreB = b.recommendations_score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        // 2. seniority_rank desc
        const rankA = SENIORITY_RANK[a.seniority as keyof typeof SENIORITY_RANK] || 0;
        const rankB = SENIORITY_RANK[b.seniority as keyof typeof SENIORITY_RANK] || 0;
        if (rankB !== rankA) return rankB - rankA;
        
        // 3. updated_at desc (mais recente)
        const dateA = new Date(a.updated_at || 0).getTime();
        const dateB = new Date(b.updated_at || 0).getTime();
        return dateB - dateA;
      });
      
      return sorted;
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
