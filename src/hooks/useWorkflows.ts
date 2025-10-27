import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkflowDefinition {
  name: string;
  trigger: string;
  conditions: Array<{ type: string; config: any }>;
  actions: Array<{ type: string; config: any }>;
  isActive: boolean;
}

export function useWorkflows() {
  const queryClient = useQueryClient();

  // Buscar workflows
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['sdr-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Criar workflow
  const createWorkflow = useMutation({
    mutationFn: async (workflow: WorkflowDefinition) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('sdr_workflows')
        .insert({
          name: workflow.name,
          trigger_type: workflow.trigger,
          conditions: workflow.conditions,
          actions: workflow.actions,
          is_active: workflow.isActive,
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Workflow criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['sdr-workflows'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao criar workflow: ' + error.message);
    }
  });

  // Ativar/Pausar workflow
  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('sdr_workflows')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Workflow ativado' : 'Workflow pausado');
      queryClient.invalidateQueries({ queryKey: ['sdr-workflows'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar workflow: ' + error.message);
    }
  });

  // Deletar workflow
  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sdr_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Workflow removido');
      queryClient.invalidateQueries({ queryKey: ['sdr-workflows'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao remover workflow: ' + error.message);
    }
  });

  return {
    workflows,
    isLoading,
    createWorkflow,
    toggleWorkflow,
    deleteWorkflow
  };
}
