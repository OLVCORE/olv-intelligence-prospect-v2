import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing company id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Delete Company] Iniciando exclusão em cascata para:', id);

    // 1) Apagar decisores, maturidade e sinais
    await supabase.from('decision_makers').delete().eq('company_id', id);
    await supabase.from('digital_maturity').delete().eq('company_id', id);
    await supabase.from('governance_signals').delete().eq('company_id', id);
    await supabase.from('insights').delete().eq('company_id', id);
    await supabase.from('risks').delete().eq('company_id', id);
    await supabase.from('pitches').delete().eq('company_id', id);
    await supabase.from('reputation_data').delete().eq('company_id', id);
    await supabase.from('news_mentions').delete().eq('company_id', id);
    await supabase.from('financial_data').delete().eq('company_id', id);
    await supabase.from('digital_presence').delete().eq('company_id', id);

    // 2) Apagar mensagens ligadas às conversas da empresa
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', id);

    if (conversations && conversations.length > 0) {
      const convIds = conversations.map((c: any) => c.id);
      await supabase.from('messages').delete().in('conversation_id', convIds);
    }

    // 3) Apagar conversas
    await supabase.from('conversations').delete().eq('company_id', id);

    // 4) Apagar canvas e comentários/versões
    const { data: canvases } = await supabase
      .from('canvas')
      .select('id')
      .eq('company_id', id);

    if (canvases && canvases.length > 0) {
      const canvasIds = canvases.map((c: any) => c.id);
      await supabase.from('canvas_comments').delete().in('canvas_id', canvasIds);
      await supabase.from('canvas_versions').delete().in('canvas_id', canvasIds);
      await supabase.from('canvas').delete().in('id', canvasIds);
    }

    // 5) Finalmente, apagar a empresa
    const { error: companyDeleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (companyDeleteError) throw companyDeleteError;

    console.log('[Delete Company] ✅ Exclusão concluída:', id);

    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Delete Company] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao excluir empresa' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});