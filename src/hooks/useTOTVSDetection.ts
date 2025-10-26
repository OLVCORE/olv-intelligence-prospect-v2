import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TOTVSDetectionParams {
  companyId: string;
  companyName: string;
  companyDomain?: string;
}

export function useTOTVSDetection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, companyName, companyDomain }: TOTVSDetectionParams) => {
      const { data, error } = await supabase.functions.invoke('detect-totvs-usage', {
        body: {
          company_id: companyId,
          company_name: companyName,
          company_domain: companyDomain,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      
      if (data.result.should_disqualify) {
        toast.error('⛔ Empresa usa TOTVS - Lead desqualificado automaticamente', {
          description: `Score: ${data.result.total_score}/100 - ${data.result.sources.length} fonte(s) detectada(s)`,
        });
      } else if (data.result.total_score > 0) {
        toast.warning('⚠️ Possível uso de TOTVS detectado', {
          description: `Score: ${data.result.total_score}/100 - Verificação manual recomendada`,
        });
      } else {
        toast.success('✅ Nenhum uso de TOTVS detectado!', {
          description: 'Lead qualificado para prospecção 🎯',
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
