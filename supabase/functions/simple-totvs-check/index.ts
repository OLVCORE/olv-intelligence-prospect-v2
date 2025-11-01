import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOTVS_PRODUCTS = [
  // Produtos Principais
  'Protheus', 'RM', 'Datasul', 'Fluig', 'Winthor', 'Microsiga',
  'TOTVS Gestão', 'TOTVS ERP', 'Carol', 'Techfin', 'Logix',
  'TOTVS Backoffice', 'TOTVS Manufatura', 'TOTVS Varejo',
  'TOTVS Educacional', 'TOTVS Saúde',
  // Fluig (Foco Especial)
  'Fluig Platform', 'Fluig ECM', 'Fluig BPM',
  // Variações
  'ERP TOTVS', 'Sistema TOTVS', 'Solução TOTVS'
];

// SEGMENTOS ICP (Foco Manufatura e Serviços)
const ICP_SEGMENTS = [
  'manufatura', 'indústria', 'fabricante', 'industrial',
  'serviços', 'distribuidor', 'distribuição', 'logística',
  'comércio', 'varejo', 'atacado', 'agronegócio'
];

// KEYWORDS DE INTENÇÃO DE COMPRA
const INTENT_KEYWORDS = [
  'implementou', 'implantou', 'adotou', 'contratou',
  'migrou para', 'substituiu', 'escolheu',
  'firmou parceria', 'acordo com', 'contrato com',
  'investimento em', 'modernização', 'transformação digital',
  'memorando de intenção', 'acordo de intenção'
];

const SOURCE_WEIGHTS = {
  // TIER 1: Documentos Oficiais (Máxima Confiança)
  cvm_ri_docs: 100,           // Relações com Investidores
  cvm_balancetes: 95,         // Balanços e demonstrativos
  apollo_tech_stack: 90,      // Stack tecnológico
  // TIER 2: Notícias Premium (Alta Confiança)
  premium_news: 85,           // Valor, Exame, Estadão
  tech_news: 80,              // Convergência Digital, Canaltech
  // TIER 3: Documentos Públicos (Média-Alta Confiança)
  judicial: 75,               // Processos judiciais
  memorandos: 70,             // Memorandos de intenção
  // TIER 4: Vagas e Redes Sociais (Média Confiança)
  linkedin_jobs: 60,          // Vagas LinkedIn
  google_news: 50,            // Notícias gerais
  // TIER 5: Busca Geral (Baixa Confiança)
  google_search: 30           // Busca genérica
};

// GERA VARIAÇÕES DO NOME DA EMPRESA para busca mais flexível
function getCompanyVariations(companyName: string): string[] {
  if (!companyName) return [];
  
  const variations: string[] = [companyName];
  
  // Remover sufixos corporativos
  const corporateSuffixes = [
    ' S.A.', ' S/A', ' SA', ' LTDA', ' LTDA.', ' Ltda', ' Ltda.',
    ' EIRELI', ' EPP', ' ME', ' Indústrias', ' Indústria', 
    ' Comércio', ' Serviços', ' Participações', ' Holdings',
    ' Transportes', ' Logística', ' e Logística'
  ];
  
  let cleanName = companyName;
  for (const suffix of corporateSuffixes) {
    const regex = new RegExp(suffix + '.*$', 'i');
    cleanName = cleanName.replace(regex, '').trim();
  }
  
  if (cleanName !== companyName && cleanName.length >= 3) {
    variations.push(cleanName);
  }
  
  // Pegar apenas primeiras 2 palavras (ex: "Golden Cargo Transportes" -> "Golden Cargo")
  const words = cleanName.split(' ').filter(w => w.length > 0);
  if (words.length > 2) {
    variations.push(words.slice(0, 2).join(' '));
  }
  
  // Primeira palavra se for muito longa (pode ser marca única)
  if (words.length > 0 && words[0].length >= 5) {
    variations.push(words[0]);
  }
  
  return [...new Set(variations)]; // Remove duplicatas
}

// VALIDAÇÃO ULTRA-RESTRITA: Empresa + TOTVS + Produto no MESMO TEXTO
// ACEITA VARIAÇÕES DO NOME (ex: "Golden Cargo" em vez de "Golden Cargo Transportes Ltda")
function isValidTOTVSEvidence(
  snippet: string, 
  title: string, 
  companyName: string
): { valid: boolean; matchType: string; produtos: string[] } {
  
  // COMBINAR título + snippet (isso é O ANÚNCIO COMPLETO)
  const fullText = `${title} ${snippet}`;
  const textLower = fullText.toLowerCase();
  
  // LOG DETALHADO - Debug completo
  console.log('[SIMPLE-TOTVS] 🔍 === VALIDANDO EVIDÊNCIA ===');
  console.log('[SIMPLE-TOTVS] 📄 Título:', title.substring(0, 100));
  console.log('[SIMPLE-TOTVS] 📄 Snippet:', snippet.substring(0, 150));
  console.log('[SIMPLE-TOTVS] 🏢 Empresa:', companyName);
  
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
      console.log('[SIMPLE-TOTVS] ❌ Rejeitado: Vaga NA TOTVS (não cliente)');
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 2. VERIFICAR: "TOTVS" está no texto?
  if (!textLower.includes('totvs')) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: TOTVS não mencionada no texto');
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  // 3. VERIFICAR: Empresa está no texto? (ACEITA VARIAÇÕES)
  const companyVariations = getCompanyVariations(companyName);
  console.log('[SIMPLE-TOTVS] 🔍 Variações do nome:', companyVariations);
  
  let companyFound = false;
  let matchedVariation = '';
  
  for (const variation of companyVariations) {
    if (textLower.includes(variation.toLowerCase())) {
      companyFound = true;
      matchedVariation = variation;
      break;
    }
  }
  
  if (!companyFound) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: Nenhuma variação do nome encontrada no texto');
    console.log('[SIMPLE-TOTVS] 📋 Tentou buscar:', companyVariations.join(' | '));
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  console.log('[SIMPLE-TOTVS] ✅ Empresa encontrada (variação):', matchedVariation);
  
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
    console.log('[SIMPLE-TOTVS] ✅ ✅ ✅ TRIPLE MATCH DETECTADO!');
    console.log('[SIMPLE-TOTVS] 🎯 Produtos:', produtosDetectados.join(', '));
    return { 
      valid: true, 
      matchType: 'triple', 
      produtos: produtosDetectados 
    };
  }
  
  // DOUBLE MATCH: Empresa + TOTVS (sem produto específico)
  console.log('[SIMPLE-TOTVS] ✅ ✅ DOUBLE MATCH DETECTADO!');
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
            
            // DETECTAR INTENÇÃO DE COMPRA
            const hasIntent = INTENT_KEYWORDS.some(k => 
              `${title} ${snippet}`.toLowerCase().includes(k)
            );
            
            evidencias.push({
              source: 'linkedin_jobs',
              source_name: 'LinkedIn Jobs',
              weight: SOURCE_WEIGHTS.linkedin_jobs,
              match_type: validation.matchType,
              content: snippet,
              url: result.link,
              title: title,
              detected_products: validation.produtos,
              has_intent: hasIntent,
              intent_keywords: hasIntent ? 
                INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                []
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
            
            // DETECTAR INTENÇÃO DE COMPRA
            const hasIntent = INTENT_KEYWORDS.some(k => 
              `${title} ${snippet}`.toLowerCase().includes(k)
            );
            
            evidencias.push({
              source: 'google_news',
              source_name: 'Google News',
              weight: SOURCE_WEIGHTS.google_news,
              match_type: validation.matchType,
              content: snippet,
              url: item.link,
              title: title,
              detected_products: validation.produtos,
              has_intent: hasIntent,
              intent_keywords: hasIntent ? 
                INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                []
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
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: 'premium_news',
                source_name: source,
                weight: SOURCE_WEIGHTS.premium_news,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  []
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
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: 'judicial',
                source_name: 'Processos Judiciais',
                weight: SOURCE_WEIGHTS.judicial,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  []
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
            }
          }
        } catch (error) {
          console.error(`[SIMPLE-TOTVS] ❌ Erro em ${source}:`, error);
        }
      }

      // 5. DOCUMENTOS CVM/RI (TIER 1 - Máxima Confiança)
      console.log('[SIMPLE-TOTVS] 📄 Buscando documentos CVM/RI...');
      totalQueries++;

      try {
        const cvmResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: `${shortSearchTerm} TOTVS (site:rad.cvm.gov.br OR site:ri.totvs.com OR filetype:pdf)`,
            num: 10,
            gl: 'br',
            hl: 'pt-br'
          }),
        });

        if (cvmResponse.ok) {
          const cvmData = await cvmResponse.json();
          const results = cvmData.organic || [];

          for (const result of results) {
            const snippet = result.snippet || '';
            const title = result.title || '';
            
            const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
            
            if (!validation.valid) {
              continue;
            }
            
            // DETECTAR INTENÇÃO DE COMPRA
            const hasIntent = INTENT_KEYWORDS.some(k => 
              `${title} ${snippet}`.toLowerCase().includes(k)
            );
            
            evidencias.push({
              source: result.link.includes('cvm.gov.br') ? 'cvm_ri_docs' : 'cvm_balancetes',
              source_name: result.link.includes('cvm.gov.br') ? 'CVM/RI' : 'Balanços',
              weight: result.link.includes('cvm.gov.br') ? 
                      SOURCE_WEIGHTS.cvm_ri_docs : 
                      SOURCE_WEIGHTS.cvm_balancetes,
              match_type: validation.matchType,
              content: snippet,
              url: result.link,
              title: title,
              detected_products: validation.produtos,
              has_intent: hasIntent,
              intent_keywords: hasIntent ? 
                INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                []
            });
            
            console.log(`[SIMPLE-TOTVS] ✅ CVM/RI: ${validation.matchType.toUpperCase()}`, 
                        title.substring(0, 50));
          }
        }
      } catch (error) {
        console.error('[SIMPLE-TOTVS] ❌ Erro CVM/RI:', error);
      }

      // 6. NOTÍCIAS PREMIUM EXPANDIDAS (TIER 2 - Alta Confiança)
      console.log('[SIMPLE-TOTVS] 📰 Buscando notícias premium expandidas...');

      const premiumSourcesExpanded = [
        { domain: 'valor.globo.com', name: 'Valor Econômico' },
        { domain: 'exame.com', name: 'Exame' },
        { domain: 'estadao.com.br', name: 'Estadão' },
        { domain: 'istoedinheiro.com.br', name: 'IstoÉ Dinheiro' },
        { domain: 'infomoney.com.br', name: 'InfoMoney' },
        { domain: 'convergenciadigital.com.br', name: 'Convergência Digital' },
        { domain: 'canaltech.com.br', name: 'Canaltech' }
      ];

      for (const source of premiumSourcesExpanded) {
        totalQueries++;
        
        try {
          const premiumResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: `${shortSearchTerm} TOTVS site:${source.domain}`,
              num: 5,
              gl: 'br',
              hl: 'pt-br',
              tbs: 'qdr:y5'  // Últimos 5 anos
            }),
          });

          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json();
            const results = premiumData.organic || [];

            for (const result of results) {
              const snippet = result.snippet || '';
              const title = result.title || '';
              
              const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
              
              if (!validation.valid) {
                continue;
              }
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: source.domain.includes('convergencia') || source.domain.includes('canaltech') ? 
                        'tech_news' : 'premium_news',
                source_name: source.name,
                weight: source.domain.includes('convergencia') || source.domain.includes('canaltech') ? 
                        SOURCE_WEIGHTS.tech_news : 
                        SOURCE_WEIGHTS.premium_news,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  []
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ ${source.name}: ${validation.matchType.toUpperCase()}`, 
                          title.substring(0, 50));
            }
          }
        } catch (error) {
          console.error(`[SIMPLE-TOTVS] ❌ Erro ${source.name}:`, error);
        }
      }

      // 7. MEMORANDOS E ACORDOS (TIER 3 - Média-Alta Confiança)
      console.log('[SIMPLE-TOTVS] 📋 Buscando memorandos e acordos...');
      totalQueries++;

      try {
        const memorandoResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: `${shortSearchTerm} TOTVS ("memorando de intenção" OR "acordo de intenção" OR "contrato" OR "parceria")`,
            num: 10,
            gl: 'br',
            hl: 'pt-br',
            tbs: 'qdr:y3'  // Últimos 3 anos
          }),
        });

        if (memorandoResponse.ok) {
          const memorandoData = await memorandoResponse.json();
          const results = memorandoData.organic || [];

          for (const result of results) {
            const snippet = result.snippet || '';
            const title = result.title || '';
            
            const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
            
            if (!validation.valid) {
              continue;
            }
            
            // DETECTAR INTENÇÃO DE COMPRA (ALTA PRIORIDADE)
            const hasIntent = INTENT_KEYWORDS.some(k => 
              `${title} ${snippet}`.toLowerCase().includes(k)
            );
            
            evidencias.push({
              source: 'memorandos',
              source_name: 'Memorandos',
              weight: SOURCE_WEIGHTS.memorandos,
              match_type: validation.matchType,
              content: snippet,
              url: result.link,
              title: title,
              detected_products: validation.produtos,
              has_intent: hasIntent,
              intent_keywords: hasIntent ? 
                INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                []
            });
            
            console.log(`[SIMPLE-TOTVS] ✅ Memorando: ${validation.matchType.toUpperCase()}`, 
                        title.substring(0, 50));
          }
        }
      } catch (error) {
        console.error('[SIMPLE-TOTVS] ❌ Erro Memorandos:', error);
      }

      // 8. BUSCA ADICIONAL POR CNPJ (se disponível)
      // Útil quando empresa tem pouca presença digital com nome, mas tem documentos oficiais
      if (cnpj && cnpj !== company_name) {
        console.log('[SIMPLE-TOTVS] 🔢 Buscando por CNPJ:', cnpj);
        totalQueries++;

        try {
          const cnpjResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: `${cnpj} TOTVS`,
              num: 10,
              gl: 'br',
              hl: 'pt-br'
            }),
          });

          if (cnpjResponse.ok) {
            const cnpjData = await cnpjResponse.json();
            const results = cnpjData.organic || [];
            
            console.log('[SIMPLE-TOTVS] 📊 Busca CNPJ - resultados:', results.length);

            for (const result of results) {
              const snippet = result.snippet || '';
              const title = result.title || '';
              
              // Para busca por CNPJ, validamos com nome da empresa se disponível
              const validation = isValidTOTVSEvidence(snippet, title, company_name || cnpj);
              
              if (!validation.valid) {
                continue;
              }
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: 'cnpj_search',
                source_name: 'Busca por CNPJ',
                weight: SOURCE_WEIGHTS.cvm_ri_docs, // Alta confiança (documentos oficiais usam CNPJ)
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  []
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ CNPJ: ${validation.matchType.toUpperCase()}`, 
                          title.substring(0, 50));
            }
          }
        } catch (error) {
          console.error('[SIMPLE-TOTVS] ❌ Erro busca CNPJ:', error);
        }
      }
    }

    const tripleMatches = evidencias.filter(e => e.match_type === 'triple').length;
    const doubleMatches = evidencias.filter(e => e.match_type === 'double').length;
    
    // CALCULAR SCORE PONDERADO
    let totalScore = 0;
    let hasHighConfidenceSource = false;
    let hasIntentEvidence = false;

    for (const evidencia of evidencias) {
      totalScore += evidencia.weight;
      
      // TIER 1 (CVM, RI, Balanços)
      if (evidencia.weight >= 90) {
        hasHighConfidenceSource = true;
      }
      
      // TEM INTENÇÃO DE COMPRA?
      if (evidencia.has_intent) {
        hasIntentEvidence = true;
        totalScore += 20;  // BONUS por intenção
      }
    }

    const numEvidencias = evidencias.length;

    // CLASSIFICAÇÃO INTELIGENTE
    let status: string;
    let confidence: string;

    if (hasHighConfidenceSource && numEvidencias >= 2) {
      // CVM/RI + outra evidência = CERTEZA
      status = 'no-go';
      confidence = 'high';
    } else if (totalScore >= 200) {
      // Score alto = Cliente TOTVS
      status = 'no-go';
      confidence = 'high';
    } else if (totalScore >= 120) {
      // Score médio-alto = Provável cliente
      status = 'no-go';
      confidence = 'medium';
    } else if (numEvidencias >= 2 || hasIntentEvidence) {
      // 2+ evidências OU intenção de compra = Investigar
      status = 'revisar';
      confidence = 'medium';
    } else if (numEvidencias >= 1) {
      // 1 evidência = Revisar
      status = 'revisar';
      confidence = 'low';
    } else {
      // 0 evidências = Não usa TOTVS
      status = 'go';
      confidence = 'low';
    }

    console.log('[SIMPLE-TOTVS] 📊 Classificação:', {
      status,
      confidence,
      totalScore,
      numEvidencias,
      hasHighConfidenceSource,
      hasIntentEvidence
    });

    const executionTime = Date.now() - startTime;

    console.log('[SIMPLE-TOTVS] 📊 Resultado:', {
      status, confidence, tripleMatches, doubleMatches, totalScore,
      evidencias: evidencias.length, executionTime: `${executionTime}ms`
    });

    const resultado = {
      status,
      confidence,
      total_weight: totalScore,
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
          total_weight: totalScore, triple_matches: tripleMatches,
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
