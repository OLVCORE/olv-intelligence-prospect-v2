import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Mail, MessageSquare, Search, Clock, Building2, ExternalLink, RefreshCw, Inbox as InboxIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function WorkspaceInboxMini() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*, contact:contacts(name), company:companies(name)')
        .in('status', ['open', 'pending'])
        .order('last_message_at', { ascending: false })
        .limit(10);
      setConversations(data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <InboxIcon className="h-5 w-5" />
          Inbox ({conversations.length})
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/sdr/inbox"><ExternalLink className="h-4 w-4" /></Link>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {conversations.map((c) => (
          <Card key={c.id} className="p-3 mb-2">
            <div className="flex items-center gap-2">
              {c.channel === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              <span className="font-medium text-sm">{c.contact?.name}</span>
            </div>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}
