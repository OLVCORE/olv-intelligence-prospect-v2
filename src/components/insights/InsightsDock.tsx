import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InsightsDockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightsDock({ open, onOpenChange }: InsightsDockProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('insights-chat', {
        body: { 
          message: userMessage,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response || "Desculpe, não consegui processar sua pergunta."
      }]);
    } catch (error) {
      console.error('Error calling insights chat:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua pergunta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[600px] md:w-[700px] lg:w-[800px] p-0 flex flex-col border-l-2"
      >
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5" />
              OLV Insight Dock
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-white/80 mt-1 text-left">
            Pergunte algo como: "Quais empresas têm maior FIT esta semana?"
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Faça uma pergunta sobre suas empresas, análises, métricas ou estratégias.
                </p>
                <div className="mt-6 space-y-2 text-left">
                  <p className="text-xs font-semibold text-foreground/70">Exemplos de perguntas:</p>
                  <div className="space-y-1 text-xs">
                    <p className="p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors">• Quais empresas têm maior potencial de venda?</p>
                    <p className="p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors">• Quais empresas precisam de consultoria urgente?</p>
                    <p className="p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors">• Mostre empresas com baixa maturidade digital</p>
                    <p className="p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors">• Quais decisores devo contatar esta semana?</p>
                  </div>
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : "bg-muted text-foreground border"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2 border">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm">Analisando dados...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta aqui..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 self-end"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
