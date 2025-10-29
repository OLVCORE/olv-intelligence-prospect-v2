import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyJob {
  id: number;
  title: string;
  location: string;
  url: string;
  portal: string;
  posted_at: string;
}

export function useCompanyJobs(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('posted_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching company jobs:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId
  });
}
