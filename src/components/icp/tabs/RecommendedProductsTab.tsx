import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Sparkles, TrendingUp, CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useProductGaps } from '@/hooks/useProductGaps';

interface RecommendedProductsTabProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  stcResult?: any;
  similarCompanies?: any[];
}

export function RecommendedProductsTab({ 
  companyId,
  companyName, 
  cnpj,
  sector,
  cnae,
  size,
  employees,
  stcResult,
  similarCompanies
}: RecommendedProductsTabProps) {
  
  // Buscar produtos recomendados REAIS via Edge Function
  const { data: productGapsData, isLoading, error } = useProductGaps({
    companyId,
    companyName: companyName || '',
    cnpj,
    sector,
    cnae,
    size,
    employees,
    detectedProducts: stcResult?.detected_products || [],
    competitors: stcResult?.competitors || [],
    similarCompanies: similarCompanies || []
  });

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para recomendar produtos
        </p>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analisando produtos recomendados...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>Erro ao carregar recomendações de produtos</span>
        </div>
      </Card>
    );
  }

  const {
    strategy,
    recommended_products = [],
    total_estimated_value,
    stack_suggestion,
    insights = []
  } = productGapsData || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Produtos TOTVS Recomendados
              <Badge variant={strategy === 'cross-sell' ? 'secondary' : 'default'}>
                {strategy === 'cross-sell' ? 'Cross-Sell' : strategy === 'upsell' ? 'Up-Sell' : 'Nova Venda'}
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              {strategy === 'cross-sell' 
                ? 'Cliente TOTVS: Oportunidades de expansão' 
                : 'Prospect: Stack inicial recomendado'}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3" />
              IA
            </Badge>
            <div className="text-sm font-semibold">{total_estimated_value}</div>
          </div>
        </div>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="p-4 bg-muted/30">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights Estratégicos
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Lista de produtos recomendados */}
      <div className="space-y-4">
        {recommended_products.map((product, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold">{product.name}</h4>
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge 
                    variant={product.priority === 'high' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {product.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                      style={{ width: `${product.fit_score}%` }}
                    />
                  </div>
                  <Badge variant="default" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {product.fit_score}% fit
                  </Badge>
                </div>
              </div>
            </div>

            {/* Razão da recomendação */}
            <div className="mb-4">
              <span className="text-sm font-medium mb-2 block">Por que recomendamos:</span>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                {product.reason}
              </p>
            </div>

            {/* Benefícios */}
            <div className="mb-4">
              <span className="text-sm font-medium mb-2 block">Benefícios principais:</span>
              <ul className="space-y-1">
                {product.benefits.map((benefit: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Informações adicionais */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor estimado:</span>
                  <p className="font-semibold">{product.value}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ROI esperado:</span>
                  <p className="font-semibold">{product.roi_months} meses</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Timing:</span>
                  <p className="font-semibold capitalize">{product.timing.replace('_', ' ')}</p>
                </div>
                {product.competitor_displacement && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Substitui:</span>
                    <p className="font-semibold text-orange-600">{product.competitor_displacement}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t">
              <Button size="sm" className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                Adicionar à Proposta
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Ver Ficha Técnica
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Stack Sugerido */}
      {stack_suggestion && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            Stack TOTVS Sugerido
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Core (Essenciais) */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                Core (Essencial)
              </span>
              <div className="space-y-1">
                {stack_suggestion.core.map((product: string, idx: number) => (
                  <Badge key={idx} variant="default" className="mr-1 mb-1">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Complementares */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                Complementares
              </span>
              <div className="space-y-1">
                {stack_suggestion.complementary.map((product: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Expansão Futura */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                Expansão Futura
              </span>
              <div className="space-y-1">
                {stack_suggestion.future_expansion.map((product: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="mr-1 mb-1">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
