import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DiscoveryParams {
  userId: string;
  sectorCode?: string;
  nicheCode: string;
  state: string;
  city?: string;
  searchMode: 'new' | 'similar';
  sourceCompanyId?: string;
}

export interface SuggestedCompany {
  id: string;
  company_name: string;
  cnpj?: string;
  cnpj_validated: boolean;
  domain?: string;
  state?: string;
  city?: string;
  sector_code?: string;
  niche_code?: string;
  source: string;
  similarity_score?: number;
  similarity_reasons?: string[];
  status: string;
  apollo_data?: any;
  receita_ws_data?: any;
  created_at: string;
}

export function useSuggestedCompanies(userId: string | undefined) {
  return useQuery({
    queryKey: ['suggested-companies', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('suggested_companies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SuggestedCompany[];
    },
    enabled: !!userId,
  });
}

export function useDiscoverCompanies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DiscoveryParams) => {
      const { data, error } = await supabase.functions.invoke('discover-companies', {
        body: {
          user_id: params.userId,
          sector_code: params.sectorCode,
          niche_code: params.nicheCode,
          state: params.state,
          city: params.city,
          search_mode: params.searchMode,
          source_company_id: params.sourceCompanyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suggested-companies'] });
      
      toast.success('🔍 Descoberta Concluída', {
        description: `${data.total_found} empresas encontradas`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na descoberta de empresas', {
        description: error.message,
      });
    },
  });
}

export function useValidateEnrichCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestedCompanyId: string) => {
      const { data, error } = await supabase.functions.invoke('validate-enrich-company', {
        body: {
          suggested_company_id: suggestedCompanyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suggested-companies'] });
      
      if (data.cnpj_validated) {
        toast.success('✅ CNPJ Validado', {
          description: `${data.company_name}`,
        });
      } else {
        toast.warning('⚠️ CNPJ não validado', {
          description: 'Empresa pode não existir ou CNPJ inválido',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro na validação', {
        description: error.message,
      });
    },
  });
}

export function useAddCompaniesToBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestedCompanyIds: string[]) => {
      // Para cada empresa sugerida, adicionar ao banco
      const promises = suggestedCompanyIds.map(async (id) => {
        const { data: suggested } = await supabase
          .from('suggested_companies')
          .select('*')
          .eq('id', id)
          .single();

        if (!suggested) return null;

        // Inserir na tabela companies
        const { data: newCompany, error: insertError } = await supabase
          .from('companies')
          .insert([{
            name: suggested.company_name,
            cnpj: suggested.cnpj,
            domain: suggested.domain,
            state: suggested.state,
            city: suggested.city,
            sector_code: suggested.sector_code,
            niche_code: suggested.niche_code,
            apollo_data: suggested.apollo_data,
            raw_data: suggested.receita_ws_data,
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        // Atualizar empresa sugerida
        await supabase
          .from('suggested_companies')
          .update({
            status: 'added_to_bank',
            company_id: newCompany.id,
            added_to_bank_at: new Date().toISOString(),
          })
          .eq('id', id);

        return newCompany;
      });

      const results = await Promise.all(promises);
      return results.filter(r => r !== null);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suggested-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
      toast.success(`✅ ${data.length} empresas adicionadas ao banco`, {
        description: 'Empresas prontas para análise ICP',
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar empresas', {
        description: error.message,
      });
    },
  });
}
