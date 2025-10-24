import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QuoteProduct {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  base_price: number;
  discount: number;
  final_price: number;
  config?: Record<string, any>;
}

export interface Quote {
  id: string;
  quote_number: string;
  company_id: string;
  account_strategy_id?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'negotiating';
  products: QuoteProduct[];
  total_list_price: number;
  total_discounts: number;
  total_final_price: number;
  suggested_price?: number;
  win_probability?: number;
  competitive_position?: 'aggressive' | 'competitive' | 'premium' | 'high_risk';
  valid_until?: string;
  applied_rules?: any[];
  created_at: string;
}

export function useQuotes(companyId?: string) {
  return useQuery({
    queryKey: ['quotes', companyId],
    queryFn: async () => {
      let query = supabase
        .from('quote_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Quote[];
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quote: {
      company_id: string;
      account_strategy_id?: string;
      products: QuoteProduct[];
    }) => {
      const { data, error } = await supabase.functions.invoke('calculate-quote-pricing', {
        body: quote,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cotação: ${error.message}`);
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: Quote['status'] }) => {
      const { data, error } = await supabase
        .from('quote_history')
        .update({ status })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}
