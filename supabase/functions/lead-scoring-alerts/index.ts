import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id, action } = await req.json();

    console.log(`[Lead Scoring] Action: ${action}, Company: ${company_id}`);

    // ============================================
    // ACTION: Calcular score de uma empresa
    // ============================================
    if (action === 'calculate_score' && company_id) {
      const { data, error } = await supabase.rpc('calculate_lead_score', {
        p_company_id: company_id
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          score: data,
          message: `Lead score calculado: ${data} pontos` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: Recalcular scores em lote
    // ============================================
    if (action === 'recalculate_batch') {
      const { batch_size = 100 } = await req.json();

      const { data, error } = await supabase.rpc('recalculate_all_lead_scores', {
        batch_size
      });

      if (error) throw error;

      const hot_leads = data?.filter((c: any) => c.new_score >= 75) || [];
      const updated_count = data?.length || 0;

      console.log(`[Lead Scoring] Recalculados: ${updated_count} empresas, ${hot_leads.length} hot leads`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count,
          hot_leads_count: hot_leads.length,
          hot_leads: hot_leads.map((c: any) => ({
            company_id: c.company_id,
            company_name: c.company_name,
            score: c.new_score
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: Buscar hot leads (score >= 75)
    // ============================================
    if (action === 'get_hot_leads') {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, lead_score, lead_score_updated_at, totvs_detection_score, digital_maturity_score')
        .gte('lead_score', 75)
        .eq('is_disqualified', false)
        .order('lead_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          hot_leads: data || [],
          count: data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ACTION: Sugerir próximas ações baseado no score
    // ============================================
    if (action === 'suggest_actions' && company_id) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select(`
          id, 
          name, 
          lead_score, 
          digital_maturity_score,
          totvs_detection_score
        `)
        .eq('id', company_id)
        .single();

      if (companyError) throw companyError;

      const score = company.lead_score || 0;
      let suggestions = [];

      if (score >= 75) {
        suggestions = [
          {
            action: 'schedule_meeting',
            priority: 'high',
            title: 'Agendar reunião executiva',
            description: 'Hot lead com alto potencial - contato direto urgente'
          },
          {
            action: 'prepare_proposal',
            priority: 'high',
            title: 'Preparar proposta personalizada',
            description: 'Empresa pronta para receber proposta comercial'
          },
          {
            action: 'activate_monitoring',
            priority: 'medium',
            title: 'Ativar monitoramento contínuo',
            description: 'Acompanhar sinais de intenção em tempo real'
          }
        ];
      } else if (score >= 50) {
        suggestions = [
          {
            action: 'nurture_campaign',
            priority: 'medium',
            title: 'Iniciar campanha de nutrição',
            description: 'Lead qualificado mas precisa de mais engajamento'
          },
          {
            action: 'educational_content',
            priority: 'medium',
            title: 'Enviar conteúdo educativo',
            description: 'Compartilhar cases e ROI do TOTVS'
          }
        ];
      } else {
        suggestions = [
          {
            action: 'research_more',
            priority: 'low',
            title: 'Pesquisar mais informações',
            description: 'Lead com baixo score - enriquecer dados primeiro'
          },
          {
            action: 'monitor_signals',
            priority: 'low',
            title: 'Monitorar sinais de compra',
            description: 'Aguardar sinais de intenção antes de abordar'
          }
        ];
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          company: {
            id: company.id,
            name: company.name,
            lead_score: score
          },
          suggestions
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Lead Scoring Error]', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
