import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Mail, MessageSquare, Search, Clock, Building2, 
  ExternalLink, RefreshCw, Settings, Inbox as InboxIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Conversation {
  id: string;
  channel: string;
  status: string;
  priority: string;
  last_message_at?: string;
  created_at: string;
  contact?: { name: string; email?: string };
  company?: { id: string; name: string };
  _lastMessagePreview?: string;
}

export function WorkspaceInboxMini() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
    
    const channel = supabase
      .channel('workspace-inbox-mini')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadConversations)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(name, email),
          company:companies(id, name)
        `)
        .in('status', ['open', 'pending'])
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Load preview
      const withPreviews = await Promise.all(
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
            _lastMessagePreview: lastMsg?.body?.substring(0, 80) || 'Sem mensagens',
          };
        })
      );

      setConversations(withPreviews as Conversation[]);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.contact?.name?.toLowerCase().includes(query) ||
      conv.contact?.email?.toLowerCase().includes(query) ||
      conv.company?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <InboxIcon className="h-5 w-5" />
            Inbox Unificado
          </h2>
          <p className="text-sm text-muted-foreground">
            {conversations.length} conversas ativas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadConversations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sdr/inbox">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sdr/integrations">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <InboxIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ativa'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <Card 
                key={conv.id}
                className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/sdr/inbox?conv=${conv.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {conv.channel === 'email' ? (
                          <Mail className="h-4 w-4 text-blue-600" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-medium text-sm">
                          {conv.contact?.name || 'Sem nome'}
                        </span>
                      </div>
                      {conv.company && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {conv.company.name}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {conv.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Urgente
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {conv.last_message_at && formatDistanceToNow(
                          new Date(conv.last_message_at),
                          { addSuffix: true, locale: ptBR }
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {conv._lastMessagePreview}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
          <Link to="/sdr/inbox">
            <Mail className="h-4 w-4" />
            Email
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
          <Link to="/sdr/integrations">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </Link>
        </Button>
      </div>
    </div>
  );
}
