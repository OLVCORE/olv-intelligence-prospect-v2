// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { suggested_company_id } = await req.json();

    if (!suggested_company_id) {
      return new Response(JSON.stringify({ 
        error: 'suggested_company_id required'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar empresa sugerida
    const { data: suggestedCompany, error: fetchError } = await sb
      .from('suggested_companies')
      .select('*')
      .eq('id', suggested_company_id)
      .single();

    if (fetchError || !suggestedCompany) {
      throw new Error('Empresa sugerida não encontrada');
    }

    console.log(`[validate-enrich] Validando: ${suggestedCompany.company_name}`);

    let cnpjValidated = false;
    let receitaWsData = null;

    // 1. VALIDAR CNPJ (ReceitaWS)
    if (suggestedCompany.cnpj) {
      console.log(`[validate-enrich] Validando CNPJ: ${suggestedCompany.cnpj}`);

      try {
        const cnpjClean = suggestedCompany.cnpj.replace(/\D/g, '');
        const receitaUrl = `https://www.receitaws.com.br/v1/cnpj/${cnpjClean}`;
        const receitaRes = await fetch(receitaUrl);

        if (receitaRes.ok) {
          receitaWsData = await receitaRes.json();
          
          if (receitaWsData.status === 'OK') {
            cnpjValidated = true;
            console.log(`[validate-enrich] ✅ CNPJ válido: ${receitaWsData.nome}`);
          } else {
            console.log(`[validate-enrich] ❌ CNPJ inválido`);
          }
        }
      } catch (e) {
        console.error('[validate-enrich] Erro ReceitaWS:', e);
      }
    }

    // 2. ENRIQUECER COM APOLLO
    let apolloData = null;
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');

    if (apolloApiKey && suggestedCompany.domain) {
      console.log(`[validate-enrich] Enriquecendo com Apollo: ${suggestedCompany.domain}`);

      try {
        const apolloUrl = 'https://api.apollo.io/v1/organizations/enrich';
        const apolloRes = await fetch(apolloUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apolloApiKey
          },
          body: JSON.stringify({
            domain: suggestedCompany.domain
          })
        });

        if (apolloRes.ok) {
          apolloData = await apolloRes.json();
          console.log(`[validate-enrich] ✅ Apollo: ${apolloData.organization?.name || 'N/A'}`);
        }
      } catch (e) {
        console.error('[validate-enrich] Erro Apollo:', e);
      }
    }

    // Atualizar empresa sugerida
    await sb
      .from('suggested_companies')
      .update({
        cnpj_validated: cnpjValidated,
        receita_ws_data: receitaWsData,
        apollo_data: apolloData,
        status: cnpjValidated ? 'validated' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', suggested_company_id);

    console.log(`[validate-enrich] ✅ Empresa validada e enriquecida`);

    return new Response(JSON.stringify({
      ok: true,
      cnpj_validated: cnpjValidated,
      has_apollo_data: !!apolloData,
      company_name: receitaWsData?.nome || suggestedCompany.company_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[validate-enrich] ERRO:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
