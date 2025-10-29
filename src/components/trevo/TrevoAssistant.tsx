import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, X, Minimize2, Maximize2, Trash2, Send, Loader2, Sparkles } from 'lucide-react';
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
        {/* Botão principal com design sofisticado */}
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-16 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 relative overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-purple-500/50"
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Icon container */}
          <div className="relative z-10">
            <Bot className="h-7 w-7 text-white" />
          </div>
          
          {/* Animated sparkles */}
          <Sparkles className="absolute top-2 right-2 h-3 w-3 text-yellow-300 animate-pulse" />
          
          {/* Status indicator */}
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
            <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
          </span>
          
          {/* Tooltip elevado */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-purple-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-purple-400" />
              <p className="text-sm font-semibold text-white">TREVO AI Assistant</p>
            </div>
            <p className="text-xs text-gray-300">Seu guia inteligente de vendas</p>
            <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-purple-500/20" />
          </div>
        </Button>
        
        {/* Pulse ring effect */}
        <div className="absolute inset-0 rounded-2xl bg-purple-500/30 animate-ping opacity-20" />
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 w-[440px] transition-all duration-300 ${isMinimized ? 'h-[70px]' : 'h-[650px]'}`}
    >
      <Card className="flex flex-col h-full shadow-2xl border-2 border-purple-500/20 overflow-hidden backdrop-blur-sm bg-background/95">
        {/* Header sofisticado */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                TREVO
                <span className="h-2.5 w-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
              </h3>
              <p className="text-xs text-white/90 font-medium">Assistente Inteligente de Vendas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
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

              {/* Input Area sofisticado */}
              <div className="p-4 border-t bg-gradient-to-b from-background/80 to-background/50 backdrop-blur-sm">
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem... (Enter para enviar)"
                    className="min-h-[70px] max-h-[140px] resize-none border-purple-500/20 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="h-[70px] w-[70px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                  </Button>
                </div>
                
                {/* Sugestões rápidas sofisticadas */}
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
                        className="text-xs hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-200 hover:scale-105"
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
