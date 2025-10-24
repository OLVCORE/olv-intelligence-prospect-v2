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

export function useCreatePersona() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (persona: any) => {
      const { data, error } = await supabase
        .from('buyer_personas')
        .insert([persona])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer_personas'] });
      toast({
        title: "Persona criada!",
        description: "Nova buyer persona adicionada à biblioteca.",
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
