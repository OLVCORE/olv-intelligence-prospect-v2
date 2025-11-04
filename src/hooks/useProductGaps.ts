import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseProductGapsParams {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  detectedProducts?: string[];
  competitors?: any[];
  similarCompanies?: any[];
  enabled?: boolean;
}

export function useProductGaps({
  companyId,
  companyName,
  cnpj,
  sector,
  cnae,
  size,
  employees,
  detectedProducts = [],
  competitors = [],
  similarCompanies = [],
  enabled = true
}: UseProductGapsParams) {
  return useQuery({
    queryKey: ['product-gaps', companyId, companyName, detectedProducts.join(',')],
    queryFn: async () => {
      console.log('[useProductGaps] Buscando recomendações para:', companyName);

      const { data, error } = await supabase.functions.invoke('generate-product-gaps', {
        body: {
          companyId,
          companyName,
          cnpj,
          sector,
          cnae,
          size,
          employees,
          detectedProducts,
          competitors,
          similarCompanies
        }
      });

      if (error) {
        console.error('[useProductGaps] Erro:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar recomendações');
      }

      console.log('[useProductGaps] Sucesso:', data.recommended_products?.length || 0, 'produtos');

      return data;
    },
    enabled: enabled && !!companyName,
    staleTime: 1000 * 60 * 30, // 30 minutos
    retry: 2
  });
}

