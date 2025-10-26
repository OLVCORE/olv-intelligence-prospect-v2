import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  return useQuery({
    queryKey: ['cross-module-data', sourceModule, companyId, accountStrategyId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      let query = supabase
        .from('account_strategy_modules')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('module', sourceModule);

      if (accountStrategyId) {
        query = query.eq('account_strategy_id', accountStrategyId);
      } else if (companyId) {
        query = query.eq('company_id', companyId).is('account_strategy_id', null);
      } else {
        return null;
      }

      const { data, error } = await query
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
}
