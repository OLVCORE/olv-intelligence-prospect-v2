import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBuyerPersonas() {
  return useQuery({
    queryKey: ['buyer_personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_personas')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBuyerPersona() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: persona, error } = await supabase
        .from('buyer_personas')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return persona;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer_personas'] });
      toast({
        title: "Persona criada!",
        description: "Nova buyer persona adicionada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar persona",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBuyerPersona() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('buyer_personas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer_personas'] });
      toast({
        title: "Persona atualizada!",
        description: "Buyer persona atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar persona",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBuyerPersona() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buyer_personas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer_personas'] });
      toast({
        title: "Persona deletada!",
        description: "Buyer persona removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar persona",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
