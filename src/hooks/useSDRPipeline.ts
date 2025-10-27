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
  title?: string;
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
      // Get REAL opportunities from sdr_deals table (unificado)
      const { data: opportunities, error: oppError } = await supabase
        .from('sdr_deals')
        .select(`
          id,
          company_id,
          contact_id,
          title,
          stage,
          value,
          probability,
          created_at,
          updated_at,
          company:companies(id, name, website, industry),
          contact:contacts(id, name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (oppError) throw oppError;

      // Map to Lead interface
      const leadsData: Lead[] = (opportunities || []).map(opp => ({
        id: opp.id,
        company_id: opp.company_id || '',
        contact_id: opp.contact_id || '',
        stage: opp.stage,
        value: Number(opp.value) || 0,
        probability: opp.probability || 0,
        next_action: 'Follow-up agendado',
        next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: opp.created_at,
        updated_at: opp.updated_at,
        company: opp.company as any,
        contact: opp.contact as any,
        conversation_id: undefined,
        canvas_id: undefined,
        title: opp.title,
      }));

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
      // Update opportunity stage in sdr_deals table (unificado)
      const { error } = await supabase
        .from('sdr_deals')
        .update({ 
          stage: newStage,
          won_date: newStage === 'won' ? new Date().toISOString() : null,
        })
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
