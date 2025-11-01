import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// PRODUTOS TOTVS
// ============================================
const TOTVS_PRODUCTS = [
  'Protheus', 'RM', 'Datasul', 'Fluig', 'Winthor', 'Microsiga',
  'TOTVS Gestão', 'TOTVS ERP', 'Carol', 'Techfin', 'Logix'
];

// ============================================
// PESOS POR FONTE (conforme protocolo)
// ============================================
const SOURCE_WEIGHTS = {
  apollo_tech_stack: 100,
  cvm_ri_docs: 90,
  judicial: 85,
  premium_news: 80,
  linkedin_jobs: 70,
  google_news: 60,
  google_search: 40
};

// ============================================
// FUNÇÃO: TRIPLE MATCH
// ============================================
function tripleMatch(text: string, companyName: string): boolean {
  const searchWindow = 80;
  const textLower = text.toLowerCase();
  const companyLower = companyName.toLowerCase();

  const companyIndex = textLower.indexOf(companyLower);
  const totvsIndex = textLower.indexOf('totvs');

  if (companyIndex === -1 || totvsIndex === -1) {
    return false;
  }

  for (const product of TOTVS_PRODUCTS) {
    const productIndex = textLower.indexOf(product.toLowerCase());
    
    if (productIndex === -1) continue;

    const indices = [companyIndex, totvsIndex, productIndex].sort((a, b) => a - b);
    const distance = indices[2] - indices[0];

    if (distance <= searchWindow) {
      return true;
    }
  }

  return false;
}

// ============================================
// FUNÇÃO: DOUBLE MATCH
// ============================================
function doubleMatch(text: string, companyName: string): boolean {
  const searchWindow = 60;
  const textLower = text.toLowerCase();
  const companyLower = companyName.toLowerCase();

  const companyIndex = textLower.indexOf(companyLower);
  
  if (companyIndex === -1) {
    return false;
  }

  const totvsIndex = textLower.indexOf('totvs');
  if (totvsIndex !== -1 && Math.abs(companyIndex - totvsIndex) <= searchWindow) {
    return true;
  }

  for (const product of TOTVS_PRODUCTS) {
    const productIndex = textLower.indexOf(product.toLowerCase());
    
    if (productIndex !== -1 && Math.abs(companyIndex - productIndex) <= searchWindow) {
      return true;
    }
  }

  return false;
}

// ============================================
// FUNÇÃO: VALIDAR VAGA LINKEDIN
// ============================================
function isValidLinkedInJobPosting(text: string): boolean {
  const textLower = text.toLowerCase();
  
  const invalidTerms = [
    'experiência anterior',
    'trabalhou na',
    'ex-funcionário',
    'ex-colaborador',
    'atuou na',
    'passou pela'
  ];

  for (const term of invalidTerms) {
    if (textLower.includes(term)) {
      return false;
    }
  }

  return true;
}

// ============================================
// FUNÇÃO: DETECTAR PRODUTOS TOTVS
// ============================================
function detectTotvsProducts(text: string): string[] {
  const textLower = text.toLowerCase();
  const detected: string[] = [];

  for (const product of TOTVS_PRODUCTS) {
    if (textLower.includes(product.toLowerCase())) {
      detected.push(product);
    }
  }

  return detected;
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[TOTVS-VERIFICATION] 🚀 Iniciando verificação...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const apolloKey = Deno.env.get('APOLLO_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { company_id, company_name, cnpj, domain } = body;

    console.log('[TOTVS-VERIFICATION] 📊 Empresa:', company_name || cnpj);

    if (!company_name && !cnpj) {
      return new Response(
        JSON.stringify({ 
          error: 'company_name ou cnpj são obrigatórios',
          status: 'error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VERIFICAR CACHE (24h)
    if (company_id) {
      const { data: cached } = await supabase
        .from('simple_totvs_checks')
        .select('*')
        .eq('company_id', company_id)
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        console.log('[TOTVS-VERIFICATION] ✅ Cache válido (24h)');
        return new Response(
          JSON.stringify({
            ...cached,
            from_cache: true,
            execution_time: `${Date.now() - startTime}ms`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[TOTVS-VERIFICATION] 🔍 Cache expirado, iniciando busca...');

    const evidencias: any[] = [];
    const searchTerm = company_name || cnpj;
    let totalQueries = 0;

    // APOLLO.IO (Tech Stack)
    if (apolloKey && domain) {
      console.log('[TOTVS-VERIFICATION] 🔍 Buscando no Apollo.io...');
      totalQueries++;

      try {
        const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apolloKey,
          },
          body: JSON.stringify({
            domain: domain,
            reveal_personal_emails: false,
          }),
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          const technologies = apolloData.organizations?.[0]?.technologies || [];

          const totvsInTech = technologies.some((tech: any) => {
            const techName = tech.name?.toLowerCase() || '';
            return techName.includes('totvs') || 
                   TOTVS_PRODUCTS.some(p => techName.includes(p.toLowerCase()));
          });

          if (totvsInTech) {
            evidencias.push({
              source: 'apollo_tech_stack',
              weight: SOURCE_WEIGHTS.apollo_tech_stack,
              match_type: 'triple',
              content: `Tech stack detectado: ${technologies.map((t: any) => t.name).join(', ')}`,
              url: `https://app.apollo.io/#/companies?domain=${domain}`,
              title: 'Apollo.io Tech Stack',
              detected_products: TOTVS_PRODUCTS.filter(p => 
                technologies.some((t: any) => t.name?.toLowerCase().includes(p.toLowerCase()))
              ),
            });

            console.log('[TOTVS-VERIFICATION] ✅ Apollo: TOTVS detectado no tech stack');
          }
        }
      } catch (error) {
        console.error('[TOTVS-VERIFICATION] ❌ Erro no Apollo:', error);
      }
    }

    // SERPER (LinkedIn Jobs)
    if (serperKey) {
      console.log('[TOTVS-VERIFICATION] 🔍 Buscando vagas no LinkedIn...');
      totalQueries++;

      try {
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

          console.log(`[TOTVS-VERIFICATION] 📊 LinkedIn: ${results.length} resultados`);

          for (const result of results) {
            const snippet = result.snippet || '';
            const title = result.title || '';
            const combined = `${title} ${snippet}`;

            if (!isValidLinkedInJobPosting(combined)) {
              console.log('[TOTVS-VERIFICATION] ⚠️ Rejeitado (histórico):', title.substring(0, 50));
              continue;
            }

            const isTriple = tripleMatch(combined, searchTerm);
            const isDouble = !isTriple && doubleMatch(combined, searchTerm);

            if (isTriple || isDouble) {
              evidencias.push({
                source: 'linkedin_jobs',
                weight: SOURCE_WEIGHTS.linkedin_jobs,
                match_type: isTriple ? 'triple' : 'double',
                content: snippet,
                url: result.link,
                title: title,
                detected_products: detectTotvsProducts(combined),
              });

              console.log(`[TOTVS-VERIFICATION] ✅ ${isTriple ? 'TRIPLE' : 'DOUBLE'} Match: ${title.substring(0, 50)}`);
            }
          }
        }
      } catch (error) {
        console.error('[TOTVS-VERIFICATION] ❌ Erro no Serper LinkedIn:', error);
      }
    }

    // SERPER (Google News)
    if (serperKey) {
      console.log('[TOTVS-VERIFICATION] 📰 Buscando notícias...');
      totalQueries++;

      try {
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

          console.log(`[TOTVS-VERIFICATION] 📰 News: ${news.length} resultados`);

          for (const item of news) {
            const snippet = item.snippet || '';
            const title = item.title || '';
            const combined = `${title} ${snippet}`;

            const isTriple = tripleMatch(combined, searchTerm);
            const isDouble = !isTriple && doubleMatch(combined, searchTerm);

            if (isTriple || isDouble) {
              evidencias.push({
                source: 'google_news',
                weight: SOURCE_WEIGHTS.google_news,
                match_type: isTriple ? 'triple' : 'double',
                content: snippet,
                url: item.link,
                title: title,
                detected_products: detectTotvsProducts(combined),
              });
            }
          }
        }
      } catch (error) {
        console.error('[TOTVS-VERIFICATION] ❌ Erro no News:', error);
      }
    }

    // SERPER (Notícias Premium)
    if (serperKey) {
      console.log('[TOTVS-VERIFICATION] 📰 Buscando notícias premium...');
      
      const premiumSources = [
        'valor.globo.com',
        'exame.com',
        'infomoney.com.br',
        'estadao.com.br/economia'
      ];

      for (const source of premiumSources) {
        totalQueries++;

        try {
          const premiumResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: `"${searchTerm}" "TOTVS" site:${source}`,
              num: 5,
              gl: 'br',
              hl: 'pt-br',
            }),
          });

          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json();
            const results = premiumData.organic || [];

            for (const result of results) {
              const snippet = result.snippet || '';
              const title = result.title || '';
              const combined = `${title} ${snippet}`;

              const isTriple = tripleMatch(combined, searchTerm);
              const isDouble = !isTriple && doubleMatch(combined, searchTerm);

              if (isTriple || isDouble) {
                evidencias.push({
                  source: 'premium_news',
                  weight: SOURCE_WEIGHTS.premium_news,
                  match_type: isTriple ? 'triple' : 'double',
                  content: snippet,
                  url: result.link,
                  title: title,
                  detected_products: detectTotvsProducts(combined),
                });
              }
            }
          }
        } catch (error) {
          console.error(`[TOTVS-VERIFICATION] ❌ Erro em ${source}:`, error);
        }
      }
    }

    // SERPER (Judicial)
    if (serperKey) {
      console.log('[TOTVS-VERIFICATION] ⚖️ Buscando processos judiciais...');
      
      const judicialSources = [
        'jusbrasil.com.br',
        'esaj.tjsp.jus.br',
        'rad.cvm.gov.br'
      ];

      for (const source of judicialSources) {
        totalQueries++;

        try {
          const judicialResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: `"${searchTerm}" "TOTVS" site:${source}`,
              num: 5,
              gl: 'br',
              hl: 'pt-br',
            }),
          });

          if (judicialResponse.ok) {
            const judicialData = await judicialResponse.json();
            const results = judicialData.organic || [];

            for (const result of results) {
              const snippet = result.snippet || '';
              const title = result.title || '';
              const combined = `${title} ${snippet}`;

              const isTriple = tripleMatch(combined, searchTerm);
              const isDouble = !isTriple && doubleMatch(combined, searchTerm);

              if (isTriple || isDouble) {
                evidencias.push({
                  source: 'judicial',
                  weight: SOURCE_WEIGHTS.judicial,
                  match_type: isTriple ? 'triple' : 'double',
                  content: snippet,
                  url: result.link,
                  title: title,
                  detected_products: detectTotvsProducts(combined),
                });
              }
            }
          }
        } catch (error) {
          console.error(`[TOTVS-VERIFICATION] ❌ Erro em ${source}:`, error);
        }
      }
    }

    // CALCULAR SCORE E STATUS
    const tripleMatches = evidencias.filter(e => e.match_type === 'triple').length;
    const doubleMatches = evidencias.filter(e => e.match_type === 'double').length;
    const totalWeight = evidencias.reduce((sum, e) => sum + e.weight, 0);

    let status: string;
    let confidence: string;

    if (tripleMatches >= 5) {
      status = 'no-go';
      confidence = 'high';
    } else if (tripleMatches >= 3) {
      status = 'no-go';
      confidence = 'medium';
    } else if (tripleMatches >= 1) {
      status = 'revisar';
      confidence = 'medium';
    } else if (doubleMatches >= 5) {
      status = 'revisar';
      confidence = 'medium';
    } else if (doubleMatches >= 2) {
      status = 'revisar';
      confidence = 'low';
    } else {
      status = 'go';
      confidence = 'low';
    }

    const executionTime = Date.now() - startTime;

    console.log('[TOTVS-VERIFICATION] 📊 Resultado:', {
      status,
      confidence,
      tripleMatches,
      doubleMatches,
      totalWeight,
      evidencias: evidencias.length,
      executionTime: `${executionTime}ms`
    });

    const resultado = {
      company_id: company_id || null,
      company_name: company_name || null,
      cnpj: cnpj || null,
      domain: domain || null,
      status,
      confidence,
      total_weight: totalWeight,
      triple_matches: tripleMatches,
      double_matches: doubleMatches,
      match_summary: {
        triple_matches: tripleMatches,
        double_matches: doubleMatches,
      },
      evidences: evidencias,
      methodology: {
        searched_sources: totalQueries,
        total_queries: totalQueries,
        execution_time: `${executionTime}ms`,
      },
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
        console.error('[TOTVS-VERIFICATION] ❌ Erro ao salvar cache:', saveError);
      } else {
        console.log('[TOTVS-VERIFICATION] ✅ Cache salvo com sucesso');
      }
    }

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[TOTVS-VERIFICATION] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error',
        execution_time: `${Date.now() - startTime}ms`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
