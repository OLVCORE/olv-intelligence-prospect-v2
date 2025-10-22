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
    const { company, decision_makers, digital_maturity } = await req.json();
    
    console.log('[Save Company] Iniciando salvamento:', company.name);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Salvar empresa no banco
    const { data: savedCompany, error: companyError } = await supabase
      .from('companies')
      .upsert(company, { onConflict: 'cnpj' })
      .select()
      .single();

    if (companyError) throw companyError;
    console.log('[Save Company] Empresa salva:', savedCompany.id);

    // 2. Salvar decisores
    if (decision_makers && decision_makers.length > 0) {
      const decisorsPayload = decision_makers.map((person: any) => ({
        company_id: savedCompany.id,
        ...person
      }));

      await supabase.from('decision_makers').insert(decisorsPayload);
      console.log('[Save Company] Decisores salvos:', decision_makers.length);
    }

    // 3. Salvar maturidade digital
    if (digital_maturity) {
      await supabase.from('digital_maturity').insert({
        company_id: savedCompany.id,
        infrastructure_score: digital_maturity.infrastructure,
        systems_score: digital_maturity.systems,
        processes_score: digital_maturity.processes,
        security_score: digital_maturity.security,
        innovation_score: digital_maturity.innovation,
        overall_score: digital_maturity.overall,
        analysis_data: digital_maturity.analysis_data
      });

      // Atualizar score na empresa
      await supabase
        .from('companies')
        .update({ digital_maturity_score: digital_maturity.overall })
        .eq('id', savedCompany.id);
        
      console.log('[Save Company] Maturidade digital salva');
    }

    // 4. Registrar no histórico
    await supabase.from('search_history').insert({
      query: company.name || company.cnpj,
      filters: company.raw_data?.refinamentos || {},
      results_count: 1
    });

    // 5. Buscar dados completos para retornar
    const { data: fullCompany } = await supabase
      .from('companies')
      .select(`
        *,
        decision_makers (*),
        digital_maturity (*),
        buying_signals (*)
      `)
      .eq('id', savedCompany.id)
      .single();

    console.log('[Save Company] ✅ Salvamento concluído');

    // 🚀 Dispara análise automática em background (sem esperar)
    supabase.functions.invoke('auto-enrich-company', {
      body: {
        companyId: fullCompany.id,
        cnpj: fullCompany.cnpj,
        name: fullCompany.name,
        website: fullCompany.website,
        linkedin_url: fullCompany.linkedin_url
      }
    }).then(() => {
      console.log(`✅ Auto-enrichment started for ${fullCompany.name}`);
    }).catch(err => {
      console.error(`❌ Failed to start auto-enrichment for ${fullCompany.name}:`, err);
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        company: fullCompany
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Save Company] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
