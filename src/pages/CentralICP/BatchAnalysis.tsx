import { Zap, ArrowLeft, Upload, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function BatchAnalysis() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-purple-600" />
            Análise em Massa
          </h1>
          <p className="text-muted-foreground">
            Processe centenas de empresas automaticamente
          </p>
        </div>
      </div>

      {/* Alert de Status */}
      <Alert className="bg-yellow-500/10 border-yellow-500/20">
        <Zap className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <p className="font-semibold">🚧 Módulo em Desenvolvimento</p>
          <p className="text-sm mt-1">
            Este módulo está sendo construído para processar múltiplas empresas simultaneamente.
          </p>
        </AlertDescription>
      </Alert>

      {/* Preview: Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Empresas</CardTitle>
          <CardDescription>Importe um CSV com as empresas para análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4 opacity-50">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Arraste um arquivo CSV ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground">Formato: nome, cnpj, domínio, estado, nicho</p>
            </div>
            <Button disabled variant="outline">
              Selecionar Arquivo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview: Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Processamento</CardTitle>
          <CardDescription>Acompanhe o progresso da análise em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Empresas Processadas</span>
              <span className="font-medium">0 / 0</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-xs text-muted-foreground">Qualificadas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/10">
              <p className="text-2xl font-bold text-red-600">0</p>
              <p className="text-xs text-muted-foreground">Desqualificadas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-500/10">
              <p className="text-2xl font-bold text-yellow-600">0</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button disabled className="flex-1" variant="default">
              <Play className="mr-2 h-4 w-4" />
              Iniciar Processamento
            </Button>
            <Button disabled variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pausar
            </Button>
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
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div>
                <p className="font-medium">Processamento em Paralelo</p>
                <p className="text-sm text-muted-foreground">
                  Análise simultânea de múltiplas empresas com fila otimizada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div>
                <p className="font-medium">Detecção TOTVS + Sinais de Intenção</p>
                <p className="text-sm text-muted-foreground">
                  Execução automática de ambas as análises para cada empresa
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div>
                <p className="font-medium">Relatório Consolidado</p>
                <p className="text-sm text-muted-foreground">
                  Exportação de resultados em CSV com todas as métricas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div>
                <p className="font-medium">Controle de Processamento</p>
                <p className="text-sm text-muted-foreground">
                  Pausar, retomar e cancelar processamento a qualquer momento
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div>
                <p className="font-medium">Histórico de Batches</p>
                <p className="text-sm text-muted-foreground">
                  Visualize todos os processamentos anteriores e seus resultados
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
