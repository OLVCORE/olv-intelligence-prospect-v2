import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SimpleTOTVSCheckParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  enabled?: boolean;
}

export const useSimpleTOTVSCheck = ({
  companyId,
  companyName,
  cnpj,
  domain,
  enabled = false,
}: SimpleTOTVSCheckParams) => {
  return useQuery({
    queryKey: ['simple-totvs-check', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] Chamando simple-totvs-check...');

      const { data, error } = await supabase.functions.invoke('simple-totvs-check', {
        body: {
          company_id: companyId,
          company_name: companyName,
          cnpj,
          domain,
        },
      });

      if (error) {
        console.error('[HOOK] Erro:', error);
        throw error;
      }

      console.log('[HOOK] Resultado:', data);
      return data;
    },
    enabled: enabled && (!!companyName || !!cnpj),
    staleTime: 60 * 1000,      // 1 minuto (balanceado)
    gcTime: 5 * 60 * 1000,     // 5 minutos
    refetchOnMount: true,      // Verificar ao abrir
    refetchOnWindowFocus: false,
  });
};
