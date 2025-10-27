import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCompetitorSearch, DetectedCompetitor } from "@/hooks/useCompetitorSearch";
import { Search, TrendingUp, DollarSign, Target } from "lucide-react";
import { useState } from "react";

interface AutoSearchCompetitorsProps {
  companyId: string;
  companyName: string;
  sector?: string;
  employees?: number;
}

export function AutoSearchCompetitors({
  companyId,
  companyName,
  sector,
  employees,
}: AutoSearchCompetitorsProps) {
  const searchMutation = useCompetitorSearch();
  const [competitors, setCompetitors] = useState<DetectedCompetitor[]>([]);

  const handleSearch = async () => {
    const result = await searchMutation.mutateAsync({
      companyId,
      companyName,
      sector,
      employees,
    });
    setCompetitors(result.competitors);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'erp': return '🏢';
      case 'crm': return '👥';
      case 'financial': return '💰';
      case 'ecommerce': return '🛒';
      default: return '📦';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'erp': return 'ERP';
      case 'crm': return 'CRM';
      case 'financial': return 'Financeiro';
      case 'ecommerce': return 'E-commerce';
      default: return 'Outro';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Busca Inteligente de Concorrentes SMB/PME
        </CardTitle>
        <CardDescription>
          Descubra os concorrentes reais mais prováveis para esta empresa baseado em portais de comparação e análise de IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSearch}
          disabled={searchMutation.isPending}
          className="w-full"
        >
          <Search className="mr-2 h-4 w-4" />
          {searchMutation.isPending ? 'Buscando...' : 'Buscar Concorrentes na Web'}
        </Button>

        {competitors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top {competitors.length} Concorrentes Detectados
            </h3>
            
            {competitors.map((competitor, idx) => (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(competitor.type)}</span>
                      <div>
                        <h4 className="font-semibold">{competitor.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(competitor.type)}
                        </Badge>
                      </div>
                    </div>
                    {competitor.relevance_score && (
                      <Badge variant="outline" className="ml-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {competitor.relevance_score}% relevância
                      </Badge>
                    )}
                  </div>

                  {competitor.reasoning && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {competitor.reasoning}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {competitor.priceRange && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{competitor.priceRange}</span>
                      </div>
                    )}
                    {competitor.targetMarket && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{competitor.targetMarket}</span>
                      </div>
                    )}
                  </div>

                  {competitor.key_differentiators && competitor.key_differentiators.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Diferenciais TOTVS:</p>
                      <ul className="text-xs space-y-1">
                        {competitor.key_differentiators.map((diff, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-primary">✓</span>
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {competitor.typical_objections && competitor.typical_objections.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Objeções Típicas:</p>
                      <ul className="text-xs space-y-1">
                        {competitor.typical_objections.map((obj, i) => (
                          <li key={i} className="text-muted-foreground">• {obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
