import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const SMART_TASKS_QUERY_KEY = ['smart-tasks'];

export interface SmartTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  company_id: string | null;
  contact_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  auto_created: boolean;
  trigger_type: string | null;
  trigger_metadata: any;
  due_date: string;
  reminder_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  context: any;
  ai_suggestions: any[];
}

export function useSmartTasks(filters?: {
  status?: string;
  priority?: string;
  assigned_to?: string;
  company_id?: string;
}) {
  return useQuery({
    queryKey: [...SMART_TASKS_QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('smart_tasks')
        .select('*, companies(name), decision_makers(name)')
        .order('due_date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.company_id) {
        query = query.eq('company_id', filters.company_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as SmartTask[];
    },
  });
}

export function useCreateSmartTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<SmartTask>) => {
      const { data: task, error} = await supabase
        .from('smart_tasks')
        .insert([data as any])
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMART_TASKS_QUERY_KEY });
      toast.success('Tarefa criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar tarefa', {
        description: error.message,
      });
    },
  });
}

export function useUpdateSmartTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SmartTask> }) => {
      const { data: task, error } = await supabase
        .from('smart_tasks')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMART_TASKS_QUERY_KEY });
      toast.success('Tarefa atualizada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar tarefa', {
        description: error.message,
      });
    },
  });
}

export function useCompleteSmartTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: task, error } = await supabase
        .from('smart_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMART_TASKS_QUERY_KEY });
      toast.success('Tarefa concluída');
    },
    onError: (error: Error) => {
      toast.error('Erro ao concluir tarefa', {
        description: error.message,
      });
    },
  });
}
