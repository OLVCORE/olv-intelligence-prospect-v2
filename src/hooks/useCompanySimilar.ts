import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SimilarCompany {
  similar_company_external_id: string;
  similar_name: string;
  location: string;
  employees_min: number;
  employees_max: number;
  similarity_score: number;
  source: string;
}

export function useCompanySimilar(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-similar', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('similar_companies')
        .select('*')
        .eq('company_id', companyId)
        .order('similarity_score', { ascending: false });

      if (error) {
        console.error('Error fetching similar companies:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId
  });
}
