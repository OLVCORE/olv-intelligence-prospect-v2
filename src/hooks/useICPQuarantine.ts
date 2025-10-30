import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ICPAnalysisResultRow = Database['public']['Tables']['icp_analysis_results']['Row'];

interface ICPAnalysisResult extends Omit<ICPAnalysisResultRow, 'temperatura'> {
  temperatura: 'hot' | 'warm' | 'cold' | null;
}

interface QuarantineEmpresas {
  aprovadas: ICPAnalysisResult[];
  reprovadas: ICPAnalysisResult[];
  totvs: ICPAnalysisResult[];
}

export function useICPQuarantine() {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: empresas, isLoading, refetch } = useQuery({
    queryKey: ['icp-quarantine'],
    queryFn: async (): Promise<QuarantineEmpresas> => {
      const { data, error } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('moved_to_pool', false)
        .order('icp_score', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as ICPAnalysisResult[];

      const aprovadas = typedData.filter(
        (e) => !e.is_cliente_totvs && (e.icp_score ?? 0) >= 40
      );

      const reprovadas = typedData.filter(
        (e) => !e.is_cliente_totvs && (e.icp_score ?? 0) < 40
      );

      const totvs = typedData.filter((e) => e.is_cliente_totvs);

      return { aprovadas, reprovadas, totvs };
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const moverParaPoolMutation = useMutation({
    mutationFn: async (empresaIds: string[]) => {
      if (empresaIds.length === 0) {
        throw new Error('Nenhuma empresa selecionada');
      }

      const empresasSelecionadas = empresas?.aprovadas.filter((e) =>
        empresaIds.includes(e.id)
      ) || [];

      if (empresasSelecionadas.length === 0) {
        throw new Error('Empresas não encontradas');
      }

      // 1. Inserir no leads_pool
      const { error: poolError } = await supabase.from('leads_pool').insert(
        empresasSelecionadas.map((e) => ({
          cnpj: e.cnpj,
          razao_social: e.razao_social,
          nome_fantasia: e.nome_fantasia,
          uf: e.uf,
          municipio: e.municipio,
          porte: e.porte,
          website: e.website,
          email: e.email,
          telefone: e.telefone,
          origem: e.origem || 'upload_massa',
          icp_score: e.icp_score || 0,
          temperatura: e.temperatura || 'cold',
          is_cliente_totvs: false,
          totvs_check_date: new Date().toISOString(),
          raw_data: e.raw_data,
        }))
      );

      if (poolError) throw poolError;

      // 2. Marcar como movidas
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({ moved_to_pool: true })
        .in('id', empresaIds);

      if (updateError) throw updateError;

      return empresasSelecionadas.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      toast.success(`✅ ${count} empresa(s) movida(s) para o Leads Pool`, {
        description: 'As empresas aprovadas estão agora disponíveis no pool',
      });
      setSelecionadas(new Set());
    },
    onError: (error: Error) => {
      toast.error('Erro ao mover empresas', {
        description: error.message,
      });
    },
  });

  const descartarMutation = useMutation({
    mutationFn: async (empresaIds: string[]) => {
      if (empresaIds.length === 0) {
        throw new Error('Nenhuma empresa selecionada');
      }

      const { error } = await supabase
        .from('icp_analysis_results')
        .delete()
        .in('id', empresaIds);

      if (error) throw error;

      return empresaIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      toast.success(`✅ ${count} empresa(s) descartada(s)`, {
        description: 'As empresas foram removidas da quarentena',
      });
      setSelecionadas(new Set());
    },
    onError: (error: Error) => {
      toast.error('Erro ao descartar empresas', {
        description: error.message,
      });
    },
  });

  const toggleSelection = (id: string) => {
    setSelecionadas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllSelection = () => {
    if (selecionadas.size === empresas?.aprovadas.length) {
      setSelecionadas(new Set());
    } else {
      setSelecionadas(new Set(empresas?.aprovadas.map((e) => e.id)));
    }
  };

  const moverParaPool = () => {
    moverParaPoolMutation.mutate(Array.from(selecionadas));
  };

  const descartarSelecionadas = () => {
    descartarMutation.mutate(Array.from(selecionadas));
  };

  const recarregar = () => {
    refetch();
  };

  return {
    empresas: empresas || { aprovadas: [], reprovadas: [], totvs: [] },
    selecionadas,
    isLoading,
    toggleSelection,
    toggleAllSelection,
    moverParaPool,
    descartarSelecionadas,
    recarregar,
  };
}
