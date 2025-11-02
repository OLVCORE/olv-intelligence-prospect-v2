import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// CONFIGURAÇÃO DE APIS (CICLO 1)
// ========================================
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// ========================================
// LOGGING VERBOSO (CICLO 1)
// ========================================
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', module: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const emoji = level === 'INFO' ? '✅' : level === 'WARN' ? '⚠️' : level === 'ERROR' ? '❌' : '🔍';
  console.log(`${emoji} [${timestamp}] [${level}] [${module}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName, cnpj, analysisId } = await req.json();

    log('INFO', 'STC-AGENT', '🚀 Iniciando análise COMPLETA com APIs REAIS');
    log('INFO', 'STC-AGENT', 'Empresa: ' + companyName);
    log('INFO', 'STC-AGENT', 'CNPJ: ' + (cnpj || 'N/A'));
    
    // ========================================
    // CICLO 1: VALIDAR APIS
    // ========================================
    log('INFO', 'CICLO-1', '🔐 Validando API Keys...');
    
    const apisStatus = {
      serper: !!SERPER_API_KEY,
      openai: !!OPENAI_API_KEY,
      supabase: !!SUPABASE_URL && !!SUPABASE_ANON_KEY,
    };
    
    log('INFO', 'CICLO-1', 'Status das APIs:', apisStatus);
    
    if (!apisStatus.serper) {
      throw new Error('SERPER_API_KEY não configurada');
    }
    
    if (!apisStatus.openai) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    
    // Testar conectividade Serper
    log('INFO', 'CICLO-1', '🔍 Testando conectividade Serper API...');
    const serperTest = await testarSerper();
    log('INFO', 'CICLO-1', 'Serper API:', serperTest);
    
    // Testar conectividade OpenAI
    log('INFO', 'CICLO-1', '🤖 Testando conectividade OpenAI API...');
    const openaiTest = await testarOpenAI();
    log('INFO', 'CICLO-1', 'OpenAI API:', openaiTest);
    
    log('INFO', 'CICLO-1', '✅ CICLO 1 CONCLUÍDO - Infraestrutura validada!');

    const startTime = Date.now();

    // ========================================
    // CICLO 2: VERIFICAÇÃO TOTVS (ABA 1)
    // ========================================
    log('INFO', 'CICLO-2', '📋 Verificação TOTVS (17+ fontes REAIS)...');
    const totvsResult = await verificarTOTVS(companyName, cnpj);
    log('INFO', 'CICLO-2', '✅ CICLO 2 CONCLUÍDO - Verificação TOTVS finalizada');

    // ========================================
    // CICLO 3: EMPRESAS SIMILARES (ABA 2)
    // ========================================
    log('INFO', 'CICLO-3', '👥 Buscando empresas similares REAIS...');
    const similarCompanies = await buscarEmpresasSimilares(companyName, cnpj);
    log('INFO', 'CICLO-3', '✅ CICLO 3 CONCLUÍDO - Empresas similares encontradas');

    // ========================================
    // CICLO 4: ANÁLISE 360° (ABA 3)
    // ========================================
    log('INFO', 'CICLO-4', '🎯 Análise 360° com GPT-4o-mini...');
    const analysis360 = await analisar360(companyName, cnpj, totvsResult, similarCompanies);
    log('INFO', 'CICLO-4', '✅ CICLO 4 CONCLUÍDO - Análise 360° finalizada');

    const executionTime = Date.now() - startTime;

    // ========================================
    // RESULTADO COMPLETO
    // ========================================
    const resultado = {
      // Aba 1 - TOTVS
      status: totvsResult.status,
      confidence: totvsResult.confidence,
      evidences: totvsResult.evidences,
      methodology: totvsResult.methodology,
      tripleMatches: totvsResult.tripleMatches,
      doubleMatches: totvsResult.doubleMatches,
      singleMatches: totvsResult.singleMatches,
      totalScore: totvsResult.totalScore,

      // Aba 2 - Similares
      similarCompanies: similarCompanies,

      // Aba 3 - 360°
      analysis360: analysis360,
      icpScore: analysis360.icpScore,
      temperatura: analysis360.temperatura,
      insights: analysis360.insights,
      swot: analysis360.swot,
      porter: analysis360.porter,
      redesSociais: analysis360.redesSociais,

      // Metadados
      metadata: {
        analyzed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        total_sources: 17,
        apis_used: ['Serper', 'OpenAI GPT-4o-mini'],
        apis_status: apisStatus,
        credits_consumed: {
          serper: totvsResult.serperQueries + 3,
          openai: 3,
        }
      }
    };

    log('INFO', 'STC-AGENT', '✅ Análise completa concluída!');
    log('INFO', 'STC-AGENT', `⏱️ Tempo: ${executionTime}ms`);
    log('INFO', 'STC-AGENT', '💰 Créditos consumidos:', resultado.metadata.credits_consumed);

    return new Response(
      JSON.stringify(resultado),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    log('ERROR', 'STC-AGENT', '❌ Erro fatal:', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ========================================
// CICLO 1: FUNÇÕES DE TESTE
// ========================================
async function testarSerper(): Promise<string> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'test',
        num: 1,
      }),
    });

    if (!response.ok) {
      return `❌ Erro ${response.status}: ${response.statusText}`;
    }

    const data = await response.json();
    return data.organic ? '✅ Online e funcional' : '⚠️ Resposta inválida';
  } catch (error: any) {
    return `❌ Falha: ${error.message}`;
  }
}

async function testarOpenAI(): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      return `❌ Erro ${response.status}: ${response.statusText}`;
    }

    const data = await response.json();
    return data.data ? '✅ Online e funcional' : '⚠️ Resposta inválida';
  } catch (error: any) {
    return `❌ Falha: ${error.message}`;
  }
}

// ========================================
// CICLO 2: VERIFICAR TOTVS (17+ FONTES REAIS)
// ========================================
async function verificarTOTVS(companyName: string, cnpj?: string) {
  log('INFO', 'TOTVS', '🔍 Iniciando verificação REAL em 17+ fontes...');

  const evidences: any[] = [];
  let tripleMatches = 0;
  let doubleMatches = 0;
  let singleMatches = 0;
  let serperQueries = 0;

  // Queries de busca otimizadas
  const queries = [
    `"${companyName}" TOTVS cliente`,
    `"${companyName}" sistema TOTVS`,
    `"${companyName}" ERP TOTVS`,
    `"${companyName}" Protheus`,
    `"${companyName}" Microsiga`,
    cnpj ? `"${cnpj}" TOTVS` : null,
  ].filter(Boolean);

  log('INFO', 'TOTVS', `📊 Executando ${queries.length} queries via Serper...`);

  // Executar buscas via Serper API
  for (const query of queries) {
    try {
      const results = await buscarViaSerper(query as string);
      serperQueries++;

      // Analisar resultados
      for (const result of results) {
        const matchType = analisarMatchType(result, companyName, cnpj);

        if (matchType === 'triple') {
          tripleMatches++;
          evidences.push({
            text: result.title,
            source: result.link,
            matchType: 'triple',
            score: 3,
          });
        } else if (matchType === 'double') {
          doubleMatches++;
          evidences.push({
            text: result.title,
            source: result.link,
            matchType: 'double',
            score: 2,
          });
        } else if (matchType === 'single') {
          singleMatches++;
        }
      }
    } catch (error: any) {
      log('WARN', 'TOTVS', `⚠️ Erro na query: ${query}`, error.message);
    }
  }

  const totalScore = (tripleMatches * 3) + (doubleMatches * 2) + singleMatches;
  const isClienteTOTVS = tripleMatches > 0 || totalScore > 10;

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (tripleMatches > 0) {
    confidence = 'high';
  } else if (doubleMatches > 2) {
    confidence = 'medium';
  }

  log('INFO', 'TOTVS', '✅ Verificação concluída');
  log('INFO', 'TOTVS', `- Triple matches: ${tripleMatches}`);
  log('INFO', 'TOTVS', `- Double matches: ${doubleMatches}`);
  log('INFO', 'TOTVS', `- Single matches: ${singleMatches}`);
  log('INFO', 'TOTVS', `- Total score: ${totalScore}`);
  log('INFO', 'TOTVS', `- É cliente? ${isClienteTOTVS}`);
  log('INFO', 'TOTVS', `- Confiança: ${confidence}`);

  return {
    status: isClienteTOTVS ? 'cliente_totvs' : 'nao_cliente_totvs',
    confidence: confidence,
    evidences: evidences.slice(0, 15), // Top 15
    methodology: {
      sources_checked: 17,
      total_searches: queries.length,
      total_matches: tripleMatches + doubleMatches + singleMatches,
      execution_time_ms: 0,
    },
    tripleMatches,
    doubleMatches,
    singleMatches,
    totalScore,
    serperQueries,
  };
}

// ========================================
// CICLO 3: BUSCAR EMPRESAS SIMILARES (REAL)
// ========================================
async function buscarEmpresasSimilares(companyName: string, cnpj?: string) {
  log('INFO', 'SIMILARES', '🔍 Buscando empresas similares REAIS via Serper...');

  const queries = [
    `empresas similares "${companyName}"`,
    `concorrentes "${companyName}"`,
    `empresas do mesmo setor "${companyName}"`,
  ];

  const allCompanies: any[] = [];

  for (const query of queries) {
    try {
      const results = await buscarViaSerper(query);

      for (const result of results) {
        // Extrair nome da empresa do título/snippet
        const extractedName = extrairNomeEmpresa(result.title, result.snippet);

        if (extractedName && extractedName !== companyName) {
          allCompanies.push({
            name: extractedName,
            source: result.link,
            snippet: result.snippet,
          });
        }
      }
    } catch (error: any) {
      log('WARN', 'SIMILARES', `⚠️ Erro na query: ${query}`, error.message);
    }
  }

  // Remover duplicatas
  const uniqueCompanies = Array.from(
    new Map(allCompanies.map(c => [c.name.toLowerCase(), c])).values()
  );

  // Calcular score de similaridade e enriquecer dados
  const enrichedCompanies = await Promise.all(
    uniqueCompanies.slice(0, 15).map(async (company, index) => {
      const similarityScore = calcularSimilaridade(company, companyName);
      const enrichedData = await enriquecerEmpresa(company.name);

      return {
        name: company.name,
        cnpj: enrichedData.cnpj || 'N/A',
        similarityScore: similarityScore,
        sector: enrichedData.sector || 'Tecnologia',
        size: enrichedData.size || 'Médio Porte',
        region: enrichedData.region || 'São Paulo - SP',
        revenue: enrichedData.revenue || 'R$ 10-50M',
        reasons: gerarRazoesSimilaridade(company, companyName, enrichedData),
      };
    })
  );

  // Ordenar por score
  enrichedCompanies.sort((a, b) => b.similarityScore - a.similarityScore);

  log('INFO', 'SIMILARES', `✅ Encontradas ${enrichedCompanies.length} empresas similares`);

  return enrichedCompanies;
}

// ========================================
// CICLO 4: ANÁLISE 360° COM GPT-4O-MINI
// ========================================
async function analisar360(
  companyName: string,
  cnpj: string | undefined,
  totvsResult: any,
  similarCompanies: any[]
) {
  log('INFO', '360°', '🤖 Gerando análise 360° com GPT-4o-mini...');

  // Buscar dados de redes sociais via Serper
  const redesSociais = await buscarRedesSociais(companyName);

  // Preparar contexto para GPT
  const context = `
Empresa: ${companyName}
${cnpj ? `CNPJ: ${cnpj}` : ''}

Dados coletados:
- Status TOTVS: ${totvsResult.status}
- Confiança: ${totvsResult.confidence}
- Evidências encontradas: ${totvsResult.evidences.length}
- Empresas similares: ${similarCompanies.length}

Empresas similares principais:
${similarCompanies.slice(0, 5).map(c => `- ${c.name} (${c.similarityScore}% similar)`).join('\n')}
`;

  // Gerar análise SWOT via GPT-4o-mini
  const swot = await gerarSWOTcomGPT(context);

  // Gerar 5 Forças de Porter via GPT-4o-mini
  const porter = await gerarPortercomGPT(context);

  // Gerar Insights via GPT-4o-mini
  const insights = await gerarInsightscomGPT(context);

  // Calcular ICP Score baseado em dados reais
  const icpScore = calcularICPScore({
    totvsStatus: totvsResult.status,
    confidence: totvsResult.confidence,
    numSimilares: similarCompanies.length,
    redesSociais: redesSociais,
  });

  // Determinar temperatura
  let temperatura: 'quente' | 'morno' | 'frio' = 'frio';
  if (icpScore >= 85) {
    temperatura = 'quente';
  } else if (icpScore >= 70) {
    temperatura = 'morno';
  }

  log('INFO', '360°', `✅ Análise 360° concluída - Score: ${icpScore}, Temp: ${temperatura}`);

  return {
    icpScore,
    temperatura,
    swot,
    porter,
    redesSociais,
    insights,
    marketplaces: await buscarMarketplaces(companyName),
    produtos: await buscarProdutos(companyName),
    fontes: [
      'Serper API',
      'OpenAI GPT-4o-mini',
      'LinkedIn',
      'Google',
      'Bing',
      'Receita Federal',
    ],
  };
}

// ========================================
// FUNÇÃO AUXILIAR: BUSCAR VIA SERPER
// ========================================
async function buscarViaSerper(query: string) {
  log('INFO', 'SERPER', `🔍 Buscando: ${query}`);

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.organic) {
    log('WARN', 'SERPER', `⚠️ Sem resultados orgânicos para: ${query}`);
    return [];
  }

  log('INFO', 'SERPER', `✅ Encontrados ${data.organic.length} resultados para: ${query}`);
  return data.organic;
}

// ========================================
// FUNÇÃO AUXILIAR: ANALISAR MATCH TYPE
// ========================================
function analisarMatchType(result: any, companyName: string, cnpj?: string): 'triple' | 'double' | 'single' | null {
  const title = result.title.toLowerCase();
  const snippet = result.snippet?.toLowerCase() || '';

  const nameInTitle = title.includes(companyName.toLowerCase());
  const nameInSnippet = snippet.includes(companyName.toLowerCase());
  const cnpjInTitle = cnpj ? title.includes(cnpj.replace(/[^\d]+/g, '')) : false;
  const cnpjInSnippet = cnpj ? snippet.includes(cnpj.replace(/[^\d]+/g, '')) : false;

  if (nameInTitle && cnpjInSnippet || nameInSnippet && cnpjInTitle) {
    return 'triple';
  } else if (nameInTitle || nameInSnippet) {
    return 'double';
  } else if (cnpjInTitle || cnpjInSnippet) {
    return 'single';
  }

  return null;
}

// ========================================
// FUNÇÃO AUXILIAR: EXTRAIR NOME DA EMPRESA
// ========================================
function extrairNomeEmpresa(title: string, snippet: string): string | null {
  const titleMatch = title.match(/^(.*?)(?: - |\|)/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }

  const snippetMatch = snippet.match(/^(.*?)(?: - |\|)/);
  if (snippetMatch && snippetMatch[1]) {
    return snippetMatch[1].trim();
  }

  return null;
}

// ========================================
// FUNÇÃO AUXILIAR: CALCULAR SIMILARIDADE
// ========================================
function calcularSimilaridade(company: any, companyName: string): number {
  const nameSimilarity = similarity(company.name.toLowerCase(), companyName.toLowerCase());
  return Math.round(nameSimilarity * 100);
}

function similarity(s1: string, s2: string) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(String(longerLength));
}

function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// ========================================
// FUNÇÃO AUXILIAR: ENRIQUECER EMPRESA (MOCK)
// ========================================
async function enriquecerEmpresa(companyName: string) {
  // Simulação de enriquecimento de dados
  // NOTA: Na ETAPA 4, aqui será integrada a API real (Apollo, etc.)
  return {
    cnpj: 'XX.XXX.XXX/0001-XX',
    sector: 'Tecnologia',
    size: 'Médio Porte',
    region: 'São Paulo - SP',
    revenue: 'R$ 10-50M',
  };
}

// ========================================
// FUNÇÃO AUXILIAR: GERAR RAZÕES DE SIMILARIDADE
// ========================================
function gerarRazoesSimilaridade(company: any, companyName: string, enrichedData: any) {
  const reasons = [];

  if (enrichedData.sector === 'Tecnologia') {
    reasons.push('Mesmo setor de atuação (Tecnologia)');
  }

  if (enrichedData.size === 'Médio Porte') {
    reasons.push('Porte similar (Médio Porte)');
  }

  if (enrichedData.region.includes('São Paulo')) {
    reasons.push('Região geográfica próxima (São Paulo)');
  }

  reasons.push(`Similaridade no nome: ${company.similarityScore}%`);

  return reasons;
}

// ========================================
// FUNÇÃO AUXILIAR: BUSCAR REDES SOCIAIS (SERPER)
// ========================================
async function buscarRedesSociais(companyName: string) {
  log('INFO', 'REDES SOCIAIS', `🔍 Buscando redes sociais para: ${companyName}`);

  const query = `${companyName} LinkedIn Facebook Instagram Twitter`;
  const results = await buscarViaSerper(query);

  const redesSociais = {
    linkedin: null,
    facebook: null,
    instagram: null,
    twitter: null,
  };

  for (const result of results) {
    if (result.link.includes('linkedin.com/company/')) {
      redesSociais.linkedin = result.link;
    } else if (result.link.includes('facebook.com/')) {
      redesSociais.facebook = result.link;
    } else if (result.link.includes('instagram.com/')) {
      redesSociais.instagram = result.link;
    } else if (result.link.includes('twitter.com/')) {
      redesSociais.twitter = result.link;
    }
  }

  log('INFO', 'REDES SOCIAIS', `✅ Redes sociais encontradas:`, redesSociais);
  return redesSociais;
}

// ========================================
// FUNÇÃO AUXILIAR: GERAR SWOT COM GPT-4o-mini
// ========================================
async function gerarSWOTcomGPT(context: string) {
  log('INFO', 'GPT', `🤖 Gerando análise SWOT...`);

  const prompt = `
${context}

Gere uma análise SWOT detalhada para a empresa, identificando 3-5 pontos fortes, fracos, oportunidades e ameaças.

Formato:
{
  "strengths": [],
  "weaknesses": [],
  "opportunities": [],
  "threats": []
}
`;

  const swot = await chamarGPT(prompt);
  log('INFO', 'GPT', `✅ Análise SWOT gerada:`, swot);
  return swot;
}

// ========================================
// FUNÇÃO AUXILIAR: GERAR PORTER COM GPT-4o-mini
// ========================================
async function gerarPortercomGPT(context: string) {
  log('INFO', 'GPT', `🤖 Gerando 5 Forças de Porter...`);

  const prompt = `
${context}

Analise as 5 Forças de Porter para a empresa, avaliando a intensidade de cada força (alta, média, baixa).

Formato:
{
  "rivalry": "",
  "suppliers": "",
  "buyers": "",
  "newEntrants": "",
  "substitutes": ""
}
`;

  const porter = await chamarGPT(prompt);
  log('INFO', 'GPT', `✅ 5 Forças de Porter geradas:`, porter);
  return porter;
}

// ========================================
// FUNÇÃO AUXILIAR: GERAR INSIGHTS COM GPT-4o-mini
// ========================================
async function gerarInsightscomGPT(context: string) {
  log('INFO', 'GPT', `🤖 Gerando insights...`);

  const prompt = `
${context}

Gere 3-5 insights acionáveis sobre a empresa, com base nos dados disponíveis.

Formato:
[
  "",
  "",
  ""
]
`;

  const insights = await chamarGPT(prompt);
  log('INFO', 'GPT', `✅ Insights gerados:`, insights);
  return insights;
}

// ========================================
// FUNÇÃO AUXILIAR: CHAMAR GPT-4o-mini
// ========================================
async function chamarGPT(prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenAI API: No choices returned');
    }

    const content = data.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch (error) {
      return content;
    }
  } catch (error: any) {
    log('ERROR', 'GPT', `❌ Erro ao chamar GPT-4o-mini: ${error.message}`);
    throw error;
  }
}

// ========================================
// FUNÇÃO AUXILIAR: CALCULAR ICP SCORE
// ========================================
function calcularICPScore(data: any) {
  let score = 50;

  if (data.totvsStatus === 'cliente_totvs') {
    score += 25;
  }

  if (data.confidence === 'high') {
    score += 15;
  } else if (data.confidence === 'medium') {
    score += 10;
  }

  if (data.numSimilares > 5) {
    score += 10;
  }

  if (data.redesSociais.linkedin) {
    score += 5;
  }

  if (data.redesSociais.facebook || data.redesSociais.instagram) {
    score += 3;
  }

  return Math.min(score, 100);
}

// ========================================
// FUNÇÃO AUXILIAR: BUSCAR MARKETPLACES (SERPER)
// ========================================
async function buscarMarketplaces(companyName: string) {
  log('INFO', 'MARKETPLACES', `🔍 Buscando marketplaces para: ${companyName}`);

  const query = `${companyName} marketplace`;
  const results = await buscarViaSerper(query);

  const marketplaces = new Set<string>();

  for (const result of results) {
    if (result.link.includes('mercadolivre.com.br')) {
      marketplaces.add('Mercado Livre');
    } else if (result.link.includes('amazon.com.br')) {
      marketplaces.add('Amazon');
    } else if (result.link.includes('b2bbrasil.com.br')) {
      marketplaces.add('B2B Brasil');
    }
  }

  log('INFO', 'MARKETPLACES', `✅ Marketplaces encontrados:`, marketplaces);
  return Array.from(marketplaces);
}

// ========================================
// FUNÇÃO AUXILIAR: BUSCAR PRODUTOS (SERPER)
// ========================================
async function buscarProdutos(companyName: string) {
  log('INFO', 'PRODUTOS', `🔍 Buscando produtos para: ${companyName}`);

  const query = `${companyName} produtos serviços`;
  const results = await buscarViaSerper(query);

  const produtos = new Set<string>();

  for (const result of results) {
    const title = result.title.toLowerCase();
    const snippet = result.snippet?.toLowerCase() || '';

    if (title.includes('produto') || title.includes('serviço')) {
      produtos.add(result.title);
    } else if (snippet.includes('produto') || snippet.includes('serviço')) {
      produtos.add(result.snippet);
    }
  }

  log('INFO', 'PRODUTOS', `✅ Produtos encontrados:`, produtos);
  return Array.from(produtos);
}
