import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName, cnpj, analysisId } = await req.json();

    console.log('[STC AGENT] 🚀 Iniciando análise COMPLETA (3 abas)...');
    console.log('[STC AGENT] Empresa:', companyName);
    console.log('[STC AGENT] CNPJ:', cnpj);

    const startTime = Date.now();

    // ========================================
    // 1. VERIFICAÇÃO TOTVS (ABA 1)
    // ========================================
    console.log('[STC AGENT] 📋 1/3 - Verificação TOTVS...');
    const totvsResult = await verificarTOTVS(companyName, cnpj);

    // ========================================
    // 2. EMPRESAS SIMILARES (ABA 2)
    // ========================================
    console.log('[STC AGENT] 👥 2/3 - Buscando empresas similares...');
    const similarCompanies = await buscarEmpresasSimilares(companyName, cnpj);

    // ========================================
    // 3. ANÁLISE 360° (ABA 3)
    // ========================================
    console.log('[STC AGENT] 🎯 3/3 - Análise 360°...');
    const analysis360 = await analisar360(companyName, cnpj);

    const executionTime = Date.now() - startTime;

    // ========================================
    // RESULTADO COMPLETO
    // ========================================
    const resultado = {
      // Dados para Aba 1 (TOTVS)
      status: totvsResult.status,
      confidence: totvsResult.confidence,
      evidences: totvsResult.evidences,
      methodology: totvsResult.methodology,
      tripleMatches: totvsResult.tripleMatches,
      doubleMatches: totvsResult.doubleMatches,
      singleMatches: totvsResult.singleMatches,
      totalScore: totvsResult.totalScore,

      // Dados para Aba 2 (Similares)
      similarCompanies: similarCompanies,

      // Dados para Aba 3 (360°)
      analysis360: analysis360,
      icpScore: analysis360.icpScore,
      temperatura: analysis360.temperatura,
      insights: analysis360.insights,
      swot: analysis360.swot,
      redesSociais: analysis360.redesSociais,

      // Metadados
      metadata: {
        analyzed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        total_sources: 17,
      }
    };

    console.log('[STC AGENT] ✅ Análise completa concluída!');
    console.log('[STC AGENT] ⏱️ Tempo:', executionTime, 'ms');

    return new Response(
      JSON.stringify(resultado),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[STC AGENT] ❌ Erro:', error);
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
// FUNÇÃO: VERIFICAR TOTVS
// ========================================
async function verificarTOTVS(companyName: string, cnpj?: string) {
  console.log('[TOTVS] Iniciando verificação com 17+ fontes...');

  const evidences: any[] = [];
  let tripleMatches = 0;
  let doubleMatches = 0;
  let singleMatches = 0;

  // 17+ FONTES DE BUSCA
  const sources = [
    'serper.dev',
    'google.com',
    'bing.com',
    'linkedin.com',
    'glassdoor.com',
    'reclameaqui.com.br',
    'mercadolivre.com.br',
    'b2bbrasil.com.br',
    'paginasamarelas.com.br',
    'guiamais.com.br',
    'cadastroempresas.com.br',
    'cnpj.biz',
    'receitaws.com.br',
    'brasil.io',
    'jusbrasil.com.br',
    'tjsp.jus.br',
    'totvs.com/cases',
  ];

  // Queries de busca
  const queries = [
    `"${companyName}" TOTVS`,
    `"${companyName}" cliente TOTVS`,
    `"${companyName}" sistema TOTVS`,
    `"${companyName}" ERP TOTVS`,
    `"${companyName}" Protheus`,
    `"${companyName}" Microsiga`,
    cnpj ? `"${cnpj}" TOTVS` : null,
  ].filter(Boolean);

  console.log('[TOTVS] Executando', queries.length, 'queries em', sources.length, 'fontes...');

  // Simular busca em múltiplas fontes
  // NOTA: Na ETAPA 4, aqui serão integradas as APIs reais (Serper, Firecrawl)
  for (const query of queries) {
    const mockResults = await buscarNaWeb(query as string, sources);
    
    mockResults.forEach(result => {
      if (result.matchType === 'triple') {
        tripleMatches++;
        evidences.push({
          text: result.text,
          source: result.source,
          matchType: 'triple',
          score: 3,
        });
      } else if (result.matchType === 'double') {
        doubleMatches++;
        evidences.push({
          text: result.text,
          source: result.source,
          matchType: 'double',
          score: 2,
        });
      } else {
        singleMatches++;
      }
    });
  }

  const totalScore = (tripleMatches * 3) + (doubleMatches * 2) + singleMatches;
  const isClienteTOTVS = tripleMatches > 0 || totalScore > 10;

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (tripleMatches > 0) {
    confidence = 'high';
  } else if (doubleMatches > 2) {
    confidence = 'medium';
  }

  console.log('[TOTVS] ✅ Verificação concluída:');
  console.log('[TOTVS] - Triple matches:', tripleMatches);
  console.log('[TOTVS] - Double matches:', doubleMatches);
  console.log('[TOTVS] - Single matches:', singleMatches);
  console.log('[TOTVS] - Total score:', totalScore);
  console.log('[TOTVS] - É cliente?', isClienteTOTVS);

  return {
    status: isClienteTOTVS ? 'cliente_totvs' : 'nao_cliente_totvs',
    confidence: confidence,
    evidences: evidences.slice(0, 10), // Limitar a 10 principais
    methodology: {
      sources_checked: sources.length,
      total_searches: queries.length,
      total_matches: tripleMatches + doubleMatches + singleMatches,
      execution_time_ms: 0,
    },
    tripleMatches,
    doubleMatches,
    singleMatches,
    totalScore,
  };
}

// ========================================
// FUNÇÃO: BUSCAR EMPRESAS SIMILARES
// ========================================
async function buscarEmpresasSimilares(companyName: string, cnpj?: string) {
  console.log('[SIMILARES] Buscando empresas similares...');
  console.log('[SIMILARES] Fontes: LinkedIn, Google, Receita Federal, Apollo');

  // Simular busca de empresas similares
  // NOTA: Na ETAPA 4, aqui serão integradas APIs reais
  const mockCompanies = [
    {
      name: 'Tech Solutions Brasil Ltda',
      cnpj: '12.345.678/0001-90',
      similarityScore: 85,
      sector: 'Tecnologia da Informação',
      size: 'Médio Porte',
      region: 'São Paulo - SP',
      revenue: 'R$ 10-50M',
      reasons: [
        'Mesmo setor de atuação (Tecnologia da Informação)',
        'Porte similar (Médio Porte)',
        'Região geográfica próxima (São Paulo)',
        'Faturamento compatível (R$ 10-50M)',
      ],
    },
    {
      name: 'Inovação Digital Sistemas S.A.',
      cnpj: '98.765.432/0001-10',
      similarityScore: 78,
      sector: 'Desenvolvimento de Software',
      size: 'Médio Porte',
      region: 'Rio de Janeiro - RJ',
      revenue: 'R$ 10-50M',
      reasons: [
        'Mesmo setor de atuação (Tecnologia)',
        'Porte similar (Médio Porte)',
        'Produtos similares (Software empresarial)',
      ],
    },
    {
      name: 'Consultoria Empresarial Premium',
      cnpj: '11.222.333/0001-44',
      similarityScore: 72,
      sector: 'Consultoria e Serviços',
      size: 'Grande Porte',
      region: 'São Paulo - SP',
      revenue: 'R$ 50-100M',
      reasons: [
        'Setor relacionado (Consultoria empresarial)',
        'Região geográfica próxima',
        'Mercado-alvo similar (B2B corporativo)',
      ],
    },
  ];

  console.log('[SIMILARES] ✅ Encontradas', mockCompanies.length, 'empresas similares');

  return mockCompanies;
}

// ========================================
// FUNÇÃO: ANÁLISE 360°
// ========================================
async function analisar360(companyName: string, cnpj?: string) {
  console.log('[360°] Gerando análise 360° completa...');
  console.log('[360°] Analisando: Redes Sociais, SWOT, Porter, Maturidade Digital');

  // Calcular ICP Score (simulado)
  const icpScore = Math.floor(Math.random() * 30) + 70; // 70-100

  // Determinar temperatura
  let temperatura: 'quente' | 'morno' | 'frio' = 'frio';
  if (icpScore >= 85) {
    temperatura = 'quente';
  } else if (icpScore >= 70) {
    temperatura = 'morno';
  }

  console.log('[360°] ✅ ICP Score:', icpScore);
  console.log('[360°] ✅ Temperatura:', temperatura);

  return {
    icpScore,
    temperatura,
    swot: {
      strengths: [
        'Forte presença digital e reconhecimento de marca',
        'Equipe qualificada com experiência no setor',
        'Boa reputação no mercado e alta satisfação dos clientes',
        'Processos bem estruturados e documentados',
        'Infraestrutura tecnológica moderna',
      ],
      weaknesses: [
        'Sistema legado desatualizado necessita modernização',
        'Falta de integração entre departamentos e sistemas',
        'Processos manuais consomem tempo e recursos',
        'Dependência de fornecedores específicos',
        'Capacitação tecnológica limitada da equipe',
      ],
      opportunities: [
        'Expansão para novos mercados e regiões',
        'Digitalização completa dos processos operacionais',
        'Automação de tarefas repetitivas e burocráticas',
        'Integração com marketplaces e canais digitais',
        'Implementação de analytics e inteligência de dados',
      ],
      threats: [
        'Concorrência acirrada no setor',
        'Mudanças regulatórias e compliance complexo',
        'Instabilidade econômica e crise',
        'Rápida evolução tecnológica',
        'Risco de obsolescência dos sistemas atuais',
      ],
    },
    porter: {
      rivalry: 'Alta rivalidade entre concorrentes estabelecidos no setor',
      suppliers: 'Poder moderado dos fornecedores de tecnologia',
      buyers: 'Alto poder de barganha dos clientes empresariais',
      newEntrants: 'Barreiras médias para novos entrantes no mercado',
      substitutes: 'Ameaça moderada de produtos e serviços substitutos',
    },
    redesSociais: {
      linkedin: {
        followers: Math.floor(Math.random() * 10000) + 1000,
        engagement: 'Médio',
        posts_per_week: 3,
      },
      facebook: {
        followers: Math.floor(Math.random() * 5000) + 500,
        engagement: 'Baixo',
        posts_per_week: 2,
      },
      instagram: {
        followers: Math.floor(Math.random() * 8000) + 800,
        engagement: 'Alto',
        posts_per_week: 5,
      },
      twitter: {
        followers: Math.floor(Math.random() * 3000) + 300,
        engagement: 'Baixo',
        posts_per_week: 1,
      },
    },
    marketplaces: [
      'Mercado Livre',
      'B2B Brasil',
      'Amazon Business',
    ],
    produtos: [
      'Software de Gestão Empresarial',
      'Consultoria em Processos',
      'Treinamento Corporativo',
    ],
    insights: [
      '🔥 Empresa com alto potencial de crescimento e expansão',
      '⚡ Necessita modernização tecnológica urgente dos sistemas',
      '🎯 Forte presença no mercado regional com oportunidades nacionais',
      '💡 Oportunidade clara de expansão através de canais digitais',
      '📊 Perfil ideal para implementação de ERP integrado',
      '🚀 Momento propício para transformação digital',
    ],
    fontes: [
      'LinkedIn Company Page',
      'Google Business Profile',
      'Reclame Aqui',
      'Glassdoor',
      'Mercado Livre',
      'Facebook Business',
      'Instagram Business',
      'Receita Federal (CNPJ)',
    ],
  };
}

// ========================================
// FUNÇÃO AUXILIAR: BUSCAR NA WEB
// ========================================
async function buscarNaWeb(query: string, sources: string[]) {
  // Simular resultados de busca web
  // NOTA: Na ETAPA 4, aqui será integrada a API real (Serper.dev, Firecrawl, etc.)
  
  console.log('[WEB SEARCH] Simulando busca para:', query);
  console.log('[WEB SEARCH] Fontes:', sources.length);

  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 100));

  const matchTypes: Array<'triple' | 'double' | 'single'> = ['triple', 'double', 'single'];
  
  // Gerar 0-3 resultados aleatórios
  const numResults = Math.floor(Math.random() * 4);
  const results = [];

  for (let i = 0; i < numResults; i++) {
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomMatchType = matchTypes[Math.floor(Math.random() * matchTypes.length)];
    
    results.push({
      text: `Encontrada menção relevante a "${query}" em ${randomSource}`,
      source: `https://${randomSource}/resultado-${i + 1}`,
      matchType: randomMatchType,
    });
  }

  console.log('[WEB SEARCH] ✅ Encontrados', results.length, 'resultados');

  return results;
}
