import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TOTVSDetectionV3Params {
  companyId: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  region?: string;
  sector?: string;
  niche?: string;
}

export interface Evidence {
  source: string;
  platform: string;
  score: number;
  title: string;
  snippet: string;
  url: string;
  timestamp: string;
  confidence: string;
  reason: string;
  totvs_products_mentioned?: string[];
}

export interface ScoreBreakdown {
  source: string;
  points_awarded: number;
  max_points: number;
  reason: string;
}

export interface Methodology {
  total_sources_checked: number;
  sources_with_results: string[];
  sources_without_results: string[];
  score_breakdown: ScoreBreakdown[];
  calculation_formula: string;
  threshold_applied: {
    qualified_if_below: number;
    disqualified_if_above: number;
  };
}

export interface TOTVSDetectionV3Result {
  ok: boolean;
  score: number;
  status: 'qualified' | 'disqualified';
  confidence: 'low' | 'medium' | 'high';
  disqualification_reason?: string;
  evidences: Evidence[];
  methodology: Methodology;
  sources_checked: number;
  platforms_scanned: string[];
  message: string;
}

export function useLatestTOTVSDetectionV3(companyId?: string) {
  return useQuery({
    queryKey: ['totvs-detection-v3', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('totvs_usage_detection')
        .select('*')
        .eq('company_id', companyId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching TOTVS detection:', error);
        throw error;
      }

      return data;
    },
    enabled: !!companyId,
    staleTime: 30000
  });
}

export function useTOTVSDetectionV3() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TOTVSDetectionV3Params) => {
      const { data, error } = await supabase.functions.invoke('detect-totvs-usage-v3', {
        body: {
          company_id: params.companyId,
          company_name: params.companyName,
          cnpj: params.cnpj,
          domain: params.domain,
          region: params.region,
          sector: params.sector,
          niche: params.niche
        },
      });

      if (error) throw error;
      return data as TOTVSDetectionV3Result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['totvs-detection-v3'] });
      
      if (data.status === 'disqualified') {
        toast.error('⛔ EMPRESA DESCARTADA - JÁ USA TOTVS', {
          description: `${data.disqualification_reason || 'Detectado uso de produtos TOTVS'} (Score: ${data.score}/100)`,
          duration: 8000,
        });
      } else {
        toast.success('✅ Empresa qualificada - Sem uso de TOTVS detectado', {
          description: `Lead válido para prospecção ativa (Score: ${data.score}/100)`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao detectar uso de TOTVS', {
        description: error.message,
      });
    },
  });
}
