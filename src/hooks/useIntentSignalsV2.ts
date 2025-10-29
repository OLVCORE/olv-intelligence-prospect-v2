import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IntentSignalsParams {
  companyId: string;
  companyName: string;
}

interface IntentSignal {
  type: string;
  score: number;
  title: string;
  description: string;
  url: string;
  timestamp: string;
  confidence: string;
  reason: string;
}

interface IntentSignalsResult {
  ok: boolean;
  score: number;
  temperature: 'hot' | 'warm' | 'cold';
  signals: IntentSignal[];
  sources_checked: number;
  message: string;
}

// Hook para buscar última detecção de sinais
export function useLatestIntentSignals(companyId?: string) {
  return useQuery({
    queryKey: ['intent-signals-detection', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('intent_signals_detection')
        .select('*')
        .eq('company_id', companyId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

// Hook para executar nova detecção
export function useDetectIntentSignalsV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, companyName }: IntentSignalsParams): Promise<IntentSignalsResult> => {
      const { data, error } = await supabase.functions.invoke('detect-intent-signals-v2', {
        body: {
          company_id: companyId,
          company_name: companyName,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['intent-signals'] });
      queryClient.invalidateQueries({ queryKey: ['intent-signals-detection', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['hot-leads'] });
      
      const emoji = data.temperature === 'hot' ? '🔥' : data.temperature === 'warm' ? '🌡️' : '❄️';
      const title = data.temperature === 'hot' 
        ? 'HOT LEAD Detectado!' 
        : data.temperature === 'warm'
        ? 'WARM LEAD Identificado'
        : 'COLD LEAD';
      
      toast.success(`${emoji} ${title}`, {
        description: `Score: ${data.score}/100 - ${data.signals?.length || 0} sinais detectados`,
        duration: 6000,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao detectar sinais de intenção', {
        description: error.message,
      });
    },
  });
}
