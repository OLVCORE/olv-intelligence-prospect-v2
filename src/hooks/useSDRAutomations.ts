import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface DealAutomation {
  dealId: string;
  type: 'sla_alert' | 'stale_deal' | 'follow_up' | 'next_action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  action?: string;
  actionUrl?: string;
}

export function useSDRAutomations() {
  return useQuery({
    queryKey: ['sdr-automations'],
    queryFn: async (): Promise<DealAutomation[]> => {
      const { data: deals, error } = await supabase
        .from('sdr_deals')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const automations: DealAutomation[] = [];

      deals?.forEach(deal => {
        const daysInStage = differenceInDays(new Date(), new Date(deal.created_at));
        const daysToClose = deal.expected_close_date 
          ? differenceInDays(new Date(deal.expected_close_date), new Date())
          : null;

        // Deal parado (mais de 7 dias sem mudança)
        if (daysInStage > 7) {
          automations.push({
            dealId: deal.id,
            type: 'stale_deal',
            priority: daysInStage > 14 ? 'urgent' : 'high',
            message: `Deal "${deal.title}" está há ${daysInStage} dias no mesmo estágio`,
            action: 'Definir próxima ação',
            actionUrl: `/sdr/workspace?deal=${deal.id}`,
          });
        }

        // SLA de fechamento próximo (menos de 7 dias)
        if (daysToClose !== null && daysToClose < 7 && daysToClose > 0) {
          automations.push({
            dealId: deal.id,
            type: 'sla_alert',
            priority: daysToClose < 3 ? 'urgent' : 'high',
            message: `Deal "${deal.title}" fecha em ${daysToClose} dias`,
            action: 'Acelerar fechamento',
            actionUrl: `/sdr/workspace?deal=${deal.id}`,
          });
        }

        // Sugestão de próxima ação baseada no estágio
        if (deal.stage === 'discovery' && daysInStage > 3) {
          automations.push({
            dealId: deal.id,
            type: 'next_action',
            priority: 'medium',
            message: `Sugiro agendar demo para "${deal.title}"`,
            action: 'Agendar demo',
            actionUrl: `/sdr/workspace?deal=${deal.id}`,
          });
        }

        if (deal.stage === 'proposal' && daysInStage > 5) {
          automations.push({
            dealId: deal.id,
            type: 'follow_up',
            priority: 'high',
            message: `Follow-up necessário em "${deal.title}"`,
            action: 'Enviar follow-up',
            actionUrl: `/sdr/inbox`,
          });
        }
      });

      return automations.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
}
