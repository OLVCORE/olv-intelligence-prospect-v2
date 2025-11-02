import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { cnpj, companyName, question } = await req.json();
    
    console.log('[STC-AGENT] ===== INICIANDO ANÁLISE PROFUNDA =====');
    console.log('[STC-AGENT] Empresa:', companyName);
    console.log('[STC-AGENT] CNPJ:', cnpj);
    console.log('[STC-AGENT] Pergunta:', question);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ==================== CAMADA 1: DADOS BÁSICOS ====================
    console.log('[STC-AGENT] 🔍 CAMADA 1: Dados Básicos');
    
    let companyData: any = null;
    
    // Buscar empresa na base de dados
    if (cnpj) {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('cnpj', cnpj)
        .single();
      if (data) companyData = data;
    }
    
    if (!companyData && companyName) {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${companyName}%`)
        .limit(1)
        .single();
      if (data) companyData = data;
    }

    // Enriquecer com Receita Federal
    if (cnpj && cnpj.length === 14) {
      try {
        const receitaResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (receitaResponse.ok) {
          const receitaData = await receitaResponse.json();
          companyData = {
            ...companyData,
            cnpj,
            sector: receitaData.cnae_fiscal_descricao,
            cnae_principal: receitaData.cnae_fiscal,
            state: receitaData.uf,
            city: receitaData.municipio,
            porte: receitaData.porte,
            capital_social: receitaData.capital_social
          };
          console.log('[STC-AGENT] ✅ Dados da Receita Federal obtidos');
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro Receita Federal:', error);
      }
    }

    const intelligence: any = {
      companyData,
      decisores: [],
      noticias: [],
      tecnologias: [],
      sinaisCompra: [],
      analiseFinanceira: {},
      concorrentes: [],
      presencaDigital: {},
      totvsAnalysis: {
        usesTotvs: false,
        confidence: 0,
        evidence: []
      }
    };

    // ==================== CAMADA 2: DECISORES NO LINKEDIN ====================
    console.log('[STC-AGENT] 👔 CAMADA 2: Decisores no LinkedIn');
    
    const linkedinQueries = [
      `site:linkedin.com/in "${companyName}" "diretor de TI"`,
      `site:linkedin.com/in "${companyName}" "gerente de TI"`,
      `site:linkedin.com/in "${companyName}" "CTO"`,
      `site:linkedin.com/in "${companyName}" "diretor de compras"`,
      `site:linkedin.com/in "${companyName}" "gerente de compras"`,
      `site:linkedin.com/in "${companyName}" "CEO"`,
      `site:linkedin.com/in "${companyName}" "CFO"`,
      `site:linkedin.com/in "${companyName}" "diretor financeiro"`
    ];

    for (const query of linkedinQueries) {
      try {
        const { data: searchData } = await supabase.functions.invoke('web-search', {
          body: { query, limit: 3 }
        });

        if (searchData?.success && searchData.results) {
          for (const result of searchData.results) {
            // Extrair nome e cargo do título
            const titleMatch = result.title.match(/^(.+?)\s*[-–|]\s*(.+?)\s*[-–|]/);
            if (titleMatch) {
              const nome = titleMatch[1].trim();
              const cargo = titleMatch[2].trim();
              
              intelligence.decisores.push({
                nome,
                cargo,
                linkedin_url: result.url,
                fonte: 'LinkedIn',
                relevancia: cargo.toLowerCase().includes('diretor') ? 'alta' : 
                           cargo.toLowerCase().includes('gerente') ? 'média' : 'baixa'
              });
            }
          }
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro busca LinkedIn:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('[STC-AGENT] ✅ Decisores encontrados:', intelligence.decisores.length);

    // ==================== CAMADA 3: NOTÍCIAS E SINAIS DE COMPRA ====================
    console.log('[STC-AGENT] 📰 CAMADA 3: Notícias e Sinais de Compra');
    
    const newsQueries = [
      `"${companyName}" expansão OR investimento OR crescimento`,
      `"${companyName}" contratação OR vaga OR "está contratando"`,
      `"${companyName}" tecnologia OR sistema OR ERP OR software`,
      `"${companyName}" modernização OR transformação digital`,
      `"${companyName}" TOTVS OR Protheus OR Microsiga`,
      `site:valor.com.br OR site:exame.com OR site:infomoney.com.br "${companyName}"`
    ];

    for (const query of newsQueries) {
      try {
        const { data: searchData } = await supabase.functions.invoke('web-search', {
          body: { query, limit: 5 }
        });

        if (searchData?.success && searchData.results) {
          for (const result of searchData.results) {
            const text = `${result.title} ${result.snippet}`.toLowerCase();
            
            // Classificar tipo de notícia
            let tipo = 'geral';
            let relevancia = 0;

            if (text.includes('expansão') || text.includes('investimento') || text.includes('crescimento')) {
              tipo = 'expansão';
              relevancia = 80;
            }
            if (text.includes('contratação') || text.includes('vaga') || text.includes('contratando')) {
              tipo = 'contratação';
              relevancia = 90;
            }
            if (text.includes('tecnologia') || text.includes('sistema') || text.includes('erp') || text.includes('software')) {
              tipo = 'tecnologia';
              relevancia = 95;
            }
            if (text.includes('totvs') || text.includes('protheus') || text.includes('microsiga')) {
              tipo = 'totvs';
              relevancia = 100;
              intelligence.totvsAnalysis.usesTotvs = true;
              intelligence.totvsAnalysis.confidence += 40;
              intelligence.totvsAnalysis.evidence.push(`Mencionado em: ${result.title}`);
            }

            intelligence.noticias.push({
              titulo: result.title,
              url: result.url,
              snippet: result.snippet,
              tipo,
              relevancia,
              data: new Date().toISOString()
            });

            // Detectar sinais de compra
            if (relevancia >= 80) {
              intelligence.sinaisCompra.push({
                tipo,
                descricao: result.title,
                score: relevancia,
                fonte: result.url
              });
            }
          }
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro busca notícias:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('[STC-AGENT] ✅ Notícias encontradas:', intelligence.noticias.length);
    console.log('[STC-AGENT] ✅ Sinais de compra:', intelligence.sinaisCompra.length);

    // ==================== CAMADA 4: TECNOLOGIAS USADAS ====================
    console.log('[STC-AGENT] 💻 CAMADA 4: Stack Tecnológico');
    
    const techQueries = [
      `"${companyName}" "utiliza" OR "usa" sistema OR software`,
      `"${companyName}" SAP OR Oracle OR Microsoft Dynamics OR TOTVS`,
      `site:linkedin.com/company "${companyName}" tecnologia`
    ];

    for (const query of techQueries) {
      try {
        const { data: searchData } = await supabase.functions.invoke('web-search', {
          body: { query, limit: 3 }
        });

        if (searchData?.success && searchData.results) {
          for (const result of searchData.results) {
            const text = `${result.title} ${result.snippet}`.toLowerCase();
            
            // Detectar tecnologias mencionadas
            const techs = ['totvs', 'protheus', 'microsiga', 'sap', 'oracle', 'dynamics', 'salesforce'];
            
            for (const tech of techs) {
              if (text.includes(tech)) {
                intelligence.tecnologias.push({
                  nome: tech.toUpperCase(),
                  fonte: result.title,
                  url: result.url
                });

                if (tech === 'totvs' || tech === 'protheus' || tech === 'microsiga') {
                  intelligence.totvsAnalysis.usesTotvs = true;
                  intelligence.totvsAnalysis.confidence += 30;
                  intelligence.totvsAnalysis.evidence.push(`Usa ${tech.toUpperCase()}: ${result.title}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro busca tecnologias:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('[STC-AGENT] ✅ Tecnologias identificadas:', intelligence.tecnologias.length);

    // ==================== CAMADA 5: PRESENÇA DIGITAL ====================
    console.log('[STC-AGENT] 🌐 CAMADA 5: Presença Digital');
    
    try {
      const { data: searchData } = await supabase.functions.invoke('web-search', {
        body: { query: companyName, limit: 5 }
      });

      if (searchData?.success && searchData.results) {
        for (const result of searchData.results) {
          const url = result.url.toLowerCase();
          
          if (url.includes('linkedin.com/company')) {
            intelligence.presencaDigital.linkedin = result.url;
          } else if (url.includes('facebook.com')) {
            intelligence.presencaDigital.facebook = result.url;
          } else if (url.includes('instagram.com')) {
            intelligence.presencaDigital.instagram = result.url;
          } else if (!intelligence.presencaDigital.website && !url.includes('wikipedia')) {
            intelligence.presencaDigital.website = result.url;
          }
        }
      }
    } catch (error) {
      console.error('[STC-AGENT] Erro busca presença digital:', error);
    }

    // ==================== CAMADA 6: ANÁLISE POR SETOR ====================
    console.log('[STC-AGENT] 🏭 CAMADA 6: Análise por Setor');
    
    const totvsHeavySectors = [
      'indústria', 'industria', 'metalúrgica', 'metalurgica', 
      'plástico', 'plastico', 'alimentos', 'bebidas',
      'têxtil', 'textil', 'construção', 'construcao',
      'cooperativa', 'agropecuária', 'agropecuaria'
    ];

    if (companyData?.sector) {
      const sectorLower = companyData.sector.toLowerCase();
      if (totvsHeavySectors.some(s => sectorLower.includes(s))) {
        intelligence.totvsAnalysis.confidence += 20;
        intelligence.totvsAnalysis.evidence.push(`Setor com alta adoção TOTVS: ${companyData.sector}`);
      }
    }

    if (companyData?.porte === 'DEMAIS') {
      intelligence.totvsAnalysis.confidence += 15;
      intelligence.totvsAnalysis.evidence.push('Porte adequado para TOTVS (DEMAIS)');
    }

    // Limitar confidence a 100
    intelligence.totvsAnalysis.confidence = Math.min(intelligence.totvsAnalysis.confidence, 100);

    // ==================== SELEÇÃO AUTOMÁTICA DE MODELO ====================
    console.log('[STC-AGENT] 🤖 Selecionando modelo de IA...');
    
    // Critérios para usar GPT-4O (análise complexa)
    const isComplexAnalysis = 
      // Pergunta explícita por análise detalhada
      (question && (
        question.toLowerCase().includes('analise completa') ||
        question.toLowerCase().includes('análise completa') ||
        question.toLowerCase().includes('detalhad') ||
        question.toLowerCase().includes('profund')
      )) ||
      // Muitos dados encontrados (análise rica)
      (intelligence.decisores.length >= 3 && 
       intelligence.noticias.length >= 5 && 
       intelligence.sinaisCompra.length >= 2) ||
      // Alta confiança TOTVS (análise crítica)
      intelligence.totvsAnalysis.confidence > 70;

    const selectedModel = isComplexAnalysis ? 'gpt-4o' : 'gpt-4o-mini';
    
    console.log('[STC-AGENT] 🎯 Modelo selecionado:', selectedModel);
    console.log('[STC-AGENT] 📊 Critérios:');
    console.log('  - Pergunta complexa:', question && question.toLowerCase().includes('detalhad'));
    console.log('  - Decisores encontrados:', intelligence.decisores.length);
    console.log('  - Notícias encontradas:', intelligence.noticias.length);
    console.log('  - Sinais de compra:', intelligence.sinaisCompra.length);
    console.log('  - Confiança TOTVS:', intelligence.totvsAnalysis.confidence);

    // ==================== GERAR RESPOSTA COM IA ====================
    console.log('[STC-AGENT] 🤖 Gerando análise com IA...');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // PROMPT COM RESTRIÇÕES ANTI-ALUCINAÇÃO
    const systemPrompt = `Você é um especialista em inteligência comercial B2B, análise de empresas e estratégias de vendas para TOTVS.

🚨 REGRAS CRÍTICAS - ZERO TOLERÂNCIA:

1. ❌ PROIBIDO INVENTAR INFORMAÇÕES
   - NUNCA invente nomes de pessoas
   - NUNCA invente números de telefone
   - NUNCA invente endereços de e-mail
   - NUNCA invente dados financeiros
   - NUNCA invente estatísticas
   - NUNCA invente notícias ou eventos

2. ✅ APENAS USE DADOS FORNECIDOS
   - Use SOMENTE informações presentes nos dados fornecidos
   - Se um dado não estiver disponível, diga "Não identificado" ou "Informação não disponível"
   - Cite as fontes quando mencionar informações específicas

3. ✅ SEJA HONESTO SOBRE LIMITAÇÕES
   - Se não há decisores identificados, diga claramente
   - Se não há notícias, informe que não foram encontradas
   - Se não há sinais de compra, seja transparente

4. ✅ BASEIE-SE EM FATOS REAIS
   - Use apenas dados da Receita Federal (quando disponíveis)
   - Use apenas perfis do LinkedIn encontrados (com URLs)
   - Use apenas notícias com fontes verificáveis
   - Use apenas tecnologias mencionadas em fontes oficiais

5. ❌ NUNCA ESPECULE
   - Não faça suposições sobre dados não disponíveis
   - Não extrapole informações
   - Não crie cenários fictícios

6. ✅ FORMATO DE RESPOSTA
   - Seja profissional e objetivo
   - Separe claramente: (1) Dados Confirmados, (2) Análise, (3) Recomendações
   - Sempre indique o nível de confiança das informações`;

    const userPrompt = `DADOS DA EMPRESA:
${JSON.stringify(companyData, null, 2)}

DECISORES IDENTIFICADOS (${intelligence.decisores.length}):
${intelligence.decisores.length > 0 
  ? intelligence.decisores.slice(0, 8).map((d: any) => 
      `- ${d.nome} (${d.cargo}) - Relevância: ${d.relevancia}\n  LinkedIn: ${d.linkedin_url}`
    ).join('\n')
  : '❌ NENHUM DECISOR IDENTIFICADO - Não invente nomes ou cargos'}

NOTÍCIAS RECENTES (${intelligence.noticias.length}):
${intelligence.noticias.length > 0
  ? intelligence.noticias.slice(0, 8).map((n: any) => 
      `- [${n.tipo.toUpperCase()}] ${n.titulo}\n  Relevância: ${n.relevancia}/100\n  Fonte: ${n.url}`
    ).join('\n')
  : '❌ NENHUMA NOTÍCIA ENCONTRADA - Não invente notícias ou eventos'}

TECNOLOGIAS USADAS (${intelligence.tecnologias.length}):
${intelligence.tecnologias.length > 0
  ? [...new Set(intelligence.tecnologias.map((t: any) => t.nome))].join(', ')
  : '❌ NENHUMA TECNOLOGIA IDENTIFICADA - Não especule sobre tecnologias'}

SINAIS DE COMPRA (${intelligence.sinaisCompra.length}):
${intelligence.sinaisCompra.length > 0
  ? intelligence.sinaisCompra.map((s: any) => 
      `- [Score: ${s.score}/100] ${s.tipo.toUpperCase()}: ${s.descricao}\n  Fonte: ${s.fonte}`
    ).join('\n')
  : '❌ NENHUM SINAL DE COMPRA DETECTADO - Não invente sinais ou oportunidades'}

PRESENÇA DIGITAL:
${JSON.stringify(intelligence.presencaDigital, null, 2)}

ANÁLISE TOTVS:
- Usa TOTVS: ${intelligence.totvsAnalysis.usesTotvs ? '✅ SIM (confirmado)' : '❌ Não confirmado'}
- Confiança: ${intelligence.totvsAnalysis.confidence}%
- Evidências: ${intelligence.totvsAnalysis.evidence.length > 0 
    ? intelligence.totvsAnalysis.evidence.join('; ') 
    : '❌ Nenhuma evidência encontrada'}

PERGUNTA DO USUÁRIO:
${question || 'Análise geral da empresa'}

⚠️ LEMBRE-SE: Use APENAS as informações acima. Se algo não estiver listado, diga "Não identificado" ou "Informação não disponível". NUNCA invente dados.`;

    const maxTokens = isComplexAnalysis ? 2500 : 1500;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // REDUZIDO para menos criatividade/alucinação
        max_tokens: maxTokens
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[STC-AGENT] Erro OpenAI:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;
    const tokensUsed = openaiData.usage.total_tokens;

    console.log('[STC-AGENT] ✅ Análise concluída');
    console.log('[STC-AGENT] 📊 Tokens utilizados:', tokensUsed);
    console.log('[STC-AGENT] 💰 Modelo usado:', selectedModel);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        intelligence: {
          companyData: intelligence.companyData,
          decisores: intelligence.decisores,
          noticias: intelligence.noticias.slice(0, 10),
          tecnologias: [...new Set(intelligence.tecnologias.map((t: any) => t.nome))],
          sinaisCompra: intelligence.sinaisCompra,
          presencaDigital: intelligence.presencaDigital,
          totvsAnalysis: intelligence.totvsAnalysis
        },
        stats: {
          decisores: intelligence.decisores.length,
          noticias: intelligence.noticias.length,
          tecnologias: intelligence.tecnologias.length,
          sinaisCompra: intelligence.sinaisCompra.length,
          totvsConfidence: intelligence.totvsAnalysis.confidence
        },
        metadata: {
          model: selectedModel,
          tokensUsed: tokensUsed,
          isComplexAnalysis: isComplexAnalysis,
          dataQuality: {
            hasCompanyData: !!companyData,
            hasDecisores: intelligence.decisores.length > 0,
            hasNoticias: intelligence.noticias.length > 0,
            hasTecnologias: intelligence.tecnologias.length > 0,
            hasSinaisCompra: intelligence.sinaisCompra.length > 0
          }
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[STC-AGENT] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
