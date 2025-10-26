import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EconodataEnrichmentParams {
  companyId: string;
  cnpj: string;
}

interface EconodataEnrichmentResult {
  success: boolean;
  companyId: string;
  source: string;
  fieldsEnriched: number;
  decisorsAdded: number;
  data: any;
}

export function useEconodataEnrichment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, cnpj }: EconodataEnrichmentParams) => {
      console.log('[Econodata Hook] Starting enrichment for company:', companyId);

      const { data, error } = await supabase.functions.invoke<EconodataEnrichmentResult>(
        'enrich-econodata',
        {
          body: { companyId, cnpj }
        }
      );

      if (error) {
        console.error('[Econodata Hook] Error:', error);
        throw error;
      }

      if (!data?.success) {
        const errorData = data as any;
        throw new Error(errorData?.error || 'Falha ao enriquecer com Econodata');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('[Econodata Hook] Enrichment successful:', data);
      
      toast.success('Enriquecimento Econodata Concluído!', {
        description: `${data.fieldsEnriched} campos atualizados, ${data.decisorsAdded} decisores adicionados`
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', data.companyId] });
      queryClient.invalidateQueries({ queryKey: ['decision_makers', data.companyId] });
      queryClient.invalidateQueries({ queryKey: ['enrichment-status', data.companyId] });
    },
    onError: (error: any) => {
      console.error('[Econodata Hook] Mutation error:', error);
      
      // Tratamento de erros específicos
      if (error.message?.includes('not configured')) {
        toast.error('API Econodata Não Configurada', {
          description: 'Entre em contato com o administrador para configurar as credenciais da API Econodata'
        });
      } else if (error.message?.includes('Rate limit')) {
        toast.error('Limite de Requisições Atingido', {
          description: 'Aguarde alguns instantes antes de tentar novamente'
        });
      } else {
        toast.error('Erro no Enriquecimento Econodata', {
          description: error.message || 'Ocorreu um erro ao buscar dados da Econodata'
        });
      }
    }
  });
}