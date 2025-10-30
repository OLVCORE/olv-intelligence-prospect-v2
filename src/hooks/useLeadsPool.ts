import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadPool {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  uf?: string;
  municipio?: string;
  porte?: string;
  cnae_principal?: string;
  website?: string;
  email?: string;
  telefone?: string;
  origem: 'icp_individual' | 'icp_massa' | 'empresas_aqui' | 'manual';
  icp_score?: number;
  temperatura?: 'hot' | 'warm' | 'cold';
  is_cliente_totvs: boolean;
  totvs_check_date?: string;
  status: 'pool';
  raw_data?: any;
  created_at: string;
  updated_at: string;
}

export interface LeadQualified {
  id: string;
  lead_pool_id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  uf?: string;
  municipio?: string;
  porte?: string;
  website?: string;
  email?: string;
  telefone?: string;
  icp_score?: number;
  temperatura?: 'hot' | 'warm' | 'cold';
  status: 'qualificada' | 'em_analise' | 'aprovada';
  motivo_qualificacao?: string;
  selected_by?: string;
  selected_at: string;
  created_at: string;
  updated_at: string;
}

// Hook para buscar leads do pool
export function useLeadsPool(filters?: {
  origem?: string;
  temperatura?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['leads-pool', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads_pool')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.origem) {
        query = query.eq('origem', filters.origem);
      }

      if (filters?.temperatura) {
        query = query.eq('temperatura', filters.temperatura);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LeadPool[];
    },
  });
}

// Hook para buscar leads qualificadas
export function useLeadsQualified(status?: string) {
  return useQuery({
    queryKey: ['leads-qualified', status],
    queryFn: async () => {
      let query = supabase
        .from('leads_qualified')
        .select('*')
        .order('icp_score', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LeadQualified[];
    },
  });
}

// Hook para adicionar lead ao pool
export function useAddToPool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Partial<LeadPool>) => {
      const { data, error } = await supabase
        .from('leads_pool')
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
    },
  });
}

// Hook para qualificar lead (mover do pool para qualificadas)
export function useQualifyLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poolId, motivo }: { poolId: string; motivo?: string }) => {
      // 1. Buscar lead do pool
      const { data: poolLead, error: poolError } = await supabase
        .from('leads_pool')
        .select('*')
        .eq('id', poolId)
        .single();

      if (poolError) throw poolError;

      // 2. Inserir em qualificadas
      const { data: qualified, error: qualifiedError } = await supabase
        .from('leads_qualified')
        .insert({
          lead_pool_id: poolLead.id,
          cnpj: poolLead.cnpj,
          razao_social: poolLead.razao_social,
          nome_fantasia: poolLead.nome_fantasia,
          uf: poolLead.uf,
          municipio: poolLead.municipio,
          porte: poolLead.porte,
          website: poolLead.website,
          email: poolLead.email,
          telefone: poolLead.telefone,
          icp_score: poolLead.icp_score,
          temperatura: poolLead.temperatura,
          status: 'qualificada',
          motivo_qualificacao: motivo || 'Qualificação manual',
        })
        .select()
        .single();

      if (qualifiedError) throw qualifiedError;
      return qualified;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      queryClient.invalidateQueries({ queryKey: ['leads-qualified'] });
      toast.success('Lead qualificada com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao qualificar lead', {
        description: error.message,
      });
    },
  });
}

// Hook para mover para pipeline (aprovar qualificadas)
export function useApproveQualified() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qualifiedIds: string[]) => {
      // 1. Buscar leads qualificadas
      const { data: qualified, error: fetchError } = await supabase
        .from('leads_qualified')
        .select('*')
        .in('id', qualifiedIds);

      if (fetchError) throw fetchError;

      // 2. Inserir em companies (pipeline)
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .insert(
          qualified.map(q => ({
            name: q.razao_social,
            cnpj: q.cnpj,
            domain: q.website,
            icp_score: q.icp_score,
            temperature: q.temperatura,
            lead_qualified_id: q.id,
            approved_at: new Date().toISOString(),
            pipeline_status: 'ativo',
            raw_data: { origem: 'leads_qualified' },
          }))
        )
        .select();

      if (companiesError) throw companiesError;

      // 3. Atualizar status das qualificadas
      const { error: updateError } = await supabase
        .from('leads_qualified')
        .update({ 
          status: 'aprovada',
          updated_at: new Date().toISOString()
        })
        .in('id', qualifiedIds);

      if (updateError) throw updateError;

      return companies;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads-qualified'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(`${data.length} empresas adicionadas ao pipeline`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao aprovar leads', {
        description: error.message,
      });
    },
  });
}