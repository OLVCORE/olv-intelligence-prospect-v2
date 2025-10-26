import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, RefreshCw, Loader2, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { useMonitoredCompanies, useTriggerManualCheck } from "@/hooks/useCompanyMonitoring";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MonitoringDashboard() {
  const { data: monitored = [], isLoading } = useMonitoredCompanies();
  const { mutate: triggerCheck, isPending } = useTriggerManualCheck();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Motor de Monitoramento Automático
            </CardTitle>
            <CardDescription>
              Sistema roda automaticamente às 2h da manhã todos os dias
            </CardDescription>
          </div>
          <Button
            onClick={() => triggerCheck()}
            disabled={isPending}
            size="sm"
            variant="outline"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Agora
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            <p className="font-semibold mb-2">Como funciona o monitoramento automático:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Sistema verifica cada empresa marcada para monitorar</li>
              <li>Busca novos sinais de TOTVS e Intent em tempo real via APIs</li>
              <li>Compara com scores anteriores para detectar mudanças</li>
              <li>Gera notificações automáticas quando detectar:
                <ul className="ml-6 mt-1 list-disc list-inside">
                  <li>🔥 HOT LEAD (Intent Score ≥ 70)</li>
                  <li>⛔ TOTVS detectado (Score ≥ 70)</li>
                  <li>📊 Mudanças significativas nos scores</li>
                </ul>
              </li>
              <li>Notificações aparecem no sino 🔔 no canto superior direito</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Empresas Monitoradas</span>
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold">{monitored.length}</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Próxima Verificação</span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-lg font-semibold">Amanhã às 2h</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Frequência</span>
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <p className="text-lg font-semibold">Diária (24h)</p>
          </div>
        </div>

        {/* Lista de empresas monitoradas */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Carregando empresas...</p>
          </div>
        ) : monitored.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">Nenhuma empresa monitorada</p>
            <p className="text-sm">
              Clique em "Monitorar Empresa" em qualquer lead para ativar o monitoramento automático
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold mb-3">Empresas Ativas ({monitored.length})</h4>
            {monitored.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.companies?.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {item.companies?.domain && (
                      <span className="text-xs text-muted-foreground">{item.companies.domain}</span>
                    )}
                    {item.last_totvs_check_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Última verificação:{" "}
                        {formatDistanceToNow(new Date(item.last_totvs_check_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.last_totvs_score !== null && (
                    <Badge variant={item.last_totvs_score >= 70 ? "destructive" : "outline"}>
                      TOTVS: {item.last_totvs_score}
                    </Badge>
                  )}
                  {item.last_intent_score !== null && (
                    <Badge variant={item.last_intent_score >= 70 ? "default" : "secondary"}>
                      Intent: {item.last_intent_score}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
