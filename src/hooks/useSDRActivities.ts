import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Activity {
  id: string;
  type: 'task' | 'message' | 'sequence' | 'conversion' | 'contact' | 'company';
  description: string;
  timestamp: string;
  priority?: string;
  metadata?: {
    company_id?: string;
    company_name?: string;
    contact_id?: string;
    contact_name?: string;
  };
}

export function useSDRActivities(limit: number = 20) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();

    // Realtime updates
    const channel = supabase
      .channel('sdr-activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sdr_tasks' }, loadActivities)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadActivities)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, loadActivities)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      const activitiesList: Activity[] = [];

      // Recent tasks
      const { data: tasks } = await supabase
        .from('sdr_tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          company:companies(id, name),
          contact:contacts(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit / 2);

      if (tasks) {
        tasks.forEach(task => {
          activitiesList.push({
            id: task.id,
            type: 'task',
            description: task.title,
            timestamp: task.created_at,
            metadata: {
              company_id: (task.company as any)?.id,
              company_name: (task.company as any)?.name,
              contact_id: (task.contact as any)?.id,
              contact_name: (task.contact as any)?.name,
            },
          });
        });
      }

      // Recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          body,
          direction,
          created_at,
          conversation:conversations(
            id,
            company:companies(id, name),
            contact:contacts(id, name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit / 2);

      if (messages) {
        messages.forEach(msg => {
          const conv = (msg.conversation as any);
          activitiesList.push({
            id: msg.id,
            type: 'message',
            description: msg.direction === 'out' 
              ? `Mensagem enviada: ${msg.body.substring(0, 50)}...`
              : `Mensagem recebida: ${msg.body.substring(0, 50)}...`,
            timestamp: msg.created_at,
            metadata: {
              company_id: conv?.company?.id,
              company_name: conv?.company?.name,
              contact_id: conv?.contact?.id,
              contact_name: conv?.contact?.name,
            },
          });
        });
      }

      // Recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select(`
          id,
          name,
          created_at,
          company:companies(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit / 4);

      if (contacts) {
        contacts.forEach(contact => {
          activitiesList.push({
            id: contact.id,
            type: 'contact',
            description: `Novo contato adicionado: ${contact.name}`,
            timestamp: contact.created_at,
            metadata: {
              company_id: (contact.company as any)?.id,
              company_name: (contact.company as any)?.name,
              contact_id: contact.id,
              contact_name: contact.name,
            },
          });
        });
      }

      // Sort by timestamp
      activitiesList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activitiesList.slice(0, limit));
    } catch (err: any) {
      console.error('Error loading activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { activities, loading, error, refresh: loadActivities };
}
