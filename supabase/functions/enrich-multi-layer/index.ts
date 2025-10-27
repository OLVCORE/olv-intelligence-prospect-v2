import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentResult {
  layer: string;
  source: string;
  success: boolean;
  data?: any;
  fields_enriched?: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, cnpj, force_premium = false } = await req.json();
    
    if (!companyId || !cnpj) {
      return new Response(
        JSON.stringify({ error: 'companyId e CNPJ são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Multi-Layer] 🚀 Iniciando enriquecimento multi-camadas para:', cnpj);

    const results: EnrichmentResult[] = [];
    let totalFieldsEnriched = 0;

    // ============================================
    // LAYER 1: EmpresaQui (Ilimitado)
    // ============================================
    console.log('[Multi-Layer] 📊 LAYER 1: EmpresaQui');
    try {
      const empresaquiResponse = await supabase.functions.invoke('enrich-empresaqui', {
        body: { cnpj, companyId }
      });

      if (empresaquiResponse.data?.success) {
        results.push({
          layer: 'layer_1',
          source: 'empresaqui',
          success: true,
          fields_enriched: empresaquiResponse.data.enriched_fields,
          data: empresaquiResponse.data.data
        });
        totalFieldsEnriched += empresaquiResponse.data.enriched_fields || 0;
        console.log('[Multi-Layer] ✅ EmpresaQui concluído');
      } else {
        results.push({
          layer: 'layer_1',
          source: 'empresaqui',
          success: false,
          error: empresaquiResponse.error?.message || 'Erro desconhecido'
        });
        console.log('[Multi-Layer] ⚠️ EmpresaQui falhou, continuando...');
      }
    } catch (error: any) {
      results.push({
        layer: 'layer_1',
        source: 'empresaqui',
        success: false,
        error: error.message
      });
    }

    // ============================================
    // LAYER 2: Apollo.io (Decisores)
    // ============================================
    console.log('[Multi-Layer] 👥 LAYER 2: Apollo.io');
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('name, website')
        .eq('id', companyId)
        .single();

      if (company) {
        // Buscar organização
        const apolloOrgResponse = await supabase.functions.invoke('enrich-apollo', {
          body: { 
            type: 'organization',
            name: company.name,
            domain: company.website
          }
        });

        if (apolloOrgResponse.data?.organization) {
          console.log('[Multi-Layer] ✅ Apollo organização encontrada');
          
          // Buscar decisores da organização
          const apolloPeopleResponse = await supabase.functions.invoke('enrich-apollo', {
            body: { 
              type: 'people',
              organizationName: company.name,
              domain: company.website,
              titles: ['CEO', 'CTO', 'CFO', 'CMO', 'COO', 'Diretor', 'VP', 'Gerente', 'Head']
            }
          });

          if (apolloPeopleResponse.data?.people) {
            const people = apolloPeopleResponse.data.people;
            console.log('[Multi-Layer] 👥 Apollo decisores encontrados:', people.length);

            // Salvar decisores
            for (const person of people) {
              await supabase.from('decision_makers').upsert({
                company_id: companyId,
                name: person.name,
                role: person.title,
                email: person.email,
                linkedin_url: person.linkedin_url,
                phone: person.phone_numbers?.[0]?.raw_number,
                source: 'apollo',
                enriched_at: new Date().toISOString(),
                metadata: {
                  email_status: person.email_status,
                  seniority: person.seniority,
                  functions: person.functions
                }
              }, {
                onConflict: 'company_id,name'
              });
            }

            results.push({
              layer: 'layer_2',
              source: 'apollo',
              success: true,
              fields_enriched: people.length,
              data: { people_count: people.length }
            });
            totalFieldsEnriched += people.length;
            console.log('[Multi-Layer] ✅ Apollo concluído');
          }
        }
      }
    } catch (error: any) {
      results.push({
        layer: 'layer_2',
        source: 'apollo',
        success: false,
        error: error.message
      });
      console.log('[Multi-Layer] ⚠️ Apollo falhou:', error.message);
    }

    // ============================================
    // LAYER 2: ReceitaWS (Free)
    // ============================================
    console.log('[Multi-Layer] 📋 LAYER 2: ReceitaWS');
    try {
      const receitaResponse = await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj, companyId }
      });

      if (receitaResponse.data?.success) {
        results.push({
          layer: 'layer_2',
          source: 'receitaws',
          success: true,
          fields_enriched: 10
        });
        totalFieldsEnriched += 10;
        console.log('[Multi-Layer] ✅ ReceitaWS concluído');
      }
    } catch (error: any) {
      results.push({
        layer: 'layer_2',
        source: 'receitaws',
        success: false,
        error: error.message
      });
    }

    // ============================================
    // LAYER 3: Econodata (Premium - Seletivo)
    // ============================================
    if (force_premium) {
      console.log('[Multi-Layer] 💎 LAYER 3: Econodata (Premium)');
      
      // Verificar quota mensal
      const { data: usage } = await supabase
        .from('enrichment_usage')
        .select('count')
        .eq('source', 'econodata')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .single();

      const currentUsage = usage?.count || 0;
      const ECONODATA_MONTHLY_LIMIT = 50;

      if (currentUsage >= ECONODATA_MONTHLY_LIMIT) {
        results.push({
          layer: 'layer_3',
          source: 'econodata',
          success: false,
          error: `Limite mensal atingido (${currentUsage}/${ECONODATA_MONTHLY_LIMIT})`
        });
        console.log('[Multi-Layer] ⚠️ Econodata: limite mensal atingido');
      } else {
        try {
          const econodataResponse = await supabase.functions.invoke('enrich-econodata', {
            body: { cnpj, companyId }
          });

          if (econodataResponse.data?.success) {
            // Incrementar contador de uso
            await supabase.from('enrichment_usage').insert({
              source: 'econodata',
              company_id: companyId,
              count: 1
            });

            results.push({
              layer: 'layer_3',
              source: 'econodata',
              success: true,
              fields_enriched: 50
            });
            totalFieldsEnriched += 50;
            console.log('[Multi-Layer] ✅ Econodata concluído (${currentUsage + 1}/${ECONODATA_MONTHLY_LIMIT})');
          }
        } catch (error: any) {
          results.push({
            layer: 'layer_3',
            source: 'econodata',
            success: false,
            error: error.message
          });
        }
      }
    } else {
      console.log('[Multi-Layer] ⏭️ Econodata pulado (não prioritário)');
    }

    // Atualizar timestamp de enriquecimento
    await supabase
      .from('companies')
      .update({ 
        enriched_at: new Date().toISOString(),
        enrichment_layers: results.length
      })
      .eq('id', companyId);

    console.log('[Multi-Layer] 🎉 Enriquecimento completo! Total de campos:', totalFieldsEnriched);

    return new Response(
      JSON.stringify({ 
        success: true,
        company_id: companyId,
        total_fields_enriched: totalFieldsEnriched,
        layers_executed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Multi-Layer] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
