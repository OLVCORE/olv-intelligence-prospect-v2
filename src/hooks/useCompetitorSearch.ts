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

export interface STCCompetitor {
  name: string;
  match_type: 'double_match' | 'triple_match';
  confidence: number;
  evidence: string;
  source_url: string;
  source_title: string;
  detected_at: string;
}

export interface CompetitorSearchResult {
  success: boolean;
  competitors: DetectedCompetitor[];
  total_comparisons_found: number;
  portals_searched: number;
  total_portals: number;
  search_date: string;
  product_searched?: string;
}

export interface STCCompetitorSearchResult {
  success: boolean;
  competitors: STCCompetitor[];
  total_found: number;
  company_name: string;
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
      const totalPortals = data.total_portals || 41;
      toast.success('🔍 Busca de Concorrentes Concluída', {
        description: `${data.competitors.length} concorrentes encontrados em ${portalsCount}/${totalPortals} portais`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na busca de concorrentes', {
        description: error.message,
      });
    },
  });
}

export function useCompetitorSearchSTC() {
  return useMutation({
    mutationFn: async ({
      companyId,
      companyName,
      sector,
    }: {
      companyId: string;
      companyName: string;
      sector?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('search-competitors-stc', {
        body: {
          company_id: companyId,
          company_name: companyName,
          sector,
        },
      });

      if (error) throw error;
      return data as STCCompetitorSearchResult;
    },
    onSuccess: (data) => {
      toast.success('✅ Busca STC Concluída', {
        description: `${data.total_found} concorrentes encontrados usando metodologia STC`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na busca STC de concorrentes', {
        description: error.message,
      });
    },
  });
}
