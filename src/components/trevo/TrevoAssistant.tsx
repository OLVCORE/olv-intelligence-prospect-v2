import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Sparkles, X, Minimize2, Maximize2, Trash2, Send, Loader2 } from 'lucide-react';
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
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 relative group"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border">
            <p className="text-sm font-medium">TREVO - Assistente Inteligente</p>
            <p className="text-xs text-muted-foreground">Clique para começar</p>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 w-[420px] transition-all duration-300 ${isMinimized ? 'h-[60px]' : 'h-[600px]'}`}
    >
        <Card className="flex flex-col h-full shadow-2xl border-2">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  TREVO
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                </h3>
                <p className="text-xs text-white/80">Assistente Inteligente de Vendas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Limpar conversa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
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
                            ? 'bg-purple-600 text-white'
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
              <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
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
                    className="h-[60px] w-[60px] bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                {/* Sugestões rápidas */}
                {messages.length === 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      'Como qualificar um lead?',
                      'Mostrar meus deals prioritários',
                      'Dicas para negociação'
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(suggestion)}
                        className="text-xs"
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
