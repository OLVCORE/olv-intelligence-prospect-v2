import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ICP_QUARANTINE_QUERY_KEY = ['icp-quarantine'];

// Hook para salvar resultados na quarentena
export function useSaveToQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (results: any[]) => {
      const records = results.map(r => ({
        company_id: r.company_id,
        cnpj: r.cnpj,
        razao_social: r.name,
        icp_score: r.icp_score || 0,
        temperatura: r.temperatura || 'cold',
        status: r.encontrou_totvs ? 'descartada' : 'pendente',
        motivo_descarte: r.encontrou_totvs ? 'Cliente TOTVS detectado' : null,
        evidencias_totvs: r.evidencias || [],
        breakdown: r.breakdown || {},
        motivos: r.motivos || [],
        raw_analysis: r,
      }));

      const { error } = await supabase
        .from('icp_analysis_results')
        .insert(records);

      if (error) throw error;
      return records;
    },
    onSuccess: (data) => {
      const aprovadas = data.filter(d => d.status === 'pendente').length;
      const descartadas = data.filter(d => d.status === 'descartada').length;
      
      toast.success('Análise salva na quarentena', {
        description: `${aprovadas} pendentes | ${descartadas} descartadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['icp-stats'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar na quarentena', {
        description: error.message,
      });
    },
  });
}

// Hook para buscar empresas na quarentena
export function useQuarantineCompanies(filters?: {
  status?: string;
  temperatura?: string;
  minScore?: number;
}) {
  return useQuery({
    queryKey: [...ICP_QUARANTINE_QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('icp_analysis_results')
        .select(`
          *,
          companies(
            id,
            cnpj_status,
            status,
            domain,
            website
          )
        `)
        .order('icp_score', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.temperatura) {
        query = query.eq('temperatura', filters.temperatura);
      }
      if (filters?.minScore) {
        query = query.gte('icp_score', filters.minScore);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Flatten companies data into the main object
      const formatted = (data || []).map((item: any) => {
        const companyData = item.companies || {};
        return {
          ...item,
          cnpj_status: companyData.cnpj_status,
          company_status: companyData.status,
          domain: companyData.domain || item.domain,
          website: companyData.website || item.website,
        };
      });

      return formatted;
    },
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Hook para aprovar empresas em batch
export function useApproveQuarantineBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisIds: string[]) => {
      const ids = (analysisIds || []).filter((id): id is string => Boolean(id));
      if (ids.length === 0) throw new Error('Nenhuma empresa selecionada');

      // 1. Buscar dados das empresas por ID da análise (evita company_id null)
      const { data: quarantineData, error: fetchError } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .in('id', ids);

      if (fetchError) throw fetchError;
      if (!quarantineData || quarantineData.length === 0) throw new Error('Nenhuma empresa encontrada');

      // 2. Inserir no leads_pool (usando origem válida do constraint)
      const leadsToInsert = quarantineData.map(q => ({
        company_id: q.company_id || null,
        cnpj: q.cnpj,
        razao_social: q.razao_social,
        icp_score: q.icp_score,
        temperatura: q.temperatura,
        status: 'active',
        source: 'icp_batch_analysis',
        origem: 'icp_massa', // Valor válido do constraint
        raw_data: q.raw_analysis,
      }));

      const { error: insertError } = await supabase
        .from('leads_pool')
        .insert(leadsToInsert);

      if (insertError) throw insertError;

      // 3. Atualizar status na quarentena pelos IDs de análise
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({ status: 'aprovada' })
        .in('id', ids);

      if (updateError) throw updateError;

      // 4. Para hot leads (score >= 75), criar deals automaticamente
      const hotLeads = quarantineData.filter(q => q.icp_score >= 75);
      
      if (hotLeads.length > 0) {
        const dealsToCreate = hotLeads.map(lead => ({
          company_id: lead.company_id || null,
          title: `Oportunidade - ${lead.razao_social}`,
          stage: 'discovery',
          priority: 'high',
          status: 'open',
          value: lead.icp_score >= 85 ? 100000 : 50000,
          probability: Math.round(lead.icp_score * 0.8),
          source: 'icp_hot_lead_auto',
          lead_score: lead.icp_score,
        }));

        const { error: dealsError } = await supabase
          .from('sdr_deals')
          .insert(dealsToCreate);

        if (dealsError) console.error('Erro ao criar deals:', dealsError);
      }

      return {
        approved: ids.length,
        hotLeads: hotLeads.length,
      };
    },
    onSuccess: (data) => {
      toast.success('Empresas aprovadas com sucesso!', {
        description: data.hotLeads > 0 
          ? `${data.approved} aprovadas | ${data.hotLeads} hot leads com deals criados automaticamente`
          : `${data.approved} empresas movidas para o pool de leads`,
      });
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      queryClient.invalidateQueries({ queryKey: ['sdr-deals'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao aprovar empresas', {
        description: error.message,
      });
    },
  });
}

// Hook para descartar empresa
export function useRejectQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ analysisId, motivo }: { analysisId: string; motivo: string }) => {
      // Atualiza o registro da análise por ID
      const { error } = await supabase
        .from('icp_analysis_results')
        .update({ 
          status: 'descartada',
          motivo_descarte: motivo,
        })
        .eq('id', analysisId);

      if (error) throw error;

      // Buscar company_id (se existir) para marcar empresa como desqualificada
      const { data: record } = await supabase
        .from('icp_analysis_results')
        .select('company_id')
        .eq('id', analysisId)
        .single();

      if (record?.company_id) {
        await supabase
          .from('companies')
          .update({
            is_disqualified: true,
            disqualification_reason: motivo,
          })
          .eq('id', record.company_id);
      }
    },
    onSuccess: () => {
      toast.success('Empresa descartada');
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error('Erro ao descartar', {
        description: error.message,
      });
    },
  });
}

// Hook para aprovação automática baseada em regras
export function useAutoApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: {
      minScore?: number;
      temperatura?: 'hot' | 'warm' | 'cold';
      autoCreateDeals?: boolean;
    }) => {
      let query = supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('status', 'pendente');

      if (rules.minScore) {
        query = query.gte('icp_score', rules.minScore);
      }
      if (rules.temperatura) {
        query = query.eq('temperatura', rules.temperatura);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        return { approved: 0, deals: 0 };
      }

      const analysisIds = data.map(d => d.id);

      // Aprovar usando o batch (usando origem válida do constraint)
      const leadsToInsert = data.map(q => ({
        company_id: q.company_id,
        cnpj: q.cnpj,
        razao_social: q.razao_social,
        icp_score: q.icp_score,
        temperatura: q.temperatura,
        status: 'active',
        source: 'icp_auto_approval',
        origem: 'icp_massa', // Valor válido do constraint
        raw_data: q.raw_analysis,
      }));

      await supabase.from('leads_pool').insert(leadsToInsert);
      await supabase
        .from('icp_analysis_results')
        .update({ status: 'aprovada' })
        .in('id', analysisIds);

      let dealsCreated = 0;
      if (rules.autoCreateDeals) {
        const dealsToCreate = data.map(lead => ({
          company_id: lead.company_id,
          title: `Auto - ${lead.razao_social}`,
          stage: 'discovery',
          priority: lead.icp_score >= 75 ? 'high' : 'medium',
          status: 'open',
          value: lead.icp_score >= 85 ? 100000 : 50000,
          probability: Math.round(lead.icp_score * 0.8),
          source: 'icp_auto_approval',
          lead_score: lead.icp_score,
        }));

        const { data: dealsData } = await supabase
          .from('sdr_deals')
          .insert(dealsToCreate)
          .select('id');

        dealsCreated = dealsData?.length || 0;
      }

      return { approved: data.length, deals: dealsCreated };
    },
    onSuccess: (data) => {
      toast.success('Aprovação automática concluída', {
        description: data.deals > 0
          ? `${data.approved} aprovadas | ${data.deals} deals criados`
          : `${data.approved} empresas aprovadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      queryClient.invalidateQueries({ queryKey: ['sdr-deals'] });
    },
  });
}
