import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, Zap, Users, Database, Crown, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LayerStatus {
  name: string;
  icon: any;
  status: 'pending' | 'running' | 'success' | 'error';
  description: string;
  fieldsEnriched?: number;
  cost: string;
}

export function MultiLayerEnrichmentPanel({ companyId, cnpj }: { companyId: string; cnpj: string }) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [layers, setLayers] = useState<LayerStatus[]>([
    { name: 'EmpresaQui', icon: Database, status: 'pending', description: 'Dados cadastrais ilimitados', cost: 'Incluso' },
    { name: 'Apollo.io', icon: Users, status: 'pending', description: 'Decisores e contatos B2B', cost: 'Free' },
    { name: 'ReceitaWS', icon: Database, status: 'pending', description: 'Dados oficiais Receita Federal', cost: 'Free' },
    { name: 'Econodata', icon: Crown, status: 'pending', description: 'Análise premium completa', cost: '1/50 mensal' }
  ]);
  const [progress, setProgress] = useState(0);
  const [econodataUsage, setEconodataUsage] = useState({ current: 0, limit: 50 });

  const loadEconodataUsage = async () => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    
    const { count } = await supabase
      .from('enrichment_usage')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'econodata')
      .gte('created_at', startOfMonth);

    setEconodataUsage({ current: count || 0, limit: 50 });
  };

  const updateLayerStatus = (index: number, status: 'pending' | 'running' | 'success' | 'error', fieldsEnriched?: number) => {
    setLayers(prev => prev.map((layer, i) => 
      i === index ? { ...layer, status, fieldsEnriched } : layer
    ));
  };

  const enrichMultiLayer = async (forcePremium = false) => {
    setIsEnriching(true);
    setProgress(0);
    await loadEconodataUsage();

    try {
      // Reset status
      setLayers(prev => prev.map(l => ({ ...l, status: 'pending' as const })));

      const { data, error } = await supabase.functions.invoke('enrich-multi-layer', {
        body: { companyId, cnpj, force_premium: forcePremium }
      });

      if (error) throw error;

      // Processar resultados
      if (data?.results) {
        data.results.forEach((result: any) => {
          const layerIndex = layers.findIndex(l => 
            l.name.toLowerCase().includes(result.source.toLowerCase())
          );
          
          if (layerIndex !== -1) {
            updateLayerStatus(
              layerIndex, 
              result.success ? 'success' : 'error',
              result.fields_enriched
            );
          }
        });

        setProgress(100);
        toast.success(`✅ Enriquecimento concluído! ${data.total_fields_enriched} campos atualizados`);
      }
    } catch (error: any) {
      console.error('Erro no enriquecimento multi-layer:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Enriquecimento Multi-Camadas</CardTitle>
              <CardDescription>Sistema inteligente de priorização de fontes</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Crown className="h-3 w-3" />
            {econodataUsage.current}/{econodataUsage.limit} Premium
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        {isEnriching && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processando camadas...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Layers Status */}
        <div className="space-y-3">
          {layers.map((layer, index) => (
            <div key={layer.name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  layer.status === 'success' ? 'bg-green-500/10 text-green-500' :
                  layer.status === 'error' ? 'bg-red-500/10 text-red-500' :
                  layer.status === 'running' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                  'bg-muted'
                }`}>
                  <layer.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{layer.name}</span>
                    {layer.status === 'success' && layer.fieldsEnriched && (
                      <Badge variant="secondary" className="text-xs">
                        +{layer.fieldsEnriched} campos
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{layer.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{layer.cost}</Badge>
                {layer.status === 'success' && <span className="text-green-500 text-xl">✓</span>}
                {layer.status === 'error' && <span className="text-red-500 text-xl">✗</span>}
                {layer.status === 'running' && (
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => enrichMultiLayer(false)}
            disabled={isEnriching}
            className="flex-1 gap-2"
          >
            <Zap className="h-4 w-4" />
            Enriquecimento Padrão
          </Button>
          <Button
            onClick={() => enrichMultiLayer(true)}
            disabled={isEnriching || econodataUsage.current >= econodataUsage.limit}
            variant="outline"
            className="flex-1 gap-2 border-primary/50 hover:bg-primary/10"
          >
            <Crown className="h-4 w-4" />
            Incluir Premium
          </Button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-primary/10">
          <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Padrão:</strong> EmpresaQui + Apollo + ReceitaWS (ilimitado)</p>
            <p><strong>Premium:</strong> Adiciona Econodata com 80+ campos extras ({50 - econodataUsage.current} disponíveis este mês)</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Custo/Empresa</div>
            <div className="text-sm font-semibold text-green-500">~R$ 0,25</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Database className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Campos Base</div>
            <div className="text-sm font-semibold text-blue-500">40-50</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Crown className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Premium</div>
            <div className="text-sm font-semibold text-purple-500">80-120</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
