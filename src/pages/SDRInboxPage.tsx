import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Mail, MessageSquare, Clock, User, 
  Tag, Send, Paperclip, MoreVertical, Star,
  Archive, UserPlus, AlertCircle, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Conversation {
  id: string;
  channel: 'whatsapp' | 'email';
  status: 'open' | 'pending' | 'closed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  sla_due_at?: string;
  last_message_at?: string;
  created_at: string;
  contact?: Contact;
  company?: { id: string; name: string };
  _lastMessagePreview?: string;
}

interface Message {
  id: string;
  direction: 'in' | 'out';
  body: string;
  created_at: string;
  status?: string;
  attachments?: any[];
}

export default function SDRInboxPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'all' | 'my' | 'unassigned' | 'urgent'>('all');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load conversations
  useEffect(() => {
    loadConversations();
    
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
            .select('body')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            _lastMessagePreview: lastMsg?.body || '',
          };
        })
      );

      setConversations(conversationsWithPreviews as Conversation[]);
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

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return;

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
          to,
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
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
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
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.contact?.name?.toLowerCase().includes(query) ||
      conv.contact?.email?.toLowerCase().includes(query) ||
      conv.contact?.phone?.includes(query) ||
      conv.company?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Left Panel - Lists */}
        <div className="w-80 border-r flex flex-col bg-card">
          <div className="p-4 border-b space-y-4">
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
                          {conv.channel === 'whatsapp' ? (
                            <MessageSquare className="h-5 w-5 text-green-600" />
                          ) : (
                            <Mail className="h-5 w-5 text-blue-600" />
                          )}
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
              <div className="p-4 border-b flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <div>
                    {selectedConv.channel === 'whatsapp' ? (
                      <MessageSquare className="h-6 w-6 text-green-600" />
                    ) : (
                      <Mail className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConv.contact?.name || selectedConv.contact?.phone || selectedConv.contact?.email}
                    </h3>
                    {selectedConv.company && (
                      <p className="text-sm text-muted-foreground">{selectedConv.company.name}</p>
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

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.direction === 'out' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          msg.direction === 'out'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs opacity-70">
                            {formatDistanceToNow(new Date(msg.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                          {msg.direction === 'out' && msg.status && (
                            <span className="text-xs opacity-70">
                              {msg.status === 'sent' && '✓'}
                              {msg.status === 'delivered' && '✓✓'}
                              {msg.status === 'read' && '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Composer */}
              <div className="p-4 border-t bg-card">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="min-h-[80px] resize-none"
                  />
                  <Button onClick={sendMessage} disabled={sending || !messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
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
