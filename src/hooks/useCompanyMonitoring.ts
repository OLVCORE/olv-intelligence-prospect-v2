import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyMonitoring {
  id: string;
  company_id: string;
  user_id: string;
  is_active: boolean;
  last_totvs_check_at?: string;
  last_intent_check_at?: string;
  last_totvs_score?: number;
  last_intent_score?: number;
  check_frequency_hours: number;
  created_at: string;
  updated_at: string;
}

export function useCompanyMonitoring(companyId?: string) {
  return useQuery({
    queryKey: ['company-monitoring', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('company_monitoring')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CompanyMonitoring | null;
    },
    enabled: !!companyId,
  });
}

export function useToggleCompanyMonitoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, isActive }: { companyId: string; isActive: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (isActive) {
        // Ativar monitoramento (inserir ou atualizar)
        const { data, error } = await supabase
          .from('company_monitoring')
          .upsert({
            company_id: companyId,
            user_id: user.id,
            is_active: true,
          }, {
            onConflict: 'company_id,user_id'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Desativar monitoramento
        const { error } = await supabase
          .from('company_monitoring')
          .update({ is_active: false })
          .eq('company_id', companyId)
          .eq('user_id', user.id);

        if (error) throw error;
        return null;
      }
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['company-monitoring'] });
      queryClient.invalidateQueries({ queryKey: ['monitored-companies'] });
      
      if (isActive) {
        toast.success('✅ Monitoramento ativado', {
          description: 'Empresa será verificada diariamente para novos sinais',
        });
      } else {
        toast.info('🔕 Monitoramento desativado', {
          description: 'Empresa removida da lista de monitoramento automático',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao alterar monitoramento', {
        description: error.message,
      });
    },
  });
}

export function useMonitoredCompanies() {
  return useQuery({
    queryKey: ['monitored-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_monitoring')
        .select(`
          *,
          companies:company_id (
            id,
            name,
            domain,
            headquarters_state,
            industry,
            employees,
            totvs_detection_score
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useTriggerManualCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('company-monitoring-cron', {
        body: { manual_trigger: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-monitoring'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast.success('✅ Verificação manual concluída', {
        description: `${data.checked || 0} empresas verificadas, ${data.notifications_created || 0} notificações criadas`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na verificação manual', {
        description: error.message,
      });
    },
  });
}
