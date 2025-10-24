import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Proposal {
  id: string;
  company_id: string;
  account_strategy_id?: string;
  quote_id?: string;
  scenario_id?: string;
  title: string;
  proposal_number: string;
  status: 'draft' | 'review' | 'approved' | 'sent' | 'accepted' | 'rejected';
  sections: any[];
  template_id: string;
  pdf_url?: string;
  presentation_url?: string;
  view_count: number;
  requires_signature: boolean;
  signed_at?: string;
  valid_until?: string;
  created_at: string;
}

export function useProposals(companyId?: string) {
  return useQuery({
    queryKey: ['proposals', companyId],
    queryFn: async () => {
      let query = supabase
        .from('visual_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Proposal[];
    },
  });
}

export function useGenerateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      company_id: string;
      account_strategy_id?: string;
      quote_id?: string;
      scenario_id?: string;
      title: string;
      template_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-visual-proposal', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta gerada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar proposta: ${error.message}`);
    },
  });
}

export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: Proposal['status'] }) => {
      const { data, error } = await supabase
        .from('visual_proposals')
        .update({ status })
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Status atualizado!');
    },
  });
}
