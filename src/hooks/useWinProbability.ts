import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WinProbabilityResult {
  company_id: string;
  company_name: string;
  base_probability: number;
  ai_probability: number;
  final_probability: number;
  confidence: 'high' | 'medium' | 'low';
  key_factors: string[];
  recommendations: string[];
  insights: string;
  context_summary: {
    totvs_risk: 'high' | 'medium' | 'low';
    intent_level: 'hot' | 'warm' | 'cold';
    historical_win_rate: number | null;
    competitor: string | null;
  };
  calculated_at: string;
}

export function useCalculateWinProbability() {
  return useMutation({
    mutationFn: async ({ 
      companyId, 
      dealValue, 
      daysInPipeline 
    }: { 
      companyId: string; 
      dealValue?: number; 
      daysInPipeline?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('calculate-win-probability', {
        body: { 
          company_id: companyId,
          deal_value: dealValue,
          days_in_pipeline: daysInPipeline,
        },
      });

      if (error) throw error;
      return data as WinProbabilityResult;
    },
    onSuccess: (data) => {
      const emoji = data.final_probability >= 70 ? '🎯' : data.final_probability >= 40 ? '⚠️' : '🔴';
      toast.success(`${emoji} Probabilidade de Ganho: ${data.final_probability}%`, {
        description: data.insights || `Confiança: ${data.confidence}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao calcular probabilidade', {
        description: error.message,
      });
    },
  });
}
