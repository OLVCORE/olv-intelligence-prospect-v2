import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type NegotiationScenario = 
  | 'objection_handling' 
  | 'pricing_negotiation' 
  | 'competitive_positioning' 
  | 'closing';

export interface NegotiationAdvice {
  primary_response: string;
  alternative_approaches: string[];
  proof_points: Array<{
    title: string;
    type: string;
    result: string;
  }>;
  warnings: string[];
  next_best_actions: string[];
}

export interface NegotiationAssistantResult {
  company_id: string;
  company_name: string;
  scenario: NegotiationScenario;
  context_input: string;
  advice: NegotiationAdvice;
  battle_card_available: boolean;
  intent_signals_count: number;
  generated_at: string;
}

export function useNegotiationAssistant() {
  return useMutation({
    mutationFn: async ({
      companyId,
      scenario,
      contextInput,
    }: {
      companyId: string;
      scenario: NegotiationScenario;
      contextInput: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-negotiation-assistant', {
        body: {
          company_id: companyId,
          scenario,
          context_input: contextInput,
        },
      });

      if (error) throw error;
      return data as NegotiationAssistantResult;
    },
    onSuccess: () => {
      toast.success('🤖 Assistente de Negociação ativado!', {
        description: 'Recomendações táticas geradas',
      });
    },
    onError: (error: Error) => {
      toast.error('Erro no assistente de negociação', {
        description: error.message,
      });
    },
  });
}
