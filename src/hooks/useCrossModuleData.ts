import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import type { ModuleType } from './useModuleDraft';

interface UseCrossModuleDataOptions {
  sourceModule: ModuleType;
  companyId?: string;
  accountStrategyId?: string;
}

/**
 * Hook para carregar dados de outros módulos da mesma estratégia
 * Permite sincronização entre CPQ → ROI, por exemplo
 */
export function useCrossModuleData<T = any>(options: UseCrossModuleDataOptions) {
  const { sourceModule, companyId, accountStrategyId } = options;
  const queryClient = useQueryClient();
  const queryKey = ['cross-module-data', sourceModule, companyId, accountStrategyId] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      let q = supabase
        .from('account_strategy_modules')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('module', sourceModule);

      if (accountStrategyId) {
        q = q.eq('account_strategy_id', accountStrategyId);
      } else if (companyId) {
        q = q.eq('company_id', companyId).is('account_strategy_id', null);
      } else {
        return null;
      }

      const { data, error } = await q
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.data as T | null;
    },
    enabled: !!(companyId || accountStrategyId),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: 1,
  });

  // Realtime: invalida cache quando CPQ/ROI mudar no backend (mesma empresa/estratégia)
  useEffect(() => {
    if (!companyId && !accountStrategyId) return;

    const channel = supabase
      .channel(`mod-${sourceModule}-${accountStrategyId || companyId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'account_strategy_modules' },
        (payload) => {
          const row: any = payload.new || payload.old;
          if (!row) return;
          if (row.module !== sourceModule) return;
          if (accountStrategyId) {
            if (row.account_strategy_id !== accountStrategyId) return;
          } else if (companyId) {
            if (row.company_id !== companyId) return;
            if (row.account_strategy_id !== null) return; // somente drafts por companyId puro
          }
          queryClient.invalidateQueries({ queryKey: queryKey as any });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sourceModule, companyId, accountStrategyId, queryClient]);

  return query;
}

