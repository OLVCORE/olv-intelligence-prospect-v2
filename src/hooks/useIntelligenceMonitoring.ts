import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IntelligenceMonitoringConfig {
  id: string;
  user_id: string;
  target_regions: string[] | null;
  target_states: string[] | null;
  target_mesoregions: string[] | null;
  target_microregions: string[] | null;
  target_municipalities: string[] | null;
  target_sectors: string[] | null;
  target_niches: string[] | null;
  min_employees: number | null;
  max_employees: number | null;
  min_revenue: number | null;
  max_revenue: number | null;
  is_active: boolean;
  check_frequency_hours: number;
  keywords_whitelist: string[] | null;
  keywords_blacklist: string[] | null;
  monitor_funding: boolean;
  monitor_leadership_changes: boolean;
  monitor_expansion: boolean;
  monitor_tech_adoption: boolean;
  monitor_partnerships: boolean;
  monitor_market_entry: boolean;
  monitor_digital_transformation: boolean;
  monitor_competitor_mentions: boolean;
  competitor_names: string[] | null;
  last_check_at: string | null;
  next_check_at: string | null;
  created_at: string;
  updated_at: string;
}

// Hook para buscar configuração do usuário
export function useMonitoringConfig(userId?: string) {
  return useQuery({
    queryKey: ['intelligence-monitoring-config', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('intelligence_monitoring_config')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Config não existe, criar padrão
        console.log('[MonitoringConfig] Config não existe, criando padrão...');
        const { data: initData, error: initError } = await supabase.functions.invoke('init-monitoring-config', {
          body: { user_id: userId },
        });

        if (initError) {
          console.error('[MonitoringConfig] Erro ao criar config padrão:', initError);
          return null;
        }

        return initData?.config || null;
      }
      
      if (error) {
        throw error;
      }
      
      return data as IntelligenceMonitoringConfig;
    },
    enabled: !!userId,
  });
}

// Hook para criar ou atualizar configuração
export function useSaveMonitoringConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<IntelligenceMonitoringConfig> & { user_id: string }) => {
      // Calcular next_check_at baseado em check_frequency_hours
      const nextCheckAt = new Date();
      nextCheckAt.setHours(nextCheckAt.getHours() + (config.check_frequency_hours || 24));

      const dataToSave = {
        ...config,
        next_check_at: nextCheckAt.toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Tentar inserir primeiro
      const { data: existingConfig } = await supabase
        .from('intelligence_monitoring_config')
        .select('id')
        .eq('user_id', config.user_id)
        .single();

      if (existingConfig) {
        // Atualizar
        const { data, error } = await supabase
          .from('intelligence_monitoring_config')
          .update(dataToSave)
          .eq('user_id', config.user_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Inserir
        const { data, error } = await supabase
          .from('intelligence_monitoring_config')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-monitoring-config', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-health-status'] });
      queryClient.invalidateQueries({ queryKey: ['monitored-companies', variables.user_id] });
      toast.success('Configuração salva com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração de monitoramento');
    },
  });
}

// Hook para ativar/desativar monitoramento
export function useToggleMonitoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('intelligence_monitoring_config')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-monitoring-config', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-health-status'] });
      toast.success(variables.isActive ? 'Monitoramento ativado!' : 'Monitoramento pausado');
    },
    onError: (error) => {
      console.error('Erro ao alternar monitoramento:', error);
      toast.error('Erro ao alternar monitoramento');
    },
  });
}

// Hook para executar monitoramento manual (trigger imediato)
export function useRunMonitoringNow() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-intelligence-monitor', {
        body: {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('[Monitoring] Execução manual concluída:', data);
      toast.success('Monitoramento executado com sucesso!');
    },
    onError: (error) => {
      console.error('[Monitoring] Erro na execução manual:', error);
      toast.error('Erro ao executar monitoramento');
    },
  });
}
