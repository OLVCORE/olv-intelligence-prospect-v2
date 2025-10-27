import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanyBattleCard {
  id: string;
  company_id: string;
  competitor_name: string;
  competitor_type: 'erp' | 'legacy' | 'spreadsheet' | 'other';
  detection_confidence: number;
  win_strategy: string;
  objection_handling: Array<{
    objection: string;
    response: string;
  }>;
  proof_points: Array<{
    title: string;
    type: 'case_study' | 'metric' | 'testimonial';
    result: string;
    relevance: string;
  }>;
  totvs_advantages: string[];
  next_steps: string[];
  context_snapshot: any;
  generated_at: string;
}

export function useCompanyBattleCard(companyId?: string) {
  return useQuery({
    queryKey: ['company-battle-card', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('company_battle_cards')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as CompanyBattleCard | null;
    },
    enabled: !!companyId,
  });
}

export function useGenerateBattleCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-battle-card', {
        body: { company_id: companyId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['company-battle-card', companyId] });
      toast.success('Battle Card gerado com sucesso!', {
        description: `Competidor detectado: ${data.battle_card.competitor_name}`,
      });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar Battle Card: ${error.message}`);
    },
  });
}
