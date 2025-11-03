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
    console.log('[STC-AGENT] 🔍 CAMADA 1: Dados Básicos da Receita Federal');
    
    let companyData: any = null;
    let receitaFederalUrl: string | null = null;
    
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
        receitaFederalUrl = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
        const receitaResponse = await fetch(receitaFederalUrl);
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
            capital_social: receitaData.capital_social,
            data_inicio_atividade: receitaData.data_inicio_atividade,
            situacao_cadastral: receitaData.situacao_cadastral
          };
          console.log('[STC-AGENT] ✅ Dados da Receita Federal obtidos');
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro Receita Federal:', error);
      }
    }

    const intelligence: any = {
      companyData,
      fontes: {
        receitaFederal: receitaFederalUrl
      },
      decisores: [],
      noticias: [],
      tecnologias: [],
      sinaisCompra: [],
      presencaDigital: {},
      totvsAnalysis: {
        usesTotvs: false,
        confidence: 0,
        evidence: []
      }
    };

    // ==================== CAMADA 2: DECISORES NO LINKEDIN (COM LINKS REAIS) ====================
    console.log('[STC-AGENT] 👔 CAMADA 2: Decisores no LinkedIn (buscando perfis reais)');
    
    const linkedinQueries = [
      { query: `site:linkedin.com/in "${companyName}" "diretor de TI"`, area: 'TI', nivel: 'Diretor' },
      { query: `site:linkedin.com/in "${companyName}" "gerente de TI"`, area: 'TI', nivel: 'Gerente' },
      { query: `site:linkedin.com/in "${companyName}" "CTO"`, area: 'TI', nivel: 'C-Level' },
      { query: `site:linkedin.com/in "${companyName}" "diretor de tecnologia"`, area: 'TI', nivel: 'Diretor' },
      { query: `site:linkedin.com/in "${companyName}" "diretor de compras"`, area: 'Compras', nivel: 'Diretor' },
      { query: `site:linkedin.com/in "${companyName}" "gerente de compras"`, area: 'Compras', nivel: 'Gerente' },
      { query: `site:linkedin.com/in "${companyName}" "CEO"`, area: 'Executivo', nivel: 'C-Level' },
      { query: `site:linkedin.com/in "${companyName}" "CFO"`, area: 'Financeiro', nivel: 'C-Level' },
      { query: `site:linkedin.com/in "${companyName}" "diretor financeiro"`, area: 'Financeiro', nivel: 'Diretor' },
      { query: `site:linkedin.com/in "${companyName}" "diretor administrativo"`, area: 'Administrativo', nivel: 'Diretor' }
    ];

    const decisoresEncontrados = new Set();

    for (const { query, area, nivel } of linkedinQueries) {
      try {
        const { data: searchData } = await supabase.functions.invoke('web-search', {
          body: { query, limit: 5 }
        });

        if (searchData?.success && searchData.results) {
          for (const result of searchData.results) {
            if (!result.url.includes('linkedin.com/in/')) {
              console.log('[STC-AGENT] ⚠️ URL inválida (não é perfil LinkedIn):', result.url);
              continue;
            }

            const titleMatch = result.title.match(/^(.+?)\s*[-–|]\s*(.+?)\s*[-–|]/);
            if (titleMatch) {
              const nome = titleMatch[1].trim();
              const cargo = titleMatch[2].trim();

              if (decisoresEncontrados.has(nome.toLowerCase())) {
                continue;
              }
              decisoresEncontrados.add(nome.toLowerCase());

              let relevancia = 'baixa';
              let prioridade = 3;

              if (nivel === 'C-Level') {
                relevancia = 'crítica';
                prioridade = 1;
              } else if (nivel === 'Diretor') {
                relevancia = 'alta';
                prioridade = 2;
              } else if (nivel === 'Gerente') {
                relevancia = 'média';
                prioridade = 3;
              }

              intelligence.decisores.push({
                nome,
                cargo,
                area,
                nivel,
                linkedin_url: result.url,
                linkedin_snippet: result.snippet || '',
                fonte: 'LinkedIn (busca verificada)',
                relevancia,
                prioridade,
                data_encontrado: new Date().toISOString()
              });

              console.log(`[STC-AGENT] ✅ Decisor encontrado: ${nome} (${cargo}) - ${result.url}`);
            }
          }
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro busca LinkedIn:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    intelligence.decisores.sort((a: any, b: any) => a.prioridade - b.prioridade);
    console.log('[STC-AGENT] ✅ Total de decisores únicos encontrados:', intelligence.decisores.length);

    // ==================== CAMADA 3: NOTÍCIAS COM FONTES VERIFICÁVEIS ====================
    console.log('[STC-AGENT] 📰 CAMADA 3: Notícias com Fontes Oficiais');
    
    const newsQueries = [
      { query: `"${companyName}" expansão OR investimento OR crescimento`, tipo: 'expansão' },
      { query: `"${companyName}" contratação OR vaga OR "está contratando"`, tipo: 'contratação' },
      { query: `"${companyName}" tecnologia OR sistema OR ERP OR software`, tipo: 'tecnologia' },
      { query: `"${companyName}" modernização OR transformação digital`, tipo: 'modernização' },
      { query: `"${companyName}" TOTVS OR Protheus OR Microsiga`, tipo: 'totvs' },
      { query: `site:valor.com.br OR site:exame.com OR site:infomoney.com.br OR site:estadao.com.br "${companyName}"`, tipo: 'mídia_oficial' }
    ];

    const noticiasEncontradas = new Set();

    for (const { query, tipo } of newsQueries) {
      try {
        const { data: searchData } = await supabase.functions.invoke('web-search', {
          body: { query, limit: 5 }
        });

        if (searchData?.success && searchData.results) {
          for (const result of searchData.results) {
            if (noticiasEncontradas.has(result.url)) {
              continue;
            }
            noticiasEncontradas.add(result.url);

            const text = `${result.title} ${result.snippet}`.toLowerCase();
            let relevancia = 50;
            let tipoFinal = tipo;

            if (text.includes('totvs') || text.includes('protheus') || text.includes('microsiga')) {
              tipoFinal = 'totvs';
              relevancia = 100;
              intelligence.totvsAnalysis.usesTotvs = true;
              intelligence.totvsAnalysis.confidence += 40;
              intelligence.totvsAnalysis.evidence.push({
                descricao: `Mencionado em: ${result.title}`,
                fonte: result.url,
                data: new Date().toISOString()
              });
            } else if (text.includes('modernização') || text.includes('transformação digital')) {
              relevancia = 85;
            } else if (text.includes('contratação') || text.includes('vaga')) {
              relevancia = 90;
            } else if (text.includes('tecnologia') || text.includes('sistema') || text.includes('erp')) {
              relevancia = 95;
            }

            const urlObj = new URL(result.url);
            const dominio = urlObj.hostname.replace('www.', '');

            intelligence.noticias.push({
              titulo: result.title,
              url: result.url,
              dominio,
              tipo: tipoFinal,
              relevancia,
              data_encontrado: new Date().toISOString()
            });

            if (relevancia >= 80) {
              intelligence.sinaisCompra.push({
                tipo: tipoFinal,
                descricao: result.title,
                score: relevancia,
                fonte_url: result.url,
                fonte_nome: dominio
              });
            }

            console.log(`[STC-AGENT] ✅ Notícia encontrada: ${result.title.substring(0, 60)}... - ${result.url}`);
          }
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro busca notícias:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    intelligence.noticias.sort((a: any, b: any) => b.relevancia - a.relevancia);
    console.log('[STC-AGENT] ✅ Total de notícias únicas encontradas:', intelligence.noticias.length);
    console.log('[STC-AGENT] ✅ Sinais de compra detectados:', intelligence.sinaisCompra.length);

    // ==================== CAMADA 4: TECNOLOGIAS COM FONTES ====================
    console.log('[STC-AGENT] 💻 CAMADA 4: Stack Tecnológico com Fontes');
    
    const techQueries = [
      `"${companyName}" "utiliza" OR "usa" sistema OR software`,
      `"${companyName}" SAP OR Oracle OR Microsoft Dynamics OR TOTVS`,
      `site:linkedin.com/company "${companyName}" tecnologia`
    ];

    const tecnologiasEncontradas = new Map();

    for (const query of techQueries) {
      try {
        const { data: searchData } = await supabase.functions.invoke('web-search', {
          body: { query, limit: 5 }
        });

        if (searchData?.success && searchData.results) {
          for (const result of searchData.results) {
            const text = `${result.title} ${result.snippet}`.toLowerCase();
            
            const techs = [
              { nome: 'TOTVS', keywords: ['totvs'] },
              { nome: 'Protheus', keywords: ['protheus'] },
              { nome: 'Microsiga', keywords: ['microsiga'] },
              { nome: 'SAP', keywords: ['sap'] },
              { nome: 'Oracle', keywords: ['oracle'] },
              { nome: 'Microsoft Dynamics', keywords: ['dynamics', 'microsoft dynamics'] },
              { nome: 'Salesforce', keywords: ['salesforce'] },
              { nome: 'Senior', keywords: ['senior sistemas'] },
              { nome: 'Linx', keywords: ['linx'] }
            ];

            for (const tech of techs) {
              if (tech.keywords.some(keyword => text.includes(keyword))) {
                if (!tecnologiasEncontradas.has(tech.nome)) {
                  tecnologiasEncontradas.set(tech.nome, {
                    nome: tech.nome,
                    fontes: []
                  });
                }

                tecnologiasEncontradas.get(tech.nome).fontes.push({
                  titulo: result.title,
                  url: result.url
                });

                if (tech.nome === 'TOTVS' || tech.nome === 'Protheus' || tech.nome === 'Microsiga') {
                  intelligence.totvsAnalysis.usesTotvs = true;
                  intelligence.totvsAnalysis.confidence += 30;
                  intelligence.totvsAnalysis.evidence.push({
                    descricao: `Usa ${tech.nome}`,
                    fonte: result.url,
                    titulo: result.title,
                    data: new Date().toISOString()
                  });
                }

                console.log(`[STC-AGENT] ✅ Tecnologia identificada: ${tech.nome} - Fonte: ${result.url}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('[STC-AGENT] Erro busca tecnologias:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    intelligence.tecnologias = Array.from(tecnologiasEncontradas.values());
    console.log('[STC-AGENT] ✅ Tecnologias únicas identificadas:', intelligence.tecnologias.length);

    // ==================== CAMADA 5: PRESENÇA DIGITAL COM LINKS OFICIAIS ====================
    console.log('[STC-AGENT] 🌐 CAMADA 5: Presença Digital (Links Oficiais)');
    
    try {
      const { data: searchData } = await supabase.functions.invoke('web-search', {
        body: { query: companyName, limit: 10 }
      });

      if (searchData?.success && searchData.results) {
        for (const result of searchData.results) {
          const url = result.url.toLowerCase();
          
          if (url.includes('linkedin.com/company/') && !intelligence.presencaDigital.linkedin) {
            intelligence.presencaDigital.linkedin = {
              url: result.url,
              titulo: result.title,
              verificado: true
            };
          } else if (url.includes('facebook.com/') && !intelligence.presencaDigital.facebook) {
            intelligence.presencaDigital.facebook = {
              url: result.url,
              titulo: result.title,
              verificado: true
            };
          } else if (url.includes('instagram.com/') && !intelligence.presencaDigital.instagram) {
            intelligence.presencaDigital.instagram = {
              url: result.url,
              titulo: result.title,
              verificado: true
            };
          } else if (!intelligence.presencaDigital.website && 
                     !url.includes('wikipedia') && 
                     !url.includes('linkedin') && 
                     !url.includes('facebook') && 
                     !url.includes('instagram')) {
            intelligence.presencaDigital.website = {
              url: result.url,
              titulo: result.title,
              verificado: true
            };
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
        intelligence.totvsAnalysis.evidence.push({
          descricao: `Setor com alta adoção TOTVS: ${companyData.sector}`,
          data: new Date().toISOString()
        });
      }
    }

    if (companyData?.porte === 'DEMAIS') {
      intelligence.totvsAnalysis.confidence += 15;
      intelligence.totvsAnalysis.evidence.push({
        descricao: 'Porte adequado para TOTVS (DEMAIS)',
        data: new Date().toISOString()
      });
    }

    intelligence.totvsAnalysis.confidence = Math.min(100, intelligence.totvsAnalysis.confidence);

    // ==================== SELEÇÃO AUTOMÁTICA DE MODELO ====================
    console.log('[STC-AGENT] 🤖 Selecionando modelo de IA...');
    
    const isComplexAnalysis = 
      (question && (
        question.toLowerCase().includes('analise completa') ||
        question.toLowerCase().includes('análise completa') ||
        question.toLowerCase().includes('detalhad') ||
        question.toLowerCase().includes('profund')
      )) ||
      (intelligence.decisores.length >= 3 && 
       intelligence.noticias.length >= 5 && 
       intelligence.sinaisCompra.length >= 2) ||
      intelligence.totvsAnalysis.confidence > 70;

    const selectedModel = isComplexAnalysis ? 'gpt-4o' : 'gpt-4o-mini';
    
    console.log('[STC-AGENT] 🎯 Modelo selecionado:', selectedModel);

    // ==================== GERAR RESPOSTA COM IA ====================
    console.log('[STC-AGENT] 🤖 Gerando análise com IA...');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em inteligência comercial B2B para TOTVS.

🚨 REGRAS CRÍTICAS - ZERO TOLERÂNCIA:

1. ❌ PROIBIDO INVENTAR INFORMAÇÕES
   - NUNCA invente nomes, cargos, telefones, e-mails
   - NUNCA invente dados financeiros ou estatísticas
   - NUNCA invente notícias ou eventos

2. ✅ SEMPRE CITE AS FONTES
   - Todos os decisores vêm com LinkedIn URL real
   - Todas as notícias vêm com URL da fonte
   - Todas as tecnologias vêm com fonte verificável
   - Dados da Receita Federal têm URL da API

3. ✅ USE APENAS DADOS FORNECIDOS
   - Se não há decisores, diga "Nenhum decisor identificado"
   - Se não há notícias, diga "Nenhuma notícia encontrada"
   - Se não há tecnologias, diga "Stack tecnológico não identificado"

4. ✅ FORMATO DE RESPOSTA
   - Sempre mencione as fontes (LinkedIn, portais de notícias, etc)
   - Sempre inclua os links quando mencionar pessoas ou notícias
   - Seja transparente sobre limitações dos dados`;

    const userPrompt = `DADOS DA EMPRESA (Fonte: Receita Federal):
${companyData ? JSON.stringify(companyData, null, 2) : '❌ Dados não disponíveis'}
${receitaFederalUrl ? `🔗 Fonte: ${receitaFederalUrl}` : ''}

DECISORES IDENTIFICADOS (${intelligence.decisores.length}):
${intelligence.decisores.length > 0 
  ? intelligence.decisores.map((d: any) => 
      `\n👤 ${d.nome}\n   Cargo: ${d.cargo}\n   Área: ${d.area} | Nível: ${d.nivel}\n   Relevância: ${d.relevancia}\n   🔗 LinkedIn: ${d.linkedin_url}\n   Snippet: ${d.linkedin_snippet}`
    ).join('\n')
  : '❌ NENHUM DECISOR IDENTIFICADO'}

NOTÍCIAS RECENTES (${intelligence.noticias.length}):
${intelligence.noticias.length > 0
  ? intelligence.noticias.slice(0, 10).map((n: any) => 
      `\n📰 ${n.titulo}\n   Tipo: ${n.tipo} | Relevância: ${n.relevancia}/100\n   Fonte: ${n.dominio}\n   🔗 ${n.url}`
    ).join('\n')
  : '❌ NENHUMA NOTÍCIA ENCONTRADA'}

TECNOLOGIAS USADAS (${intelligence.tecnologias.length}):
${intelligence.tecnologias.length > 0
  ? intelligence.tecnologias.map((t: any) => 
      `\n💻 ${t.nome}\n   Fontes (${t.fontes.length}):\n${t.fontes.map((f: any) => `      - ${f.titulo}\n        🔗 ${f.url}`).join('\n')}`
    ).join('\n')
  : '❌ NENHUMA TECNOLOGIA IDENTIFICADA'}

SINAIS DE COMPRA (${intelligence.sinaisCompra.length}):
${intelligence.sinaisCompra.length > 0
  ? intelligence.sinaisCompra.map((s: any) => 
      `\n🎯 [Score: ${s.score}/100] ${s.tipo.toUpperCase()}\n   ${s.descricao}\n   Fonte: ${s.fonte_nome}\n   🔗 ${s.fonte_url}`
    ).join('\n')
  : '❌ NENHUM SINAL DE COMPRA DETECTADO'}

PRESENÇA DIGITAL:
${intelligence.presencaDigital.website ? `🌐 Website: ${intelligence.presencaDigital.website.url}` : '❌ Website não encontrado'}
${intelligence.presencaDigital.linkedin ? `💼 LinkedIn: ${intelligence.presencaDigital.linkedin.url}` : '❌ LinkedIn não encontrado'}
${intelligence.presencaDigital.facebook ? `📘 Facebook: ${intelligence.presencaDigital.facebook.url}` : '❌ Facebook não encontrado'}
${intelligence.presencaDigital.instagram ? `📸 Instagram: ${intelligence.presencaDigital.instagram.url}` : '❌ Instagram não encontrado'}

ANÁLISE TOTVS:
Usa TOTVS: ${intelligence.totvsAnalysis.usesTotvs ? '✅ SIM (confirmado)' : '❌ Não confirmado'}
Confiança: ${intelligence.totvsAnalysis.confidence}%
Evidências (${intelligence.totvsAnalysis.evidence.length}):
${intelligence.totvsAnalysis.evidence.length > 0
  ? intelligence.totvsAnalysis.evidence.map((e: any) => 
      `- ${e.descricao}\n  🔗 Fonte: ${e.fonte || 'Análise interna'}`
    ).join('\n')
  : '❌ Nenhuma evidência encontrada'}

PERGUNTA DO USUÁRIO:
${question || 'Análise geral da empresa'}

⚠️ IMPORTANTE: Cite os links do LinkedIn dos decisores e URLs das notícias na sua resposta.`;

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
        temperature: 0.3,
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
          fontes: intelligence.fontes,
          decisores: intelligence.decisores,
          noticias: intelligence.noticias.slice(0, 15),
          tecnologias: intelligence.tecnologias,
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
            hasReceitaFederal: !!receitaFederalUrl,
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
