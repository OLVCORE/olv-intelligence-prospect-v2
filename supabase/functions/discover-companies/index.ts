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
    const { 
      user_id, 
      discovery_batch_id, 
      sector_code, 
      niche_code, 
      state, 
      city,
      source_company_id,
      search_mode
    } = await req.json();

    if (!user_id || !niche_code || !state) {
      return new Response(JSON.stringify({ 
        error: 'user_id, niche_code, state required',
        hint: 'Preencha nicho e estado'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[discover-companies] Modo: ${search_mode} | Nicho: ${niche_code} | Estado: ${state}`);

    // Buscar nicho
    const { data: niche, error: nicheError } = await sb
      .from('niches')
      .select('*')
      .eq('niche_code', niche_code)
      .single();

    if (nicheError || !niche) {
      throw new Error('Nicho não encontrado');
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!googleApiKey || !googleCseId) {
      throw new Error('Google API not configured');
    }

    const suggestedCompanies: any[] = [];

    // MODO 1: BUSCAR EMPRESAS SIMILARES
    if (search_mode === 'similar' && source_company_id) {
      console.log(`[discover-companies] Buscando similares à: ${source_company_id}`);

      const { data: sourceCompany } = await sb
        .from('companies')
        .select('*')
        .eq('id', source_company_id)
        .single();

      if (!sourceCompany) {
        throw new Error('Empresa base não encontrada');
      }

      const nicheKeywords = niche.keywords.slice(0, 3).map((k: string) => `"${k}"`).join(' OR ');
      const query = `(${nicheKeywords}) AND "${state}" AND (empresa OR companhia OR indústria OR distribuidora)`;
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=10`;

      console.log(`[discover-companies] Query: ${query}`);

      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          console.log(`[discover-companies] Google: ${items.length} resultados`);

          for (const item of items) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const itemUrl = item.link || '';

            const companyNameMatch = title.match(/^([^-|]+)/);
            const companyName = companyNameMatch ? companyNameMatch[1].trim() : title;

            if (companyName.toLowerCase() === sourceCompany.name.toLowerCase()) {
              continue;
            }

            // Verificar se já existe
            const { data: existing } = await sb
              .from('companies')
              .select('id')
              .ilike('name', `%${companyName}%`)
              .limit(1);

            if (existing && existing.length > 0) {
              console.log(`[discover-companies] ⚠️ Já existe: ${companyName}`);
              continue;
            }

            const { data: alreadySuggested } = await sb
              .from('suggested_companies')
              .select('id')
              .eq('company_name', companyName)
              .limit(1);

            if (alreadySuggested && alreadySuggested.length > 0) {
              console.log(`[discover-companies] ⚠️ Já sugerida: ${companyName}`);
              continue;
            }

            console.log(`[discover-companies] ✅ Nova: ${companyName}`);

            let domain = '';
            try {
              domain = new URL(itemUrl).hostname;
            } catch {
              domain = itemUrl;
            }

            suggestedCompanies.push({
              user_id,
              discovery_batch_id,
              company_name: companyName,
              domain: domain,
              state,
              city: city || null,
              sector_code,
              niche_code,
              source: 'similar_companies',
              source_company_id,
              similarity_score: 0.85,
              similarity_reasons: ['mesmo_nicho', 'mesma_regiao'],
              status: 'pending'
            });
          }
        }
      } catch (e) {
        console.error('[discover-companies] Erro Google:', e);
      }
    }

    // MODO 2: BUSCAR EMPRESAS NOVAS
    if (search_mode === 'new') {
      console.log(`[discover-companies] Buscando novas no nicho: ${niche.niche_name}`);

      const nicheKeywords = niche.keywords.slice(0, 3).map((k: string) => `"${k}"`).join(' OR ');
      const query = `(${nicheKeywords}) AND "${state}" AND (CNPJ OR "razão social")`;
      const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=10`;

      console.log(`[discover-companies] Query: ${query}`);

      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          console.log(`[discover-companies] Google: ${items.length} resultados`);

          for (const item of items) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const itemUrl = item.link || '';

            const companyNameMatch = title.match(/^([^-|]+)/);
            const companyName = companyNameMatch ? companyNameMatch[1].trim() : title;

            const cnpjMatch = snippet.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
            const cnpj = cnpjMatch ? cnpjMatch[1] : null;

            const { data: existing } = await sb
              .from('companies')
              .select('id')
              .or(`name.ilike.%${companyName}%${cnpj ? `,cnpj.eq.${cnpj}` : ''}`)
              .limit(1);

            if (existing && existing.length > 0) {
              console.log(`[discover-companies] ⚠️ Já existe: ${companyName}`);
              continue;
            }

            const { data: alreadySuggested } = await sb
              .from('suggested_companies')
              .select('id')
              .eq('company_name', companyName)
              .limit(1);

            if (alreadySuggested && alreadySuggested.length > 0) {
              console.log(`[discover-companies] ⚠️ Já sugerida: ${companyName}`);
              continue;
            }

            console.log(`[discover-companies] ✅ Nova: ${companyName}`);

            let domain = '';
            try {
              domain = new URL(itemUrl).hostname;
            } catch {
              domain = itemUrl;
            }

            suggestedCompanies.push({
              user_id,
              discovery_batch_id,
              company_name: companyName,
              cnpj: cnpj,
              domain: domain,
              state,
              city: city || null,
              sector_code,
              niche_code,
              source: 'google_search',
              status: 'pending'
            });
          }
        }
      } catch (e) {
        console.error('[discover-companies] Erro Google:', e);
      }
    }

    // Salvar empresas sugeridas
    if (suggestedCompanies.length > 0) {
      const { error: insertError } = await sb
        .from('suggested_companies')
        .insert(suggestedCompanies);

      if (insertError) {
        console.error('[discover-companies] Erro ao salvar:', insertError);
      } else {
        console.log(`[discover-companies] ✅ ${suggestedCompanies.length} sugestões salvas`);
      }
    }

    // Atualizar lote
    if (discovery_batch_id) {
      await sb
        .from('discovery_batches')
        .update({
          total_found: suggestedCompanies.length,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', discovery_batch_id);
    }

    return new Response(JSON.stringify({
      ok: true,
      total_found: suggestedCompanies.length,
      companies: suggestedCompanies.map(c => ({
        name: c.company_name,
        cnpj: c.cnpj,
        domain: c.domain,
        source: c.source
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[discover-companies] ERRO:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      message: e.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
