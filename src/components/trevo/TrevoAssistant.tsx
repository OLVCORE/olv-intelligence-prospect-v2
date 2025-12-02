import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useTrevoAssistant, TrevoContext } from '@/hooks/useTrevoAssistant';
import ReactMarkdown from 'react-markdown';

interface TrevoAssistantProps {
  context: TrevoContext;
}

/**
 * TREVO - Assistente Inteligente STRATEVO
 * NOVO - Criado do zero em AZUL
 * Posição: bottom-4 right-4 z-[100]
 */
export function TrevoAssistant({ context }: TrevoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, isLoading, sendMessage, clearMessages } = useTrevoAssistant(context);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput('');
    await sendMessage(message);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Botão flutuante (fechado)
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] group">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-2 border-blue-400 relative overflow-hidden transition-all duration-300 hover:scale-110"
          aria-label="Abrir TREVO - Assistente Inteligente"
        >
          {/* Ícone Bot Azul */}
          <Bot className="h-8 w-8 text-white animate-pulse" />
          
          {/* Sparkles decorativo */}
          <Sparkles className="absolute top-1 right-1 h-3 w-3 text-blue-200 animate-pulse" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border-2 border-blue-500">
            <p className="text-sm font-bold">🤖 TREVO Assistente</p>
            <p className="text-xs text-blue-100">Seu guia inteligente</p>
          </div>
        </Button>
      </div>
    );
  }

  // Painel aberto
  return (
    <div className="fixed top-16 right-4 w-[440px] h-[calc(100vh-5rem)] z-[100] transition-all duration-300">
      <Card className="flex flex-col h-full shadow-2xl border-2 border-blue-500/30 overflow-hidden bg-background/98 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-950/40 to-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center border-2 border-blue-400 shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent text-lg">
                TREVO
                <span className="ml-2 h-2.5 w-2.5 bg-blue-400 rounded-full inline-block animate-pulse" />
              </h3>
              <p className="text-xs text-blue-400/80">Assistente Inteligente</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={clearMessages} title="Limpar conversa">
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} title="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <p className="font-semibold">Olá! Sou o TREVO 🤖</p>
              <p className="text-sm mt-2">Seu assistente inteligente STRATEVO</p>
              <p className="text-xs mt-4">Como posso ajudar você hoje?</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-muted'
                  }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <p className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

