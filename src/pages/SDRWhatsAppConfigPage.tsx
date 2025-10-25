import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, MessageSquare, Check, X, Loader2, 
  AlertCircle, ExternalLink, Copy, RefreshCw 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
type WhatsAppProvider = 'twilio' | 'meta360' | 'zenvia';

interface WhatsAppConfig {
  id?: string;
  provider: WhatsAppProvider;
  account_sid?: string;
  auth_token?: string;
  phone_number?: string;
  phone_number_id?: string;
  access_token?: string;
  api_key?: string;
  api_key_sid?: string;
  api_key_secret?: string;
  region?: string;
  status?: 'active' | 'inactive';
}

export default function SDRWhatsAppConfigPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [testing, setTesting] = useState(false);
const [useBackendSecrets, setUseBackendSecrets] = useState(false);
const [config, setConfig] = useState<WhatsAppConfig>({
  provider: 'twilio'
});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('sdr_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'whatsapp')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const credentials = (data.config as any) || {};
        setConfig({
          id: data.id,
          provider: (data.provider || 'twilio') as WhatsAppProvider,
          ...credentials,
          status: data.is_active ? 'active' : 'inactive'
        });
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
      toast({
        title: 'Erro ao carregar configuração',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const credentials: any = {};

// Organize credentials by provider (camelCase for edge function)
if (config.provider === 'twilio') {
  credentials.accountSid = config.account_sid;
  credentials.authToken = config.auth_token;
  credentials.phoneNumber = config.phone_number;
  if (config.api_key_sid) credentials.apiKeySid = config.api_key_sid;
  if (config.api_key_secret) credentials.apiKeySecret = config.api_key_secret;
  if (config.region) credentials.region = config.region;
} else if (config.provider === 'meta360') {
  credentials.phoneNumberId = config.phone_number_id;
  credentials.accessToken = config.access_token;
} else if (config.provider === 'zenvia') {
  credentials.apiKey = config.api_key;
}

      // Save to sdr_integrations
      const sdrConfigData: any = {
        user_id: user.id,
        integration_name: 'whatsapp',
        provider: config.provider,
        is_active: true,
        config: credentials,
        last_sync_at: new Date().toISOString()
      };

      if (config.id) {
        const { error } = await supabase
          .from('sdr_integrations')
          .update(sdrConfigData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('sdr_integrations')
          .insert(sdrConfigData)
          .select()
          .single();

        if (error) throw error;
        setConfig({ ...config, id: data.id, status: 'active' });
      }

      // Also save to integration_configs for unified display
      const integrationConfigData = {
        user_id: user.id,
        channel: 'whatsapp',
        provider: config.provider,
        config: {},
        credentials,
        status: 'active'
      };

      // Check if exists
      const { data: existingConfig } = await supabase
        .from('integration_configs')
        .select('id')
        .eq('user_id', user.id)
        .eq('channel', 'whatsapp')
        .eq('provider', config.provider)
        .maybeSingle();

      if (existingConfig) {
        await supabase
          .from('integration_configs')
          .update(integrationConfigData)
          .eq('id', existingConfig.id);
      } else {
        await supabase
          .from('integration_configs')
          .insert(integrationConfigData);
      }

      toast({
        title: 'Configuração salva',
        description: 'WhatsApp configurado com sucesso'
      });
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      toast({
        title: 'Teste em andamento',
        description: 'Verificando conexão com WhatsApp...'
      });

      // Prepare credentials in camelCase for edge function
      const credentials: any = {};
      if (config.provider === 'twilio') {
        credentials.accountSid = config.account_sid;
        credentials.authToken = config.auth_token;
        credentials.phoneNumber = config.phone_number;
      } else if (config.provider === 'meta360') {
        credentials.phoneNumberId = config.phone_number_id;
        credentials.accessToken = config.access_token;
      } else if (config.provider === 'zenvia') {
        credentials.apiKey = config.api_key;
      }

const { data, error } = await supabase.functions.invoke('integration-health-check', {
  body: {
    channel: 'whatsapp',
    provider: config.provider,
    config: {},
    credentials: useBackendSecrets ? {} : credentials
  }
});

      if (error) throw error;

      if (data?.health?.status === 'healthy') {
        toast({
          title: 'Conexão testada com sucesso!',
          description: data.health.message || 'WhatsApp configurado corretamente'
        });
      } else {
        throw new Error(data?.health?.message || 'Erro ao testar conexão');
      }
    } catch (error: any) {
      toast({
        title: 'Erro no teste',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/sdr-whatsapp-webhook`;
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'URL do webhook copiada!' });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center px-6 gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/sdr/integrations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <h1 className="text-lg font-semibold">Configuração WhatsApp</h1>
                <p className="text-xs text-muted-foreground">
                  Configure sua integração com WhatsApp
                </p>
              </div>
            </div>
            {config.status === 'active' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provedor WhatsApp</CardTitle>
                <CardDescription>
                  Escolha o provedor de API do WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Provedor</Label>
                    <Select 
                      value={config.provider}
                      onValueChange={(value: WhatsAppProvider) => setConfig({ ...config, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="meta360">Meta Cloud API (360dialog)</SelectItem>
                        <SelectItem value="zenvia">Zenvia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provider-specific Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credenciais</CardTitle>
                <CardDescription>
                  Insira as credenciais do provedor selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={config.provider} className="w-full">
                  
                  {/* Twilio */}
                  <TabsContent value="twilio" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="account_sid">Account SID</Label>
                      <Input
                        id="account_sid"
                        type="text"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={config.account_sid || ''}
                        onChange={(e) => setConfig({ ...config, account_sid: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="auth_token">Auth Token</Label>
                      <Input
                        id="auth_token"
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••"
                        value={config.auth_token || ''}
                        onChange={(e) => setConfig({ ...config, auth_token: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Número WhatsApp</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="+5511999999999"
                        value={config.phone_number || ''}
                        onChange={(e) => setConfig({ ...config, phone_number: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Formato: +[código país][número]
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="api_key_sid">API Key SID (opcional)</Label>
                      <Input
                        id="api_key_sid"
                        type="text"
                        placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={config.api_key_sid || ''}
                        onChange={(e) => setConfig({ ...config, api_key_sid: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="api_key_secret">API Key Secret (opcional)</Label>
                      <Input
                        id="api_key_secret"
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••"
                        value={config.api_key_secret || ''}
                        onChange={(e) => setConfig({ ...config, api_key_secret: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Região/Edge (opcional)</Label>
                      <Input
                        id="region"
                        type="text"
                        placeholder="us1, br1, ie1, sg1..."
                        value={config.region || ''}
                        onChange={(e) => setConfig({ ...config, region: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">Usar secrets do backend</p>
                        <p className="text-xs text-muted-foreground">Testar usando TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN salvos no backend</p>
                      </div>
                      <Switch checked={useBackendSecrets} onCheckedChange={setUseBackendSecrets} />
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Onde encontrar:</strong> Console Twilio → WhatsApp Business / Senders
                        <a 
                          href="https://console.twilio.com/us1/develop/sms/whatsapp/senders" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-primary underline inline-flex items-center gap-1"
                        >
                          Abrir Console
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  {/* Meta Cloud API */}
                  <TabsContent value="meta360" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="phone_number_id">Phone Number ID</Label>
                      <Input
                        id="phone_number_id"
                        type="text"
                        placeholder="123456789012345"
                        value={config.phone_number_id || ''}
                        onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="access_token">Access Token</Label>
                      <Input
                        id="access_token"
                        type="password"
                        placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={config.access_token || ''}
                        onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                      />
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Onde encontrar:</strong> Meta Business Manager → WhatsApp API
                        <a 
                          href="https://business.facebook.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-primary underline inline-flex items-center gap-1"
                        >
                          Abrir Business Manager
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  {/* Zenvia */}
                  <TabsContent value="zenvia" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="api_key">API Key</Label>
                      <Input
                        id="api_key"
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••"
                        value={config.api_key || ''}
                        onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                      />
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Onde encontrar:</strong> Dashboard Zenvia → API → Credenciais
                        <a 
                          href="https://app.zenvia.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-primary underline inline-flex items-center gap-1"
                        >
                          Abrir Dashboard
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Webhook Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Webhook URL</CardTitle>
                <CardDescription>
                  Configure esta URL no seu provedor para receber mensagens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value="https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/sdr-whatsapp-webhook"
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs space-y-2">
                      <p><strong>Como configurar:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Twilio:</strong> Console → WhatsApp → Sandbox/Sender → Configure Webhook → "When a message comes in"</li>
                        <li><strong>Meta/360:</strong> Business Manager → WhatsApp → Webhooks → Subscribe to messages</li>
                        <li><strong>Zenvia:</strong> Dashboard → Webhooks → Adicionar → URL acima</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testing || saving}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
              <Button onClick={saveConfig} disabled={saving || testing}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
