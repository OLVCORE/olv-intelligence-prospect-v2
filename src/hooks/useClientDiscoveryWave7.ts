import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface ClientDiscoveryWave7Params {
  companyId: string;
  companyName: string;
  domain?: string;
}

export function useClientDiscoveryWave7() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, companyName, domain }: ClientDiscoveryWave7Params) => {
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
    onSuccess: (data) => {
      const count = data.discovered_clients?.length || 0;
      const potential = data.statistics?.potential_indirect || 0;

      toast({
        title: 'Client Discovery concluído! 🎉',
        description: `${count} clientes descobertos\n~${potential} potenciais (expansão 3.5x)`,
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['company-similar'] });
      queryClient.invalidateQueries({ queryKey: ['discovered-clients'] });
    },
    onError: (error: Error) => {
      console.error('[useClientDiscoveryWave7] Error:', error);
      toast({
        title: 'Erro no Client Discovery',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

