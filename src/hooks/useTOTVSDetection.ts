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
          domain: companyDomain,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['totvs-detection'] });
      
      if (data.status === 'disqualified') {
        toast.error('⛔ EMPRESA DESCARTADA - JÁ É CLIENTE TOTVS', {
          description: `Detectado uso de produtos TOTVS (Score: ${data.score}/100). ${data.evidences?.length || 0} evidências encontradas.`,
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
