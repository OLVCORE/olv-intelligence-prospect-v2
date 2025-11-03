import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface RecommendedProductsReportProps {
  data: any;
}

export default function RecommendedProductsReport({ data }: RecommendedProductsReportProps) {
  const products = data?.productGaps || [];
  const isClienteTOTVS = data?.status === 'cliente_totvs';
  
  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Nenhum Produto Recomendado</h3>
        <p className="text-muted-foreground">
          Não foi possível gerar recomendações de produtos baseadas nas evidências disponíveis.
        </p>
      </Card>
    );
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta Prioridade';
      case 'medium': return 'Média Prioridade';
      case 'low': return 'Baixa Prioridade';
      default: return priority;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {isClienteTOTVS ? 'Oportunidades de Cross-Selling' : 'Produtos Recomendados'}
            </h2>
            <p className="text-muted-foreground">
              {isClienteTOTVS 
                ? 'Produtos TOTVS que a empresa ainda não utiliza'
                : 'Stack inicial recomendado para prospecção'
              }
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{products.length}</div>
            <div className="text-sm text-muted-foreground">Produtos</div>
          </div>
        </div>
      </Card>
      
      {/* Lista de Produtos */}
      <div className="grid gap-4">
        {products.map((product: any, i: number) => (
          <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{product.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  {product.reason}
                </p>
              </div>
              <Badge className={getPriorityColor(product.priority)}>
                {getPriorityLabel(product.priority)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Valor Estimado</div>
                  <div className="font-semibold">{product.estimatedValue}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Timing</div>
                  <div className="font-semibold">{product.timing}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Posição</div>
                  <div className="font-semibold">#{i + 1} Recomendado</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Resumo de Oportunidade */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Potencial Total Estimado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">ARR Total</div>
            <div className="text-2xl font-bold text-green-600">
              R$ {calculateTotalARR(products)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Alta Prioridade</div>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p: any) => p.priority === 'high').length}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Timing Imediato</div>
            <div className="text-2xl font-bold text-blue-600">
              {products.filter((p: any) => p.timing?.toLowerCase().includes('imediato')).length}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function calculateTotalARR(products: any[]): string {
  // Extrair valores min e max de strings como "R$ 100K-500K ARR"
  let minTotal = 0;
  let maxTotal = 0;
  
  for (const product of products) {
    const value = product.estimatedValue || '';
    const matches = value.match(/(\d+)K-(\d+)K/);
    if (matches) {
      minTotal += parseInt(matches[1]);
      maxTotal += parseInt(matches[2]);
    }
  }
  
  if (minTotal === 0 && maxTotal === 0) return 'N/A';
  
  return `${minTotal}K-${maxTotal}K`;
}
