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
  total_portals: number;
  search_date: string;
  product_searched?: string;
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
      const cacheKey = `competitors:${companyName.toLowerCase()}`;

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

      // Filtrar rigorosamente no client para bloquear lixo e TOTVS
      const EXCLUDE = /(totvs|protheus|rm|datasul|logix|microsiga)/i;
      const filtered = (data as CompetitorSearchResult).competitors
        .filter((c) => !EXCLUDE.test(c.name))
        // preferir somente evidências STC (quando presente)
        .filter((c: any) => {
          if ('match_type' in c) {
            return c.match_type === 'triple' || c.match_type === 'double';
          }
          // fallback: validar ao menos 1 link com contexto
          const ctx = /\b(usa|utiliza|cliente|implementou|migrou)\b/i;
          const erp = /\b(erp|sistema|gestão)\b/i;
          return (c.comparison_links || []).some((l) => ctx.test(l.snippet) && erp.test(l.snippet));
        })
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 8);

      const portals = new Set<string>();
      filtered.forEach((c) => (c.portals || []).forEach((p: string) => portals.add(p)));

      const shaped: CompetitorSearchResult = {
        ...(data as CompetitorSearchResult),
        competitors: filtered as any,
        portals_searched: portals.size,
        total_portals: portals.size,
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ cached_at: Date.now(), data: shaped }));
      } catch {}

      return shaped;
    },
    onSuccess: (data) => {
      const portalsCount = data.portals_searched || 0;
      const totalPortals = data.total_portals || portalsCount;
      toast.success('🔍 Busca de Concorrentes Concluída', {
        description: `${data.competitors.length} concorrentes validados em ${portalsCount} portais`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na busca de concorrentes', {
        description: error.message,
      });
    },
  });
}
