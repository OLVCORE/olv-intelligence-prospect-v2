import { useState } from 'react';
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
  Mail, MailOpen, Download, Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

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
  const [sending, setSending] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const toggleEmailSelection = (convId: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(convId)) {
      newSelection.delete(convId);
    } else {
      newSelection.add(convId);
    }
    setSelectedEmails(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === conversations.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(conversations.map(c => c.id)));
    }
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
    
    setSending(true);
    try {
      await onSendMessage(composeBody, composeSubject);
      setComposing(false);
      setReplyMode(null);
      setComposeBody('');
      setComposeSubject('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Email List Panel */}
      <div className="w-96 border-r flex flex-col">
        {/* Toolbar */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Checkbox 
              checked={selectedEmails.size === conversations.length && conversations.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {selectedEmails.size > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir ({selectedEmails.size})
                </Button>
                <Button variant="ghost" size="sm" onClick={handleBulkArchive}>
                  <Archive className="h-4 w-4 mr-1" />
                  Arquivar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum email</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "border-b p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedConv?.id === conv.id && "bg-muted"
                )}
                onClick={() => onSelectConversation(conv)}
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedEmails.has(conv.id)}
                    onCheckedChange={() => toggleEmailSelection(conv.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {conv.contact?.name || 'Desconhecido'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {conv.last_message_at && new Date(conv.last_message_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {conv.company && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {conv.company.name}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {conv._lastMessagePreview || 'Sem prévia de mensagem'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Email Detail Panel */}
      <div className="flex-1 flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MailOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Selecione um email para visualizar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Email Header */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">
                  {selectedConv.contact?.name || 'Desconhecido'}
                </h2>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleReply}>
                    <Reply className="h-4 w-4 mr-1" />
                    Responder
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReplyAll}>
                    <ReplyAll className="h-4 w-4 mr-1" />
                    Resp. Todos
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleForward}>
                    <Forward className="h-4 w-4 mr-1" />
                    Encaminhar
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
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        Marcar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {selectedConv.contact?.email && (
                <p className="text-sm text-muted-foreground">
                  {selectedConv.contact.email}
                </p>
              )}
              {selectedConv.company && (
                <Badge variant="outline" className="mt-2">
                  {selectedConv.company.name}
                </Badge>
              )}
              {/* Vincular conversa a empresa */}
              {!selectedConv.company && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Select onValueChange={(v) => setSelectedCompanyId(v)}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Vincular a uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={!selectedCompanyId} onClick={() => onLinkCompany(selectedConv.id, selectedCompanyId)}>
                    Vincular
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={createCompanyPath || "/companies"}>Nova empresa</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Messages Thread */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem nesta conversa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <Card key={msg.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium">
                            {msg.direction === 'out' ? 'Você' : selectedConv.contact?.name || 'Cliente'}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(msg.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(msg.body, {
                            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'img'],
                            ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
                          })
                        }}
                      />
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs text-muted-foreground mb-2">Anexos:</div>
                          {msg.attachments.map((att: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm bg-muted rounded px-2 py-1 mb-1">
                              <Paperclip className="h-3 w-3" />
                              {att.filename || `Arquivo ${idx + 1}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Compose/Reply Area */}
            {composing && (
              <div className="border-t p-4 bg-muted/20">
                <div className="space-y-3">
                  <Input
                    placeholder="Assunto"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                  <Textarea
                    placeholder="Escreva sua mensagem..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={6}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setComposing(false);
                          setReplyMode(null);
                          setComposeBody('');
                          setComposeSubject('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSend} disabled={sending || !composeBody.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
