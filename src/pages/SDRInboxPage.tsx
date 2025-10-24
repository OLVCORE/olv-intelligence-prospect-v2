import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeInbox } from '@/hooks/useRealtimeInbox';
import { 
  Search, Mail, MessageSquare, Clock, User, 
  Tag, Send, Paperclip, MoreVertical, Star,
  Archive, UserPlus, AlertCircle, CheckCircle2, Building2, Link2,
  Instagram, Facebook, Linkedin, Twitter, Phone, Settings, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChannelIcon } from '@/components/inbox/ChannelIcon';
import { MessageRenderer } from '@/components/inbox/MessageRenderer';
import { EmailInboxPanel } from '@/components/inbox/EmailInboxPanel';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Conversation {
  id: string;
  channel: 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'sms';
  status: 'open' | 'pending' | 'closed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  sla_due_at?: string;
  last_message_at?: string;
  created_at: string;
  contact?: Contact;
  company?: { id: string; name: string };
  _lastMessagePreview?: string;
  _provider?: string;
}

interface Message {
  id: string;
  direction: 'in' | 'out';
  body: string;
  created_at: string;
  status?: string;
  attachments?: any[];
  channel: string;
}

export default function SDRInboxPage() {
  const { toast } = useToast();
  const { connected, messages: realtimeMessages } = useRealtimeInbox();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'all' | 'my' | 'unassigned' | 'urgent'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('email'); // Email como padrão
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeIntegrations, setActiveIntegrations] = useState<any[]>([]);

  // Load conversations, companies and integrations
  useEffect(() => {
    loadConversations();
    loadCompanies();
    loadActiveIntegrations();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('sdr-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (selectedConv && payload.new && (payload.new as any).conversation_id === selectedConv.id) {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view]);

  // Handle realtime messages
  useEffect(() => {
    if (realtimeMessages.length > 0 && selectedConv) {
      const newMsg = realtimeMessages[realtimeMessages.length - 1];
      if (newMsg.conversation_id === selectedConv.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id);
          return exists ? prev : [...prev, newMsg];
        });
      }
    }
  }, [realtimeMessages, selectedConv]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    }
  }, [selectedConv]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(*),
          company:companies(id, name)
        `)
        .order('last_message_at', { ascending: false });

      if (view === 'my') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) query = query.eq('assigned_to', user.id);
      } else if (view === 'unassigned') {
        query = query.is('assigned_to', null);
      } else if (view === 'urgent') {
        query = query.eq('priority', 'high').lt('sla_due_at', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Load last message preview for each conversation
      const conversationsWithPreviews = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('body, metadata')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let preview = '';
          if (lastMsg?.body) {
            // Remove HTML tags and get plain text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = lastMsg.body;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';
            
            // For emails, try to get subject from metadata
            let subject = '';
            if (conv.channel === 'email' && lastMsg.metadata) {
              const metadata = lastMsg.metadata as any;
              subject = metadata.subject || '';
            }
            
            // Format preview: "Subject - Message preview" or just message preview
            preview = subject 
              ? `${subject} - ${plainText.substring(0, 100)}`.trim()
              : plainText.substring(0, 100).trim();
          }

          return {
            ...conv,
            _lastMessagePreview: preview || 'Sem prévia',
          };
        })
      );

      // Fetch active integrations to decorate provider per channel
      const { data: activeInts } = await supabase
        .from('integration_configs')
        .select('channel, provider, status')
        .eq('status', 'active');

      const withProvider = (conversationsWithPreviews as any[]).map((conv) => ({
        ...conv,
        _provider: activeInts?.find((i: any) => i.channel === conv.channel)?.provider,
      }));

      setConversations(withProvider as Conversation[]);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Erro ao carregar conversas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error loading companies:', error);
    }
  };

  const loadActiveIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      setActiveIntegrations(data || []);
    } catch (error: any) {
      console.error('Error loading integrations:', error);
    }
  };

  const linkToCompany = async (conversationId: string, companyId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ company_id: companyId })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: 'Empresa vinculada',
        description: 'Conversa vinculada à empresa com sucesso',
      });

      loadConversations();
    } catch (error: any) {
      toast({
        title: 'Erro ao vincular empresa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return;

    // Validação STRICT de company context
    if (!selectedConv.company?.id) {
      toast({
        title: 'Empresa não vinculada',
        description: 'Por favor, vincule esta conversa a uma empresa antes de enviar mensagens',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const to = selectedConv.channel === 'whatsapp' 
        ? selectedConv.contact?.phone 
        : selectedConv.contact?.email;

      if (!to) {
        throw new Error('Destinatário não encontrado');
      }

      const { data, error } = await supabase.functions.invoke('sdr-send-message', {
        body: {
          channel: selectedConv.channel,
          conversationId: selectedConv.id,
          companyId: selectedConv.company.id,
          to,
          subject: subjectInput || 'Mensagem',
          body: messageInput,
        },
      });

      if (error) throw error;

      setMessageInput('');
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
      });

      // Reload messages
      loadMessages(selectedConv.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Error 422 explicativo
      if (error.message.includes('Company context')) {
        toast({
          title: 'Contexto de empresa necessário',
          description: 'Esta conversa precisa estar vinculada a uma empresa para enviar mensagens',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao enviar mensagem',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', convId);

      if (error) throw error;

      toast({
        title: 'Conversa excluída',
        description: 'A conversa foi excluída com sucesso',
      });

      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }

      loadConversations();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const archiveConversation = async (convId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', convId);

      if (error) throw error;

      toast({
        title: 'Conversa arquivada',
        description: 'A conversa foi arquivada com sucesso',
      });

      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }

      loadConversations();
    } catch (error: any) {
      toast({
        title: 'Erro ao arquivar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getSLAStatus = (conv: Conversation) => {
    if (!conv.sla_due_at) return null;
    const due = new Date(conv.sla_due_at);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return { status: 'overdue', label: 'Vencido', variant: 'destructive' as const };
    if (minutes < 15) return { status: 'urgent', label: `${minutes}min`, variant: 'destructive' as const };
    if (minutes < 60) return { status: 'warning', label: `${minutes}min`, variant: 'secondary' as const };
    return { status: 'ok', label: `${Math.floor(minutes / 60)}h`, variant: 'secondary' as const };
  };

  const filteredConversations = conversations.filter(conv => {
    // Filter by channel
    if (channelFilter !== 'all' && conv.channel !== channelFilter) {
      return false;
    }

    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.contact?.name?.toLowerCase().includes(query) ||
      conv.contact?.email?.toLowerCase().includes(query) ||
      conv.contact?.phone?.includes(query) ||
      conv.company?.name?.toLowerCase().includes(query)
    );
  });

  // Count conversations by channel
  const channelCounts = {
    all: conversations.length,
    email: conversations.filter(c => c.channel === 'email').length,
    whatsapp: conversations.filter(c => c.channel === 'whatsapp').length,
    instagram: conversations.filter(c => c.channel === 'instagram').length,
    facebook: conversations.filter(c => c.channel === 'facebook').length,
    linkedin: conversations.filter(c => c.channel === 'linkedin').length,
    twitter: conversations.filter(c => c.channel === 'twitter').length,
    sms: conversations.filter(c => c.channel === 'sms').length,
  };

  // Define all possible channels
  const allChannels = [
    { key: 'all', label: 'Todos', icon: null, provider: undefined },
    { key: 'email', label: 'Email', icon: 'email', provider: undefined },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', provider: undefined },
    { key: 'instagram', label: 'Instagram', icon: 'instagram', provider: undefined },
    { key: 'facebook', label: 'Facebook', icon: 'facebook', provider: undefined },
    { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', provider: undefined },
    { key: 'twitter', label: 'Twitter', icon: 'twitter', provider: undefined },
    { key: 'sms', label: 'SMS', icon: 'sms', provider: undefined },
    { key: 'telegram', label: 'Telegram', icon: 'telegram', provider: undefined },
  ];

  // Get available channels with active integrations data
  const availableChannels = allChannels.map(ch => {
    if (ch.key === 'all') {
      return { ...ch, count: channelCounts.all, isActive: true };
    }
    
    const integration = activeIntegrations.find(int => int.channel === ch.key);
    const count = channelCounts[ch.key as keyof typeof channelCounts] || 0;
    
    return {
      ...ch,
      count,
      provider: integration?.provider,
      isActive: !!integration,
    };
  });

  // Email-specific view with modern email client interface
  if (channelFilter === 'email') {
    const emailConversations = filteredConversations.filter(c => c.channel === 'email');
    
    return (
      <AppLayout>
        <div className="h-[calc(100vh-4rem)]">
          <EmailInboxPanel
            conversations={emailConversations}
            selectedConv={selectedConv}
            messages={messages}
            onSelectConversation={(conv) => setSelectedConv(conv)}
            onSendMessage={async (body: string, subject?: string) => {
              if (!selectedConv?.company?.id) {
                toast({
                  title: 'Empresa não vinculada',
                  description: 'Vincule esta conversa a uma empresa antes de enviar',
                  variant: 'destructive',
                });
                return;
              }
              const to = selectedConv.contact?.email;
              if (!to) throw new Error('Email do destinatário não encontrado');
              const { error } = await supabase.functions.invoke('sdr-send-message', {
                body: {
                  channel: 'email',
                  conversationId: selectedConv.id,
                  companyId: selectedConv.company.id,
                  to,
                  subject: subject || 'Mensagem',
                  body,
                },
              });
              if (error) throw error;
              toast({ title: 'Email enviado', description: 'Sua mensagem foi enviada com sucesso' });
              loadMessages(selectedConv.id);
            }}
            onRefresh={loadConversations}
            onDelete={deleteConversation}
            onArchive={archiveConversation}
            companies={companies}
            onLinkCompany={linkToCompany}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Left Panel - Lists */}
         <div className="w-80 border-r flex flex-col bg-card">
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Conversas</h2>
              <Button 
                variant="default" 
                size="sm"
                className="gap-2"
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('email-imap-sync');
                    if (error) throw error;
                    toast({
                      title: 'Emails sincronizados',
                      description: `${data.emailsProcessed || 0} emails processados`,
                    });
                    loadConversations();
                  } catch (error: any) {
                    toast({
                      title: 'Erro na sincronização',
                      description: error.message,
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={view} onValueChange={(v: any) => setView(v)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="my">Meus</TabsTrigger>
                <TabsTrigger value="unassigned">Não Atrib.</TabsTrigger>
                <TabsTrigger value="urgent">Urgente</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Channel Filter Tabs - All Channels Always Visible */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">FILTRAR POR CANAL</p>
              <Tabs value={channelFilter} onValueChange={setChannelFilter} className="w-full">
                <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                  {availableChannels.map((channel) => (
                    <TabsTrigger
                      key={channel.key}
                      value={channel.key}
                      disabled={!channel.isActive && channel.key !== 'all'}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border bg-card shadow-sm transition-all",
                        "hover:bg-accent hover:border-primary/50",
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md",
                        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border"
                      )}
                    >
                      {channel.icon && (
                        <ChannelIcon 
                          channel={channel.icon} 
                          provider={channel.provider}
                          size="sm" 
                        />
                      )}
                      <span className="text-xs font-semibold">{channel.label}</span>
                      {channel.count > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="ml-1 h-5 px-2 text-[10px] font-bold"
                        >
                          {channel.count}
                        </Badge>
                      )}
                      {!channel.isActive && channel.key !== 'all' && (
                        <span className="ml-1 text-[10px] opacity-60">(inativo)</span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              
              {activeIntegrations.length === 0 && (
                <Card className="p-4 border-dashed bg-muted/30">
                  <div className="text-center text-xs text-muted-foreground">
                    <Settings className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    <p className="font-medium mb-1">Configure integrações para ativar canais</p>
                    <Button size="sm" variant="outline" asChild className="mt-2">
                      <Link to="/sdr/integrations">
                        <Settings className="h-3 w-3 mr-1" />
                        Integrações
                      </Link>
                    </Button>
                  </div>
                </Card>
              )}
              
              {/* Email Sync Button - Only show when email filter is active */}
              {channelFilter === 'email' && activeIntegrations.some(int => int.channel === 'email') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke('email-imap-sync');
                      if (error) throw error;
                      toast({
                        title: '✅ Emails sincronizados',
                        description: `${data.emailsProcessed || 0} emails processados com sucesso`,
                      });
                      loadConversations();
                    } catch (error: any) {
                      toast({
                        title: 'Erro na sincronização',
                        description: error.message,
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Buscar Novos Emails
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Carregando...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => {
                  const sla = getSLAStatus(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-accent transition-colors",
                        selectedConv?.id === conv.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <ChannelIcon 
                            channel={conv.channel} 
                            provider={conv._provider}
                            size="md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium truncate">
                              {conv.contact?.name || conv.contact?.phone || conv.contact?.email}
                            </span>
                            {sla && (
                              <Badge variant={sla.variant} className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {sla.label}
                              </Badge>
                            )}
                          </div>
                          {conv.company && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {conv.company.name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {conv._lastMessagePreview}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={conv.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                              {conv.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {conv.status}
                            </Badge>
                            {conv.tags?.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Thread Detail */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <ChannelIcon 
                        channel={selectedConv.channel} 
                        provider={selectedConv._provider}
                        size="lg"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedConv.contact?.name || selectedConv.contact?.phone || selectedConv.contact?.email}
                      </h3>
                      {selectedConv.company && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {selectedConv.company.name}
                        </p>
                      )}
                    </div>
                    {(() => {
                      const sla = getSLAStatus(selectedConv);
                      return sla && (
                        <Badge variant={sla.variant}>
                          <Clock className="h-3 w-3 mr-1" />
                          SLA: {sla.label}
                        </Badge>
                      );
                    })()}
                    {connected && (
                      <Badge variant="outline" className="text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                        Conectado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Company Linking - STRICT VALIDATION */}
                {!selectedConv.company && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm flex-1">Vincule uma empresa para enviar mensagens</span>
                    <Select onValueChange={(companyId) => linkToCompany(selectedConv.id, companyId)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className={selectedConv.channel === 'email' ? '' : 'space-y-1'}>
                  {messages.map((msg) => (
                    <MessageRenderer
                      key={msg.id}
                      message={{ ...msg, channel: selectedConv.channel }}
                      channel={selectedConv.channel}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Composer */}
              <div className="p-4 border-t bg-card">
                {!selectedConv.company ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Vincule uma empresa para enviar mensagens</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    {selectedConv.channel === 'email' && (
                      <Input 
                        placeholder="Assunto"
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                      />
                    )}
                    <div className="flex items-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Textarea
                        placeholder={selectedConv.channel === 'email' ? 'Escreva sua resposta por email...' : 'Digite sua mensagem...'}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="min-h-[100px] resize-none"
                      />
                      <Button onClick={sendMessage} disabled={sending || !messageInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-sm">Escolha uma conversa da lista para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
