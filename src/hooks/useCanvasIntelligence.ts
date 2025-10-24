import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCanvas } from './useCanvasRealtime';

export const useCanvasIntelligence = (canvasId: string, companyId?: string) => {
  const canvas = useCanvas(canvasId);
  const [companyData, setCompanyData] = useState<any>(null);
  const [digitalMaturity, setDigitalMaturity] = useState<any>(null);
  const [governanceSignals, setGovernanceSignals] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  // Load company data
  const loadCompanyData = useCallback(async () => {
    if (!companyId) {
      setIsLoadingData(false);
      return;
    }

    try {
      // Company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompanyData(company);

      // Digital Maturity
      const { data: maturity } = await supabase
        .from('digital_maturity')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      setDigitalMaturity(maturity);

      // Governance signals
      const { data: signals } = await supabase
        .from('governance_signals')
        .select('*')
        .eq('company_id', companyId)
        .order('detected_at', { ascending: false });
      
      setGovernanceSignals(signals || []);

    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [companyId]);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!canvasId) return;

    try {
      const { data, error } = await supabase
        .from('canvas_comments')
        .select('*')
        .eq('canvas_id', canvasId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, [canvasId]);

  // Add comment
  const addComment = useCallback(async (
    type: 'comment' | 'insight' | 'risk' | 'hypothesis' | 'task',
    content: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('canvas_comments')
        .insert({
          canvas_id: canvasId,
          user_id: user.id,
          type,
          content,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Adicionado',
        description: `${type} adicionado com sucesso.`
      });

      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar.',
        variant: 'destructive'
      });
    }
  }, [canvasId, loadComments, toast]);

  // Update comment status
  const updateCommentStatus = useCallback(async (
    commentId: string,
    status: 'active' | 'resolved' | 'archived'
  ) => {
    try {
      const { error } = await supabase
        .from('canvas_comments')
        .update({ status })
        .eq('id', commentId);

      if (error) throw error;
      loadComments();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  }, [loadComments]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('canvas_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, [loadComments]);

  // Execute AI proactive analysis
  const executeProactiveAI = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('canvas-ai-proactive', {
        body: {
          canvasId,
          companyId,
          companyData,
          digitalMaturity,
          governanceSignals
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        for (const suggestion of data.suggestions) {
          await addComment(suggestion.type, suggestion.content);
        }

        toast({
          title: 'IA Proativa',
          description: `${data.suggestions.length} sugestões adicionadas.`
        });
      }
    } catch (error) {
      console.error('Error executing proactive AI:', error);
    }
  }, [canvasId, companyId, companyData, digitalMaturity, governanceSignals, addComment, toast]);

  // Load all data on mount
  useEffect(() => {
    loadCompanyData();
    loadComments();
  }, [loadCompanyData, loadComments]);

  // Setup realtime for comments
  useEffect(() => {
    if (!canvasId) return;

    const channel = supabase
      .channel(`canvas_comments:${canvasId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'canvas_comments',
          filter: `canvas_id=eq.${canvasId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canvasId, loadComments]);

  return {
    ...canvas,
    companyData,
    digitalMaturity,
    governanceSignals,
    comments,
    isLoadingData,
    addComment,
    updateCommentStatus,
    deleteComment,
    executeProactiveAI
  };
};
