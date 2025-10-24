import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Clock, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Sincronização Automática Google Sheets
        </CardTitle>
        <CardDescription>
          Configure uma planilha do Google Sheets para importar leads automaticamente em intervalos programados
        </CardDescription>
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
              variant="outline"
              onClick={handleTestSync}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Testar Agora'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
