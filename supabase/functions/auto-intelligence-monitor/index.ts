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

    console.log('[AutoMonitor] 🚀 Iniciando varredura automática de intelligence...');

    // 1. Buscar todas as configurações ativas que precisam de verificação
    const { data: configs, error: configError } = await supabase
      .from('intelligence_monitoring_config')
      .select('*')
      .eq('is_active', true)
      .or(`next_check_at.is.null,next_check_at.lte.${new Date().toISOString()}`);

    if (configError) {
      console.error('[AutoMonitor] Erro ao buscar configs:', configError);
      throw configError;
    }

    if (!configs || configs.length === 0) {
      console.log('[AutoMonitor] ℹ️ Nenhuma configuração ativa para monitorar');
      return new Response(
        JSON.stringify({ success: true, configs_checked: 0, message: 'Nenhuma config ativa' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AutoMonitor] 📊 ${configs.length} config(s) encontradas para monitorar`);

    const results = [];

    for (const config of configs) {
      console.log(`[AutoMonitor] 🔍 Processando config ${config.id} do usuário ${config.user_id}`);

      try {
        // 2. Buscar empresas que atendem aos critérios de filtro
        let query = supabase
          .from('companies')
          .select('id, name, domain, cnpj, headquarters_state, industry')
          .eq('is_disqualified', false);

        // Filtro por estados
        if (config.target_states && config.target_states.length > 0) {
          query = query.in('headquarters_state', config.target_states);
        }

        // Filtro por tamanho (employees)
        if (config.min_employees) {
          query = query.gte('employees', config.min_employees);
        }
        if (config.max_employees) {
          query = query.lte('employees', config.max_employees);
        }

        // Limitar a 50 empresas por vez para não sobrecarregar
        query = query.limit(50);

        const { data: companies, error: companiesError } = await query;

        if (companiesError) {
          console.error(`[AutoMonitor] Erro ao buscar empresas:`, companiesError);
          continue;
        }

        console.log(`[AutoMonitor] 🏢 ${companies?.length || 0} empresas encontradas para monitorar`);

        // 3. Para cada empresa, executar detecção de sinais se habilitado
        let signalsDetected = 0;
        let opportunitiesDetected = 0;

        if (companies && companies.length > 0) {
          for (const company of companies) {
            // Detectar Buying Signals se habilitado
            if (config.monitor_funding || 
                config.monitor_leadership_changes || 
                config.monitor_expansion || 
                config.monitor_tech_adoption || 
                config.monitor_partnerships || 
                config.monitor_market_entry || 
                config.monitor_digital_transformation) {
              
              try {
                console.log(`[AutoMonitor] 🔎 Detectando sinais para ${company.name}...`);
                
                const detectResponse = await supabase.functions.invoke('detect-buying-signals', {
                  body: {
                    company_id: company.id,
                    company_name: company.name,
                    domain: company.domain,
                  },
                });

                if (detectResponse.data?.signals_detected > 0) {
                  signalsDetected += detectResponse.data.signals_detected;
                  console.log(`[AutoMonitor] ✅ ${detectResponse.data.signals_detected} sinais detectados`);
                }
              } catch (error) {
                console.error(`[AutoMonitor] Erro ao detectar sinais para ${company.name}:`, error);
              }
            }

            // Detectar Displacement Opportunities se habilitado
            if (config.monitor_competitor_mentions && config.competitor_names && config.competitor_names.length > 0) {
              try {
                console.log(`[AutoMonitor] 🎯 Analisando displacement para ${company.name}...`);
                
                const displacementResponse = await supabase.functions.invoke('analyze-displacement-opportunities', {
                  body: {
                    company_id: company.id,
                    company_name: company.name,
                    competitors: config.competitor_names,
                  },
                });

                if (displacementResponse.data?.opportunities_detected > 0) {
                  opportunitiesDetected += displacementResponse.data.opportunities_detected;
                  console.log(`[AutoMonitor] ✅ ${displacementResponse.data.opportunities_detected} oportunidades detectadas`);
                }
              } catch (error) {
                console.error(`[AutoMonitor] Erro ao analisar displacement para ${company.name}:`, error);
              }
            }

            // Pausa de 1s entre empresas para não sobrecarregar APIs externas
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // 4. Atualizar config com próximo horário de verificação
        const nextCheckAt = new Date();
        nextCheckAt.setHours(nextCheckAt.getHours() + config.check_frequency_hours);

        const { error: updateError } = await supabase
          .from('intelligence_monitoring_config')
          .update({
            last_check_at: new Date().toISOString(),
            next_check_at: nextCheckAt.toISOString(),
          })
          .eq('id', config.id);

        if (updateError) {
          console.error(`[AutoMonitor] Erro ao atualizar config:`, updateError);
        }

        results.push({
          config_id: config.id,
          user_id: config.user_id,
          companies_checked: companies?.length || 0,
          signals_detected: signalsDetected,
          opportunities_detected: opportunitiesDetected,
          next_check_at: nextCheckAt.toISOString(),
        });

        console.log(`[AutoMonitor] ✅ Config ${config.id} processada: ${signalsDetected} sinais, ${opportunitiesDetected} oportunidades`);

      } catch (error) {
        console.error(`[AutoMonitor] Erro ao processar config ${config.id}:`, error);
        results.push({
          config_id: config.id,
          user_id: config.user_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`[AutoMonitor] 🎉 Varredura concluída: ${configs.length} configs processadas`);

    return new Response(
      JSON.stringify({
        success: true,
        configs_checked: configs.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[AutoMonitor] ❌ Erro crítico:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
