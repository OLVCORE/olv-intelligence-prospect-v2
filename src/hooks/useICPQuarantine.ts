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
      const message = String(error?.message || '');
      const code = (error as any)?.code;
      if (code === '23505' || /duplicate key value/i.test(message)) {
        toast.error('CNPJ duplicado', {
          description: 'Este CNPJ já existe na quarentena. O registro foi ignorado.',
        });
      } else {
        toast.error('Erro ao salvar na quarentena', {
          description: message,
        });
      }
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
      // cnpj_status now comes directly from icp_analysis_results
      const formatted = (data || []).map((item: any) => {
        const companyData = item.companies || {};
        return {
          ...item,
          domain: companyData.domain || item.domain,
          website: item.website || companyData.website,
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

      // 1. Buscar dados das empresas por ID da análise
      const { data: quarantineData, error: fetchError } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .in('id', ids);

      if (fetchError) throw fetchError;
      if (!quarantineData || quarantineData.length === 0) throw new Error('Nenhuma empresa encontrada');

      // 2. Validar dados obrigatórios e separar empresas válidas
      const validCompanies = quarantineData.filter(q => 
        q.cnpj && 
        q.cnpj.trim() !== '' && 
        q.razao_social && 
        q.razao_social.trim() !== ''
      );

      const invalidCompanies = quarantineData.filter(q => 
        !q.cnpj || 
        q.cnpj.trim() === '' || 
        !q.razao_social || 
        q.razao_social.trim() === ''
      );

      if (validCompanies.length === 0) {
        throw new Error('Nenhuma empresa possui dados válidos (CNPJ e Razão Social são obrigatórios)');
      }

      // 3. Inserir no leads_pool apenas empresas válidas
      const leadsToInsert = validCompanies.map(q => ({
        company_id: q.company_id || null,
        cnpj: q.cnpj!,
        razao_social: q.razao_social!,
        icp_score: q.icp_score || 0,
        temperatura: q.temperatura || 'cold',
        status: 'pool',
        source: 'icp_batch_analysis',
        origem: 'icp_massa',
        raw_data: q.raw_analysis || {},
      }));

      const { error: insertError } = await supabase
        .from('leads_pool')
        .insert(leadsToInsert);

      if (insertError) throw insertError;

      // 4. Atualizar status na quarentena para empresas válidas
      const validIds = validCompanies.map(q => q.id);
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({ status: 'aprovada' })
        .in('id', validIds);

      if (updateError) throw updateError;

      // 5. Marcar empresas inválidas como "dados_incompletos"
      if (invalidCompanies.length > 0) {
        const invalidIds = invalidCompanies.map(q => q.id);
        await supabase
          .from('icp_analysis_results')
          .update({ 
            status: 'pendente',
            motivo_descarte: 'Dados incompletos (CNPJ ou Razão Social ausentes)'
          })
          .in('id', invalidIds);
      }

      // 6. Para hot leads (score >= 75), criar deals automaticamente
      const hotLeads = validCompanies.filter(q => (q.icp_score || 0) >= 75);
      
      if (hotLeads.length > 0) {
        const dealsToCreate = hotLeads.map(lead => ({
          company_id: lead.company_id || null,
          title: `Oportunidade - ${lead.razao_social}`,
          stage: 'discovery',
          priority: 'high',
          status: 'open',
          value: (lead.icp_score || 0) >= 85 ? 100000 : 50000,
          probability: Math.round((lead.icp_score || 0) * 0.8),
          source: 'icp_hot_lead_auto',
          lead_score: lead.icp_score || 0,
        }));

        const { error: dealsError } = await supabase
          .from('sdr_deals')
          .insert(dealsToCreate);

        if (dealsError) console.error('Erro ao criar deals:', dealsError);
      }

      return {
        approved: validCompanies.length,
        hotLeads: hotLeads.length,
        invalid: invalidCompanies.length,
        invalidNames: invalidCompanies.map(c => c.razao_social || 'Sem nome').slice(0, 5)
      };
    },
    onSuccess: (data) => {
      const mainMessage = data.hotLeads > 0 
        ? `${data.approved} aprovadas | ${data.hotLeads} hot leads com deals criados`
        : `${data.approved} empresas movidas para o pool de leads`;
      
      const warningMessage = data.invalid > 0
        ? ` | ⚠️ ${data.invalid} empresas com dados incompletos (não aprovadas)`
        : '';

      toast.success('Empresas aprovadas com sucesso!', {
        description: mainMessage + warningMessage,
        duration: 5000,
      });

      if (data.invalid > 0 && data.invalidNames.length > 0) {
        toast.warning('Empresas não aprovadas:', {
          description: `${data.invalidNames.join(', ')}${data.invalid > 5 ? ' e outras...' : ''} - Dados incompletos`,
          duration: 7000,
        });
      }
      
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
        status: 'pool',
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
