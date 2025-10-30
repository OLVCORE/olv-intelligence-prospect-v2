import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const LEADS_QUALIFIED_QUERY_KEY = ['leads-qualified'];

export function useLeadsQualified() {
  return useQuery({
    queryKey: LEADS_QUALIFIED_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_qualified')
        .select('*')
        .eq('status', 'qualificada')
        .order('icp_score', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });
}

export function useLeadsQualifiedCount() {
  return useQuery({
    queryKey: [...LEADS_QUALIFIED_QUERY_KEY, 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads_qualified')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'qualificada');
      
      if (error) throw error;
      return count || 0;
    },
    staleTime: 10 * 1000,
  });
}
