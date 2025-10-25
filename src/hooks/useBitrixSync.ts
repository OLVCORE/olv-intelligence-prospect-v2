import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BitrixConfig {
  id: string;
  webhook_url: string;
  domain: string;
  sync_direction: 'olv_to_bitrix' | 'bitrix_to_olv' | 'bidirectional';
  auto_sync: boolean;
  sync_interval_minutes: number;
  field_mapping: Record<string, string>;
  last_sync: string | null;
  status: 'active' | 'inactive' | 'error';
}

export interface BitrixSyncLog {
  id: string;
  config_id: string;
  sync_direction: string;
  records_synced: number;
  status: 'success' | 'error' | 'partial';
  error_message?: string;
  created_at: string;
}

export function useBitrixConfig() {
  return useQuery({
    queryKey: ['bitrix-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('bitrix_sync_config' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? (data as unknown as BitrixConfig) : null;
    },
  });
}

export function useBitrixSyncLogs() {
  const { data: config } = useBitrixConfig();

  return useQuery({
    queryKey: ['bitrix-sync-logs', config?.id],
    queryFn: async () => {
      if (!config?.id) return [];

      const { data, error } = await supabase
        .from('bitrix_sync_log' as any)
        .select('*')
        .eq('config_id', config.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []) as unknown as BitrixSyncLog[];
    },
    enabled: !!config?.id,
  });
}

export function useSyncBitrix() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string) => {
      const { data, error } = await supabase.functions.invoke('bitrix-sync-deals', {
        body: { config_id: configId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: '✅ Sincronização concluída!',
        description: `${data.synced || 0} deals sincronizados`
      });
      queryClient.invalidateQueries({ queryKey: ['bitrix-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
