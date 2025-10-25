import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Copy, ExternalLink, AlertCircle, Building2, Users, Search, CheckCircle2
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

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  provider?: string;
  available: boolean;
  description?: string;
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
  { id: 'gmail', name: 'Gmail', category: 'email', provider: 'gmail', available: true, description: 'Integração com email Google' },
  { id: 'outlook', name: 'Outlook', category: 'email', provider: 'outlook', available: true, description: 'Microsoft Outlook/Hotmail' },
  { id: 'yahoo', name: 'Yahoo', category: 'email', provider: 'yahoo', available: true, description: 'Yahoo Mail' },
  { id: 'icloud', name: 'iCloud', category: 'email', provider: 'icloud', available: true, description: 'Apple iCloud Mail' },
  { id: 'zoho', name: 'Zoho', category: 'email', provider: 'zoho', available: true, description: 'Zoho Mail' },
  { id: 'custom', name: 'Outro Email', category: 'email', provider: 'custom', available: true, description: 'Servidor customizado' },
  
  // Social
  { id: 'whatsapp', name: 'WhatsApp', category: 'social', provider: 'whatsapp', available: true, description: 'Mensagens WhatsApp' },
  { id: 'telegram', name: 'Telegram', category: 'social', provider: 'telegram', available: false, description: 'Mensagens Telegram' },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', provider: 'linkedin', available: false, description: 'Rede profissional' },
  { id: 'instagram', name: 'Instagram', category: 'social', provider: 'instagram', available: false, description: 'Direct Messages' },
  { id: 'facebook', name: 'Facebook', category: 'social', provider: 'facebook', available: false, description: 'Messenger' },
  { id: 'twitter', name: 'Twitter/X', category: 'social', provider: 'twitter', available: false, description: 'Direct Messages' },
  
  // CRM
  { id: 'kommo', name: 'Kommo', category: 'crm', provider: 'kommo', available: false, description: 'CRM e vendas' },
  { id: 'bitrix24', name: 'Bitrix24', category: 'crm', provider: 'bitrix24', available: true, description: 'Sincronização bidirecional de deals' },
  { id: 'hubspot', name: 'HubSpot', category: 'crm', provider: 'hubspot', available: false, description: 'Marketing & Vendas' },
  { id: 'pipedrive', name: 'Pipedrive', category: 'crm', provider: 'pipedrive', available: false, description: 'Pipeline de vendas' },
  { id: 'salesforce', name: 'Salesforce', category: 'crm', provider: 'salesforce', available: false, description: 'CRM Enterprise' },
  { id: 'zoho_crm', name: 'Zoho CRM', category: 'crm', provider: 'zoho_crm', available: false, description: 'CRM Zoho' },
  { id: 'rd_station', name: 'RD Station', category: 'crm', provider: 'rd_station', available: false, description: 'Marketing Digital' },
  { id: 'activecampaign', name: 'ActiveCampaign', category: 'crm', provider: 'activecampaign', available: false, description: 'Email Marketing' },
  { id: 'agendor', name: 'Agendor', category: 'crm', provider: 'agendor', available: false, description: 'CRM Brasil' },
  
  // Communication
  { id: 'sms', name: 'SMS', category: 'communication', provider: 'sms', available: false, description: 'Mensagens SMS' },
  { id: 'voice', name: 'Telefone', category: 'communication', provider: 'voice', available: false, description: 'Chamadas VoIP' },
  { id: 'slack', name: 'Slack', category: 'communication', provider: 'slack', available: false, description: 'Chat corporativo' },
  { id: 'teams', name: 'Teams', category: 'communication', provider: 'teams', available: false, description: 'Microsoft Teams' },
  
  // Automation
  { id: 'zapier', name: 'Zapier', category: 'automation', provider: 'zapier', available: false, description: 'Automação de fluxos' },
  { id: 'make', name: 'Make', category: 'automation', provider: 'make', available: false, description: 'Integração visual' },
  { id: 'n8n', name: 'n8n', category: 'automation', provider: 'n8n', available: false, description: 'Automação open-source' },
  
  // Support
  { id: 'intercom', name: 'Intercom', category: 'support', provider: 'intercom', available: false, description: 'Chat & Suporte' },
  { id: 'zendesk', name: 'Zendesk', category: 'support', provider: 'zendesk', available: false, description: 'Help Desk' },
  { id: 'freshdesk', name: 'Freshdesk', category: 'support', provider: 'freshdesk', available: false, description: 'Suporte ao cliente' },
  { id: 'drift', name: 'Drift', category: 'support', provider: 'drift', available: false, description: 'Conversational AI' },
];

function WebhookSetupInstructions() {
  const { toast } = useToast();
  const webhookUrl = "https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-inbound-webhook";

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'URL copiada!' });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Status do Sistema */}
      <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <strong>✅ Sistema Pronto!</strong><br />
          • <strong>Envio:</strong> Configurado e funcionando via Resend<br />
          • <strong>Recebimento:</strong> Precisa configurar o redirecionamento abaixo
        </AlertDescription>
      </Alert>

      {/* Instruções ULTRA simplificadas */}
      <div className="p-6 border-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            ✓
          </div>
          <div className="flex-1 space-y-3">
            <h4 className="font-bold text-base">📧 Configure em 3 minutos</h4>
            <p className="text-sm font-medium">Use: <code className="bg-background px-2 py-1 rounded border">consultores@olvinternacional.com.br</code></p>
            
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">1</span>
                <div>
                  <p className="font-semibold">cPanel: Forwarder</p>
                  <p className="text-muted-foreground text-xs">De: consultores@olvinternacional.com.br → Para: um-gmail-seu@gmail.com</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">2</span>
                <div className="space-y-2">
                  <p className="font-semibold">Gmail: Apps Script</p>
                  <p className="text-muted-foreground text-xs">Abra <a href="https://script.google.com" target="_blank" rel="noopener" className="text-primary underline font-medium">script.google.com</a> → Novo projeto → Cole:</p>
                  <pre className="p-3 bg-background rounded border text-[10px] overflow-x-auto font-mono">
{`function encaminharParaWebhook() {
  var threads = GmailApp.getInboxThreads(0, 10);
  var webhook = "${webhookUrl}";
  
  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    messages.forEach(function(message) {
      if (!message.isUnread()) return;
      
      var payload = {
        from: message.getFrom(),
        to: message.getTo(),
        subject: message.getSubject(),
        html: message.getBody(),
        text: message.getPlainBody()
      };
      
      UrlFetchApp.fetch(webhook, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload)
      });
      
      message.markRead();
    });
  });
}`}
                  </pre>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">3</span>
                <div>
                  <p className="font-semibold">Ativar Trigger</p>
                  <p className="text-muted-foreground text-xs">No Apps Script: Relógio (⏰) → Add Trigger → Time-driven → Every minute</p>
                </div>
              </div>
            </div>

            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm">
                <strong>✅ Pronto!</strong> Emails recebidos aparecerão aqui automaticamente.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>


      {/* Teste */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>✅ Como Testar:</strong> Após configurar, envie um email para o endereço configurado. 
          Ele deve aparecer aqui em até 1 minuto.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function SDRIntegrationsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Load from integration_configs (old)
      const { data: oldIntegrations, error: oldError } = await supabase
        .from('integration_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (oldError && oldError.code !== 'PGRST116') throw oldError;

      // Load from sdr_integrations (new - WhatsApp)
      const { data: sdrIntegrations, error: sdrError } = await supabase
        .from('sdr_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sdrError && sdrError.code !== 'PGRST116') throw sdrError;

      // Combine and normalize both sources
      const combined: Integration[] = [
        ...(oldIntegrations || []).map((i: any) => ({
          id: i.id,
          channel: i.channel,
          provider: i.provider,
          status: i.status,
          health_status: i.health_status,
          last_health_check: i.last_health_check,
          config: i.config || {},
          credentials: i.credentials || {}
        })),
        ...(sdrIntegrations || []).map((i: any) => ({
          id: i.id,
          channel: i.integration_name === 'whatsapp' ? 'social' : i.integration_name,
          provider: i.provider || i.integration_name,
          status: i.is_active ? 'active' : 'inactive',
          health_status: null,
          last_health_check: i.last_sync_at,
          config: i.config || {},
          credentials: {}
        }))
      ];

      setIntegrations(combined);
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
            {/* Quick Email Setup Banner */}
            <Alert className="mb-6 border-primary/50 bg-primary/5">
              <Mail className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>Novo:</strong> Configure seu email em 3 passos simples com nosso assistente visual
                </div>
                <Link to="/email-settings">
                  <Button size="sm" variant="default">
                    <Settings className="h-3.5 w-3.5 mr-2" />
                    Configurar Email
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>

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
                              <Badge 
                                variant={integration.status === 'active' ? 'default' : 'destructive'} 
                                className={`text-[10px] h-5 ${integration.status === 'active' ? 'bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))]/80' : ''}`}
                              >
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

            {/* Available Integrations por Categoria */}
            <div className="space-y-6">
              {['email', 'social', 'crm', 'communication', 'automation', 'support'].map((category) => {
                const categoryItems = filteredIntegrations.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;
                
                const categoryNames: Record<string, string> = {
                  email: 'Email',
                  social: 'Redes Sociais',
                  crm: 'CRM',
                  communication: 'Comunicação',
                  automation: 'Automação',
                  support: 'Suporte'
                };

                return (
                  <div key={category}>
                    <h2 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                      {categoryNames[category]} ({categoryItems.length})
                    </h2>
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                      {categoryItems.map((item: IntegrationItem) => (
                        <Dialog key={item.id}>
                          <DialogTrigger asChild>
                            <button className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${item.available ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed opacity-60'}`}>
                              <div className="w-full flex items-center justify-center">
                                <PlatformLogo platform={item.category} provider={item.provider} size="lg" />
                              </div>
                              <div className="text-center w-full">
                                <p className="text-sm font-semibold leading-tight line-clamp-1">{item.name}</p>
                                {item.description && (
                                  <p className="text-[9px] text-muted-foreground leading-tight line-clamp-1">{item.description}</p>
                                )}
                                {!item.available && (
                                  <Badge variant="secondary" className="text-[7px] h-3 mt-0.5 px-1 mx-auto">Breve</Badge>
                                )}
                              </div>
                            </button>
                          </DialogTrigger>
                           {item.available && (
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Configurar {item.name}</DialogTitle>
                                <DialogDescription>
                                  {item.id === 'bitrix24' ? (
                                    <div className="space-y-3 pt-4">
                                      <p>Sincronize seus deals automaticamente com o Bitrix24 de forma bidirecional</p>
                                      <Button 
                                        onClick={() => navigate('/sdr/integrations/bitrix24')}
                                        className="w-full gap-2"
                                        size="lg"
                                      >
                                        <Settings className="h-4 w-4" />
                                        Configurar Bitrix24
                                      </Button>
                                    </div>
                                  ) : item.id === 'whatsapp' ? (
                                    <div className="space-y-3 pt-4">
                                      <p>Configure WhatsApp Business API para enviar e receber mensagens</p>
                                      <Button 
                                        onClick={() => navigate('/sdr/integrations/whatsapp')}
                                        className="w-full gap-2"
                                        size="lg"
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        Configurar WhatsApp
                                      </Button>
                                    </div>
                                  ) : (
                                    `Conecte sua conta ${item.name}`
                                  )}
                                </DialogDescription>
                              </DialogHeader>
                              {item.id !== 'bitrix24' && item.id !== 'whatsapp' && (
                                <IntegrationForm 
                                  defaultChannel={item.category}
                                  defaultProvider={item.provider}
                                  onSuccess={loadIntegrations} 
                                />
                              )}
                            </DialogContent>
                          )}
                        </Dialog>
                      ))}
                    </div>
                  </div>
                );
              })}
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

          {/* Configuração IMAP */}
          <div className="space-y-3 p-4 border rounded-lg bg-background">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h3 className="font-semibold text-sm">Configuração IMAP (Recebimento)</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="cred.imap.user" 
                type="email" 
                required={!integration}
                defaultValue={useProfileData && profile?.email ? profile.email : String(integration?.credentials?.['imap.user'] ?? '')}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imap-password">Senha/App Password</Label>
              <Input 
                id="imap-password"
                name="cred.imap.password" 
                type="password" 
                required={!integration}
                placeholder={integration ? "Deixe vazio para manter a senha atual" : "Sua senha ou senha de app"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="imap-host">Servidor IMAP</Label>
                <Input 
                  id="imap-host"
                  name="cred.imap.host" 
                  type="text" 
                  required={!integration}
                  defaultValue={currentEmailProvider?.imap.host || integration?.credentials?.['imap.host'] || 'imap.gmail.com'}
                  placeholder="imap.gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-port">Porta IMAP</Label>
                <Input 
                  id="imap-port"
                  name="cred.imap.port" 
                  type="number" 
                  required={!integration}
                  defaultValue={currentEmailProvider?.imap.port || integration?.credentials?.['imap.port'] || 993}
                  placeholder="993"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="imap-secure" 
                name="config.imap.secure" 
                defaultChecked={currentEmailProvider?.imap.secure ?? integration?.config?.['imap.secure'] ?? true}
                value="true"
              />
              <Label htmlFor="imap-secure" className="text-sm">SSL/TLS</Label>
            </div>
          </div>

          {/* Configuração SMTP */}
          <div className="space-y-3 p-4 border rounded-lg bg-background">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h3 className="font-semibold text-sm">Configuração SMTP (Envio)</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-email">Email SMTP</Label>
              <Input 
                id="smtp-email"
                name="cred.smtp.user" 
                type="email" 
                required={!integration}
                defaultValue={useProfileData && profile?.email ? profile.email : String(integration?.credentials?.['smtp.user'] ?? '')}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-password">Senha SMTP</Label>
              <Input 
                id="smtp-password"
                name="cred.smtp.password" 
                type="password" 
                placeholder={integration ? "Deixe vazio para usar a mesma do IMAP" : "Deixe vazio para usar a mesma do IMAP"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">Servidor SMTP</Label>
                <Input 
                  id="smtp-host"
                  name="cred.smtp.host" 
                  type="text" 
                  required={!integration}
                  defaultValue={currentEmailProvider?.smtp.host || integration?.credentials?.['smtp.host'] || 'smtp.gmail.com'}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-port">Porta SMTP</Label>
                <Input 
                  id="smtp-port"
                  name="cred.smtp.port" 
                  type="number" 
                  required={!integration}
                  defaultValue={currentEmailProvider?.smtp.port || integration?.credentials?.['smtp.port'] || 587}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="smtp-secure" 
                name="config.smtp.secure" 
                defaultChecked={currentEmailProvider?.smtp.secure ?? integration?.config?.['smtp.secure'] ?? true}
                value="true"
              />
              <Label htmlFor="smtp-secure" className="text-sm">SSL/TLS</Label>
            </div>
          </div>

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
