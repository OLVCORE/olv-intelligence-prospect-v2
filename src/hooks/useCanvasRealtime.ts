import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CanvasBlock {
  id: string;
  type: 'text' | 'heading' | 'list' | 'ai-response';
  content: string;
  position: number;
}

export interface Canvas {
  id: string;
  company_id: string | null;
  title: string;
  content: { blocks: CanvasBlock[] };
  created_at: string;
  updated_at: string;
  last_edited_by: string | null;
  is_template: boolean;
  tags: string[];
}

export const useCanvas = (canvasId?: string) => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecutingAI, setIsExecutingAI] = useState(false);
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Carregar canvas
  const loadCanvas = useCallback(async () => {
    if (!canvasId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('canvas')
        .select('*')
        .eq('id', canvasId)
        .single();

      if (error) throw error;
      setCanvas(data as unknown as Canvas);
    } catch (error) {
      console.error('Error loading canvas:', error);
      toast({
        title: 'Erro ao carregar canvas',
        description: 'Não foi possível carregar o canvas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [canvasId, toast]);

  // Autosave com debounce
  const saveCanvas = useCallback(async (updatedCanvas: Partial<Canvas>) => {
    if (!canvasId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('canvas')
        .update({
          content: updatedCanvas.content as any,
          title: updatedCanvas.title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', canvasId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving canvas:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [canvasId, toast]);

  // Atualizar conteúdo com autosave
  const updateContent = useCallback((blocks: CanvasBlock[]) => {
    const updatedCanvas = {
      ...canvas!,
      content: { blocks },
    };
    setCanvas(updatedCanvas);

    // Debounce autosave
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveCanvas({ content: { blocks }, title: canvas!.title });
    }, 1000);
  }, [canvas, saveCanvas]);

  // Executar comando de IA
  const executeAICommand = useCallback(async (command: string) => {
    setIsExecutingAI(true);
    try {
      const context = canvas?.content.blocks
        .map(b => b.content)
        .join('\n\n') || '';

      const { data, error } = await supabase.functions.invoke('canvas-ai-command', {
        body: { command, context, canvasId },
      });

      if (error) throw error;

      // Adicionar resposta da IA ao canvas
      const newBlock: CanvasBlock = {
        id: crypto.randomUUID(),
        type: 'ai-response',
        content: data.result,
        position: (canvas?.content.blocks.length || 0) + 1,
      };

      const updatedBlocks = [...(canvas?.content.blocks || []), newBlock];
      updateContent(updatedBlocks);

      toast({
        title: 'Comando executado',
        description: 'A resposta da IA foi adicionada ao canvas.',
      });

      return data.result;
    } catch (error) {
      console.error('Error executing AI command:', error);
      toast({
        title: 'Erro ao executar comando',
        description: 'Não foi possível executar o comando de IA.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsExecutingAI(false);
    }
  }, [canvas, canvasId, updateContent, toast]);

  // Configurar Realtime
  useEffect(() => {
    if (!canvasId) return;

    loadCanvas();

    // Configurar canal Realtime
    channelRef.current = supabase
      .channel(`canvas:${canvasId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'canvas',
          filter: `id=eq.${canvasId}`,
        },
        (payload) => {
          console.log('Canvas updated by another user:', payload);
          setCanvas(payload.new as unknown as Canvas);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [canvasId, loadCanvas]);

  return {
    canvas,
    isLoading,
    isSaving,
    isExecutingAI,
    updateContent,
    executeAICommand,
    saveCanvas,
  };
};