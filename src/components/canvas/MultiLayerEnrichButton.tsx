import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useMultiLayerEnrichment, EnrichmentProgress } from '@/hooks/useMultiLayerEnrichment';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MultiLayerEnrichButtonProps {
  companyId: string;
  cnpj?: string;
  onComplete?: () => void;
}

export function MultiLayerEnrichButton({ companyId, cnpj, onComplete }: MultiLayerEnrichButtonProps) {
  const [open, setOpen] = useState(false);
  const [includePremium, setIncludePremium] = useState(false);
  const { isEnriching, progress, enrichCompany } = useMultiLayerEnrichment();

  const handleEnrich = async () => {
    if (!cnpj) {
      return;
    }

    const result = await enrichCompany(companyId, cnpj, includePremium);
    
    if (result.success) {
      setTimeout(() => {
        setOpen(false);
        onComplete?.();
      }, 2000);
    }
  };

  const getStatusIcon = (status: EnrichmentProgress['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const getLayerName = (layer: string) => {
    const names: Record<string, string> = {
      layer_1: 'Layer 1 - Base',
      layer_2: 'Layer 2 - Enriquecimento',
      layer_3: 'Layer 3 - Premium'
    };
    return names[layer] || layer;
  };

  const getSourceName = (source: string) => {
    const names: Record<string, string> = {
      empresaqui: 'EmpresaQui',
      apollo: 'Apollo.io',
      receitaws: 'ReceitaWS',
      econodata: 'Econodata'
    };
    return names[source] || source;
  };

  const overallProgress = progress.length > 0 
    ? (progress.filter(p => p.status === 'success').length / progress.length) * 100 
    : 0;

  // Agrupar por layer para mostrar progresso individual
  const layerProgress = {
    layer_1: progress.filter(p => p.layer === 'layer_1'),
    layer_2: progress.filter(p => p.layer === 'layer_2'),
    layer_3: progress.filter(p => p.layer === 'layer_3')
  };

  const getLayerProgress = (layer: 'layer_1' | 'layer_2' | 'layer_3') => {
    const items = layerProgress[layer];
    if (items.length === 0) return 0;
    return (items.filter(p => p.status === 'success').length / items.length) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
          disabled={!cnpj}
        >
          <Zap className="h-4 w-4 mr-2" />
          Enriquecimento 360°
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enriquecimento Multi-Layer 360°
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progresso Geral */}
          {progress.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          {/* Progresso por Layer */}
          {progress.length > 0 && (
            <div className="space-y-3">
              {['layer_1', 'layer_2', 'layer_3'].map((layer) => {
                const items = layerProgress[layer as keyof typeof layerProgress];
                if (items.length === 0) return null;
                
                const layerProg = getLayerProgress(layer as 'layer_1' | 'layer_2' | 'layer_3');
                
                return (
                  <div key={layer} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{getLayerName(layer)}</span>
                      <span className="text-muted-foreground">{Math.round(layerProg)}%</span>
                    </div>
                    <Progress value={layerProg} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Detalhamento por Fonte */}
          <div className="space-y-3">
            {progress.map((item, index) => (
              <Collapsible key={index}>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getSourceName(item.source)}</span>
                      <Badge variant="outline" className="text-xs">
                        {getLayerName(item.layer)}
                      </Badge>
                    </div>
                    {item.fields_enriched && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.fields_enriched} campos enriquecidos
                      </p>
                    )}
                    {item.error && (
                      <CollapsibleTrigger className="text-xs text-red-500 hover:underline">
                        Ver erro
                      </CollapsibleTrigger>
                    )}
                  </div>
                  {item.status === 'success' && item.fields_enriched && (
                    <Badge variant="default" className="bg-green-500/10 text-green-600">
                      +{item.fields_enriched}
                    </Badge>
                  )}
                </div>
                {item.error && (
                  <CollapsibleContent>
                    <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-600">
                      {item.error}
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ))}
          </div>

          {/* Controles */}
          {!isEnriching && progress.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="space-y-1">
                  <Label htmlFor="premium" className="font-medium">
                    Incluir Layer 3 (Econodata Premium)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Dados financeiros avançados • Limitado a 50/mês
                  </p>
                </div>
                <Switch
                  id="premium"
                  checked={includePremium}
                  onCheckedChange={setIncludePremium}
                />
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium text-sm mb-2">O que será enriquecido:</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• <strong>Layer 1:</strong> EmpresaQui (dados básicos ilimitados)</li>
                  <li>• <strong>Layer 2:</strong> Apollo.io (decisores) + ReceitaWS (gratuito)</li>
                  {includePremium && (
                    <li>• <strong>Layer 3:</strong> Econodata (50 campos premium/financeiros)</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Botão de Ação */}
          {!isEnriching && progress.length === 0 && (
            <Button 
              onClick={handleEnrich} 
              disabled={!cnpj || isEnriching}
              className="w-full"
              size="lg"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enriquecendo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Iniciar Enriquecimento
                </>
              )}
            </Button>
          )}

          {!cnpj && (
            <p className="text-sm text-muted-foreground text-center">
              CNPJ não disponível para esta empresa
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
