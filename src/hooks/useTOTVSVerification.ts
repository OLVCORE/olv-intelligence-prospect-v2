import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TOTVSVerificationParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  enabled?: boolean;
}

export const useTOTVSVerification = ({
  companyId,
  companyName,
  cnpj,
  domain,
  enabled = false,
}: TOTVSVerificationParams) => {
  return useQuery({
    queryKey: ['totvs-verification', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] Chamando totvs-verification...');

      const { data, error } = await supabase.functions.invoke('totvs-verification', {
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useTOTVSVerificationBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empresas: any[]) => {
      console.log('[HOOK BATCH] Verificando', empresas.length, 'empresas...');

      const resultados = [];

      for (const empresa of empresas) {
        try {
          const { data, error } = await supabase.functions.invoke('totvs-verification', {
            body: {
              company_id: empresa.company_id,
              company_name: empresa.razao_social,
              cnpj: empresa.cnpj,
              domain: empresa.website,
            },
          });

          if (error) throw error;

          resultados.push({
            empresa,
            resultado: data,
            sucesso: true,
          });
        } catch (error: any) {
          console.error('[HOOK BATCH] Erro:', error);
          resultados.push({
            empresa,
            erro: error.message,
            sucesso: false,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return resultados;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['totvs-verification'] });
    },
  });
};
