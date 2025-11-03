import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SEOKeywordsResult {
  organicResults: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
  }>;
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
    website?: string;
  };
}

export function useSEOKeywords(companyName: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['seo-keywords', companyName],
    queryFn: async () => {
      if (!companyName) return null;

      const { data, error } = await supabase.functions.invoke('serper-search', {
        body: { 
          query: companyName,
          type: 'search'
        }
      });

      if (error) {
        console.error('Error fetching SEO data:', error);
        throw error;
      }

      return data as SEOKeywordsResult;
    },
    enabled: enabled && !!companyName,
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}
