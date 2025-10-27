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
      
      if (data.result.should_disqualify || data.result.total_score >= 50) {
        toast.error('⛔ EMPRESA DESCARTADA - Utiliza produtos TOTVS', {
          description: `Score TOTVS: ${data.result.total_score}/100 - Não é prospect válido`,
          duration: 6000,
        });
      } else if (data.result.total_score >= 30) {
        toast.warning('⚠️ Indícios de uso TOTVS detectados', {
          description: `Score: ${data.result.total_score}/100 - Requer validação manual antes de prospectar`,
          duration: 5000,
        });
      } else {
        toast.success('✅ Empresa qualificada - Sem uso de TOTVS detectado', {
          description: 'Lead válido para prospecção ativa',
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
