import { BarChart3, ArrowLeft, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResultsDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            Dashboard de Resultados
          </h1>
          <p className="text-muted-foreground">
            Visualize empresas qualificadas e desqualificadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button disabled variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alert de Status */}
      <Alert className="bg-yellow-500/10 border-yellow-500/20">
        <BarChart3 className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <p className="font-semibold">🚧 Módulo em Desenvolvimento</p>
          <p className="text-sm mt-1">
            Este dashboard consolidará todos os resultados de qualificação ICP.
          </p>
        </AlertDescription>
      </Alert>

      {/* Preview: Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Analisadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Todas as análises</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qualificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">0% do total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Desqualificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Já usam TOTVS</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hot Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Alto sinal de intenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Preview: Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Analisadas</CardTitle>
          <CardDescription>Lista completa com filtros avançados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>Nenhuma empresa analisada ainda</p>
            <p className="text-sm mt-2">
              Execute análises individuais ou em massa para popular este dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview: Features */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Planejadas</CardTitle>
          <CardDescription>O que este módulo oferecerá</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
              <div>
                <p className="font-medium">Visualização Consolidada</p>
                <p className="text-sm text-muted-foreground">
                  Todas as empresas analisadas em uma única visão
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
              <div>
                <p className="font-medium">Filtros Inteligentes</p>
                <p className="text-sm text-muted-foreground">
                  Filtre por qualificação, nicho, região, score TOTVS, score de intenção
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
              <div>
                <p className="font-medium">Exportação Customizada</p>
                <p className="text-sm text-muted-foreground">
                  Exporte para CSV/Excel com campos personalizados
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
              <div>
                <p className="font-medium">Análise de Tendências</p>
                <p className="text-sm text-muted-foreground">
                  Gráficos de evolução temporal de qualificações
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
              <div>
                <p className="font-medium">Ações em Massa</p>
                <p className="text-sm text-muted-foreground">
                  Atribua tags, altere status ou exporte grupos de empresas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
