import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { force_refresh } = await req.json().catch(() => ({ force_refresh: false }));
    console.log('🔄 Starting batch enrichment for all companies...', force_refresh ? '(FORCE REFRESH MODE)' : '');

    // Busca empresas com CNPJ
    const { data: companies, error: fetchError } = await supabaseClient
      .from('companies')
      .select(`
        id,
        name,
        cnpj,
        website,
        linkedin_url,
        digital_maturity_score,
        digital_maturity (id)
      `)
      .not('cnpj', 'is', null)
      .limit(50); // Processa 50 por vez para não sobrecarregar

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📊 Found ${companies?.length || 0} companies to enrich`);

    const results = {
      total: companies?.length || 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Processa cada empresa
    for (const company of companies || []) {
      try {
        // Verificar se já tem análise completa
        const hasAnalysis = company.digital_maturity_score !== null;
        
        if (hasAnalysis && !force_refresh) {
          console.log(`⏭️ Skipping ${company.name} (already has 360° analysis)`);
          results.skipped++;
          results.details.push({
            company_id: company.id,
            company_name: company.name,
            status: 'skipped',
            reason: 'Already has 360° analysis'
          });
          continue;
        }

        if (hasAnalysis && force_refresh) {
          console.log(`🔄 Force refreshing ${company.name} (already had analysis)`);
        }

        console.log(`🚀 Enriching: ${company.name}`);
        
        const { data, error: enrichError } = await supabaseClient.functions.invoke('enrich-company-360', {
          body: {
            company_id: company.id
          }
        });

        if (enrichError) {
          throw enrichError;
        }

        results.processed++;
        console.log(`✅ ${company.name} enriched successfully`);

        // Aguarda 2 segundos entre cada empresa para não sobrecarregar APIs
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to enrich ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`🎉 Batch enrichment completed: ${results.processed} success, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error in batch enrichment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
