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
  Check, X, Loader2, RefreshCw, Settings, Zap,
  Copy, ExternalLink, AlertCircle, Building2, Users, BotIcon
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

// Configurações pré-definidas para provedores de email
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

// Categorias de integrações
const INTEGRATION_CATEGORIES = {
  email: {
    title: 'E-mail',
    icon: Mail,
    items: [
      { channel: 'email', provider: 'gmail', label: 'Gmail' },
      { channel: 'email', provider: 'outlook', label: 'Outlook' },
      { channel: 'email', provider: 'yahoo', label: 'Yahoo' },
      { channel: 'email', provider: 'icloud', label: 'iCloud' },
      { channel: 'email', provider: 'zoho', label: 'Zoho' },
      { channel: 'email', provider: 'custom', label: 'Outro Email' },
    ]
  },
  social: {
    title: 'Redes Sociais',
    icon: MessageSquare,
    items: [
      { channel: 'whatsapp', label: 'WhatsApp' },
      { channel: 'telegram', label: 'Telegram' },
      { channel: 'linkedin', label: 'LinkedIn' },
      { channel: 'instagram', label: 'Instagram' },
      { channel: 'facebook', label: 'Facebook' },
      { channel: 'twitter', label: 'Twitter/X' },
    ]
  },
  crm: {
    title: 'CRMs',
    icon: Building2,
    items: [
      { channel: 'crm', provider: 'kommo', label: 'Kommo' },
      { channel: 'crm', provider: 'bitrix24', label: 'Bitrix24' },
      { channel: 'crm', provider: 'hubspot', label: 'HubSpot' },
      { channel: 'crm', provider: 'pipedrive', label: 'Pipedrive' },
      { channel: 'crm', provider: 'salesforce', label: 'Salesforce' },
      { channel: 'crm', provider: 'zoho_crm', label: 'Zoho CRM' },
      { channel: 'crm', provider: 'rd_station', label: 'RD Station' },
      { channel: 'crm', provider: 'activecampaign', label: 'ActiveCampaign' },
      { channel: 'crm', provider: 'agendor', label: 'Agendor' },
    ]
  },
  communication: {
    title: 'Comunicação',
    icon: Phone,
    items: [
      { channel: 'sms', label: 'SMS (Twilio)' },
      { channel: 'voice', label: 'Telefone/VoIP' },
      { channel: 'slack', label: 'Slack' },
      { channel: 'teams', label: 'Microsoft Teams' },
    ]
  },
  automation: {
    title: 'Automação',
    icon: Zap,
    items: [
      { channel: 'automation', provider: 'zapier', label: 'Zapier' },
      { channel: 'automation', provider: 'make', label: 'Make (Integromat)' },
      { channel: 'automation', provider: 'n8n', label: 'n8n' },
    ]
  },
  support: {
    title: 'Atendimento',
    icon: Users,
    items: [
      { channel: 'support', provider: 'intercom', label: 'Intercom' },
      { channel: 'support', provider: 'zendesk', label: 'Zendesk' },
      { channel: 'support', provider: 'freshdesk', label: 'Freshdesk' },
      { channel: 'support', provider: 'drift', label: 'Drift' },
    ]
  }
};

function WebhookSetupInstructions() {
  const { toast } = useToast();
  const webhookUrl = "https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook";

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'URL copiada!' });
  };

  const copyScript = () => {
    const script = `#!/bin/bash
cat | curl -X POST \\
  -H "Content-Type: application/json" \\
  -d @- \\
  ${webhookUrl}`;
    navigator.clipboard.writeText(script);
    toast({ title: 'Script copiado!' });
  };

  const testWebhook = async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'teste@example.com',
          to: 'consultores@olvinternacional.com.br',
          subject: 'Teste de Webhook',
          body: 'Este é um email de teste do webhook',
          html: '<p>Este é um email de teste do webhook</p>',
          messageId: `test-${Date.now()}@example.com`,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: '✅ Webhook funcionando!',
          description: 'O webhook está recebendo emails corretamente.'
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro no teste',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mt-6 p-4 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <h4 className="font-semibold text-sm">⚙️ Configuração do Webhook de Emails</h4>
          <p className="text-xs text-muted-foreground">
            Para receber emails automaticamente na plataforma, você precisa configurar um <strong>forward/redirecionamento</strong> no seu servidor de email para enviar os emails recebidos para nosso webhook.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">URL do Webhook</Label>
        <div className="flex gap-2">
          <Input 
            readOnly 
            value={webhookUrl}
            className="text-xs font-mono"
          />
          <Button type="button" variant="outline" size="sm" onClick={copyWebhookUrl}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={testWebhook}>
        <Zap className="h-4 w-4 mr-2" />
        Testar Webhook Agora
      </Button>

      <div className="space-y-3 pt-3 border-t">
        <h5 className="font-semibold text-xs flex items-center gap-2">
          📋 Opção 1: Configurar no cPanel (Recomendado)
        </h5>
        <ol className="text-xs space-y-2 text-muted-foreground list-decimal list-inside">
          <li>Acesse o <strong>cPanel</strong> do seu servidor de email</li>
          <li>Vá em <strong>Email → Forwarders</strong> (ou "Redirecionadores")</li>
          <li>Clique em <strong>"Add Forwarder"</strong></li>
          <li>Configure:
            <ul className="ml-6 mt-1 space-y-1 list-disc">
              <li>Email de origem: <code className="bg-muted px-1 rounded">consultores@olvinternacional.com.br</code></li>
              <li>Destino: Selecione <strong>"Pipe to a Program"</strong></li>
            </ul>
          </li>
          <li>Cole o script abaixo no campo de comando</li>
        </ol>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Script para cPanel (copie e cole)</Label>
          <div className="relative">
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
{`#!/bin/bash
cat | curl -X POST \\
  -H "Content-Type: application/json" \\
  -d @- \\
  ${webhookUrl}`}
            </pre>
            <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2" onClick={copyScript}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t">
        <h5 className="font-semibold text-xs">📮 Opção 2: Serviços de Email Profissionais</h5>
        <p className="text-xs text-muted-foreground">
          Use serviços como <strong>Mailgun</strong>, <strong>SendGrid</strong> ou <strong>Postmark</strong> que têm suporte nativo a webhooks.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a href="https://documentation.mailgun.com/en/latest/user_manual.html#receiving-messages" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Mailgun Docs
            </a>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href="https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              SendGrid Docs
            </a>
          </Button>
        </div>
      </div>

      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          📚 Mais detalhes: <code className="bg-muted px-1 rounded text-xs">docs/EMAIL_SETUP.md</code>
        </p>
      </div>
    </div>
  );
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
            <p className="text-muted-foreground">Configure canais de comunicação e ferramentas</p>
          </div>
          <Button onClick={loadIntegrations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Integrações Ativas */}
        {!loading && integrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Integrações Ativas</CardTitle>
              <CardDescription>Suas conexões configuradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-card border">
                            <PlatformLogo 
                              platform={integration.channel} 
                              provider={integration.provider}
                              size="lg"
                            />
                          </div>
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
                          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
            </CardContent>
          </Card>
        )}

        {/* Categorias de Integrações */}
        <div className="space-y-6">
          {Object.entries(INTEGRATION_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle>{category.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {key === 'email' && 'Configure contas de email para envio e recebimento'}
                    {key === 'social' && 'Conecte suas redes sociais e mensageiros'}
                    {key === 'crm' && 'Integre com seu sistema de CRM'}
                    {key === 'communication' && 'Canais de comunicação adicionais'}
                    {key === 'automation' && 'Ferramentas de automação de processos'}
                    {key === 'support' && 'Plataformas de atendimento ao cliente'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {category.items.map((item) => (
                      <Dialog key={`${item.channel}-${item.provider || item.label}`}>
                        <DialogTrigger asChild>
                          <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
                            <CardContent className="flex flex-col items-center justify-center py-6 gap-3">
                              <PlatformLogo platform={item.channel} provider={item.provider} size="lg" />
                              <p className="text-sm font-medium text-center">{item.label}</p>
                            </CardContent>
                          </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Configurar {item.label}</DialogTitle>
                            <DialogDescription>
                              Conecte seu canal {item.label}
                            </DialogDescription>
                          </DialogHeader>
                          <IntegrationForm 
                            defaultChannel={item.channel}
                            defaultProvider={item.provider}
                            onSuccess={loadIntegrations} 
                          />
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
  const [channel, setChannel] = useState(integration?.channel || defaultChannel || 'email');
  const [provider, setProvider] = useState(integration?.provider || defaultProvider || 'gmail');
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

  // Ajusta o provedor padrão quando o canal de email é selecionado
  useEffect(() => {
    if (channel === 'email' && !integration) {
      setProvider(emailProvider);
    }
  }, [channel, emailProvider, integration]);

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

      // Coletar dados do formulário
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('config.')) {
          config[key.replace('config.', '')] = value;
        } else if (key.startsWith('cred.')) {
          const path = key.replace('cred.', '');
          const val = String(value).trim();
          
          const isSecret = path.includes('password') || path.includes('authToken') || path.includes('apiKey') || path.includes('apiSecret') || path.includes('accessToken');
          
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

      const mergedCredentials = integration 
        ? (resetCreds
            ? Object.fromEntries(Object.entries(newCredentials).filter(([, v]) => v !== '' && v !== undefined && v !== null))
            : { ...integration.credentials, ...newCredentials })
        : newCredentials;

      // Validações específicas
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

      {/* Email Provider Selector */}
      {channel === 'email' && (
        <div className="space-y-2">
          <Label htmlFor="email-provider">Provedor de Email</Label>
          <Select value={emailProvider} onValueChange={(v) => setEmailProvider(v as keyof typeof EMAIL_PROVIDERS)}>
            <SelectTrigger id="email-provider">
              <SelectValue placeholder="Selecione seu provedor de email" />
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
      )}

      {integration && (
        <div className="flex items-center space-x-2">
          <Checkbox id="reset-creds" checked={resetCreds} onCheckedChange={(v) => setResetCreds(Boolean(v))} />
          <Label htmlFor="reset-creds" className="text-sm">Limpar credenciais antigas antes de salvar</Label>
        </div>
      )}

      {/* Email Configuration */}
      {channel === 'email' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="imap-host">Servidor IMAP</Label>
            <Input 
              id="imap-host" 
              name="cred.imap.host" 
              placeholder="imap.example.com" 
              required={!integration}
              defaultValue={currentEmailProvider?.imap.host || String((integration?.credentials?.['imap.host'] ?? integration?.credentials?.imap?.host) ?? '')} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imap-port">Porta IMAP</Label>
              <Input 
                id="imap-port" 
                name="cred.imap.port" 
                type="number" 
                placeholder="993" 
                required={!integration}
                defaultValue={currentEmailProvider?.imap.port || String((integration?.credentials?.['imap.port'] ?? integration?.credentials?.imap?.port) ?? '')} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imap-secure">SSL/TLS</Label>
              <Select 
                name="config.imap.secure" 
                defaultValue={String(currentEmailProvider?.imap.secure ?? integration?.config?.['imap.secure'] ?? 'true')}
              >
                <SelectTrigger id="imap-secure">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim (Recomendado)</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
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
            <Input 
              id="imap-pass" 
              name="cred.imap.password" 
              type="password" 
              required={!integration}
              placeholder={integration ? "Deixe vazio para manter a senha atual" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-host">Servidor SMTP</Label>
            <Input 
              id="smtp-host" 
              name="cred.smtp.host" 
              placeholder="smtp.example.com" 
              required={!integration}
              defaultValue={currentEmailProvider?.smtp.host || String((integration?.credentials?.['smtp.host'] ?? integration?.credentials?.smtp?.host) ?? '')} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Porta SMTP</Label>
              <Input 
                id="smtp-port" 
                name="cred.smtp.port" 
                type="number" 
                placeholder="587" 
                required={!integration}
                defaultValue={currentEmailProvider?.smtp.port || String((integration?.credentials?.['smtp.port'] ?? integration?.credentials?.smtp?.port) ?? '')} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-secure">SSL/TLS</Label>
              <Select 
                name="config.smtp.secure" 
                defaultValue={String(currentEmailProvider?.smtp.secure ?? integration?.config?.['smtp.secure'] ?? 'true')}
              >
                <SelectTrigger id="smtp-secure">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim (Recomendado)</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
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
            <Input 
              id="smtp-pass" 
              name="cred.smtp.password" 
              type="password" 
              required={!integration}
              placeholder={integration ? "Deixe vazio para manter a senha atual" : ""}
            />
          </div>

          <WebhookSetupInstructions />
        </>
      )}

      {/* WhatsApp Configuration */}
      {channel === 'whatsapp' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="whatsapp-provider">Provedor WhatsApp</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="whatsapp-provider">
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta_cloud">Meta Cloud API</SelectItem>
                <SelectItem value="twilio">Twilio WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider === 'meta_cloud' && (
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

          {provider === 'twilio' && (
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
                <Label htmlFor="twilio-token">Auth Token</Label>
                <Input 
                  id="twilio-token" 
                  name="cred.authToken" 
                  type="password" 
                  placeholder={integration ? "Deixe vazio para manter o atual" : ""}
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
        </>
      )}

      {/* CRM Configurations */}
      {channel === 'crm' && (
        <>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Consulte a documentação do {provider} para obter suas credenciais de API
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="crm-api-key">API Key / Token</Label>
            <Input 
              id="crm-api-key" 
              name="cred.apiKey" 
              type="password" 
              required={!integration}
              placeholder={integration ? "Deixe vazio para manter o atual" : "Cole sua API Key aqui"}
            />
          </div>
          
          {['hubspot', 'salesforce', 'pipedrive'].includes(provider) && (
            <div className="space-y-2">
              <Label htmlFor="crm-domain">Domínio / URL</Label>
              <Input 
                id="crm-domain" 
                name="cred.domain" 
                placeholder="sua-empresa.hubspot.com"
                defaultValue={String(integration?.credentials?.domain ?? '')}
              />
            </div>
          )}
        </>
      )}

      {/* Other Channels */}
      {!['email', 'whatsapp', 'crm'].includes(channel) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Esta integração está em desenvolvimento. Em breve você poderá configurá-la.
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            {integration ? 'Atualizar' : 'Adicionar'} Integração
          </>
        )}
      </Button>
    </form>
  );
}
