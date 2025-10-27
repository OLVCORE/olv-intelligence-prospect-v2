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
      
      if (data.result.should_disqualify || data.result.total_score > 0) {
        toast.error('⛔ EMPRESA DESCARTADA - JÁ É CLIENTE TOTVS', {
          description: `Detectado uso de produtos TOTVS (Score: ${data.result.total_score}/100). OLV não pode prospectar clientes TOTVS existentes.`,
          duration: 8000,
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
