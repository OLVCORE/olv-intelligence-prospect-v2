import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Reply, ReplyAll, Forward, Trash2, Archive, Star, 
  MoreVertical, Paperclip, Send, ChevronLeft, RefreshCw,
  Mail, MailOpen, Download, Flag, Tag, Clock, Search,
  SortAsc, X, Inbox, AlertCircle, Building2, UserPlus, CheckCircle2, Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailComposer } from './EmailComposer';
import { AISuggestedReplies } from './AISuggestedReplies';
import { supabase } from '@/integrations/supabase/client';
interface Message {
  id: string;
  direction: 'in' | 'out';
  body: string;
  created_at: string;
  status?: string;
  attachments?: any[];
  from_id?: string;
  to_id?: string;
  metadata?: any;
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
  contact?: { id: string; name: string; email?: string; phone?: string };
  company?: { id: string; name: string };
  _lastMessagePreview?: string;
  _provider?: string;
}

interface EmailInboxPanelProps {
  conversations: Conversation[];
  selectedConv: Conversation | null;
  messages: Message[];
  onSelectConversation: (conv: Conversation) => void;
  onSendMessage: (body: string, subject?: string) => Promise<void>;
  onRefresh: () => void;
  onDelete: (convId: string) => Promise<void>;
  onArchive?: (convId: string) => Promise<void>;
  companies: { id: string; name: string }[];
  onLinkCompany: (convId: string, companyId: string) => Promise<void>;
  createCompanyPath?: string;
}

export function EmailInboxPanel({
  conversations,
  selectedConv,
  messages,
  onSelectConversation,
  onSendMessage,
  onRefresh,
  onDelete,
  onArchive,
  companies,
  onLinkCompany,
  createCompanyPath
}: EmailInboxPanelProps) {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [replyMode, setReplyMode] = useState<'reply' | 'reply-all' | 'forward' | null>(null);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeTo, setComposeTo] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'starred'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'sender'>('date');
  const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set());
  
  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv._lastMessagePreview?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (filterStatus === 'unread') {
      filtered = filtered.filter(conv => conv.status === 'open');
    } else if (filterStatus === 'starred') {
      filtered = filtered.filter(conv => starredEmails.has(conv.id));
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.last_message_at || b.created_at).getTime() - 
               new Date(a.last_message_at || a.created_at).getTime();
      } else {
        return (a.contact?.name || '').localeCompare(b.contact?.name || '');
      }
    });
    
    return filtered;
  }, [conversations, searchTerm, filterStatus, sortBy, starredEmails]);

  const toggleEmailSelection = (convId: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(convId)) {
      newSelection.delete(convId);
    } else {
      newSelection.add(convId);
    }
    setSelectedEmails(newSelection);
  };

  const handleBulkDelete = async () => {
    for (const convId of selectedEmails) {
      await onDelete(convId);
    }
    setSelectedEmails(new Set());
  };

  const handleBulkArchive = async () => {
    if (onArchive) {
      for (const convId of selectedEmails) {
        await onArchive(convId);
      }
      setSelectedEmails(new Set());
    }
  };

  const handleReply = () => {
    setReplyMode('reply');
    setComposing(true);
    setComposeSubject('Re: ' + (selectedConv?.contact?.name || 'Sem assunto'));
    setComposeBody('');
  };

  const handleReplyAll = () => {
    setReplyMode('reply-all');
    setComposing(true);
    setComposeSubject('Re: ' + (selectedConv?.contact?.name || 'Sem assunto'));
    setComposeBody('');
  };

  const handleForward = () => {
    setReplyMode('forward');
    setComposing(true);
    setComposeSubject('Fwd: ' + (selectedConv?.contact?.name || 'Sem assunto'));
    const lastMessage = messages[messages.length - 1];
    setComposeBody(lastMessage ? `\n\n---------- Forwarded message ---------\n${lastMessage.body}` : '');
  };

  const handleSend = async () => {
    if (!composeBody.trim()) return;
    
    // For new emails (composing without reply mode)
    if (composing && !replyMode && !selectedConv) {
      // TODO: Implement sending new emails without existing conversation
      // This would require creating a new contact and conversation first
      alert('Envio de novos emails será implementado em breve. Por enquanto, você pode responder emails recebidos.');
      return;
    }
    
    setSending(true);
    try {
      await onSendMessage(composeBody, composeSubject);
      setComposing(false);
      setReplyMode(null);
      setComposeBody('');
      setComposeSubject('');
      setComposeTo('');
    } finally {
      setSending(false);
    }
  };
  
  const toggleStar = (convId: string) => {
    const newStarred = new Set(starredEmails);
    if (newStarred.has(convId)) {
      newStarred.delete(convId);
    } else {
      newStarred.add(convId);
    }
    setStarredEmails(newStarred);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Email List Panel */}
      <div className="w-96 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Caixa de Entrada
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={async () => {
                try {
                  // Get current session
                  const { data: { session } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getSession());
                  
                  if (session?.access_token) {
                    // First trigger IMAP sync
                    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-imap-sync`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                      },
                    });
                  }
                  // Then refresh the list
                  onRefresh();
                } catch (error) {
                  console.error('Error syncing:', error);
                  onRefresh(); // Refresh anyway
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Compose Button */}
          <Button 
            className="w-full mb-3 gap-2" 
            onClick={() => {
              if (conversations.length === 0) {
                return; // Tooltip will explain why it's disabled
              }
              setComposing(true);
              setReplyMode(null);
              setComposeSubject('');
              setComposeBody('');
              setComposeTo('');
            }}
            disabled={conversations.length === 0}
            title={conversations.length === 0 ? "Aguarde receber emails para poder responder" : "Escrever novo email"}
          >
            <Send className="h-4 w-4" />
            Escrever Email
          </Button>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Tabs value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)} className="flex-1">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Não lidos</TabsTrigger>
                <TabsTrigger value="starred" className="text-xs">Favoritos</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <SortAsc className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  {sortBy === 'date' && '✓ '}Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('sender')}>
                  {sortBy === 'sender' && '✓ '}Remetente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedEmails.size > 0 && (
          <div className="px-3 py-2 bg-primary/10 border-b flex items-center gap-2">
            <span className="text-sm font-medium">{selectedEmails.size} selecionado(s)</span>
            <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="h-7">
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={handleBulkArchive} className="h-7">
              <Archive className="h-3 w-3 mr-1" />
              Arquivar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedEmails(new Set())} className="h-7 ml-auto">
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Email List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm ? 'Nenhum email encontrado' : 'Nenhum email'}
              </p>
              {searchTerm && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isStarred = starredEmails.has(conv.id);
              const isUnread = conv.status === 'open';
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "border-b p-3 cursor-pointer hover:bg-accent/50 transition-colors group",
                    selectedConv?.id === conv.id && "bg-accent",
                    isUnread && "bg-primary/5"
                  )}
                  onClick={() => onSelectConversation(conv)}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedEmails.has(conv.id)}
                      onCheckedChange={() => toggleEmailSelection(conv.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(conv.id);
                      }}
                    >
                      <Star className={cn("h-3 w-3", isStarred && "fill-yellow-400 text-yellow-400")} />
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("truncate text-sm", isUnread && "font-semibold")}>
                          {conv.contact?.name || conv.contact?.email || 'Desconhecido'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {conv.last_message_at && formatDistanceToNow(
                            new Date(conv.last_message_at), 
                            { addSuffix: true, locale: ptBR }
                          )}
                        </span>
                      </div>
                      
                      {conv.company && (
                        <Badge variant="outline" className="mb-1 text-xs">
                          {conv.company.name}
                        </Badge>
                      )}
                      
                      <p className="text-xs text-muted-foreground truncate">
                        {conv._lastMessagePreview || 'Sem prévia'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Email Detail Panel */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="h-20 w-20 mx-auto mb-4 opacity-10" />
              <p className="text-lg font-medium mb-2">Selecione um email</p>
              <p className="text-sm">Clique em uma conversa para visualizar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-start gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onSelectConversation(null as any)}
                  className="mt-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      {selectedConv.contact?.name || selectedConv.contact?.email || 'Desconhecido'}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStar(selectedConv.id)}
                      >
                        <Star className={cn(
                          "h-4 w-4",
                          starredEmails.has(selectedConv.id) && "fill-yellow-400 text-yellow-400"
                        )} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDelete(selectedConv.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                          {onArchive && (
                            <DropdownMenuItem onClick={() => onArchive(selectedConv.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Flag className="h-4 w-4 mr-2" />
                            Marcar como spam
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{selectedConv.contact?.email}</span>
                    {selectedConv.last_message_at && (
                      <>
                        <span>•</span>
                        <span>{new Date(selectedConv.last_message_at).toLocaleString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Company Link Section */}
                  {selectedConv.company ? (
                    <Badge variant="outline" className="mt-2">
                      <Building2 className="h-3 w-3 mr-1" />
                      {selectedConv.company.name}
                    </Badge>
                  ) : (
                    <Card className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                            Conversa não vinculada a empresa
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select onValueChange={(v) => setSelectedCompanyId(v)} value={selectedCompanyId}>
                              <SelectTrigger className="w-48 h-8 text-xs">
                                <SelectValue placeholder="Selecionar empresa" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((c) => (
                                  <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              disabled={!selectedCompanyId} 
                              onClick={() => onLinkCompany(selectedConv.id, selectedCompanyId)}
                              className="h-8 text-xs"
                            >
                              Vincular
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                              <Link to={createCompanyPath || "/companies"}>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Nova empresa
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
              
            {/* Action Bar */}
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
              <Button variant="default" size="sm" onClick={handleReply}>
                <Reply className="h-4 w-4 mr-1" />
                Responder
              </Button>
              <Button variant="outline" size="sm" onClick={handleReplyAll}>
                <ReplyAll className="h-4 w-4 mr-1" />
                Todos
              </Button>
              <Button variant="outline" size="sm" onClick={handleForward}>
                <Forward className="h-4 w-4 mr-1" />
                Encaminhar
              </Button>
            </div>

            {/* Messages Thread */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <MailOpen className="h-16 w-16 mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium mb-1">Nenhuma mensagem</p>
                  <p className="text-sm">Comece a conversa enviando uma mensagem</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((msg, idx) => {
                    const isLast = idx === messages.length - 1;
                    return (
                      <Card key={msg.id} className={cn(
                        "p-5 transition-all hover:shadow-md",
                        msg.direction === 'out' && "bg-primary/5 border-primary/20",
                        isLast && "ring-2 ring-primary/20"
                      )}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center font-semibold",
                              msg.direction === 'out' 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted text-muted-foreground"
                            )}>
                              {msg.direction === 'out' 
                                ? 'EU' 
                                : (selectedConv.contact?.name?.[0]?.toUpperCase() || 'C')
                              }
                            </div>
                            <div>
                              <p className="font-semibold">
                                {msg.direction === 'out' ? 'Você' : selectedConv.contact?.name || selectedConv.contact?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {msg.metadata?.subject && (
                              <Badge variant="outline" className="text-xs">
                                {msg.metadata.subject}
                              </Badge>
                            )}
                            {msg.direction === 'in' && (
                              <Badge variant="default" className="text-xs">Recebido</Badge>
                            )}
                            {msg.direction === 'out' && msg.status === 'sent' && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Enviado
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(msg.body, {
                              ALLOWED_TAGS: [
                                'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote',
                                'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                                'img', 'b', 'i', 's', 'pre', 'code'
                              ],
                              ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style', 'width', 'height']
                            })
                          }}
                        />
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {msg.attachments.length} anexo(s)
                            </span>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Compose Area */}
            {(composing || replyMode) && (
              <div className="p-6 border-t bg-card">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      {replyMode === 'reply' && <><Reply className="h-4 w-4" />Responder</>}
                      {replyMode === 'reply-all' && <><ReplyAll className="h-4 w-4" />Responder a Todos</>}
                      {replyMode === 'forward' && <><Forward className="h-4 w-4" />Encaminhar</>}
                      {!replyMode && composing && <><Edit className="h-4 w-4" />Nova Mensagem</>}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setComposing(false);
                        setReplyMode(null);
                        setComposeBody('');
                        setComposeSubject('');
                        setComposeTo('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <EmailComposer
                    to={composing && !replyMode ? composeTo : (selectedConv?.contact?.email || '')}
                    onToChange={setComposeTo}
                    subject={composeSubject}
                    body={composeBody}
                    onSubjectChange={setComposeSubject}
                    onBodyChange={setComposeBody}
                    onSend={handleSend}
                    sending={sending}
                    allowEditTo={composing && !replyMode}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}