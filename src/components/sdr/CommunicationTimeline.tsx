import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Mail, MessageSquare, Video, Calendar, FileText, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'stage_change';
  timestamp: string;
  title: string;
  description?: string;
  metadata?: any;
  user?: { name: string };
}

interface CommunicationTimelineProps {
  dealId: string;
  companyId?: string;
}

export function CommunicationTimeline({ dealId, companyId }: CommunicationTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
    
    const channel = supabase
      .channel(`timeline-${dealId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sdr_deal_activities' }, loadTimeline)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      // Load deal activities
      const { data: activities } = await supabase
        .from('sdr_deal_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Load conversations if company exists
      let conversations: any[] = [];
      if (companyId) {
        const { data: convos } = await supabase
          .from('conversations')
          .select('*, messages(*)')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(20);
        conversations = convos || [];
      }

      // Load call recordings
      const { data: calls } = await supabase
        .from('call_recordings')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Merge and sort all events
      const timeline: TimelineEvent[] = [];

      // Add deal activities
      activities?.forEach(act => {
        timeline.push({
          id: act.id,
          type: act.activity_type === 'stage_change' ? 'stage_change' : 'note',
          timestamp: act.created_at,
          title: act.description,
          metadata: act.new_value
        });
      });

      // Add conversations
      conversations.forEach(conv => {
        const lastMessage = conv.messages?.[0];
        if (lastMessage) {
          timeline.push({
            id: conv.id,
            type: conv.channel === 'email' ? 'email' : 'whatsapp',
            timestamp: conv.last_message_at || conv.created_at,
            title: `${conv.channel === 'email' ? 'Email' : 'WhatsApp'} - ${conv.contact?.name}`,
            description: lastMessage.body?.substring(0, 100)
          });
        }
      });

      // Add calls
      calls?.forEach(call => {
        timeline.push({
          id: call.id,
          type: 'call',
          timestamp: call.created_at,
          title: 'Ligação telefônica',
          description: `Duração: ${call.duration_seconds}s`,
          metadata: call
        });
      });

      // Sort by timestamp
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setEvents(timeline.slice(0, 50));
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      case 'meeting': return Video;
      case 'note': return FileText;
      case 'stage_change': return Calendar;
      default: return User;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-600';
      case 'email': return 'text-purple-600';
      case 'whatsapp': return 'text-green-600';
      case 'meeting': return 'text-orange-600';
      case 'stage_change': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando timeline...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-border" />

            {/* Events */}
            {events.map((event, idx) => {
              const Icon = getIcon(event.type);
              const color = getColor(event.type);

              return (
                <div key={event.id} className="relative flex gap-4 pb-6">
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2",
                    color
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <Card className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.timestamp), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    )}
                    {event.type === 'stage_change' && event.metadata && (
                      <Badge variant="outline" className="mt-2">
                        {event.metadata.stage}
                      </Badge>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
