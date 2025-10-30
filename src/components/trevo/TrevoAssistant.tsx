import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Clover, X, Minimize2, Maximize2, Trash2, Send, Loader2, Sparkles } from 'lucide-react';
import { useTrevoAssistant, TrevoContext } from '@/hooks/useTrevoAssistant';
import ReactMarkdown from 'react-markdown';

interface TrevoAssistantProps {
  context: TrevoContext;
}

export function TrevoAssistant({ context }: TrevoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useTrevoAssistant(context);

  // Auto-scroll para última mensagem
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
    
    // Focar no input novamente
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Botão principal com design neutro e profissional */}
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-16 w-16 rounded-2xl shadow-2xl bg-card text-foreground border border-border relative overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-accent hover:text-accent-foreground"
          aria-label="Abrir TREVO, assistente inteligente"
        >
          {/* brilho suave ao passar o mouse */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-foreground/5 to-transparent" />
          
          {/* Ícone */}
          <div className="relative z-10">
            <Clover className="h-7 w-7 text-primary" />
          </div>
          
          {/* Detalhe sutil */}
          <Sparkles className="absolute top-2 right-2 h-3 w-3 text-primary/70" />
          
          {/* Indicador de status */}
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
            <span className="h-2 w-2 bg-background rounded-full animate-pulse" />
          </span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-popover text-popover-foreground rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-border backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clover className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">TREVO · Assistente</p>
            </div>
            <p className="text-xs text-muted-foreground">Seu guia inteligente de vendas</p>
            <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-popover border-r border-b border-border" />
          </div>
        </Button>
        
        {/* Anel pulsante discreto */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/30 animate-ping opacity-15" />
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 w-[440px] transition-all duration-300 ${isMinimized ? 'h-[70px]' : 'h-[650px]'}`}
    >
      <Card className="flex flex-col h-full shadow-2xl border border-border overflow-hidden bg-background/95">
        {/* Header neutro */}
        <div className="flex items-center justify-between p-4 border-b bg-card relative">
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center border border-border shadow-sm">
              <Clover className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                TREVO
                <span className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse" />
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Assistente Inteligente de Vendas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-9 w-9 hover:bg-accent rounded-lg transition-all duration-200"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-9 w-9 hover:bg-accent rounded-lg transition-all duration-200"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-9 w-9 hover:bg-accent rounded-lg transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-opacity duration-300`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      <p className="text-[10px] mt-2 opacity-60">
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start transition-opacity duration-300">
                    <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">TREVO está pensando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem... (Enter para enviar)"
                  className="min-h-[70px] max-h-[140px] resize-none border-border focus:border-primary focus:ring-primary/20 rounded-xl"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-[70px] w-[70px] rounded-xl shadow-lg bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Send className="h-6 w-6" />
                  )}
                </Button>
              </div>
              
              {/* Sugestões rápidas */}
              {messages.length === 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    '💡 Como qualificar um lead?',
                    '🎯 Mostrar meus deals prioritários',
                    '🤝 Dicas para negociação'
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(suggestion.replace(/^[^\s]+\s/, ''))}
                      className="text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
