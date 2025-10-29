import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMonitoredCompanies(userId?: string) {
  return useQuery({
    queryKey: ['monitored-companies', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Buscar o monitoramento ativo mais recente do usuário
      const { data: config } = await supabase
        .from('intelligence_monitoring_config')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!config || !config.is_active) {
        return [];
      }

      // Buscar empresas que atendem aos critérios
      let query = supabase
        .from('companies')
        .select('id, name, domain, headquarters_state, industry, employees')
        .eq('is_disqualified', false);

      // Aplicar filtros da config
      if (config.target_states && config.target_states.length > 0) {
        query = query.in('headquarters_state', config.target_states);
      }

      if (config.min_employees) {
        query = query.gte('employees', config.min_employees);
      }

      if (config.max_employees) {
        query = query.lte('employees', config.max_employees);
      }

      // Limitar a 100 empresas para preview
      query = query.limit(100);

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    enabled: !!userId,
  });
}
