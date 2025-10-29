import { FileText, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function IndividualAnalysis() {
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
            <FileText className="h-8 w-8" />
            Análise Individual
          </h1>
          <p className="text-muted-foreground">
            Qualifique empresas uma por vez com análise detalhada
          </p>
        </div>
      </div>

      {/* Alert de Status */}
      <Alert className="bg-yellow-500/10 border-yellow-500/20">
        <FileText className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <p className="font-semibold">🚧 Módulo em Desenvolvimento</p>
          <p className="text-sm mt-1">
            Este módulo está sendo construído. Por enquanto, use a página de{" "}
            <button
              onClick={() => navigate('/competitive-intelligence')}
              className="text-primary underline hover:no-underline"
            >
              Qualificação ICP
            </button>
            {" "}para análise individual de empresas.
          </p>
        </AlertDescription>
      </Alert>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Planejadas</CardTitle>
          <CardDescription>O que este módulo oferecerá</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Análise Profunda Individual</p>
                <p className="text-sm text-muted-foreground">
                  Análise detalhada empresa por empresa com insights aprofundados
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Detecção TOTVS Avançada</p>
                <p className="text-sm text-muted-foreground">
                  Identificação de produtos TOTVS em uso com nível de confiança
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Sinais de Intenção de Compra</p>
                <p className="text-sm text-muted-foreground">
                  Análise de comportamento e indicadores de intenção de troca de ERP
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Recomendação de Qualificação</p>
                <p className="text-sm text-muted-foreground">
                  Decisão automatizada: Qualificado/Desqualificado com justificativa
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium">Histórico de Análises</p>
                <p className="text-sm text-muted-foreground">
                  Rastreamento de todas as análises realizadas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">
              Enquanto isso, experimente a Qualificação ICP
            </p>
            <Button onClick={() => navigate('/competitive-intelligence')} size="lg">
              Ir para Qualificação ICP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
