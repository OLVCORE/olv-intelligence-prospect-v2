import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IntentSignal {
  id: string;
  company_id: string;
  signal_type: 'job_posting' | 'news' | 'growth' | 'linkedin_activity' | 'search_activity';
  signal_source: string;
  signal_title: string;
  signal_description: string;
  signal_url?: string;
  confidence_score: number;
  detected_at: string;
  expires_at?: string;
  metadata: any;
}

interface DetectIntentSignalsParams {
  companyId: string;
  companyName: string;
  companyDomain?: string;
  cnpj?: string;
}

export function useIntentSignals(companyId?: string) {
  return useQuery({
    queryKey: ['intent-signals', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('intent_signals')
        .select('*')
        .eq('company_id', companyId)
        .gte('detected_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data as IntentSignal[];
    },
    enabled: !!companyId,
  });
}

export function useDetectIntentSignals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, companyName, companyDomain, cnpj }: DetectIntentSignalsParams) => {
      const { data, error } = await supabase.functions.invoke('detect-intent-signals', {
        body: {
          company_id: companyId,
          company_name: companyName,
          company_domain: companyDomain,
          cnpj,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['intent-signals'] });
      queryClient.invalidateQueries({ queryKey: ['hot-leads'] });
      
      if (data.intent_score >= 70) {
        toast.success('🔥 HOT LEAD - Alta intenção de compra', {
          description: `Score: ${data.intent_score}/100 | ${data.signals_detected} sinais identificados - Ação imediata recomendada`,
          duration: 6000,
        });
      } else if (data.intent_score >= 40) {
        toast.info('📊 Sinais de intenção moderados detectados', {
          description: `Score: ${data.intent_score}/100 | ${data.signals_detected} sinais - Lead morno para nurturing`,
          duration: 4000,
        });
      } else if (data.signals_detected > 0) {
        toast('ℹ️ Sinais fracos de intenção', {
          description: `Score: ${data.intent_score}/100 - Lead frio, apenas monitorar`,
          duration: 3000,
        });
      } else {
        toast('❄️ Nenhum sinal de intenção detectado', {
          description: 'Sem indícios de momento de compra',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao detectar sinais de intenção', {
        description: error.message,
      });
    },
  });
}

export function useHotLeads(minIntentScore: number = 70) {
  return useQuery({
    queryKey: ['hot-leads', minIntentScore],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_hot_leads', {
        min_intent_score: minIntentScore,
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useCalculateIntentScore(companyId?: string) {
  return useQuery({
    queryKey: ['intent-score', companyId],
    queryFn: async () => {
      if (!companyId) return 0;

      const { data, error } = await supabase.rpc('calculate_intent_score', {
        company_uuid: companyId,
      });

      if (error) throw error;
      return data as number;
    },
    enabled: !!companyId,
  });
}
