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
      
      // Extrair mensagem de erro do backend
      let errorMsg = error?.message || '';
      
      // Se for um FunctionsHttpError, tentar pegar a mensagem do contexto
      if (error?.context?.error) {
        errorMsg = error.context.error;
      }
      
      // Classificar erros comuns
      const isCreditsError = /crédito|credit|402|payment/i.test(errorMsg);
      const isAuthError = /autentic|unauthorized|401|api key|invalid/i.test(errorMsg);
      const isRateLimit = /limite|rate|429/i.test(errorMsg);
      
      // Mensagem de erro amigável
      const errorMessage: TrevoMessage = {
        role: 'assistant',
        content: isCreditsError
          ? '💳 Os créditos da IA se esgotaram. Entre em contato com o administrador da plataforma para recarregar.'
          : isAuthError
          ? '🔐 Erro de autenticação. Entre em contato com o suporte.'
          : isRateLimit
          ? '⏳ Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.'
          : `😔 Desculpe, encontrei um problema. Tente novamente em alguns instantes.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      if (isCreditsError) {
        toast.error('Créditos esgotados', {
          description: 'Os créditos da IA se esgotaram. Entre em contato com o administrador.',
          duration: 10000
        });
      } else if (isAuthError) {
        toast.error('Falha de autenticação', {
          description: 'Erro de autenticação com o serviço de IA',
          duration: 10000
        });
      } else if (isRateLimit) {
        toast.error('Limite de requisições', {
          description: 'Aguarde alguns instantes e tente novamente',
        });
      } else {
        toast.error('Erro ao comunicar com o TREVO', {
          description: errorMsg || 'Tente novamente em alguns instantes'
        });
      }
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
