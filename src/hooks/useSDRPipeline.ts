import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  company_id: string;
  contact_id: string;
  stage: string;
  value: number;
  probability: number;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string; website?: string; industry?: string };
  contact?: { name: string; email?: string; phone?: string };
  conversation_id?: string;
  canvas_id?: string;
}

export function useSDRPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get conversations with companies and contacts
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          company_id,
          contact_id,
          status,
          priority,
          created_at,
          updated_at,
          company:companies(id, name, website, industry),
          contact:contacts(id, name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      // Map conversations to leads with estimated values
      const leadsData: Lead[] = (conversations || []).map(conv => {
        // Map status to stage
        let stage = 'new';
        if (conv.status === 'open') stage = 'contacted';
        if (conv.status === 'pending') stage = 'qualified';
        if (conv.status === 'closed') stage = 'won';

        // Estimate value based on company industry and priority
        let estimatedValue = 50000;
        if (conv.priority === 'high') estimatedValue = 120000;
        if (conv.priority === 'medium') estimatedValue = 75000;
        if (conv.priority === 'low') estimatedValue = 30000;

        // Calculate probability based on stage
        let probability = 20;
        if (stage === 'contacted') probability = 40;
        if (stage === 'qualified') probability = 60;
        if (stage === 'proposal') probability = 75;
        if (stage === 'negotiation') probability = 85;
        if (stage === 'won') probability = 100;

        return {
          id: conv.id,
          company_id: conv.company_id || '',
          contact_id: conv.contact_id || '',
          stage,
          value: estimatedValue,
          probability,
          next_action: 'Follow-up agendado',
          next_action_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          company: conv.company as any,
          contact: conv.contact as any,
          conversation_id: conv.id,
        };
      });

      setLeads(leadsData);
    } catch (err: any) {
      console.error('Error loading pipeline:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: string) => {
    try {
      // Update conversation status based on stage
      let status = 'open';
      if (newStage === 'new') status = 'open';
      if (newStage === 'contacted') status = 'open';
      if (newStage === 'qualified') status = 'pending';
      if (newStage === 'won') status = 'closed';

      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      setLeads(leads.map(lead =>
        lead.id === leadId ? { ...lead, stage: newStage } : lead
      ));
    } catch (err: any) {
      console.error('Error updating lead stage:', err);
      throw err;
    }
  };

  return { leads, loading, error, refresh: loadLeads, updateLeadStage };
}
