import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DetectedCompetitor {
  name: string;
  type: 'erp' | 'crm' | 'financial' | 'ecommerce';
  relevance_score?: number;
  confidence?: number;
  reasoning?: string;
  key_differentiators?: string[];
  typical_objections?: string[];
  source?: string;
  priceRange?: string;
  targetMarket?: string;
}

export interface CompetitorSearchResult {
  company_id: string;
  company_name: string;
  competitors: DetectedCompetitor[];
  search_date: string;
  sources_checked: number;
}

export function useCompetitorSearch() {
  return useMutation({
    mutationFn: async ({
      companyId,
      companyName,
      sector,
      employees,
    }: {
      companyId: string;
      companyName: string;
      sector?: string;
      employees?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('search-competitors-web', {
        body: {
          company_id: companyId,
          company_name: companyName,
          sector,
          employees,
        },
      });

      if (error) throw error;
      return data as CompetitorSearchResult;
    },
    onSuccess: (data) => {
      toast.success('🔍 Busca de Concorrentes Concluída', {
        description: `${data.competitors.length} concorrentes SMB/PME detectados`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na busca de concorrentes', {
        description: error.message,
      });
    },
  });
}
