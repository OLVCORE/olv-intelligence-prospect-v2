import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[InitConfig] Criando config padrão para usuário:', user_id);

    // Verificar se já existe config
    const { data: existing } = await supabase
      .from('intelligence_monitoring_config')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      console.log('[InitConfig] Config já existe, pulando criação');
      return new Response(
        JSON.stringify({ success: true, message: 'Config já existe', config_id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar config padrão
    const nextCheckAt = new Date();
    nextCheckAt.setHours(nextCheckAt.getHours() + 6);

    const { data: newConfig, error } = await supabase
      .from('intelligence_monitoring_config')
      .insert({
        user_id,
        target_regions: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
        target_states: null, // null = todos os estados
        is_active: true,
        check_frequency_hours: 6,
        monitor_funding: true,
        monitor_leadership_changes: true,
        monitor_expansion: true,
        monitor_tech_adoption: true,
        monitor_partnerships: true,
        monitor_market_entry: true,
        monitor_digital_transformation: true,
        monitor_competitor_mentions: true,
        competitor_names: ['SAP', 'Oracle', 'Microsoft Dynamics', 'Salesforce', 'Senior', 'Linx', 'Omie', 'Bling'],
        next_check_at: nextCheckAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[InitConfig] Erro ao criar config:', error);
      throw error;
    }

    console.log('[InitConfig] ✅ Config padrão criada com sucesso:', newConfig.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Config padrão criada com sucesso',
        config: newConfig,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[InitConfig] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
