import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SimilarCompany {
  id: string;
  similar_company_external_id: string;
  similar_name: string;
  location: string | null;
  employees_min: number | null;
  employees_max: number | null;
  similarity_score: number | null;
  source: string;
}

export function useSimilarCompanies(companyId: string | undefined) {
  return useQuery({
    queryKey: ['similar-companies', companyId],
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
    enabled: !!companyId,
    staleTime: 30000
  });
}
