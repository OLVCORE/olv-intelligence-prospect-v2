import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IntentSignalsV3Params {
  companyId: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  region?: string;
  sector?: string;
  niche?: string;
}

export interface IntentSignal {
  type: string;
  score: number;
  title: string;
  description: string;
  url: string;
  timestamp: string;
  confidence: string;
  reason: string;
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
    cold_if_below: number;
    warm_if_between: [number, number];
    hot_if_above: number;
  };
}

export interface CompanyMatch {
  name: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  matchReasons: string[];
  sources: string[];
  signals: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

export interface IntentSignalsV3Result {
  ok: boolean;
  score: number;
  temperature: 'cold' | 'warm' | 'hot';
  confidence: 'low' | 'medium' | 'high';
  signals: IntentSignal[];
  methodology: Methodology;
  sources_checked: number;
  platforms_scanned: string[];
  message: string;
  multiple_matches?: boolean;
  matches?: CompanyMatch[];
  original_company_name?: string;
}

export function useLatestIntentSignalsV3(companyId?: string) {
  return useQuery({
    queryKey: ['intent-signals-v3', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('intent_signals_detection')
        .select('*')
        .eq('company_id', companyId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching intent signals:', error);
        throw error;
      }

      return data;
    },
    enabled: !!companyId,
    staleTime: 30000
  });
}

export function useDetectIntentSignalsV3() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: IntentSignalsV3Params & { selected_company_name?: string }) => {
      const { data, error } = await supabase.functions.invoke('detect-intent-signals-v3', {
        body: {
          company_id: params.companyId,
          company_name: params.companyName,
          cnpj: params.cnpj,
          domain: params.domain,
          region: params.region,
          sector: params.sector,
          niche: params.niche,
          selected_company_name: params.selected_company_name
        },
      });

      if (error) throw error;
      return data as IntentSignalsV3Result;
    },
    onSuccess: (data) => {
      // Se há múltiplos matches, não fazer nada aqui (o componente vai lidar)
      if (data.multiple_matches) {
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['intent-signals-v3'] });
      
      const tempEmoji = data.temperature === 'hot' ? '🔥' : data.temperature === 'warm' ? '🌡️' : '❄️';
      const tempLabel = data.temperature === 'hot' ? 'HOT LEAD' : data.temperature === 'warm' ? 'WARM LEAD' : 'COLD LEAD';
      
      toast.success(`${tempEmoji} ${tempLabel}`, {
        description: `${data.signals.length} sinais detectados (Score: ${data.score}/100)`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao detectar sinais de intenção', {
        description: error.message,
      });
    },
  });
}
