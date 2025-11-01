import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { ColumnMapping } from '@/lib/csvMapper';

interface MappingTemplate {
  id: string;
  nome_template: string;
  descricao?: string;
  mappings: ColumnMapping[];
  custom_fields: string[];
  total_colunas: number;
  ultima_utilizacao?: string;
  criado_em: string;
}

export function useICPMappingTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listar templates do usuário
  const { data: templates, isLoading, error: queryError } = useQuery({
    queryKey: ['icp-mapping-templates'],
    queryFn: async () => {
      console.log('[TEMPLATES] Carregando templates...');
      
      const { data, error } = await supabase
        .from('icp_mapping_templates')
        .select('*')
        .order('ultima_utilizacao', { ascending: false, nullsFirst: false })
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('[TEMPLATES] Erro ao carregar:', error);
        throw error;
      }
      
      console.log('[TEMPLATES] Templates carregados:', data?.length || 0);
      
      // Converter Json para ColumnMapping[]
      return (data || []).map(item => ({
        ...item,
        mappings: item.mappings as unknown as ColumnMapping[],
      })) as MappingTemplate[];
    },
  });

  // Mostrar erro se houver
  if (queryError) {
    console.error('[TEMPLATES] Erro na query:', queryError);
    toast({
      title: 'Erro ao carregar templates',
      description: 'Verifique as permissões de acesso aos templates.',
      variant: 'destructive',
    });
  }

  // Salvar novo template
  const saveTemplate = useMutation({
    mutationFn: async ({
      nome_template,
      descricao,
      mappings,
      custom_fields,
    }: {
      nome_template: string;
      descricao?: string;
      mappings: ColumnMapping[];
      custom_fields: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('icp_mapping_templates')
        .insert({
          user_id: user.id,
          nome_template,
          descricao,
          mappings: mappings as any,
          custom_fields,
          total_colunas: mappings.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-mapping-templates'] });
      toast({
        title: 'Template salvo!',
        description: 'O template de mapeamento foi salvo com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar template existente
  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      nome_template,
      descricao,
      mappings,
      custom_fields,
    }: {
      id: string;
      nome_template?: string;
      descricao?: string;
      mappings?: ColumnMapping[];
      custom_fields?: string[];
    }) => {
      const updateData: any = {};
      if (nome_template) updateData.nome_template = nome_template;
      if (descricao !== undefined) updateData.descricao = descricao;
      if (mappings) {
        updateData.mappings = mappings as any;
        updateData.total_colunas = mappings.length;
      }
      if (custom_fields) updateData.custom_fields = custom_fields;

      const { data, error } = await supabase
        .from('icp_mapping_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-mapping-templates'] });
      toast({
        title: 'Template atualizado!',
        description: 'O template foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deletar template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('icp_mapping_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-mapping-templates'] });
      toast({
        title: 'Template removido',
        description: 'O template foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Marcar template como usado
  const markAsUsed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('icp_mapping_templates')
        .update({ ultima_utilizacao: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-mapping-templates'] });
    },
  });

  return {
    templates: templates || [],
    isLoading,
    saveTemplate: saveTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
    markAsUsed: markAsUsed.mutateAsync,
  };
}
