import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Canvas, Inserts } from '@/lib/db';

export const CANVAS_QUERY_KEY = ['canvas'];

export function useCanvasList() {
  return useQuery({
    queryKey: CANVAS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canvas')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Canvas[];
    },
  });
}

export function useCanvas(id: string) {
  return useQuery({
    queryKey: ['canvas', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canvas')
        .select(`
          *,
          canvas_comments(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCanvas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (canvas: Inserts<'canvas'>) => {
      const { data, error } = await supabase
        .from('canvas')
        .insert([canvas])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANVAS_QUERY_KEY });
    },
  });
}

export function useUpdateCanvas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Canvas> }) => {
      const { data, error } = await supabase
        .from('canvas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CANVAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['canvas', variables.id] });
    },
  });
}

export function useDeleteCanvas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canvas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CANVAS_QUERY_KEY });
    },
  });
}
