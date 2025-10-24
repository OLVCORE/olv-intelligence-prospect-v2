import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAccountStrategies(companyId?: string) {
  return useQuery({
    queryKey: ['account_strategies', companyId],
    queryFn: async () => {
      let query = supabase
        .from('account_strategies')
        .select(`
          *,
          companies(*),
          buyer_personas(*),
          decision_makers(*)
        `)
        .order('created_at', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId || companyId === undefined,
  });
}

export function useGenerateAccountStrategy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({
      companyId,
      personaId,
      decisionMakerId
    }: {
      companyId: string;
      personaId: string;
      decisionMakerId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-account-strategy', {
        body: { companyId, personaId, decisionMakerId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['account_strategies'] });
      toast({
        title: "Estratégia gerada!",
        description: "Account Strategy criada com sucesso pela IA.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar estratégia",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateBusinessCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ accountStrategyId }: { accountStrategyId: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-business-case', {
        body: { accountStrategyId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_cases'] });
      toast({
        title: "Business Case gerado!",
        description: "Proposta comercial criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar Business Case",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSuggestNextAction() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ accountStrategyId }: { accountStrategyId: string }) => {
      const { data, error } = await supabase.functions.invoke('suggest-next-action', {
        body: { accountStrategyId }
      });
      
      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sugerir ação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
