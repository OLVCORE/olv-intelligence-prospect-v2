import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🔍 Iniciando varredura automática de monitoramento...");

    // Buscar empresas que precisam de verificação
    const { data: companiesToCheck, error: fetchError } = await supabase
      .rpc('get_companies_for_monitoring_check');

    if (fetchError) {
      console.error("Erro ao buscar empresas:", fetchError);
      throw fetchError;
    }

    console.log(`📋 ${companiesToCheck?.length || 0} empresas para verificar`);

    if (!companiesToCheck || companiesToCheck.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Nenhuma empresa precisa de verificação no momento",
          checked: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];
    let notificationsCreated = 0;

    // Processar em lotes para não sobrecarregar
    for (const company of companiesToCheck.slice(0, 20)) { // Limitar a 20 por execução
      console.log(`\n🏢 Verificando: ${company.company_name}`);

      try {
        // 1. Detectar TOTVS
        const { data: totvsData, error: totvsError } = await supabase.functions.invoke(
          'detect-totvs-usage',
          {
            body: {
              company_id: company.company_id,
              company_name: company.company_name,
              company_domain: company.company_domain,
            }
          }
        );

        // 2. Detectar Intent Signals
        const { data: intentData, error: intentError } = await supabase.functions.invoke(
          'detect-intent-signals',
          {
            body: {
              company_id: company.company_id,
              company_name: company.company_name,
              company_domain: company.company_domain,
              cnpj: company.company_cnpj,
            }
          }
        );

        const newTotvsScore = totvsData?.result?.total_score || 0;
        const newIntentScore = intentData?.intent_score || 0;
        const oldTotvsScore = company.last_totvs_score || 0;
        const oldIntentScore = company.last_intent_score || 0;

        // Detectar mudanças significativas
        const totvsIncreased = newTotvsScore > oldTotvsScore && newTotvsScore >= 70;
        const intentIncreased = newIntentScore > oldIntentScore && newIntentScore >= 70;
        const totvsChanged = Math.abs(newTotvsScore - oldTotvsScore) >= 20;
        const intentChanged = Math.abs(newIntentScore - oldIntentScore) >= 20;

        // Criar notificações se houver mudanças significativas
        if (totvsIncreased) {
          // TOTVS detectado - DESQUALIFICAR
          await supabase.from('sdr_notifications').insert({
            user_id: company.user_id,
            type: 'totvs_detected',
            title: `⛔ ${company.company_name} - TOTVS Detectado`,
            message: `Score aumentou para ${newTotvsScore}/100. Lead desqualificado automaticamente.`,
            metadata: {
              company_id: company.company_id,
              company_name: company.company_name,
              old_score: oldTotvsScore,
              new_score: newTotvsScore,
              sources: totvsData?.result?.sources || []
            }
          });
          notificationsCreated++;
        }

        if (intentIncreased) {
          // HOT LEAD detectado!
          await supabase.from('sdr_notifications').insert({
            user_id: company.user_id,
            type: 'hot_lead',
            title: `🔥 ${company.company_name} - HOT LEAD Detectado!`,
            message: `Score de intenção aumentou para ${newIntentScore}/100. Contatar AGORA!`,
            metadata: {
              company_id: company.company_id,
              company_name: company.company_name,
              old_score: oldIntentScore,
              new_score: newIntentScore,
              signals_count: intentData?.signals_detected || 0
            }
          });
          notificationsCreated++;
        }

        if (totvsChanged && !totvsIncreased) {
          await supabase.from('sdr_notifications').insert({
            user_id: company.user_id,
            type: 'totvs_change',
            title: `📊 ${company.company_name} - Score TOTVS Alterado`,
            message: `Score mudou de ${oldTotvsScore} para ${newTotvsScore}/100.`,
            metadata: {
              company_id: company.company_id,
              company_name: company.company_name,
              old_score: oldTotvsScore,
              new_score: newTotvsScore
            }
          });
          notificationsCreated++;
        }

        if (intentChanged && !intentIncreased) {
          await supabase.from('sdr_notifications').insert({
            user_id: company.user_id,
            type: 'intent_change',
            title: `📈 ${company.company_name} - Sinais de Intenção Atualizados`,
            message: `Score mudou de ${oldIntentScore} para ${newIntentScore}/100.`,
            metadata: {
              company_id: company.company_id,
              company_name: company.company_name,
              old_score: oldIntentScore,
              new_score: newIntentScore
            }
          });
          notificationsCreated++;
        }

        // Atualizar tracking de monitoramento
        await supabase
          .from('company_monitoring')
          .update({
            last_totvs_check_at: new Date().toISOString(),
            last_intent_check_at: new Date().toISOString(),
            last_totvs_score: newTotvsScore,
            last_intent_score: newIntentScore,
          })
          .eq('id', company.monitoring_id);

        results.push({
          company: company.company_name,
          success: true,
          totvs_score: newTotvsScore,
          intent_score: newIntentScore,
          notifications_sent: totvsIncreased || intentIncreased || totvsChanged || intentChanged ? 1 : 0
        });

        console.log(`✅ ${company.company_name}: TOTVS ${newTotvsScore}, Intent ${newIntentScore}`);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error(`❌ Erro ao verificar ${company.company_name}:`, err);
        results.push({
          company: company.company_name,
          success: false,
          error: errorMessage
        });
      }

      // Pequeno delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✨ Varredura concluída: ${results.length} empresas verificadas, ${notificationsCreated} notificações criadas`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: results.length,
        notifications_created: notificationsCreated,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro no cron job:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
