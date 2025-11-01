import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const LEADS_POOL_QUERY_KEY = ['leads-pool'];

export function useLeadsPool(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  temperatura?: string;
}) {
  const { page = 0, pageSize = 50, search = '', temperatura } = options || {};
  
  return useQuery({
    queryKey: [...LEADS_POOL_QUERY_KEY, page, pageSize, search, temperatura],
    queryFn: async () => {
      let query = supabase
        .from('leads_pool')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`razao_social.ilike.%${search}%,cnpj.ilike.%${search}%`);
      }

      if (temperatura) {
        query = query.eq('temperatura', temperatura);
      }

      query = query.order('icp_score', { ascending: false });

      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      return { 
        data: data || [], 
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    staleTime: 30 * 1000,
  });
}

export function useAddToQualified() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadPoolId: string) => {
      const { data: poolData, error: poolError } = await supabase
        .from('leads_pool')
        .select('*')
        .eq('id', leadPoolId)
        .single();

      if (poolError) throw poolError;

      // Upsert manual por CNPJ (evita erro 400 sem unique index)
      const { data: existing } = await supabase
        .from('leads_qualified')
        .select('id')
        .eq('cnpj', poolData.cnpj)
        .maybeSingle();

      let error: any = null;
      if (existing) {
        const { error: updateErr } = await supabase
          .from('leads_qualified')
          .update({
            lead_pool_id: poolData.id,
            razao_social: poolData.razao_social,
            nome_fantasia: poolData.nome_fantasia,
            uf: poolData.uf,
            municipio: poolData.municipio,
            porte: poolData.porte,
            website: poolData.website,
            email: poolData.email,
            telefone: poolData.telefone,
            icp_score: poolData.icp_score,
            temperatura: poolData.temperatura,
            status: 'qualificada',
            motivo_qualificacao: 'Seleção manual do usuário',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('leads_qualified')
          .insert({
            cnpj: poolData.cnpj,
            lead_pool_id: poolData.id,
            razao_social: poolData.razao_social,
            nome_fantasia: poolData.nome_fantasia,
            uf: poolData.uf,
            municipio: poolData.municipio,
            porte: poolData.porte,
            website: poolData.website,
            email: poolData.email,
            telefone: poolData.telefone,
            icp_score: poolData.icp_score,
            temperatura: poolData.temperatura,
            status: 'qualificada',
            motivo_qualificacao: 'Seleção manual do usuário',
            updated_at: new Date().toISOString(),
          });
        error = insertErr;
      }

      if (error) throw error;
      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_POOL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['leads-qualified'] });
      toast.success('Empresa movida para qualificadas');
    },
    onError: (error: Error) => {
      toast.error('Erro ao mover empresa', {
        description: error.message,
      });
    },
  });
}
