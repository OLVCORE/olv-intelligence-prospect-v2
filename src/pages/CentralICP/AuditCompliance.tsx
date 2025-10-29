import { Shield, ArrowLeft, Download, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

export default function AuditCompliance() {
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
            <Shield className="h-8 w-8 text-red-600" />
            Auditoria e Compliance
          </h1>
          <p className="text-muted-foreground">
            Logs de validação e checkpoints de qualidade
          </p>
        </div>
        <Button disabled variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar Logs
        </Button>
      </div>

      {/* Alert de Status */}
      <Alert className="bg-gray-500/10 border-gray-500/20">
        <Shield className="h-4 w-4 text-gray-600" />
        <AlertDescription>
          <p className="font-semibold">📋 Módulo Planejado</p>
          <p className="text-sm mt-1">
            Este módulo garantirá rastreabilidade completa de todas as análises realizadas.
          </p>
        </AlertDescription>
      </Alert>

      {/* Preview: Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Logs</CardTitle>
          <CardDescription>Pesquise por empresa, data ou tipo de análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por empresa, CNPJ ou domínio..." 
              className="flex-1"
              disabled
            />
            <Button disabled>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview: Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Auditoria</CardTitle>
          <CardDescription>Registro cronológico de todas as operações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>Nenhum log de auditoria disponível</p>
            <p className="text-sm mt-2">
              Os logs aparecerão aqui quando análises forem executadas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview: Compliance Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Checkpoints de Qualidade</CardTitle>
          <CardDescription>Validações automáticas de integridade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div>
                <p className="font-medium">✓ Validação de CNPJ</p>
                <p className="text-xs text-muted-foreground">Todos os CNPJs são validados via ReceitaWS</p>
              </div>
              <span className="text-green-600 font-semibold">100%</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div>
                <p className="font-medium">✓ Verificação de Domínio</p>
                <p className="text-xs text-muted-foreground">Domínios são verificados e acessíveis</p>
              </div>
              <span className="text-green-600 font-semibold">100%</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div>
                <p className="font-medium">✓ Enriquecimento de Dados</p>
                <p className="text-xs text-muted-foreground">Dados enriquecidos via Apollo e LinkedIn</p>
              </div>
              <span className="text-green-600 font-semibold">Ativo</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div>
                <p className="font-medium">⚠ Rate Limiting</p>
                <p className="text-xs text-muted-foreground">Controle de taxa de requisições para APIs externas</p>
              </div>
              <span className="text-yellow-600 font-semibold">Monitorando</span>
            </div>
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
              <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
              <div>
                <p className="font-medium">Rastreabilidade Completa</p>
                <p className="text-sm text-muted-foreground">
                  Cada análise registrada com timestamp, usuário e parâmetros utilizados
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
              <div>
                <p className="font-medium">Validação de Dados de Entrada</p>
                <p className="text-sm text-muted-foreground">
                  Verificação de integridade de CNPJs, domínios e dados enriquecidos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
              <div>
                <p className="font-medium">Alertas de Anomalias</p>
                <p className="text-sm text-muted-foreground">
                  Detecção automática de padrões estranhos ou inconsistências
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
              <div>
                <p className="font-medium">Exportação de Logs</p>
                <p className="text-sm text-muted-foreground">
                  Exporte logs para análise externa ou conformidade regulatória
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
              <div>
                <p className="font-medium">Relatórios de Compliance</p>
                <p className="text-sm text-muted-foreground">
                  Relatórios automáticos de conformidade LGPD e boas práticas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
