import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AISuggestedRepliesProps {
  conversationId: string;
  lastMessage?: string;
  companyContext?: {
    name?: string;
    industry?: string;
  };
  contactName?: string;
  onSelectReply: (reply: string) => void;
}

export function AISuggestedReplies({
  conversationId,
  lastMessage,
  companyContext,
  contactName,
  onSelectReply,
}: AISuggestedRepliesProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    if (!lastMessage) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-replies', {
        body: {
          lastMessage,
          companyName: companyContext?.name,
          contactName,
          conversationId,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setExpanded(true);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Erro ao gerar sugestões',
        description: 'Não foi possível gerar respostas sugeridas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate on mount if we have context
    if (lastMessage && !suggestions.length) {
      generateSuggestions();
    }
  }, [lastMessage]);

  if (!lastMessage) return null;

  return (
    <div className="space-y-2">
      {!expanded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Sugestões IA
        </Button>
      ) : (
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Respostas sugeridas por IA
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
              className="h-6 text-xs"
            >
              Ocultar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onSelectReply(suggestion);
                    setExpanded(false);
                  }}
                  className="w-full text-left justify-start h-auto whitespace-normal p-3"
                >
                  <span className="text-sm">{suggestion}</span>
                </Button>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={loading}
            className="w-full text-xs gap-2"
          >
            <Sparkles className="h-3 w-3" />
            Gerar novas sugestões
          </Button>
        </Card>
      )}
    </div>
  );
}
