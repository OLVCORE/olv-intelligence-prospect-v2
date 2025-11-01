import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOTVS_PRODUCTS = [
  'Protheus', 'RM', 'Datasul', 'Fluig', 'Winthor', 'Microsiga',
  'TOTVS Gestão', 'TOTVS ERP', 'Carol', 'Techfin', 'Logix',
  'TOTVS Backoffice', 'TOTVS Manufatura', 'TOTVS Varejo',
  'TOTVS Educacional', 'TOTVS Saúde'
];

const SOURCE_WEIGHTS = {
  apollo_tech_stack: 100,
  cvm_ri_docs: 90,
  judicial: 85,
  premium_news: 80,
  linkedin_jobs: 70,
  google_news: 60,
  google_search: 40
};

function tripleMatch(text: string, companyName: string): boolean {
  const searchWindow = 150;
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

function doubleMatch(text: string, companyName: string): boolean {
  const searchWindow = 120;
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

function isValidLinkedInJobPosting(text: string): boolean {
  const textLower = text.toLowerCase();
  const invalidTerms = [
    'experiência anterior', 'trabalhou na', 'ex-funcionário',
    'ex-colaborador', 'atuou na', 'passou pela', 'trabalhou anteriormente'
  ];
  for (const term of invalidTerms) {
    if (textLower.includes(term)) {
      return false;
    }
  }
  return true;
}

function hasValidContext(text: string, companyName: string): boolean {
  const textLower = text.toLowerCase();
  
  // REJEITAR: Listas de valores monetários (padrão de documentos judiciais)
  const moneyListPattern = /R\$\s*[\d.,]+\s*-.*?-\s*R\$\s*[\d.,]+/i;
  if (moneyListPattern.test(text)) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: lista de valores monetários');
    return false;
  }
  
  // REJEITAR: Múltiplas empresas listadas (padrão: "EMPRESA1 LTDA - R$ ... - EMPRESA2 LTDA")
  const multipleCompaniesPattern = /(LTDA|S\.A\.|SA|EIRELI).*?-.*?(LTDA|S\.A\.|SA|EIRELI)/i;
  if (multipleCompaniesPattern.test(text)) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: lista de múltiplas empresas');
    return false;
  }
  
  // ACEITAR: Verbos de ação que indicam uso real
  const actionVerbs = [
    'utiliza', 'usa', 'implementou', 'adotou', 'contratou', 'renovou',
    'migrou', 'escolheu', 'implantou', 'utilizar', 'usar', 'implementar',
    'sistema', 'solução', 'cliente', 'parceiro', 'contrato', 'licença'
  ];
  
  for (const verb of actionVerbs) {
    if (textLower.includes(verb)) {
      console.log('[SIMPLE-TOTVS] ✅ Aceito: verbo de ação encontrado:', verb);
      return true;
    }
  }
  
  // Se não tem contexto de uso, rejeitar
  console.log('[SIMPLE-TOTVS] ❌ Rejeitado: sem contexto de uso');
  return false;
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[SIMPLE-TOTVS] 🚀 Iniciando verificação...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { company_id, company_name, cnpj, domain } = body;

    if (!company_name && !cnpj) {
      return new Response(
        JSON.stringify({ error: 'company_name ou cnpj são obrigatórios', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchTerm = company_name || cnpj;
    
    // Extrair nome curto (remover sufixos corporativos)
    const extractShortName = (fullName: string): string => {
      if (!fullName) return fullName;
      
      const corporateSuffixes = [
        ' S.A.', ' S/A', ' SA ', ' LTDA', ' EIRELI', ' EPP', ' ME',
        ' Indústrias', ' Indústria', ' Comércio', ' Serviços',
        ' Participações', ' Holdings'
      ];
      
      let shortName = fullName;
      for (const suffix of corporateSuffixes) {
        const regex = new RegExp(suffix + '.*$', 'i');
        shortName = shortName.replace(regex, '').trim();
      }
      
      return shortName;
    };
    
    const shortSearchTerm = company_name ? extractShortName(company_name) : searchTerm;
    console.log('[SIMPLE-TOTVS] 🔍 Termo de busca completo:', searchTerm);
    console.log('[SIMPLE-TOTVS] 🔍 Termo de busca curto:', shortSearchTerm);

    if (company_id) {
      const { data: cached } = await supabase
        .from('simple_totvs_checks')
        .select('*')
        .eq('company_id', company_id)
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        console.log('[SIMPLE-TOTVS] ✅ Cache válido (24h)');
        return new Response(
          JSON.stringify({ ...cached, from_cache: true, execution_time: `${Date.now() - startTime}ms` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[SIMPLE-TOTVS] 🔍 Cache expirado, iniciando busca...');

    const evidencias: any[] = [];
    let totalQueries = 0;

    if (serperKey) {
      console.log('[SIMPLE-TOTVS] 🔍 Buscando vagas no LinkedIn...');
      totalQueries++;

      try {
        const linkedinQuery = `${shortSearchTerm} TOTVS site:linkedin.com/jobs`;
        console.log('[SIMPLE-TOTVS] 🔍 Query LinkedIn:', linkedinQuery);
        
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: linkedinQuery,
            num: 20, gl: 'br', hl: 'pt-br',
          }),
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          const results = serperData.organic || [];
          console.log('[SIMPLE-TOTVS] 📊 LinkedIn - Raw results:', results.length);
          
          // LOG DETALHADO: Mostrar os primeiros 3 títulos
          if (results.length > 0) {
            console.log('[SIMPLE-TOTVS] 🔍 LinkedIn - Sample titles:');
            results.slice(0, 3).forEach((r: any, i: number) => {
              console.log(`  ${i + 1}. ${r.title?.substring(0, 80)}`);
            });
          }
          
          let validLinkedInCount = 0;

          for (const result of results) {
            const title = result.title || '';
            const snippet = result.snippet || '';
            const combined = `${title} ${snippet}`;

            if (!isValidLinkedInJobPosting(combined)) {
              console.log('[SIMPLE-TOTVS] ⚠️ Rejeitado (histórico):', title.substring(0, 50));
              continue;
            }

            const isTriple = tripleMatch(combined, shortSearchTerm);
            const isDouble = !isTriple && doubleMatch(combined, shortSearchTerm);

            // LOG: Mostrar por que foi rejeitado
            if (!isTriple && !isDouble) {
              console.log(`[SIMPLE-TOTVS] ❌ Rejeitado (sem match): ${title.substring(0, 60)}`);
            }

            if (isTriple || isDouble) {
              // Validar contexto antes de aceitar
              if (!hasValidContext(combined, shortSearchTerm)) {
                console.log(`[SIMPLE-TOTVS] ❌ Rejeitado (contexto inválido): ${title.substring(0, 60)}`);
                continue;
              }
              
              validLinkedInCount++;
              evidencias.push({
                source: 'linkedin_jobs',
                weight: SOURCE_WEIGHTS.linkedin_jobs,
                match_type: isTriple ? 'triple' : 'double',
                content: snippet,
                url: result.link,
                title: title,
                detected_products: detectTotvsProducts(combined),
              });
              console.log(`[SIMPLE-TOTVS] ✅ ${isTriple ? 'TRIPLE' : 'DOUBLE'} Match:`, title.substring(0, 50));
            }
          }
          console.log('[SIMPLE-TOTVS] ✅ LinkedIn - Valid evidences:', validLinkedInCount);
        }
      } catch (error) {
        console.error('[SIMPLE-TOTVS] ❌ Erro no Serper LinkedIn:', error);
      }

      console.log('[SIMPLE-TOTVS] 📰 Buscando notícias...');
      totalQueries++;

      try {
        const newsQuery = `${shortSearchTerm} TOTVS`;
        console.log('[SIMPLE-TOTVS] 🔍 Query News:', newsQuery);
        
        const newsResponse = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: newsQuery, num: 10, gl: 'br', hl: 'pt-br' }),
        });

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const news = newsData.news || [];
          console.log('[SIMPLE-TOTVS] 📰 News - Raw results:', news.length);
          
          // LOG DETALHADO: Mostrar os primeiros 3 títulos
          if (news.length > 0) {
            console.log('[SIMPLE-TOTVS] 🔍 News - Sample titles:');
            news.slice(0, 3).forEach((item: any, i: number) => {
              console.log(`  ${i + 1}. ${item.title?.substring(0, 80)}`);
            });
          }
          
          let validNewsCount = 0;
          for (const item of news) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const combined = `${title} ${snippet}`;
            const isTriple = tripleMatch(combined, shortSearchTerm);
            const isDouble = !isTriple && doubleMatch(combined, shortSearchTerm);

            if (isTriple || isDouble) {
              // Validar contexto antes de aceitar
              if (!hasValidContext(combined, shortSearchTerm)) {
                console.log(`[SIMPLE-TOTVS] ❌ Rejeitado (contexto inválido): ${title.substring(0, 60)}`);
                continue;
              }
              
              validNewsCount++;
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
          console.log('[SIMPLE-TOTVS] ✅ News - Valid evidences:', validNewsCount);
        }
      } catch (error) {
        console.error('[SIMPLE-TOTVS] ❌ Erro no News:', error);
      }

      console.log('[SIMPLE-TOTVS] 📰 Buscando notícias premium...');
      const premiumSources = ['valor.globo.com', 'exame.com', 'infomoney.com.br', 'estadao.com.br/economia'];

      for (const source of premiumSources) {
        totalQueries++;
        try {
          const premiumQuery = `${shortSearchTerm} TOTVS site:${source}`;
          console.log('[SIMPLE-TOTVS] 🔍 Query Premium:', premiumQuery);
          
          const premiumResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: premiumQuery, num: 5, gl: 'br', hl: 'pt-br' }),
          });

          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json();
            const results = premiumData.organic || [];

            for (const result of results) {
              const title = result.title || '';
              const snippet = result.snippet || '';
              const combined = `${title} ${snippet}`;
              const isTriple = tripleMatch(combined, shortSearchTerm);
              const isDouble = !isTriple && doubleMatch(combined, shortSearchTerm);

              if (isTriple || isDouble) {
                // Validar contexto antes de aceitar
                if (!hasValidContext(combined, shortSearchTerm)) {
                  console.log(`[SIMPLE-TOTVS] ❌ Rejeitado (contexto inválido): ${title.substring(0, 60)}`);
                  continue;
                }
                
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
          console.error(`[SIMPLE-TOTVS] ❌ Erro em ${source}:`, error);
        }
      }

      console.log('[SIMPLE-TOTVS] ⚖️ Buscando processos judiciais...');
      const judicialSources = ['jusbrasil.com.br', 'esaj.tjsp.jus.br'];

      for (const source of judicialSources) {
        totalQueries++;
        try {
          const judicialQuery = `${shortSearchTerm} TOTVS site:${source}`;
          console.log('[SIMPLE-TOTVS] 🔍 Query Judicial:', judicialQuery);
          
          const judicialResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: judicialQuery, num: 5, gl: 'br', hl: 'pt-br' }),
          });

          if (judicialResponse.ok) {
            const judicialData = await judicialResponse.json();
            const results = judicialData.organic || [];

            for (const result of results) {
              const title = result.title || '';
              const snippet = result.snippet || '';
              const combined = `${title} ${snippet}`;
              const isTriple = tripleMatch(combined, shortSearchTerm);
              const isDouble = !isTriple && doubleMatch(combined, shortSearchTerm);

              if (isTriple || isDouble) {
                // Validar contexto antes de aceitar
                if (!hasValidContext(combined, shortSearchTerm)) {
                  console.log(`[SIMPLE-TOTVS] ❌ Rejeitado (contexto inválido): ${title.substring(0, 60)}`);
                  continue;
                }
                
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
          console.error(`[SIMPLE-TOTVS] ❌ Erro em ${source}:`, error);
        }
      }
    }

    const tripleMatches = evidencias.filter(e => e.match_type === 'triple').length;
    const doubleMatches = evidencias.filter(e => e.match_type === 'double').length;
    const totalWeight = evidencias.reduce((sum, e) => sum + e.weight, 0);
    const numEvidencias = evidencias.length;

    let status: string;
    let confidence: string;

    // NOVA LÓGICA: Baseada no número total de evidências
    if (numEvidencias >= 3) {
      status = 'no-go';      // 3+ evidências = USA TOTVS
      confidence = 'high';
    } else if (numEvidencias >= 2) {
      status = 'no-go';      // 2 evidências = PROVÁVEL USO
      confidence = 'medium';
    } else if (numEvidencias >= 1) {
      status = 'revisar';    // 1 evidência = INVESTIGAR
      confidence = 'low';
    } else {
      status = 'go';         // 0 evidências = NÃO USA
      confidence = 'low';
    }

    const executionTime = Date.now() - startTime;

    console.log('[SIMPLE-TOTVS] 📊 Resultado:', {
      status, confidence, tripleMatches, doubleMatches, totalWeight,
      evidencias: evidencias.length, executionTime: `${executionTime}ms`
    });

    const resultado = {
      status,
      confidence,
      total_weight: totalWeight,
      triple_matches: tripleMatches,
      double_matches: doubleMatches,
      match_summary: { triple_matches: tripleMatches, double_matches: doubleMatches },
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
          company_id, company_name, cnpj, domain, status, confidence,
          total_weight: totalWeight, triple_matches: tripleMatches,
          double_matches: doubleMatches, evidences: evidencias,
          checked_at: new Date().toISOString(),
        });

      if (saveError) {
        console.error('[SIMPLE-TOTVS] ❌ Erro ao salvar cache:', saveError);
      } else {
        console.log('[SIMPLE-TOTVS] ✅ Cache salvo');
      }
    }

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SIMPLE-TOTVS] ❌ Erro:', error);
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
