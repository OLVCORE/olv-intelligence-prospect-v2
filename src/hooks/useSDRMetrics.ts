import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SDRMetrics {
  totalContacts: number;
  activeConversations: number;
  tasksToday: number;
  completedTasks: number;
  responseRate: number;
  avgResponseTime: number;
  conversionRate: number;
  sequencesRunning: number;
  overdueConversations: number;
  newLeadsToday: number;
  totalCompanies: number;
  totalOpportunities: number;
  qualifiedLeadsToday: number;
}

export function useSDRMetrics() {
  const [metrics, setMetrics] = useState<SDRMetrics>({
    totalContacts: 0,
    activeConversations: 0,
    tasksToday: 0,
    completedTasks: 0,
    responseRate: 0,
    avgResponseTime: 0,
    conversionRate: 0,
    sequencesRunning: 0,
    overdueConversations: 0,
    newLeadsToday: 0,
    totalCompanies: 0,
    totalOpportunities: 0,
    qualifiedLeadsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Total contacts
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Active conversations
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'pending']);

      // Tasks today
      const { count: tasksTodayCount } = await supabase
        .from('sdr_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today);

      const { count: completedTasksCount } = await supabase
        .from('sdr_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today)
        .eq('status', 'done');

      // Running sequences
      const { count: sequencesCount } = await supabase
        .from('sdr_sequence_runs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running');

      // Overdue conversations (SLA)
      const { count: overdueCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .lt('sla_due_at', now.toISOString())
        .neq('status', 'closed');

      // New leads today (contacts created today)
      const { count: newLeadsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      // Total companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Calculate response rate (messages with responses)
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id')
        .gte('created_at', `${today}T00:00:00`);

      let responseRate = 0;
      if (conversationsData && conversationsData.length > 0) {
        const conversationsWithResponses = await Promise.all(
          conversationsData.map(async (conv) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('direction', 'in');
            return count ? count > 0 : false;
          })
        );
        const responded = conversationsWithResponses.filter(Boolean).length;
        responseRate = Math.round((responded / conversationsData.length) * 100);
      }

      // Calculate average response time (in minutes)
      const { data: messagesData } = await supabase
        .from('messages')
        .select('conversation_id, created_at, direction')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: true });

      let avgResponseTime = 0;
      if (messagesData && messagesData.length > 0) {
        const conversationTimes: { [key: string]: { out?: string; in?: string } } = {};
        
        messagesData.forEach(msg => {
          if (!conversationTimes[msg.conversation_id]) {
            conversationTimes[msg.conversation_id] = {};
          }
          if (msg.direction === 'out' && !conversationTimes[msg.conversation_id].out) {
            conversationTimes[msg.conversation_id].out = msg.created_at;
          }
          if (msg.direction === 'in' && !conversationTimes[msg.conversation_id].in) {
            conversationTimes[msg.conversation_id].in = msg.created_at;
          }
        });

        const responseTimes = Object.values(conversationTimes)
          .filter(conv => conv.out && conv.in)
          .map(conv => {
            const outTime = new Date(conv.out!).getTime();
            const inTime = new Date(conv.in!).getTime();
            return (inTime - outTime) / (1000 * 60); // minutes
          });

        if (responseTimes.length > 0) {
          avgResponseTime = Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          );
        }
      }

      // Conversion rate REAL - deals won / total deals (unificado)
      const { count: totalOpps } = await supabase
        .from('sdr_deals')
        .select('*', { count: 'exact', head: true });

      const { count: wonOpps } = await supabase
        .from('sdr_deals')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'won');

      const conversionRate = totalOpps && totalOpps > 0 
        ? Math.round((wonOpps || 0) / totalOpps * 100)
        : 0;

      // Qualified leads today (deals created today with stage >= qualified)
      const { count: qualifiedToday } = await supabase
        .from('sdr_deals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .in('stage', ['qualified', 'proposal', 'negotiation', 'won']);

      setMetrics({
        totalContacts: contactsCount || 0,
        activeConversations: conversationsCount || 0,
        tasksToday: tasksTodayCount || 0,
        completedTasks: completedTasksCount || 0,
        responseRate,
        avgResponseTime,
        conversionRate,
        sequencesRunning: sequencesCount || 0,
        overdueConversations: overdueCount || 0,
        newLeadsToday: newLeadsCount || 0,
        totalCompanies: companiesCount || 0,
        totalOpportunities: totalOpps || 0,
        qualifiedLeadsToday: qualifiedToday || 0,
      });
    } catch (err: any) {
      console.error('Error loading SDR metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, error, refresh: loadMetrics };
}
