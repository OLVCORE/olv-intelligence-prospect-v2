import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
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
  Check, X, Loader2, RefreshCw, Settings, Zap,
  Copy, ExternalLink, AlertCircle, Building2, Users, Search
} from 'lucide-react';
import { PlatformLogo } from '@/components/inbox/PlatformLogo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: true },
    instructions: 'Use uma senha de app. Acesse: myaccount.google.com/apppasswords'
  },
  outlook: {
    name: 'Outlook / Hotmail',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: true },
    instructions: 'Use sua senha normal do Outlook'
  },
  yahoo: {
    name: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 587, secure: true },
    instructions: 'Gere uma senha de app em: account.yahoo.com/security'
  },
  icloud: {
    name: 'iCloud Mail',
    imap: { host: 'imap.mail.me.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.me.com', port: 587, secure: true },
    instructions: 'Use uma senha específica de app'
  },
  zoho: {
    name: 'Zoho Mail',
    imap: { host: 'imap.zoho.com', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com', port: 587, secure: true },
    instructions: 'Use sua senha normal do Zoho'
  },
  custom: {
    name: 'Outro (Customizado)',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 587, secure: true },
    instructions: 'Configure manualmente os servidores IMAP e SMTP'
  }
};

const ALL_INTEGRATIONS = [
  // Email
  { id: 'gmail', name: 'Gmail', category: 'email', provider: 'gmail', available: true },
  { id: 'outlook', name: 'Outlook', category: 'email', provider: 'outlook', available: true },
  { id: 'yahoo', name: 'Yahoo', category: 'email', provider: 'yahoo', available: true },
  { id: 'icloud', name: 'iCloud', category: 'email', provider: 'icloud', available: true },
  { id: 'zoho', name: 'Zoho', category: 'email', provider: 'zoho', available: true },
  { id: 'custom', name: 'Outro Email', category: 'email', provider: 'custom', available: true },
  
  // Social
  { id: 'whatsapp', name: 'WhatsApp', category: 'social', available: false },
  { id: 'telegram', name: 'Telegram', category: 'social', available: false },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', available: false },
  { id: 'instagram', name: 'Instagram', category: 'social', available: false },
  { id: 'facebook', name: 'Facebook', category: 'social', available: false },
  { id: 'twitter', name: 'Twitter/X', category: 'social', available: false },
  
  // CRM
  { id: 'kommo', name: 'Kommo', category: 'crm', provider: 'kommo', available: false },
  { id: 'bitrix24', name: 'Bitrix24', category: 'crm', provider: 'bitrix24', available: false },
  { id: 'hubspot', name: 'HubSpot', category: 'crm', provider: 'hubspot', available: false },
  { id: 'pipedrive', name: 'Pipedrive', category: 'crm', provider: 'pipedrive', available: false },
  { id: 'salesforce', name: 'Salesforce', category: 'crm', provider: 'salesforce', available: false },
  { id: 'zoho_crm', name: 'Zoho CRM', category: 'crm', provider: 'zoho_crm', available: false },
  { id: 'rd_station', name: 'RD Station', category: 'crm', provider: 'rd_station', available: false },
  { id: 'activecampaign', name: 'ActiveCampaign', category: 'crm', provider: 'activecampaign', available: false },
  { id: 'agendor', name: 'Agendor', category: 'crm', provider: 'agendor', available: false },
  
  // Communication
  { id: 'sms', name: 'SMS', category: 'communication', available: false },
  { id: 'voice', name: 'Telefone', category: 'communication', available: false },
  { id: 'slack', name: 'Slack', category: 'communication', available: false },
  { id: 'teams', name: 'Teams', category: 'communication', available: false },
  
  // Automation
  { id: 'zapier', name: 'Zapier', category: 'automation', provider: 'zapier', available: false },
  { id: 'make', name: 'Make', category: 'automation', provider: 'make', available: false },
  { id: 'n8n', name: 'n8n', category: 'automation', provider: 'n8n', available: false },
  
  // Support
  { id: 'intercom', name: 'Intercom', category: 'support', provider: 'intercom', available: false },
  { id: 'zendesk', name: 'Zendesk', category: 'support', provider: 'zendesk', available: false },
  { id: 'freshdesk', name: 'Freshdesk', category: 'support', provider: 'freshdesk', available: false },
  { id: 'drift', name: 'Drift', category: 'support', provider: 'drift', available: false },
];

function WebhookSetupInstructions() {
  const { toast } = useToast();
  const webhookUrl = "https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook";

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'URL copiada!' });
  };

  return (
    <div className="mt-4 p-3 border rounded-lg bg-muted/30 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-xs">Configuração do Webhook</h4>
          <p className="text-[11px] text-muted-foreground">
            Configure um forward no seu servidor de email para enviar emails para o webhook.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">URL do Webhook</Label>
        <div className="flex gap-2">
          <Input 
            readOnly 
            value={webhookUrl}
            className="text-[10px] font-mono h-8"
          />
          <Button type="button" variant="outline" size="sm" onClick={copyWebhookUrl} className="h-8">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SDRIntegrationsPage() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
      toast({
        title: 'Erro ao testar integração',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTestingIntegration(null);
    }
  };

  const filteredIntegrations = ALL_INTEGRATIONS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-6 gap-4">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Integrações</h1>
            </div>
            <Button onClick={loadIntegrations} variant="outline" size="sm">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="border-b bg-muted/20">
          <div className="px-6 py-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar integrações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="w-full justify-start h-9">
                <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
                <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
                <TabsTrigger value="crm" className="text-xs">CRM</TabsTrigger>
                <TabsTrigger value="communication" className="text-xs">Comunicação</TabsTrigger>
                <TabsTrigger value="automation" className="text-xs">Automação</TabsTrigger>
                <TabsTrigger value="support" className="text-xs">Suporte</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Active Integrations */}
            {integrations.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Configuradas ({integrations.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((integration) => (
                    <Card key={integration.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <PlatformLogo 
                              platform={integration.channel} 
                              provider={integration.provider}
                              size="sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate capitalize">{integration.provider}</p>
                                <p className="text-xs text-muted-foreground capitalize">{integration.channel}</p>
                              </div>
                              <Badge variant={integration.status === 'active' ? 'default' : 'destructive'} className="text-[10px] h-5">
                                {integration.status === 'active' ? 'Ativo' : 'Erro'}
                              </Badge>
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => testIntegration(integration)}
                                disabled={testingIntegration === integration.id}
                              >
                                {testingIntegration === integration.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Testar'
                                )}
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 px-2">
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Configurar Integração</DialogTitle>
                                  </DialogHeader>
                                  <IntegrationForm 
                                    integration={integration} 
                                    onSuccess={loadIntegrations} 
                                  />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Integrations */}
            <div>
              <h2 className="text-sm font-semibold mb-3">
                Disponíveis ({filteredIntegrations.length})
              </h2>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {filteredIntegrations.map((item) => (
                  <Dialog key={item.id}>
                    <DialogTrigger asChild>
                      <Card className={`group hover:shadow-sm transition-all ${item.available ? 'cursor-pointer hover:border-primary' : 'cursor-not-allowed opacity-50'}`}>
                        <CardContent className="p-3 flex flex-col items-center gap-2">
                          <PlatformLogo platform={item.category} provider={item.provider} size="md" />
                          <div className="text-center w-full">
                            <p className="text-xs font-medium truncate">{item.name}</p>
                            {!item.available && (
                              <Badge variant="secondary" className="text-[9px] h-4 mt-1">Breve</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    {item.available && (
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Configurar {item.name}</DialogTitle>
                          <DialogDescription>
                            Conecte sua conta {item.name}
                          </DialogDescription>
                        </DialogHeader>
                        <IntegrationForm 
                          defaultChannel={item.category}
                          defaultProvider={item.provider}
                          onSuccess={loadIntegrations} 
                        />
                      </DialogContent>
                    )}
                  </Dialog>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function IntegrationForm({ 
  integration, 
  defaultChannel,
  defaultProvider,
  onSuccess 
}: { 
  integration?: Integration;
  defaultChannel?: string;
  defaultProvider?: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [channel] = useState(integration?.channel || defaultChannel || 'email');
  const [provider] = useState(integration?.provider || defaultProvider || 'gmail');
  const [emailProvider, setEmailProvider] = useState<keyof typeof EMAIL_PROVIDERS>(
    (integration?.provider && integration.provider in EMAIL_PROVIDERS) ? integration.provider as keyof typeof EMAIL_PROVIDERS : 'gmail'
  );
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

      for (const [key, value] of formData.entries()) {
        if (key.startsWith('config.')) {
          config[key.replace('config.', '')] = value;
        } else if (key.startsWith('cred.')) {
          const path = key.replace('cred.', '');
          const val = String(value).trim();
          
          const isSecret = path.includes('password') || path.includes('authToken') || path.includes('apiKey');
          
          if (integration && !resetCreds && isSecret && !val) {
            const existing = integration.credentials?.[path];
            if (existing) {
              newCredentials[path] = existing;
            }
          } else if (val) {
            newCredentials[path] = val;
          }
        }
      }

      // Se for email, copiar senha IMAP para SMTP se SMTP não tiver senha
      if (channel === 'email') {
        if (newCredentials['imap.password'] && !newCredentials['smtp.password']) {
          newCredentials['smtp.password'] = newCredentials['imap.password'];
        }
        // Copiar usuário IMAP para SMTP se SMTP não tiver usuário
        if (newCredentials['imap.user'] && !newCredentials['smtp.user']) {
          newCredentials['smtp.user'] = newCredentials['imap.user'];
        }
      }

      const mergedCredentials = integration 
        ? (resetCreds ? newCredentials : { ...integration.credentials, ...newCredentials })
        : newCredentials;

      const data = {
        channel,
        provider: channel === 'email' ? emailProvider : provider,
        config,
        credentials: mergedCredentials,
        status: 'active',
        user_id: user.id,
      };

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

  const currentEmailProvider = EMAIL_PROVIDERS[emailProvider];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {profile && useProfileData && channel === 'email' && profile.email && (
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Usando dados do perfil</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setUseProfileData(false)}>
              Usar outros dados
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Email: {profile.email}</p>
        </div>
      )}

      {channel === 'email' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email-provider">Provedor de Email</Label>
            <Select value={emailProvider} onValueChange={(v) => setEmailProvider(v as keyof typeof EMAIL_PROVIDERS)}>
              <SelectTrigger id="email-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_PROVIDERS).map(([key, prov]) => (
                  <SelectItem key={key} value={key}>{prov.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentEmailProvider && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {currentEmailProvider.instructions}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {integration && (
            <div className="flex items-center space-x-2">
              <Checkbox id="reset-creds" checked={resetCreds} onCheckedChange={(v) => setResetCreds(Boolean(v))} />
              <Label htmlFor="reset-creds" className="text-sm">Substituir credenciais</Label>
            </div>
          )}

          {/* Configuração Automática Banner */}
          <Alert className="bg-primary/5 border-primary/20">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              <strong>Configuração automática ativa!</strong> Servidores, portas e SSL já estão configurados para {currentEmailProvider.name}.
            </AlertDescription>
          </Alert>

          {/* Campos Ocultos (Automáticos) */}
          <input type="hidden" name="cred.imap.host" value={currentEmailProvider?.imap.host || ''} />
          <input type="hidden" name="cred.imap.port" value={currentEmailProvider?.imap.port || 993} />
          <input type="hidden" name="config.imap.secure" value={String(currentEmailProvider?.imap.secure ?? true)} />
          <input type="hidden" name="cred.smtp.host" value={currentEmailProvider?.smtp.host || ''} />
          <input type="hidden" name="cred.smtp.port" value={currentEmailProvider?.smtp.port || 587} />
          <input type="hidden" name="config.smtp.secure" value={String(currentEmailProvider?.smtp.secure ?? true)} />

          {/* Campos que o Usuário Precisa Preencher */}
          <div className="space-y-3 p-4 border rounded-lg bg-background">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h3 className="font-semibold text-sm">Informações necessárias</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Seu Email {profile?.email && <span className="text-xs text-muted-foreground">(do perfil)</span>}
              </Label>
              <Input 
                id="email"
                name="cred.imap.user" 
                type="email" 
                required={!integration}
                defaultValue={useProfileData && profile?.email ? profile.email : String(integration?.credentials?.['imap.user'] ?? '')}
                className="h-10"
              />
              <input type="hidden" name="cred.smtp.user" defaultValue={useProfileData && profile?.email ? profile.email : String(integration?.credentials?.['smtp.user'] ?? '')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha de App / Senha da Conta
              </Label>
              <Input 
                id="password"
                name="cred.imap.password" 
                type="password" 
                required={!integration}
                placeholder={integration ? "Deixe vazio para manter a senha atual" : "Digite sua senha ou senha de app"}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                {emailProvider === 'gmail' && '💡 Para Gmail, use uma senha de app. '}
                {emailProvider === 'yahoo' && '💡 Para Yahoo, use uma senha de app. '}
                {emailProvider === 'outlook' && '💡 Para Outlook, use sua senha normal. '}
                A mesma senha será usada para IMAP e SMTP.
              </p>
            </div>
          </div>

          {/* Detalhes Técnicos (Opcional) */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-2">
              <span>Ver configurações técnicas</span>
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium">Servidor IMAP:</p>
                  <p className="text-muted-foreground">{currentEmailProvider.imap.host}:{currentEmailProvider.imap.port}</p>
                </div>
                <div>
                  <p className="font-medium">Servidor SMTP:</p>
                  <p className="text-muted-foreground">{currentEmailProvider.smtp.host}:{currentEmailProvider.smtp.port}</p>
                </div>
              </div>
              <div>
                <p className="font-medium">SSL/TLS:</p>
                <p className="text-muted-foreground">Habilitado para IMAP e SMTP</p>
              </div>
            </div>
          </details>

          <WebhookSetupInstructions />
        </>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            {integration ? 'Atualizar' : 'Conectar'}
          </>
        )}
      </Button>
    </form>
  );
}
