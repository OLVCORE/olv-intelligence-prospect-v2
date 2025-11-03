import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Sparkles, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

interface RecommendedProductsTabProps {
  companyName?: string;
  stcResult?: any;
}

export function RecommendedProductsTab({ companyName, stcResult }: RecommendedProductsTabProps) {
  // Produtos TOTVS recomendados baseado em análise
  const recommendedProducts = [
    {
      name: 'Protheus',
      category: 'ERP',
      score: 95,
      reasons: [
        'Empresa de médio porte com múltiplos processos',
        'Necessidade de integração de departamentos',
        'Gestão financeira e contábil complexa'
      ],
      features: ['Gestão Financeira', 'Controladoria', 'Supply Chain', 'Manufatura']
    },
    {
      name: 'Fluig',
      category: 'Plataforma Digital',
      score: 85,
      reasons: [
        'Necessidade de digitalização de processos',
        'Múltiplas aprovações e workflows',
        'Colaboração entre equipes'
      ],
      features: ['BPM', 'ECM', 'Portal', 'Social']
    },
    {
      name: 'RM',
      category: 'Gestão de RH',
      score: 78,
      reasons: [
        'Mais de 50 funcionários',
        'Necessidade de gestão de ponto',
        'Processos de RH complexos'
      ],
      features: ['Folha de Pagamento', 'Ponto Eletrônico', 'Recrutamento', 'Treinamento']
    }
  ];

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para recomendar produtos
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              Produtos TOTVS Recomendados
            </h3>
            <p className="text-sm text-muted-foreground">
              Baseado no perfil e necessidades identificadas
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            IA
          </Badge>
        </div>
      </Card>

      {/* Lista de produtos recomendados */}
      <div className="space-y-4">
        {recommendedProducts.map((product, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold">{product.name}</h4>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                      style={{ width: `${product.score}%` }}
                    />
                  </div>
                  <Badge variant="default" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {product.score}% fit
                  </Badge>
                </div>
              </div>
            </div>

            {/* Razões da recomendação */}
            <div className="mb-4">
              <span className="text-sm font-medium mb-2 block">Por que recomendamos:</span>
              <ul className="space-y-1">
                {product.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Features principais */}
            <div className="mb-4">
              <span className="text-sm font-medium mb-2 block">Módulos principais:</span>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t">
              <Button size="sm" className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Comparar Produtos
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Análise de Gap */}
      <Card className="p-6 bg-muted/30">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Análise de Gap (Produto vs. Necessidade)
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p>
              <strong>Protheus ERP</strong> cobre 95% das necessidades identificadas em gestão financeira e operacional
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p>
              <strong>Fluig</strong> resolve gargalos de processos manuais e aprovações demoradas
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p>
              <strong>RM</strong> otimiza gestão de pessoas e reduz custos trabalhistas
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
