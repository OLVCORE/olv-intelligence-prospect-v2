import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { suggestionId, action } = await req.json();
    
    console.log('[AI Copilot Execute] Executando ação:', action.type);

    let result;

    switch (action.type) {
      case 'create_task':
        // Criar tarefa de follow-up
        result = await supabase
          .from('sdr_tasks')
          .insert({
            deal_id: action.payload.dealId,
            title: 'Follow-up sugerido pelo Copilot',
            description: 'Retomar contato e manter deal aquecido',
            priority: 'high',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'todo'
          })
          .select()
          .single();
        break;

      case 'update_deal':
        // Atualizar deal
        result = await supabase
          .from('sdr_deals')
          .update(action.payload.updates)
          .eq('id', action.payload.dealId)
          .select()
          .single();
        break;

      case 'send_message':
        // Preparar mensagem (criar rascunho)
        result = await supabase
          .from('messages')
          .insert({
            conversation_id: action.payload.conversationId,
            content: action.payload.content,
            direction: 'outbound',
            status: 'draft'
          })
          .select()
          .single();
        break;

      case 'navigate':
        // Navegação é tratada no frontend
        result = { success: true, url: action.payload.url };
        break;

      case 'create_proposal':
        // Iniciar criação de proposta
        result = await supabase
          .from('visual_proposals')
          .insert({
            company_id: action.payload.companyId,
            status: 'draft',
            sections: []
          })
          .select()
          .single();

        // Vincular ao deal
        if (result.data) {
          await supabase
            .from('sdr_deals')
            .update({ proposal_id: result.data.id })
            .eq('id', action.payload.dealId);
        }
        break;

      default:
        throw new Error(`Tipo de ação desconhecido: ${action.type}`);
    }

    console.log('[AI Copilot Execute] Ação executada com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: result?.data || result,
        suggestionId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Copilot Execute] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
