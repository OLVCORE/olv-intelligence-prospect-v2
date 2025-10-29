import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyNews {
  id: number;
  title: string;
  url: string;
  portal: string;
  published_at: string;
  score: number;
  why: string;
}

export function useCompanyNews(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-news', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_news')
        .select('*')
        .eq('company_id', companyId)
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching company news:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId
  });
}
