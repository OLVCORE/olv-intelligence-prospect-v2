import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PRODUTOS TOTVS
const TOTVS_PRODUCTS = [
  'Protheus', 'RM', 'Datasul', 'Fluig', 'Winthor', 'Microsiga',
  'TOTVS Gestão', 'TOTVS ERP', 'Carol', 'Techfin'
];

// PESOS POR FONTE
const SOURCE_WEIGHTS = {
  linkedin_jobs: 90,      // Vagas LinkedIn
  google_news: 80,        // Notícias
  judicial: 85,           // Processos
  premium_news: 80,       // Valor, Exame
  google_search: 60,      // Busca geral
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[TOTVS-CHECKER] 🚀 Iniciando verificação...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperKey = Deno.env.get('SERPER_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. PARSEAR BODY
    const { company_id, company_name, cnpj, domain } = await req.json();

    if (!company_name && !cnpj) {
      return new Response(
        JSON.stringify({ 
          error: 'company_name ou cnpj são obrigatórios',
          status: 'error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[TOTVS-CHECKER] 📊 Empresa:', company_name || cnpj);

    // 2. VERIFICAR CACHE (apenas se tiver company_id)
    if (company_id) {
      const { data: cached } = await supabase
        .from('simple_totvs_checks')
        .select('*')
        .eq('company_id', company_id)
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (cached) {
        console.log('[TOTVS-CHECKER] ✅ Cache válido encontrado');
        return new Response(
          JSON.stringify({
            ...cached,
            from_cache: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. BUSCAR EVIDÊNCIAS
    const evidencias: any[] = [];
    const searchTerm = company_name || cnpj;

    if (!serperKey) {
      console.error('[TOTVS-CHECKER] ❌ SERPER_API_KEY não configurada');
      return new Response(
        JSON.stringify({ 
          error: 'SERPER_API_KEY não configurada',
          status: 'error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3.1 BUSCAR NO SERPER (LinkedIn Jobs)
    console.log('[TOTVS-CHECKER] 🔍 Buscando no Serper (LinkedIn)...');
    
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `"${searchTerm}" "TOTVS" site:linkedin.com/jobs`,
        num: 20,
        gl: 'br',
        hl: 'pt-br',
      }),
    });

    if (serperResponse.ok) {
      const serperData = await serperResponse.json();
      const results = serperData.organic || [];

      console.log('[TOTVS-CHECKER] 📊 Serper retornou:', results.length, 'resultados');

      for (const result of results) {
        const snippet = result.snippet || '';
        const title = result.title || '';
        const combined = `${title} ${snippet}`.toLowerCase();

        // VALIDAR SE É VAGA ATUAL (não histórico)
        if (
          combined.includes('experiência anterior') ||
          combined.includes('trabalhou na') ||
          combined.includes('ex-funcionário')
        ) {
          console.log('[TOTVS-CHECKER] ⚠️ Rejeitado (histórico):', title.substring(0, 50));
          continue;
        }

        // TRIPLE MATCH: Empresa + TOTVS + Produto (mesmos 80 chars)
        const tripleMatch = TOTVS_PRODUCTS.some(product => {
          const searchWindow = 80;
          const companyIndex = combined.indexOf(searchTerm.toLowerCase());
          const totvsIndex = combined.indexOf('totvs');
          const productIndex = combined.indexOf(product.toLowerCase());

          if (companyIndex === -1 || totvsIndex === -1 || productIndex === -1) {
            return false;
          }

          const indices = [companyIndex, totvsIndex, productIndex].sort((a, b) => a - b);
          return (indices[2] - indices[0]) <= searchWindow;
        });

        // DOUBLE MATCH: Empresa + TOTVS OU Empresa + Produto (mesmos 60 chars)
        const doubleMatch = (() => {
          const searchWindow = 60;
          const companyIndex = combined.indexOf(searchTerm.toLowerCase());
          const totvsIndex = combined.indexOf('totvs');

          if (companyIndex !== -1 && totvsIndex !== -1) {
            return Math.abs(companyIndex - totvsIndex) <= searchWindow;
          }

          return TOTVS_PRODUCTS.some(product => {
            const productIndex = combined.indexOf(product.toLowerCase());
            if (companyIndex !== -1 && productIndex !== -1) {
              return Math.abs(companyIndex - productIndex) <= searchWindow;
            }
            return false;
          });
        })();

        if (tripleMatch || doubleMatch) {
          const matchType = tripleMatch ? 'triple' : 'double';
          
          evidencias.push({
            source: 'linkedin_jobs',
            weight: SOURCE_WEIGHTS.linkedin_jobs,
            match_type: matchType,
            content: snippet,
            url: result.link,
            title: title,
            detected_products: TOTVS_PRODUCTS.filter(p => 
              combined.includes(p.toLowerCase())
            ),
          });

          console.log(`[TOTVS-CHECKER] ✅ ${matchType.toUpperCase()} Match:`, title.substring(0, 50));
        }
      }
    }

    // 3.2 BUSCAR NO SERPER (Google News)
    console.log('[TOTVS-CHECKER] 📰 Buscando notícias...');
    
    const newsResponse = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `"${searchTerm}" "TOTVS"`,
        num: 10,
        gl: 'br',
        hl: 'pt-br',
      }),
    });

    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      const news = newsData.news || [];

      console.log('[TOTVS-CHECKER] 📰 News retornou:', news.length, 'resultados');

      for (const item of news) {
        const snippet = item.snippet || '';
        const title = item.title || '';
        const combined = `${title} ${snippet}`.toLowerCase();

        // Aplicar mesma lógica de Triple/Double Match
        const tripleMatch = TOTVS_PRODUCTS.some(product => {
          const searchWindow = 80;
          const companyIndex = combined.indexOf(searchTerm.toLowerCase());
          const totvsIndex = combined.indexOf('totvs');
          const productIndex = combined.indexOf(product.toLowerCase());

          if (companyIndex === -1 || totvsIndex === -1 || productIndex === -1) {
            return false;
          }

          const indices = [companyIndex, totvsIndex, productIndex].sort((a, b) => a - b);
          return (indices[2] - indices[0]) <= searchWindow;
        });

        const doubleMatch = (() => {
          const searchWindow = 60;
          const companyIndex = combined.indexOf(searchTerm.toLowerCase());
          const totvsIndex = combined.indexOf('totvs');

          if (companyIndex !== -1 && totvsIndex !== -1) {
            return Math.abs(companyIndex - totvsIndex) <= searchWindow;
          }

          return TOTVS_PRODUCTS.some(product => {
            const productIndex = combined.indexOf(product.toLowerCase());
            if (companyIndex !== -1 && productIndex !== -1) {
              return Math.abs(companyIndex - productIndex) <= searchWindow;
            }
            return false;
          });
        })();

        if (tripleMatch || doubleMatch) {
          evidencias.push({
            source: 'google_news',
            weight: SOURCE_WEIGHTS.google_news,
            match_type: tripleMatch ? 'triple' : 'double',
            content: snippet,
            url: item.link,
            title: title,
            detected_products: TOTVS_PRODUCTS.filter(p => 
              combined.includes(p.toLowerCase())
            ),
          });
        }
      }
    }

    // 4. CALCULAR SCORE E STATUS
    const tripleMatches = evidencias.filter(e => e.match_type === 'triple').length;
    const doubleMatches = evidencias.filter(e => e.match_type === 'double').length;
    const totalWeight = evidencias.reduce((sum, e) => sum + e.weight, 0);

    let status: string;
    let confidence: string;

    // LÓGICA DE CLASSIFICAÇÃO
    if (tripleMatches >= 5) {
      status = 'no-go';
      confidence = 'high';
    } else if (tripleMatches >= 3) {
      status = 'no-go';
      confidence = 'medium';
    } else if (tripleMatches >= 1 || doubleMatches >= 5) {
      status = 'revisar';
      confidence = 'medium';
    } else if (doubleMatches >= 2) {
      status = 'revisar';
      confidence = 'low';
    } else {
      status = 'go';
      confidence = 'low';
    }

    console.log('[TOTVS-CHECKER] 📊 Resultado:', {
      status,
      confidence,
      tripleMatches,
      doubleMatches,
      totalWeight,
      evidencias: evidencias.length
    });

    // 5. SALVAR CACHE (apenas se tiver company_id)
    const resultado = {
      company_id: company_id || null,
      company_name: company_name || null,
      cnpj: cnpj || null,
      domain: domain || null,
      status,
      confidence,
      total_weight: totalWeight,
      match_summary: {
        triple_matches: tripleMatches,
        double_matches: doubleMatches,
      },
      evidences: evidencias,
      checked_at: new Date().toISOString(),
      from_cache: false,
    };

    if (company_id) {
      const { error: saveError } = await supabase
        .from('simple_totvs_checks')
        .upsert({
          company_id,
          company_name,
          cnpj,
          domain,
          status,
          confidence,
          total_weight: totalWeight,
          triple_matches: tripleMatches,
          double_matches: doubleMatches,
          evidences: evidencias,
          checked_at: new Date().toISOString(),
        });

      if (saveError) {
        console.error('[TOTVS-CHECKER] ❌ Erro ao salvar cache:', saveError);
      } else {
        console.log('[TOTVS-CHECKER] ✅ Cache salvo com sucesso');
      }
    }

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[TOTVS-CHECKER] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
