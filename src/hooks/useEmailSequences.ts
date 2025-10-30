import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const EMAIL_SEQUENCES_QUERY_KEY = ['email-sequences'];

export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: 'manual' | 'stage_change' | 'deal_created' | 'time_based';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  subject: string;
  body_template: string;
  delay_days: number;
  delay_hours: number;
  send_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmailSequences() {
  return useQuery({
    queryKey: EMAIL_SEQUENCES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_sequences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailSequence[];
    },
  });
}

export function useEmailSequenceSteps(sequenceId: string | null) {
  return useQuery({
    queryKey: [...EMAIL_SEQUENCES_QUERY_KEY, 'steps', sequenceId],
    queryFn: async () => {
      if (!sequenceId) return [];
      
      const { data, error } = await supabase
        .from('email_sequence_steps')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_order', { ascending: true });
      
      if (error) throw error;
      return data as EmailSequenceStep[];
    },
    enabled: !!sequenceId,
  });
}

export function useCreateEmailSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EmailSequence>) => {
      const { data: sequence, error } = await supabase
        .from('email_sequences')
        .insert([data as any])
        .select()
        .single();
      
      if (error) throw error;
      return sequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_SEQUENCES_QUERY_KEY });
      toast.success('Sequência criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar sequência', {
        description: error.message,
      });
    },
  });
}

export function useUpdateEmailSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailSequence> }) => {
      const { data: sequence, error } = await supabase
        .from('email_sequences')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return sequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_SEQUENCES_QUERY_KEY });
      toast.success('Sequência atualizada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar sequência', {
        description: error.message,
      });
    },
  });
}

export function useDeleteEmailSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_sequences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_SEQUENCES_QUERY_KEY });
      toast.success('Sequência removida');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover sequência', {
        description: error.message,
      });
    },
  });
}
