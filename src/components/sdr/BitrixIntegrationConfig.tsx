import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, 
  ArrowLeftRight, ArrowRight, ArrowLeft, Settings2,
  Database, Calendar, TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BitrixConfig {
  id?: string;
  webhook_url: string;
  domain: string;
  sync_direction: 'olv_to_bitrix' | 'bitrix_to_olv' | 'bidirectional';
  auto_sync: boolean;
  sync_interval_minutes: number;
  field_mapping: Record<string, string>;
  last_sync: string | null;
  status: 'active' | 'inactive' | 'error';
}

export function BitrixIntegrationConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<BitrixConfig>({
    webhook_url: '',
    domain: '',
    sync_direction: 'bidirectional',
    auto_sync: true,
    sync_interval_minutes: 15,
    field_mapping: {
      title: 'TITLE',
      value: 'OPPORTUNITY',
      stage: 'STAGE_ID',
      company: 'COMPANY_ID',
      contact: 'CONTACT_ID',
      probability: 'PROBABILITY',
      closeDate: 'CLOSEDATE',
    },
    last_sync: null,
    status: 'inactive'
  });

  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bitrix_sync_config' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const record = data as Record<string, any>;
        if ('id' in record) {
          setConfig({
            id: record.id,
            webhook_url: record.webhook_url,
            domain: record.domain || '',
            sync_direction: record.sync_direction,
            auto_sync: record.auto_sync,
            sync_interval_minutes: record.sync_interval_minutes,
            field_mapping: record.field_mapping || config.field_mapping,
            last_sync: record.last_sync,
            status: record.status
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
      toast({
        title: 'Erro ao carregar configuração',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const testConnection = async () => {
    if (!config.webhook_url) {
      toast({ title: 'Digite a URL do webhook', variant: 'destructive' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('bitrix-test-connection', {
        body: { webhook_url: config.webhook_url }
      });

      if (error) throw error;

      if (data.success) {
        setTestResult({ success: true, message: 'Conexão estabelecida com sucesso!' });
        toast({ title: '✅ Conexão testada com sucesso!' });
      } else {
        setTestResult({ success: false, message: data.message || 'Falha na conexão' });
        toast({ 
          title: 'Erro na conexão', 
          description: data.message,
          variant: 'destructive' 
        });
      }
    } catch (error: any) {
      console.error('Test connection error:', error);
      setTestResult({ success: false, message: error.message });
      toast({
        title: 'Erro ao testar conexão',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    if (!config.webhook_url) {
      toast({ title: 'Webhook URL é obrigatório', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const configData = {
        user_id: user.id,
        webhook_url: config.webhook_url,
        domain: config.domain,
        sync_direction: config.sync_direction,
        auto_sync: config.auto_sync,
        sync_interval_minutes: config.sync_interval_minutes,
        field_mapping: config.field_mapping,
        status: 'active'
      };

      if (config.id) {
        const { error } = await supabase
          .from('bitrix_sync_config' as any)
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('bitrix_sync_config' as any)
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const record = data as Record<string, any>;
          if ('id' in record) {
            setConfig(prev => ({ ...prev, id: record.id, status: 'active' }));
          }
        }
      }

      toast({ title: '✅ Configuração salva com sucesso!' });
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar configuração',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const syncNow = async () => {
    if (!config.id) {
      toast({ title: 'Salve a configuração primeiro', variant: 'destructive' });
      return;
    }

    setSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke('bitrix-sync-deals', {
        body: { config_id: config.id }
      });

      if (error) throw error;

      toast({ 
        title: '✅ Sincronização concluída!',
        description: `${data.synced || 0} deals sincronizados`
      });

      await loadConfig();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Integração Bitrix24</h2>
            <p className="text-sm text-muted-foreground">
              Sincronize seus deals automaticamente com o Bitrix24
            </p>
          </div>
          <Badge 
            variant={config.status === 'active' ? 'default' : 'secondary'}
            className="gap-1"
          >
            {config.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
            {config.status === 'inactive' && <XCircle className="h-3 w-3" />}
            {config.status === 'error' && <AlertTriangle className="h-3 w-3" />}
            {config.status === 'active' ? 'Ativo' : 
             config.status === 'error' ? 'Erro' : 'Inativo'}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Webhook Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook">Webhook URL do Bitrix24 *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="webhook"
                  placeholder="https://seudominio.bitrix24.com.br/rest/123/abc..."
                  value={config.webhook_url}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                />
                <Button 
                  onClick={testConnection} 
                  disabled={testing || !config.webhook_url}
                  variant="outline"
                >
                  {testing ? 'Testando...' : 'Testar'}
                </Button>
              </div>
              {testResult && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${
                  testResult.success ? 'text-green-600' : 'text-destructive'
                }`}>
                  {testResult.success ? 
                    <CheckCircle2 className="h-4 w-4" /> : 
                    <XCircle className="h-4 w-4" />
                  }
                  {testResult.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="domain">Domínio Bitrix24</Label>
              <Input
                id="domain"
                placeholder="seudominio.bitrix24.com.br"
                value={config.domain}
                onChange={(e) => setConfig(prev => ({ ...prev, domain: e.target.value }))}
                className="mt-2"
              />
            </div>
          </div>

          <Separator />

          {/* Sync Direction */}
          <div className="space-y-3">
            <Label>Direção da Sincronização</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={config.sync_direction === 'olv_to_bitrix' ? 'default' : 'outline'}
                onClick={() => setConfig(prev => ({ ...prev, sync_direction: 'olv_to_bitrix' }))}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <ArrowRight className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium">OLV → Bitrix</div>
                  <div className="text-xs opacity-70">Apenas enviar</div>
                </div>
              </Button>

              <Button
                variant={config.sync_direction === 'bitrix_to_olv' ? 'default' : 'outline'}
                onClick={() => setConfig(prev => ({ ...prev, sync_direction: 'bitrix_to_olv' }))}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <ArrowLeft className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium">Bitrix → OLV</div>
                  <div className="text-xs opacity-70">Apenas receber</div>
                </div>
              </Button>

              <Button
                variant={config.sync_direction === 'bidirectional' ? 'default' : 'outline'}
                onClick={() => setConfig(prev => ({ ...prev, sync_direction: 'bidirectional' }))}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <ArrowLeftRight className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium">Bidirecional</div>
                  <div className="text-xs opacity-70">Sincronizar tudo</div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Auto Sync Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sincronização Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Sincronizar automaticamente em intervalos regulares
                </p>
              </div>
              <Switch
                checked={config.auto_sync}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_sync: checked }))}
              />
            </div>

            {config.auto_sync && (
              <div>
                <Label>Intervalo de Sincronização (minutos)</Label>
                <Select
                  value={config.sync_interval_minutes.toString()}
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    sync_interval_minutes: parseInt(value) 
                  }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutos</SelectItem>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Last Sync Info */}
          {config.last_sync && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última Sincronização</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(config.last_sync).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={saveConfig} 
              disabled={saving || !config.webhook_url}
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>

            <Button 
              onClick={syncNow} 
              disabled={syncing || !config.id}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Field Mapping Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5" />
          <h3 className="font-semibold">Mapeamento de Campos</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure como os campos do OLV são mapeados para o Bitrix24
        </p>
        
        <div className="space-y-3">
          {Object.entries(config.field_mapping).map(([olvField, bitrixField]) => (
            <div key={olvField} className="grid grid-cols-2 gap-4 items-center">
              <div className="text-sm font-medium">{olvField}</div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Input 
                  value={bitrixField}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    field_mapping: {
                      ...prev.field_mapping,
                      [olvField]: e.target.value
                    }
                  }))}
                  placeholder="Campo Bitrix"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
