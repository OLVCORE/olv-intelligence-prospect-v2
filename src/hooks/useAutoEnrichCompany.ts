import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  cnpj?: string;
  headquarters_state?: string;
  headquarters_city?: string;
  niche_code?: string;
}

/**
 * Hook para enriquecimento automático de dados da empresa via ReceitaWS
 * Executa automaticamente ao detectar dados faltantes (Estado, Município, Nicho)
 */
export function useAutoEnrichCompany(company?: Company | null) {
  const queryClient = useQueryClient();

  const enrichMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { data, error } = await supabase.functions.invoke('enrich-company-receita', {
        body: { company_id: companyId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Revalidar queries relacionadas à empresa
      if (company?.id) {
        queryClient.invalidateQueries({ queryKey: ['company', company.id] });
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      }
      
      console.log('✅ Empresa enriquecida automaticamente:', data.enriched_fields);
    },
    onError: (error) => {
      console.error('❌ Erro ao enriquecer empresa:', error);
    },
  });

  useEffect(() => {
    // Verificar se precisa enriquecer
    if (!company?.id) return;
    if (enrichMutation.isPending) return;

    const needsEnrichment = 
      !company.headquarters_state || 
      !company.headquarters_city || 
      !company.niche_code;

    const hasCNPJ = !!company.cnpj;

    // Se precisa enriquecer e tem CNPJ, executar automaticamente
    if (needsEnrichment && hasCNPJ) {
      console.log('🔄 Iniciando enriquecimento automático da empresa...');
      enrichMutation.mutate(company.id);
    }
  }, [company?.id, company?.cnpj, company?.headquarters_state, company?.headquarters_city, company?.niche_code]);

  return {
    isEnriching: enrichMutation.isPending,
    enrichmentError: enrichMutation.error,
  };
}
