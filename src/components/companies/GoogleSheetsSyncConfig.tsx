import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Clock, Link as LinkIcon, RefreshCw, Info, Code } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GoogleSheetsSyncConfig() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("60");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('google_sheets_sync_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar config:', error);
        return;
      }

      if (data) {
        setConfig(data);
        setSheetUrl(data.sheet_url);
        setSyncFrequency(String(data.sync_frequency_minutes));
        setIsActive(data.is_active);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleSave = async () => {
    if (!sheetUrl.trim()) {
      toast.error("Insira a URL do Google Sheets");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const configData = {
        user_id: user.id,
        sheet_url: sheetUrl,
        sync_frequency_minutes: parseInt(syncFrequency),
        is_active: isActive,
      };

      if (config) {
        // Atualizar existente
        const { error } = await supabase
          .from('google_sheets_sync_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
        toast.success("Configuração atualizada!");
      } else {
        // Criar nova
        const { error } = await supabase
          .from('google_sheets_sync_config')
          .insert(configData);

        if (error) throw error;
        toast.success("Sincronização automática configurada!");
      }

      await loadConfig();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setLoading(false);
    }
  };

  const handleTestSync = async () => {
    setLoading(true);
    try {
      toast.info("Iniciando sincronização manual...");
      
      const { data, error } = await supabase.functions.invoke('google-sheets-auto-sync');

      if (error) throw error;

      toast.success("Sincronização concluída!", {
        description: `${data.results?.[0]?.success || 0} empresas importadas`
      });

      await loadConfig();
    } catch (error) {
      console.error('Erro ao testar sincronização:', error);
      toast.error("Erro ao testar sincronização");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Sincronização Automática Google Sheets
            </CardTitle>
            <CardDescription>
              Configure uma planilha do Google Sheets para importar leads automaticamente em intervalos programados
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Code className="h-4 w-4" />
                Instruções Cron Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Configurar Cron Job no Supabase
                </DialogTitle>
                <DialogDescription>
                  Siga estes passos para ativar a sincronização automática periódica
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Requer Acesso Admin</AlertTitle>
                  <AlertDescription>
                    Esta configuração requer acesso de administrador ao painel do Supabase
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Passo 1: Acesse o Supabase Dashboard</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Abra o painel do Supabase em <a href="https://supabase.com/dashboard" target="_blank" rel="noopener" className="text-primary underline">supabase.com/dashboard</a></li>
                    <li>Selecione seu projeto</li>
                    <li>No menu lateral, clique em "SQL Editor"</li>
                  </ol>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Passo 2: Execute o SQL abaixo</h3>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs font-mono">
{`-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para sincronização a cada 15 minutos
SELECT cron.schedule(
  'google-sheets-auto-sync',
  '*/15 * * * *', -- A cada 15 minutos
  $$
  SELECT
    net.http_post(
      url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/google-sheets-auto-sync',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);`}
                    </pre>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Passo 3: Ajustar Frequência (opcional)</h3>
                  <p className="text-sm text-muted-foreground">
                    Modifique o padrão cron na linha 2 do comando acima:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-4">
                    <li><code className="bg-muted px-1 rounded">*/15 * * * *</code> - A cada 15 minutos</li>
                    <li><code className="bg-muted px-1 rounded">*/30 * * * *</code> - A cada 30 minutos</li>
                    <li><code className="bg-muted px-1 rounded">0 * * * *</code> - A cada hora</li>
                    <li><code className="bg-muted px-1 rounded">0 */2 * * *</code> - A cada 2 horas</li>
                    <li><code className="bg-muted px-1 rounded">0 0 * * *</code> - Uma vez por dia (00:00)</li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Verificar Cron Jobs Ativos</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <code className="text-xs">SELECT * FROM cron.job;</code>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Remover Cron Job</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <code className="text-xs">SELECT cron.unschedule('google-sheets-auto-sync');</code>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <p className="font-medium mb-2">Como configurar:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Abra sua planilha no Google Sheets</li>
              <li>Clique em "Compartilhar" → "Qualquer pessoa com o link"</li>
              <li>Cole o link abaixo e escolha a frequência</li>
              <li>O sistema verificará automaticamente nos horários programados</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-url">URL do Google Sheets</Label>
            <Input
              id="sheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência de Sincronização</Label>
            <Select value={syncFrequency} onValueChange={setSyncFrequency} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">A cada 15 minutos</SelectItem>
                <SelectItem value="30">A cada 30 minutos</SelectItem>
                <SelectItem value="60">A cada 1 hora</SelectItem>
                <SelectItem value="120">A cada 2 horas</SelectItem>
                <SelectItem value="240">A cada 4 horas</SelectItem>
                <SelectItem value="480">A cada 8 horas</SelectItem>
                <SelectItem value="720">A cada 12 horas</SelectItem>
                <SelectItem value="1440">Uma vez por dia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Sincronização Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative a sincronização automática
              </p>
            </div>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={loading}
            />
          </div>

          {config?.last_sync_at && (
            <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Última sincronização: {format(new Date(config.last_sync_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={loading || !sheetUrl.trim()}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Salvar Configuração'
            )}
          </Button>

          {config && (
            <Button
              variant="default"
              onClick={handleTestSync}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sincronizar Agora
                </>
              )}
            </Button>
          )}
        </div>

        <Alert className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Como funciona:</strong> Adicione ou atualize dados na planilha do Google Sheets a qualquer momento. 
            O sistema irá sincronizar automaticamente nos períodos configurados OU você pode clicar em 
            "Sincronizar Agora" para forçar uma atualização imediata.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
