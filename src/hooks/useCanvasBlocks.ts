import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CanvasBlock {
  id: string;
  canvas_id: string;
  type: 'note' | 'insight' | 'decision' | 'task' | 'reference' | 'attachment' | 'timeline';
  content: Record<string, any>;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CanvasActivity {
  id: string;
  canvas_id: string;
  block_id?: string;
  user_id?: string;
  action_type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CanvasLink {
  id: string;
  canvas_id: string;
  target_type: 'playbook' | 'sequence_run' | 'task' | 'report' | 'insight' | 'company';
  target_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export const useCanvasBlocks = (canvasId: string) => {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [activities, setActivities] = useState<CanvasActivity[]>([]);
  const [links, setLinks] = useState<CanvasLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Carregar blocos
  const loadBlocks = useCallback(async () => {
    if (!canvasId) return;

    try {
      const { data, error } = await supabase
        .from('canvas_blocks')
        .select('*')
        .eq('canvas_id', canvasId)
        .order('order_index');

      if (error) throw error;
      setBlocks((data || []) as CanvasBlock[]);
    } catch (error) {
      console.error('Erro ao carregar blocos:', error);
      toast({
        title: 'Erro ao carregar blocos',
        description: 'Não foi possível carregar os blocos do canvas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [canvasId, toast]);

  // Carregar atividades
  const loadActivities = useCallback(async () => {
    if (!canvasId) return;

    try {
      const { data, error } = await supabase
        .from('canvas_activity')
        .select('*')
        .eq('canvas_id', canvasId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities((data || []) as CanvasActivity[]);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  }, [canvasId]);

  // Carregar links
  const loadLinks = useCallback(async () => {
    if (!canvasId) return;

    try {
      const { data, error } = await supabase
        .from('canvas_links')
        .select('*')
        .eq('canvas_id', canvasId);

      if (error) throw error;
      setLinks((data || []) as CanvasLink[]);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
    }
  }, [canvasId]);

  // Adicionar bloco
  const addBlock = useCallback(async (
    type: CanvasBlock['type'],
    content: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const maxOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.order_index)) : -1;

      const { data, error } = await supabase
        .from('canvas_blocks')
        .insert({
          canvas_id: canvasId,
          type,
          content,
          order_index: maxOrder + 1,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Bloco adicionado',
        description: 'Novo bloco criado com sucesso.',
      });

      return data;
    } catch (error) {
      console.error('Erro ao adicionar bloco:', error);
      toast({
        title: 'Erro ao adicionar bloco',
        description: 'Não foi possível criar o bloco.',
        variant: 'destructive',
      });
      return null;
    }
  }, [canvasId, blocks, toast]);

  // Atualizar bloco
  const updateBlock = useCallback(async (
    blockId: string,
    updates: Partial<CanvasBlock>
  ) => {
    try {
      const { error } = await supabase
        .from('canvas_blocks')
        .update(updates)
        .eq('id', blockId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o bloco.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Deletar bloco
  const deleteBlock = useCallback(async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('canvas_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: 'Bloco removido',
        description: 'Bloco deletado com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar bloco:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o bloco.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Reordenar blocos
  const reorderBlocks = useCallback(async (reorderedBlocks: CanvasBlock[]) => {
    try {
      const updates = reorderedBlocks.map((block, index) => ({
        id: block.id,
        order_index: index
      }));

      for (const update of updates) {
        await supabase
          .from('canvas_blocks')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      return true;
    } catch (error) {
      console.error('Erro ao reordenar blocos:', error);
      return false;
    }
  }, []);

  // Promover decisão para tarefa SDR
  const promoteDecisionToTask = useCallback(async (blockId: string) => {
    try {
      const { data, error } = await supabase.rpc('promote_canvas_decision', {
        p_block_id: blockId,
        p_target_type: 'sdr_task'
      });

      if (error) throw error;

      toast({
        title: 'Decisão promovida',
        description: 'Tarefa SDR criada com sucesso!',
      });

      // Recarregar links
      loadLinks();

      return data;
    } catch (error) {
      console.error('Erro ao promover decisão:', error);
      toast({
        title: 'Erro ao promover',
        description: 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, loadLinks]);

  // Criar versão (snapshot)
  const createVersion = useCallback(async (tag?: string, description?: string) => {
    try {
      const { data, error } = await supabase.rpc('create_canvas_version', {
        p_canvas_id: canvasId,
        p_tag: tag,
        p_description: description
      });

      if (error) throw error;

      toast({
        title: 'Versão criada',
        description: 'Snapshot do canvas salvo com sucesso.',
      });

      loadActivities();

      return data;
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      toast({
        title: 'Erro ao criar versão',
        description: 'Não foi possível salvar o snapshot.',
        variant: 'destructive',
      });
      return null;
    }
  }, [canvasId, toast, loadActivities]);

  // Configurar realtime
  useEffect(() => {
    if (!canvasId) return;

    loadBlocks();
    loadActivities();
    loadLinks();

    const blocksChannel: RealtimeChannel = supabase
      .channel(`canvas_blocks:${canvasId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'canvas_blocks',
          filter: `canvas_id=eq.${canvasId}`
        },
        () => {
          loadBlocks();
        }
      )
      .subscribe();

    const activityChannel: RealtimeChannel = supabase
      .channel(`canvas_activity:${canvasId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'canvas_activity',
          filter: `canvas_id=eq.${canvasId}`
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    const linksChannel: RealtimeChannel = supabase
      .channel(`canvas_links:${canvasId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'canvas_links',
          filter: `canvas_id=eq.${canvasId}`
        },
        () => {
          loadLinks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(blocksChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(linksChannel);
    };
  }, [canvasId, loadBlocks, loadActivities, loadLinks]);

  return {
    blocks,
    activities,
    links,
    isLoading,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    promoteDecisionToTask,
    createVersion,
    refreshBlocks: loadBlocks,
    refreshActivities: loadActivities,
    refreshLinks: loadLinks
  };
};