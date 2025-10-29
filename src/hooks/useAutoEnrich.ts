import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutoEnrichResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    company_id: string;
    company_name: string;
    error: string;
  }>;
}

export function useAutoEnrich() {
  return useMutation({
    mutationFn: async () => {
      console.log('[Auto-Enrich] Iniciando processo manual');
      
      const { data, error } = await supabase.functions.invoke('auto-enrich-companies', {
        body: {}
      });

      if (error) throw error;
      return data as AutoEnrichResult;
    },
    onSuccess: (data) => {
      if (data.success > 0) {
        toast.success('🔄 Auto-Enriquecimento Concluído', {
          description: `${data.success} empresas enriquecidas com sucesso${data.failed > 0 ? ` (${data.failed} falharam)` : ''}`,
        });
      } else {
        toast.info('ℹ️ Auto-Enriquecimento', {
          description: 'Nenhuma empresa necessita enriquecimento no momento',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro no auto-enriquecimento', {
        description: error.message,
      });
    },
  });
}
