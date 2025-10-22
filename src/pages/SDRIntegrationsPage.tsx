import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, MessageSquare, Phone, Send, 
  Check, X, Loader2, RefreshCw, Settings, Zap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Integration {
  id: string;
  channel: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  health_status?: any;
  last_health_check?: string;
  config: any;
  credentials: any;
}

export default function SDRIntegrationsPage() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations((data || []) as Integration[]);
    } catch (error: any) {
      console.error('Error loading integrations:', error);
      toast({
        title: 'Erro ao carregar integrações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testIntegration = async (integration: Integration) => {
    setTestingIntegration(integration.id);
    try {
      const { data, error } = await supabase.functions.invoke('integration-health-check', {
        body: {
          channel: integration.channel,
          provider: integration.provider,
          config: integration.config,
          credentials: integration.credentials || {},
        },
      });

      if (error) throw error;

      // Update integration health status
      await supabase
        .from('integration_configs')
        .update({
          health_status: data.health,
          last_health_check: new Date().toISOString(),
          status: data.health.status === 'healthy' ? 'active' : 'error',
        })
        .eq('id', integration.id);

      await loadIntegrations();

      toast({
        title: 'Teste concluído',
        description: data.health.message,
        variant: data.health.status === 'healthy' ? 'default' : 'destructive',
      });
    } catch (error: any) {
      console.error('Error testing integration:', error);
      toast({
        title: 'Erro ao testar integração',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTestingIntegration(null);
    }
  };

  const syncEmails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('email-imap-sync');
      
      if (error) throw error;
      
      toast({
        title: 'Sincronização concluída',
        description: `${data.emailsProcessed || 0} emails processados`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-5 w-5" />;
      case 'whatsapp': return <MessageSquare className="h-5 w-5" />;
      case 'sms': return <Phone className="h-5 w-5" />;
      case 'telegram': return <Send className="h-5 w-5" />;
      case 'linkedin': return <Send className="h-5 w-5" />;
      case 'instagram': return <MessageSquare className="h-5 w-5" />;
      case 'x': return <Send className="h-5 w-5" />;
      case 'facebook': return <MessageSquare className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'error':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrações</h1>
            <p className="text-muted-foreground">Configure canais de comunicação</p>
          </div>
          <Button onClick={loadIntegrations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : integrations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Settings className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
                  <p className="text-muted-foreground mb-4">Adicione canais para começar</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={syncEmails}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar Emails
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Zap className="h-4 w-4 mr-2" />
                          Adicionar Integração
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Integração</DialogTitle>
                          <DialogDescription>
                            Configure um novo canal de comunicação
                          </DialogDescription>
                        </DialogHeader>
                        <IntegrationForm onSuccess={loadIntegrations} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getChannelIcon(integration.channel)}
                          <div>
                            <CardTitle className="capitalize">{integration.channel}</CardTitle>
                            <CardDescription className="capitalize">
                              {integration.provider}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {integration.health_status && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Status da Saúde</p>
                          <p className="text-xs text-muted-foreground">
                            {integration.health_status.message}
                          </p>
                          {integration.last_health_check && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Último teste: {new Date(integration.last_health_check).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => testIntegration(integration)}
                          disabled={testingIntegration === integration.id}
                        >
                          {testingIntegration === integration.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          Testar Conexão
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Configurar Integração</DialogTitle>
                            <DialogDescription>Edite ou substitua as credenciais desta integração</DialogDescription>
                          </DialogHeader>
                            <IntegrationForm 
                              integration={integration} 
                              onSuccess={loadIntegrations} 
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Add Buttons */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { channel: 'email', label: 'Email (IMAP/SMTP)', icon: Mail },
            { channel: 'whatsapp', label: 'WhatsApp (Meta)', icon: MessageSquare },
            { channel: 'sms', label: 'SMS', icon: Phone },
            { channel: 'telegram', label: 'Telegram', icon: Send },
            { channel: 'linkedin', label: 'LinkedIn', icon: Send },
            { channel: 'instagram', label: 'Instagram', icon: MessageSquare },
            { channel: 'x', label: 'X (Twitter)', icon: Send },
            { channel: 'facebook', label: 'Facebook', icon: MessageSquare },
          ].map((item) => (
            <Dialog key={item.channel}>
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <item.icon className="h-8 w-8 mb-2 text-primary" />
                    <p className="text-sm font-medium">{item.label}</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurar {item.label}</DialogTitle>
                  <DialogDescription>
                    Conecte seu canal {item.label}
                  </DialogDescription>
                </DialogHeader>
                <IntegrationForm 
                  defaultChannel={item.channel} 
                  onSuccess={loadIntegrations} 
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function IntegrationForm({ 
  integration, 
  defaultChannel,
  onSuccess 
}: { 
  integration?: Integration;
  defaultChannel?: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState(integration?.channel || defaultChannel || 'email');
  const [provider, setProvider] = useState(integration?.provider || 'imap_smtp');
  const [profile, setProfile] = useState<any>(null);
  const [useProfileData, setUseProfileData] = useState(true);
  const [resetCreds, setResetCreds] = useState(!!integration);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Ajusta o provedor padrão de acordo com o canal selecionado (evita salvar sem credenciais)
  useEffect(() => {
    if (!integration) {
      const map: Record<string, string> = {
        email: 'imap_smtp',
        whatsapp: 'meta_cloud',
        sms: 'twilio',
        telegram: 'bot',
        linkedin: 'api',
        instagram: 'graph_api',
        x: 'api',
        facebook: 'graph_api',
      };
      const expected = map[channel];
      if (expected && provider !== expected) setProvider(expected);
    }
  }, [channel, integration, provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const formData = new FormData(e.target as HTMLFormElement);
      const config: any = {};
      const newCredentials: any = {};

      // Coletar dados do formulário - salva em formato PLANO (sem aninhamento)
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('config.')) {
          config[key.replace('config.', '')] = value;
        } else if (key.startsWith('cred.')) {
          const path = key.replace('cred.', '');
          const val = String(value).trim();
          
          // Se estiver editando e o campo sensível vier vazio, preserva o valor atual
          const isSecret = path.includes('password') || path.includes('authToken') || path.includes('apiKey') || path.includes('apiSecret') || path.includes('accessToken');
          
          if (integration && !resetCreds && isSecret && !val) {
            // Mantém valor existente quando não estamos limpando credenciais
            const existing = integration.credentials?.[path];
            if (existing) {
              newCredentials[path] = existing;
            }
          } else if (val) {
            // Salva novo valor
            newCredentials[path] = val;
          }
        }
      }

      // Se estiver editando, decide entre mesclar ou substituir credenciais
      const mergedCredentials = integration 
        ? (resetCreds
            ? Object.fromEntries(Object.entries(newCredentials).filter(([, v]) => v !== '' && v !== undefined && v !== null))
            : { ...integration.credentials, ...newCredentials })
        : newCredentials;

      // Regras específicas para WhatsApp/Twilio
      if (channel === 'whatsapp' && provider === 'twilio') {
        const hasAuth = !!mergedCredentials.authToken;
        const hasApiKeys = !!mergedCredentials.apiKeySid && !!mergedCredentials.apiKeySecret;
        if (!hasAuth && !hasApiKeys) {
          throw new Error('Twilio: informe Auth Token ou API Key SID e Secret.');
        }
        if (mergedCredentials.phoneNumber) {
          const pn = String(mergedCredentials.phoneNumber).replace(/\s+/g, '');
          mergedCredentials.phoneNumber = pn.startsWith('+') ? pn : `+${pn}`;
        }
      }

      const data = {
        channel,
        provider,
        config,
        credentials: mergedCredentials,
        status: 'active',
        user_id: user.id,
      };

      console.log('Salvando integração:', { 
        channel, 
        provider, 
        credentialKeys: Object.keys(mergedCredentials),
        hasAccountSid: !!mergedCredentials.accountSid,
        hasAuthToken: !!mergedCredentials.authToken,
        hasApiKeys: !!(mergedCredentials.apiKeySid && mergedCredentials.apiKeySecret),
        resetCreds
      });

      // Validação extra para evitar salvar sem provedor correto
      if (channel === 'whatsapp' && !['meta_cloud', 'twilio'].includes(provider)) {
        throw new Error('Selecione um provedor válido para WhatsApp (Meta Cloud ou Twilio).');
      }

      if (integration) {
        const { error } = await supabase
          .from('integration_configs')
          .update(data)
          .eq('id', integration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integration_configs')
          .insert([data]);

        if (error) throw error;
      }

      toast({
        title: integration ? 'Integração atualizada' : 'Integração adicionada',
        description: 'As configurações foram salvas com sucesso',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving integration:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Profile Data Info */}
      {profile && useProfileData && (
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Usando dados do seu perfil</p>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setUseProfileData(false)}
            >
              Usar outros dados
            </Button>
          </div>
          {channel === 'email' && profile.email && (
            <p className="text-xs text-muted-foreground">Email: {profile.email}</p>
          )}
          {channel === 'whatsapp' && profile.whatsapp && (
            <p className="text-xs text-muted-foreground">WhatsApp: {profile.whatsapp}</p>
          )}
          {channel === 'telegram' && profile.telegram_username && (
            <p className="text-xs text-muted-foreground">Telegram: {profile.telegram_username}</p>
          )}
        </div>
      )}

      {!profile && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Configure seu perfil primeiro em{' '}
            <Link to="/settings" className="font-medium underline">Configurações</Link>
            {' '}para pré-preencher automaticamente seus dados.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="provider">Provedor</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger id="provider">
            <SelectValue placeholder="Selecione um provedor" />
          </SelectTrigger>
          <SelectContent>
            {channel === 'email' && <SelectItem value="imap_smtp">IMAP/SMTP</SelectItem>}
            {channel === 'whatsapp' && (
              <>
                <SelectItem value="meta_cloud">Meta Cloud API</SelectItem>
                <SelectItem value="twilio">Twilio WhatsApp</SelectItem>
              </>
            )}
            {channel === 'sms' && <SelectItem value="twilio">Twilio</SelectItem>}
            {channel === 'telegram' && <SelectItem value="bot">Bot API</SelectItem>}
            {channel === 'linkedin' && <SelectItem value="api">LinkedIn API</SelectItem>}
            {channel === 'instagram' && <SelectItem value="graph_api">Instagram Graph API</SelectItem>}
            {channel === 'x' && <SelectItem value="api">X API v2</SelectItem>}
            {channel === 'facebook' && <SelectItem value="graph_api">Facebook Graph API</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {integration && (
        <div className="flex items-center space-x-2">
          <Checkbox id="reset-creds" checked={resetCreds} onCheckedChange={(v) => setResetCreds(Boolean(v))} />
          <Label htmlFor="reset-creds" className="text-sm">Limpar credenciais antigas antes de salvar</Label>
        </div>
      )}

      {channel === 'email' && provider === 'imap_smtp' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="imap-host">Servidor IMAP</Label>
            <Input id="imap-host" name="cred.imap.host" placeholder="imap.gmail.com" required={!integration} defaultValue={String((integration?.credentials?.['imap.host'] ?? integration?.credentials?.imap?.host) ?? '')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imap-port">Porta IMAP</Label>
              <Input id="imap-port" name="cred.imap.port" type="number" placeholder="993" required={!integration} defaultValue={String((integration?.credentials?.['imap.port'] ?? integration?.credentials?.imap?.port) ?? '')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imap-secure">SSL/TLS</Label>
              <Input id="imap-secure" name="config.imap.secure" defaultValue={String(integration?.config?.['imap.secure'] ?? 'true')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="imap-user">Email</Label>
            <Input 
              id="imap-user" 
              name="cred.imap.user" 
              type="email" 
              required={!integration}
              defaultValue={useProfileData && profile?.email ? profile.email : String((integration?.credentials?.['imap.user'] ?? integration?.credentials?.imap?.user) ?? '')} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imap-pass">Senha/App Password</Label>
            <Input id="imap-pass" name="cred.imap.password" type="password" required={!integration} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-host">Servidor SMTP</Label>
            <Input id="smtp-host" name="cred.smtp.host" placeholder="smtp.gmail.com" required={!integration} defaultValue={String((integration?.credentials?.['smtp.host'] ?? integration?.credentials?.smtp?.host) ?? '')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Porta SMTP</Label>
              <Input id="smtp-port" name="cred.smtp.port" type="number" placeholder="587" required={!integration} defaultValue={String((integration?.credentials?.['smtp.port'] ?? integration?.credentials?.smtp?.port) ?? '')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-secure">SSL/TLS</Label>
              <Input id="smtp-secure" name="config.smtp.secure" defaultValue={String(integration?.config?.['smtp.secure'] ?? 'true')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-user">Email SMTP</Label>
            <Input 
              id="smtp-user" 
              name="cred.smtp.user" 
              type="email" 
              required={!integration}
              defaultValue={useProfileData && profile?.email ? profile.email : String((integration?.credentials?.['smtp.user'] ?? integration?.credentials?.smtp?.user) ?? '')} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-pass">Senha SMTP</Label>
            <Input id="smtp-pass" name="cred.smtp.password" type="password" required={!integration} />
          </div>
        </>
      )}

      {channel === 'whatsapp' && provider === 'meta_cloud' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="meta-token">Access Token</Label>
            <Input id="meta-token" name="cred.accessToken" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-phone-id">Phone Number ID</Label>
            <Input id="meta-phone-id" name="cred.phoneNumberId" required defaultValue={String(integration?.credentials?.phoneNumberId ?? '')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-business-id">WhatsApp Business Account ID</Label>
            <Input id="meta-business-id" name="cred.businessAccountId" required defaultValue={String(integration?.credentials?.businessAccountId ?? '')} />
          </div>
        </>
      )}

      {channel === 'whatsapp' && provider === 'twilio' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="twilio-sid">Account SID</Label>
            <Input 
              id="twilio-sid" 
              name="cred.accountSid" 
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required 
              defaultValue={String(integration?.credentials?.accountSid ?? '')} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilio-token">Auth Token (opcional se usar API Key)</Label>
            <Input 
              id="twilio-token" 
              name="cred.authToken" 
              type="password" 
              placeholder={integration ? "Deixe vazio para manter o atual" : ""}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twilio-api-sid">API Key SID (opcional)</Label>
              <Input 
                id="twilio-api-sid" 
                name="cred.apiKeySid" 
                placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                defaultValue={String(integration?.credentials?.apiKeySid ?? '')} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilio-api-secret">API Key Secret (opcional)</Label>
              <Input 
                id="twilio-api-secret" 
                name="cred.apiKeySecret" 
                type="password" 
                placeholder={integration ? "Deixe vazio para manter o atual" : ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilio-region">Region (opcional, ex.: au1, ie1)</Label>
            <Input 
              id="twilio-region" 
              name="cred.region" 
              placeholder="deixe em branco se não souber"
              defaultValue={String(integration?.credentials?.region ?? '')} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilio-phone">WhatsApp Number</Label>
            <Input 
              id="twilio-phone" 
              name="cred.phoneNumber" 
              placeholder="+5511999999999" 
              required 
              defaultValue={useProfileData && profile?.whatsapp ? profile.whatsapp : String(integration?.credentials?.phoneNumber ?? '')} 
            />
          </div>
        </>
      )}

      {channel === 'linkedin' && provider === 'api' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="linkedin-token">Access Token</Label>
            <Input id="linkedin-token" name="cred.accessToken" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin-org">Organization ID</Label>
            <Input id="linkedin-org" name="cred.organizationId" defaultValue={String(integration?.credentials?.organizationId ?? '')} />
          </div>
        </>
      )}

      {channel === 'instagram' && provider === 'graph_api' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ig-token">Access Token</Label>
            <Input id="ig-token" name="cred.accessToken" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ig-account">Instagram Account ID</Label>
            <Input id="ig-account" name="cred.instagramAccountId" required defaultValue={String(integration?.credentials?.instagramAccountId ?? '')} />
          </div>
        </>
      )}

      {channel === 'x' && provider === 'api' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="x-api-key">API Key</Label>
            <Input id="x-api-key" name="cred.apiKey" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="x-api-secret">API Secret</Label>
            <Input id="x-api-secret" name="cred.apiSecret" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="x-access-token">Access Token</Label>
            <Input id="x-access-token" name="cred.accessToken" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="x-access-secret">Access Token Secret</Label>
            <Input id="x-access-secret" name="cred.accessTokenSecret" type="password" required />
          </div>
        </>
      )}

      {channel === 'facebook' && provider === 'graph_api' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="fb-token">Access Token</Label>
            <Input id="fb-token" name="cred.accessToken" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-page">Page ID</Label>
            <Input id="fb-page" name="cred.pageId" required defaultValue={String(integration?.credentials?.pageId ?? '')} />
          </div>
        </>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {integration ? 'Atualizar' : 'Adicionar'} Integração
      </Button>
    </form>
  );
}
