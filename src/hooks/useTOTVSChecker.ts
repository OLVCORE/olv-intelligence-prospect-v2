import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TOTVSCheckParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  enabled?: boolean;
}

export const useTOTVSChecker = ({
  companyId,
  companyName,
  cnpj,
  domain,
  enabled = false,
}: TOTVSCheckParams) => {
  return useQuery({
    queryKey: ['totvs-check', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] Chamando totvs-checker...');

      const { data, error } = await supabase.functions.invoke('totvs-checker', {
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
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
