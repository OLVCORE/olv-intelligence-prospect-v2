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

// VALIDAÇÃO ULTRA-RESTRITA: Empresa + TOTVS + Produto no MESMO TEXTO
function isValidTOTVSEvidence(
  snippet: string, 
  title: string, 
  companyName: string
): { valid: boolean; matchType: string; produtos: string[] } {
  
  // COMBINAR título + snippet (isso é O ANÚNCIO COMPLETO)
  const fullText = `${title} ${snippet}`;
  const textLower = fullText.toLowerCase();
  const companyLower = companyName.toLowerCase();
  
  console.log('[SIMPLE-TOTVS] 🔍 Validando:', title.substring(0, 60));
  
  // 1. REJEITAR: Vagas NA TOTVS (não cliente)
  const totvsJobPatterns = [
    'totvs contratou',
    'vaga na totvs',
    'trabalhar na totvs',
    'oportunidade na totvs',
    'junte-se à totvs',
    'totvs está contratando',
    'carreira na totvs'
  ];
  
  for (const pattern of totvsJobPatterns) {
    if (textLower.includes(pattern)) {
      console.log('[SIMPLE-TOTVS] ❌ Rejeitado: Vaga NA TOTVS');
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 2. VERIFICAR: Empresa está no texto?
  if (!textLower.includes(companyLower)) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: Empresa não mencionada');
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  // 3. VERIFICAR: "TOTVS" está no texto?
  if (!textLower.includes('totvs')) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: TOTVS não mencionada');
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  // 4. DETECTAR: Produtos TOTVS mencionados
  const produtosDetectados: string[] = [];
  
  for (const produto of TOTVS_PRODUCTS) {
    if (textLower.includes(produto.toLowerCase())) {
      produtosDetectados.push(produto);
    }
  }
  
  // 5. CLASSIFICAR: Triple ou Double Match
  
  // TRIPLE MATCH: Empresa + TOTVS + Produto (TUDO NO MESMO TEXTO)
  if (produtosDetectados.length > 0) {
    console.log('[SIMPLE-TOTVS] ✅ TRIPLE MATCH:', produtosDetectados.join(', '));
    return { 
      valid: true, 
      matchType: 'triple', 
      produtos: produtosDetectados 
    };
  }
  
  // DOUBLE MATCH: Empresa + TOTVS (sem produto específico)
  console.log('[SIMPLE-TOTVS] ✅ DOUBLE MATCH');
  return { 
    valid: true, 
    matchType: 'double', 
    produtos: [] 
  };
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
            
            // Validar LinkedIn job postings
            if (!isValidLinkedInJobPosting(combined)) {
              continue;
            }
            
            // VALIDAÇÃO ULTRA-RESTRITA
            const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
            
            if (!validation.valid) {
              continue;
            }
            
            validLinkedInCount++;
            evidencias.push({
              source: 'linkedin_jobs',
              weight: SOURCE_WEIGHTS.linkedin_jobs,
              match_type: validation.matchType,
              content: snippet,
              url: result.link,
              title: title,
              detected_products: validation.produtos,
            });
            
            console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
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
            
            // VALIDAÇÃO ULTRA-RESTRITA
            const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
            
            if (!validation.valid) {
              continue;
            }
            
            validNewsCount++;
            evidencias.push({
              source: 'google_news',
              weight: SOURCE_WEIGHTS.google_news,
              match_type: validation.matchType,
              content: snippet,
              url: item.link,
              title: title,
              detected_products: validation.produtos,
            });
            
            console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
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
              
              // VALIDAÇÃO ULTRA-RESTRITA
              const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
              
              if (!validation.valid) {
                continue;
              }
              
              evidencias.push({
                source: 'premium_news',
                weight: SOURCE_WEIGHTS.premium_news,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
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
              
              // VALIDAÇÃO ULTRA-RESTRITA
              const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
              
              if (!validation.valid) {
                continue;
              }
              
              evidencias.push({
                source: 'judicial',
                weight: SOURCE_WEIGHTS.judicial,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
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
