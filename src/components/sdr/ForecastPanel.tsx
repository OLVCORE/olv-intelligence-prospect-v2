import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

export function ForecastPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const generateForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-forecast-pipeline');

      if (error) {
        if (error.message?.includes('429')) {
          toast({
            title: '⚠️ Rate limit atingido',
            description: 'Aguarde alguns instantes e tente novamente.',
            variant: 'destructive'
          });
          return;
        }
        if (error.message?.includes('402')) {
          toast({
            title: '💳 Créditos insuficientes',
            description: 'Adicione créditos no seu workspace Lovable AI.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      setForecast(data.forecast);
      setMetadata(data.metadata);
      toast({ title: '✅ Forecast gerado com sucesso!' });
    } catch (error: any) {
      console.error('Error generating forecast:', error);
      toast({
        title: 'Erro ao gerar forecast',
        description: error.message || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Forecast Inteligente
          </h2>
          <p className="text-sm text-muted-foreground">
            Previsão de pipeline com IA - próximos 30, 60 e 90 dias
          </p>
        </div>
        <Button 
          onClick={generateForecast} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Previsão
            </>
          )}
        </Button>
      </div>

      {/* Metadata Cards */}
      {metadata && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Pipeline</p>
            </div>
            <p className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(metadata.pipelineValue)}
            </p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Deals Ativos</p>
            </div>
            <p className="text-lg font-bold">{metadata.openDeals}</p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <p className="text-lg font-bold">{metadata.winRate.toFixed(1)}%</p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
            </div>
            <p className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(metadata.avgDealSize)}
            </p>
          </Card>
        </div>
      )}

      {/* Forecast Content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-lg font-medium">Analisando pipeline com IA...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processando {metadata?.openDeals || '...'} deals ativos
              </p>
            </div>
          </div>
        ) : forecast ? (
          <Card className="p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{forecast}</ReactMarkdown>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-600 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Forecast com Lovable AI</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Gere uma previsão inteligente de fechamento baseada em dados históricos, 
              probabilidades e tendências do seu pipeline atual.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <Badge variant="outline">Previsão 30/60/90 dias</Badge>
              <Badge variant="outline">Top deals prioritários</Badge>
              <Badge variant="outline">Análise de riscos</Badge>
              <Badge variant="outline">Ações recomendadas</Badge>
            </div>
            <Button onClick={generateForecast} size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Gerar Primeira Previsão
            </Button>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}
