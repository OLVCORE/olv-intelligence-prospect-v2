import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export interface CopilotSuggestion {
  id: string;
  type: 'action' | 'alert' | 'opportunity' | 'warning' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  action?: {
    label: string;
    type: 'navigate' | 'create_task' | 'send_message' | 'update_deal' | 'create_proposal';
    payload: any;
  };
  metadata?: {
    dealId?: string;
    companyId?: string;
    companyName?: string;
    cnpj?: string;
    score?: number;
    reason?: string;
    confidence?: number;
  };
  dismissed?: boolean;
  createdAt: Date;
}

export interface CopilotContext {
  userId: string;
  currentPage?: string;
  activeDeal?: {
    id: string;
    stage: string;
    value: number;
    probability: number;
    daysInStage: number;
    company: any;
  };
}

/**
 * Hook que conecta com o AI Copilot para obter sugestões contextuais
 * em tempo real baseadas no estado atual do usuário
 */
export function useAICopilot(context: CopilotContext) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar sugestões do copilot
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['ai-copilot-suggestions', context],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-copilot-suggest', {
        body: { context }
      });

      // Se a função estiver sem créditos (402) ou indisponível, não quebre a UI
      if (error) {
        console.warn('Copilot indisponível:', error);
        return [] as CopilotSuggestion[];
      }

      return (data?.suggestions as CopilotSuggestion[]) || [];
    },
    refetchInterval: 60000, // Atualizar a cada 1 minuto
    enabled: !!context.userId // Ativar apenas se tiver userId
  });

  // Executar ação sugerida
  const executeSuggestion = useMutation({
    mutationFn: async (suggestion: CopilotSuggestion) => {
      if (!suggestion.action) return;

      const { data, error } = await supabase.functions.invoke('ai-copilot-execute', {
        body: { 
          suggestionId: suggestion.id,
          action: suggestion.action 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, suggestion) => {
      toast.success(`Ação executada: ${suggestion.action?.label}`);
      queryClient.invalidateQueries({ queryKey: ['ai-copilot-suggestions'] });
      
      // Navegar se a ação retornou uma URL
      if (data?.result?.url) {
        navigate(data.result.url);
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao executar ação: ' + error.message);
    }
  });

  // Descartar sugestão
  const dismissSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      // Marcar como descartada localmente
      queryClient.setQueryData<CopilotSuggestion[]>(
        ['ai-copilot-suggestions', context],
        (old) => old?.map(s => s.id === suggestionId ? { ...s, dismissed: true } : s)
      );
    }
  });

  // Obter insights para um deal específico
  const getDealInsights = async (dealId: string) => {
    const { data, error } = await supabase.functions.invoke('ai-deal-insights', {
      body: { dealId }
    });

    if (error) throw error;
    return data.insights;
  };

  return {
    suggestions: suggestions?.filter(s => !s.dismissed) || [],
    isLoading,
    executeSuggestion: executeSuggestion.mutate,
    dismissSuggestion: dismissSuggestion.mutate,
    getDealInsights
  };
}

/**
 * Hook simplificado para notificações e alertas do copilot
 */
export function useCopilotAlerts() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });

  return useAICopilot({
    userId: user?.id || '',
    currentPage: window.location.pathname
  });
}
