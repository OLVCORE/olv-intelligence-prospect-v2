import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export interface TrevoMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TrevoContext {
  userId?: string;
  currentPage?: string;
  companyId?: string;
  dealId?: string;
}

export function useTrevoAssistant(context: TrevoContext) {
  const [messages, setMessages] = useState<TrevoMessage[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou o **TREVO**, seu assistente inteligente de vendas. Estou aqui para ajudá-lo a navegar pela plataforma, tomar decisões mais assertivas e acelerar seus resultados.\n\nComo posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar usuário
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Adicionar mensagem do usuário
    const newUserMessage: TrevoMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Preparar histórico de mensagens para a API
      const apiMessages = [...messages, newUserMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('trevo-assistant', {
        body: {
          messages: apiMessages,
          context: {
            ...context,
            userId: user?.id
          }
        }
      });

      if (error) throw error;

      // Adicionar resposta do assistente
      const assistantMessage: TrevoMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error calling TREVO:', error);
      
      // Mensagem de erro amigável
      const errorMessage: TrevoMessage = {
        role: 'assistant',
        content: `😔 Desculpe, encontrei um problema: ${error.message || 'Erro ao processar sua mensagem'}. Tente novamente em alguns instantes.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Erro ao comunicar com o TREVO', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, user]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: '👋 Olá! Sou o **TREVO**, seu assistente inteligente de vendas. Como posso ajudar você hoje?',
      timestamp: new Date()
    }]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}
