// ✅ Função batch para enriquecer empresas existentes com dados da ReceitaWS
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { force_refresh } = await req.json().catch(() => ({ force_refresh: false }));
    console.log('🚀 Starting batch ReceitaWS enrichment...', force_refresh ? '(FORCE REFRESH MODE)' : '');

    // Buscar todas as empresas com CNPJ que ainda não têm dados da ReceitaWS
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, cnpj, raw_data, industry')
      .not('cnpj', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📊 Found ${companies.length} companies with CNPJ`);

    const results = {
      total: companies.length,
      enriched: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Processar cada empresa
    for (const company of companies) {
      try {
        // Verificar se já tem dados da ReceitaWS (ambos os formatos)
        const hasReceitaData = company.raw_data?.receita || company.raw_data?.receitaws;
        
        if (hasReceitaData && !force_refresh) {
          console.log(`⏭️ Skipping ${company.name} (already has ReceitaWS data)`);
          results.skipped++;
          results.details.push({
            company_id: company.id,
            company_name: company.name,
            status: 'skipped',
            reason: 'Already has ReceitaWS data'
          });
          continue;
        }

        if (hasReceitaData && force_refresh) {
          console.log(`🔄 Force refreshing ${company.name} (already had data)`);
        }

        console.log(`🔄 Enriching ${company.name} (${company.cnpj})...`);

        // Buscar dados da ReceitaWS
        const { data: response } = await supabase.functions.invoke('enrich-receitaws', {
          body: { cnpj: company.cnpj, company_id: company.id }
        });

        if (!response?.data) {
          results.errors++;
          
          // Marcar como inexistente se API retornou erro
          await supabase
            .from('companies')
            .update({ cnpj_status: 'inexistente' })
            .eq('id', company.id);
          
          results.details.push({
            company_id: company.id,
            company_name: company.name,
            status: 'error',
            reason: response?.error || 'CNPJ não encontrado na Receita Federal'
          });
          continue;
        }

        const receitaData = response.data;
        const cnpjStatus = response.cnpj_status || 'pendente';

        // Atualizar a empresa com os dados obtidos
        const updateData: any = {};

        if (receitaData.nome && !company.name) {
          updateData.name = receitaData.nome;
        }

        if (receitaData.fantasia) {
          updateData.name = receitaData.fantasia;
        }

        if (receitaData.atividade_principal?.[0]?.text) {
          updateData.industry = receitaData.atividade_principal[0].text;
        }

        // Merge seguro preservando dados existentes
        const existingRaw = (company.raw_data && typeof company.raw_data === 'object') ? company.raw_data : {};
        updateData.raw_data = {
          ...existingRaw,
          receita: receitaData,
          enriched_at: new Date().toISOString(),
          ...(existingRaw.apollo && { apollo: existingRaw.apollo }),
          ...(existingRaw.segment && { segment: existingRaw.segment }),
          ...(existingRaw.refinamentos && { refinamentos: existingRaw.refinamentos })
        };

        // Construir localização
        if (receitaData.municipio && receitaData.uf) {
          updateData.location = {
            city: receitaData.municipio,
            state: receitaData.uf,
            country: 'Brasil',
            address: [
              receitaData.logradouro,
              receitaData.numero,
              receitaData.complemento,
              receitaData.bairro,
              receitaData.cep
            ].filter(Boolean).join(', ')
          };
        }

        // Adicionar status do CNPJ ao update
        updateData.cnpj_status = cnpjStatus;
        
        const { error: updateError } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', company.id);

        if (updateError) {
          throw updateError;
        }

        // Persistir também em company_enrichment e regenerar relatório
        const { error: enrErr } = await supabase
          .from('company_enrichment')
          .upsert({ company_id: company.id, source: 'receitaws', data: receitaData }, { onConflict: 'company_id,source' });
        if (enrErr) {
          console.warn('⚠️ Failed to upsert company_enrichment (receitaws):', enrErr.message);
        }

        try {
          await supabase.functions.invoke('generate-company-report', { body: { companyId: company.id } });
        } catch (genErr) {
          console.warn('⚠️ Failed to regenerate report:', genErr);
        }

        results.enriched++;
        results.details.push({
          company_id: company.id,
          company_name: company.name,
          cnpj: company.cnpj,
          status: 'enriched',
          data_obtained: {
            name: updateData.name,
            industry: updateData.industry,
            location: updateData.location?.city
          }
        });

        console.log(`✅ Enriched ${company.name}`);

        // Delay para não sobrecarregar a API (1 requisição por segundo)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error enriching ${company.name}:`, error);
        results.errors++;
        results.details.push({
          company_id: company.id,
          company_name: company.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 Batch enrichment completed!`);
    console.log(`   Total: ${results.total}`);
    console.log(`   Enriched: ${results.enriched}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.total,
          enriched: results.enriched,
          skipped: results.skipped,
          errors: results.errors
        },
        details: results.details
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Batch enrichment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
