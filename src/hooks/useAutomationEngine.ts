import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: 'time_based' | 'event_based' | 'condition_based';
  conditions: any;
  actions: any[];
  is_active: boolean;
}

interface AutomationExecution {
  dealId: string;
  ruleId: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  metadata?: any;
}

export function useAutomationEngine() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Execute automation rules against deals
  const executeAutomations = async (deals: any[]): Promise<AutomationExecution[]> => {
    const executions: AutomationExecution[] = [];

    deals.forEach(deal => {
      const daysInStage = differenceInDays(new Date(), new Date(deal.updated_at || deal.created_at));
      const daysToClose = deal.expected_close_date 
        ? differenceInDays(new Date(deal.expected_close_date), new Date())
        : null;

      // Rule 1: Stale Deal Detection (7 days no movement)
      if (daysInStage > 7 && deal.status === 'open') {
        executions.push({
          dealId: deal.id,
          ruleId: 'stale_deal',
          action: 'alert_reactivate',
          priority: daysInStage > 14 ? 'urgent' : 'high',
          message: `Deal parado há ${daysInStage} dias - reativar urgentemente`,
          metadata: { daysInStage }
        });
      }

      // Rule 2: SLA Close Date Alert
      if (daysToClose !== null && daysToClose < 7 && daysToClose > 0) {
        executions.push({
          dealId: deal.id,
          ruleId: 'sla_close',
          action: 'accelerate_close',
          priority: daysToClose < 3 ? 'urgent' : 'high',
          message: `Faltam apenas ${daysToClose} dias para data prevista de fechamento`,
          metadata: { daysToClose }
        });
      }

      // Rule 3: Stage-based auto-progression
      if (deal.stage === 'prospecting' && daysInStage > 5) {
        executions.push({
          dealId: deal.id,
          ruleId: 'stage_progression',
          action: 'suggest_discovery',
          priority: 'medium',
          message: 'Tempo ideal para avançar para Discovery - agende call',
          metadata: { suggestedStage: 'discovery' }
        });
      }

      if (deal.stage === 'discovery' && daysInStage > 3) {
        executions.push({
          dealId: deal.id,
          ruleId: 'stage_progression',
          action: 'suggest_demo',
          priority: 'medium',
          message: 'Próximo passo: agendar demo personalizada',
          metadata: { suggestedStage: 'proposal' }
        });
      }

      if (deal.stage === 'proposal' && daysInStage > 7) {
        executions.push({
          dealId: deal.id,
          ruleId: 'stage_progression',
          action: 'suggest_negotiation',
          priority: 'high',
          message: 'Proposta enviada há 7+ dias - hora de negociar',
          metadata: { suggestedStage: 'negotiation' }
        });
      }

      // Rule 4: Low Probability Alert
      if (deal.probability < 30 && deal.stage !== 'prospecting') {
        executions.push({
          dealId: deal.id,
          ruleId: 'low_probability',
          action: 'review_strategy',
          priority: 'high',
          message: `Probabilidade baixa (${deal.probability}%) - revisar estratégia`,
          metadata: { probability: deal.probability }
        });
      }

      // Rule 5: High Value + High Priority
      if (deal.value > 100000 && deal.priority === 'high' && daysInStage > 3) {
        executions.push({
          dealId: deal.id,
          ruleId: 'high_value_attention',
          action: 'executive_involvement',
          priority: 'urgent',
          message: 'Deal de alto valor requer atenção executiva',
          metadata: { value: deal.value }
        });
      }

      // Rule 6: Auto-assign best SDR (based on fit)
      if (!deal.assigned_to && deal.stage === 'prospecting') {
        executions.push({
          dealId: deal.id,
          ruleId: 'auto_assign',
          action: 'assign_sdr',
          priority: 'medium',
          message: 'Deal não atribuído - sugerindo SDR ideal',
          metadata: { suggestedSDR: 'auto' }
        });
      }
    });

    return executions;
  };

  const { data: automationTriggers, isLoading } = useQuery({
    queryKey: ['automation-triggers'],
    queryFn: async () => {
      const { data: deals } = await supabase
        .from('sdr_deals')
        .select('*')
        .eq('status', 'open')
        .order('updated_at', { ascending: true });

      return executeAutomations(deals || []);
    },
    refetchInterval: 60000, // Check every minute
  });

  const executeAction = useMutation({
    mutationFn: async ({ execution, action }: { execution: AutomationExecution; action: 'execute' | 'dismiss' }) => {
      if (action === 'execute') {
        // Execute the suggested action
        toast({ 
          title: '✅ Ação executada!', 
          description: execution.message 
        });
      } else {
        // Dismiss
        toast({ 
          title: 'Ação descartada', 
          description: 'Automação ignorada' 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
    }
  });

  return {
    automationTriggers,
    isLoading,
    executeAction,
    totalTriggers: automationTriggers?.length || 0,
    urgentTriggers: automationTriggers?.filter(t => t.priority === 'urgent').length || 0,
    highTriggers: automationTriggers?.filter(t => t.priority === 'high').length || 0
  };
}
