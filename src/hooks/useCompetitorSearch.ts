import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ComparisonLink {
  portal: string;
  title: string;
  url: string;
  snippet: string;
}

export interface DetectedCompetitor {
  name: string;
  mentions: number;
  comparison_links: ComparisonLink[];
  portals: string[];
  avg_position: number;
  relevance_score: number;
}

export interface CompetitorSearchResult {
  success: boolean;
  competitors: DetectedCompetitor[];
  total_comparisons_found: number;
  portals_searched: number;
  search_date: string;
}

export function useCompetitorSearch() {
  return useMutation({
    mutationFn: async ({
      companyName,
      sector,
      productCategory,
      keywords,
      totvsProduct,
    }: {
      companyName: string;
      sector?: string;
      productCategory?: string;
      keywords?: string;
      totvsProduct?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('search-competitors', {
        body: {
          company_name: companyName,
          sector,
          productCategory,
          keywords,
          totvs_product: totvsProduct,
        },
      });

      if (error) throw error;
      return data as CompetitorSearchResult;
    },
    onSuccess: (data) => {
      const portalsCount = data.portals_searched || 0;
      toast.success('🔍 Busca de Concorrentes Concluída', {
        description: `${data.competitors.length} concorrentes encontrados em ${portalsCount} portais`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na busca de concorrentes', {
        description: error.message,
      });
    },
  });
}
