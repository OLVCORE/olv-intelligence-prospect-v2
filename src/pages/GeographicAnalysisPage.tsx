import CompaniesMap from "@/components/map/CompaniesMap";
import GeographicDistribution from "@/components/analytics/GeographicDistribution";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, TrendingUp } from "lucide-react";

export default function GeographicAnalysisPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Globe className="h-10 w-10" />
          Análise Geográfica
        </h1>
        <p className="text-muted-foreground">
          Visualização e análise da distribuição geográfica das empresas cadastradas
        </p>
      </div>

      {/* Mapa com todas as empresas */}
      <CompaniesMap height="600px" showStats />

      {/* Estatísticas e Gráficos */}
      <GeographicDistribution />

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights Geográficos
          </CardTitle>
          <CardDescription>
            Análise automática da distribuição territorial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border-l-4 border-primary bg-primary/5 rounded">
              <h4 className="font-semibold mb-2">🗺️ Geocodificação Automática</h4>
              <p className="text-sm text-muted-foreground">
                Todas as empresas com CEP ou endereço completo são automaticamente geocodificadas 
                e aparecem no mapa com pins precisos. Empresas sem endereço completo aparecem com 
                círculos indicando a área aproximada.
              </p>
            </div>

            <div className="p-4 border-l-4 border-chart-2 bg-chart-2/5 rounded">
              <h4 className="font-semibold mb-2">📊 Pipeline de Vendas</h4>
              <p className="text-sm text-muted-foreground">
                Use a distribuição geográfica para otimizar rotas de vendas, identificar regiões 
                com maior concentração de leads e planejar expansão territorial estratégica.
              </p>
            </div>

            <div className="p-4 border-l-4 border-chart-3 bg-chart-3/5 rounded">
              <h4 className="font-semibold mb-2">🎯 Segmentação Regional</h4>
              <p className="text-sm text-muted-foreground">
                Identifique padrões regionais de mercado, adapte abordagens comerciais por região 
                e aloque recursos de forma eficiente baseado na concentração geográfica.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
