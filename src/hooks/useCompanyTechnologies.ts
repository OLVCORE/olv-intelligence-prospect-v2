import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Technology {
  technology: string;
  category: string;
  source: string;
}

export function useCompanyTechnologies(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-technologies', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_technologies')
        .select('*')
        .eq('company_id', companyId)
        .order('technology');

      if (error) {
        console.error('Error fetching company technologies:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId
  });
}
