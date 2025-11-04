import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClientDiscoveryParams {
  companyId: string;
  companyName: string;
  domain?: string;
}

export function useClientDiscoveryWave7() {
  return useMutation({
    mutationFn: async ({ companyId, companyName, domain }: ClientDiscoveryParams) => {
      console.log('[useClientDiscoveryWave7] Iniciando descoberta para:', companyName);

      const { data, error } = await supabase.functions.invoke('client-discovery-wave7', {
        body: {
          companyId,
          companyName,
          domain
        }
      });

      if (error) {
        console.error('[useClientDiscoveryWave7] Erro:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao descobrir clientes');
      }

      console.log('[useClientDiscoveryWave7] Sucesso:', data.discovered_clients?.length || 0, 'clientes');

      return data;
    },
  });
}
