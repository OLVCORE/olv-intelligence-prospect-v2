import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de 40+ plataformas para scraping REAL
const PLATAFORMAS = [
  // Busca geral (3 fontes)
  { nome: 'Google Search', url: (empresa: string) => `https://www.google.com/search?q=${encodeURIComponent(empresa + ' empresa')}`, peso: 0.08 },
  { nome: 'Google News', url: (empresa: string) => `https://news.google.com/search?q=${encodeURIComponent(empresa)}`, peso: 0.05 },
  { nome: 'Bing Search', url: (empresa: string) => `https://www.bing.com/search?q=${encodeURIComponent(empresa)}`, peso: 0.04 },

  // Redes sociais (7 fontes)
  { nome: 'LinkedIn', url: (empresa: string) => `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(empresa)}`, peso: 0.15 },
  { nome: 'Facebook', url: (empresa: string) => `https://www.facebook.com/search/top?q=${encodeURIComponent(empresa)}`, peso: 0.08 },
  { nome: 'Instagram', url: (empresa: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(empresa.replace(/\s+/g, ''))}`, peso: 0.06 },
  { nome: 'Twitter/X', url: (empresa: string) => `https://twitter.com/search?q=${encodeURIComponent(empresa)}`, peso: 0.07 },
  { nome: 'YouTube', url: (empresa: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(empresa)}`, peso: 0.05 },
  { nome: 'TikTok', url: (empresa: string) => `https://www.tiktok.com/search?q=${encodeURIComponent(empresa)}`, peso: 0.03 },
  { nome: 'Pinterest', url: (empresa: string) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(empresa)}`, peso: 0.02 },

  // Reputação (5 fontes)
  { nome: 'Reclame Aqui', url: (empresa: string) => `https://www.reclameaqui.com.br/busca/?q=${encodeURIComponent(empresa)}`, peso: 0.10 },
  { nome: 'TrustPilot', url: (empresa: string) => `https://www.trustpilot.com/search?query=${encodeURIComponent(empresa)}`, peso: 0.08 },
  { nome: 'Glassdoor', url: (empresa: string) => `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(empresa)}`, peso: 0.09 },
  { nome: 'Indeed', url: (empresa: string) => `https://www.indeed.com/q-${encodeURIComponent(empresa)}-jobs.html`, peso: 0.07 },
  { nome: 'Vagas.com', url: (empresa: string) => `https://www.vagas.com.br/vagas-em-${encodeURIComponent(empresa)}`, peso: 0.06 },

  // Reviews B2B (4 fontes)
  { nome: 'G2', url: (empresa: string) => `https://www.g2.com/search?query=${encodeURIComponent(empresa)}`, peso: 0.07 },
  { nome: 'Capterra', url: (empresa: string) => `https://www.capterra.com/search/?query=${encodeURIComponent(empresa)}`, peso: 0.06 },
  { nome: 'GetApp', url: (empresa: string) => `https://www.getapp.com/search?query=${encodeURIComponent(empresa)}`, peso: 0.05 },
  { nome: 'Software Advice', url: (empresa: string) => `https://www.softwareadvice.com/search/${encodeURIComponent(empresa)}`, peso: 0.04 },

  // Tecnologia (4 fontes)
  { nome: 'BuiltWith', url: (domain: string) => `https://builtwith.com/${domain}`, peso: 0.12 },
  { nome: 'Wappalyzer', url: (domain: string) => `https://www.wappalyzer.com/lookup/${domain}`, peso: 0.11 },
  { nome: 'SimilarTech', url: (domain: string) => `https://www.similartech.com/websites/${domain}`, peso: 0.09 },
  { nome: 'StackShare', url: (empresa: string) => `https://stackshare.io/search/q=${encodeURIComponent(empresa)}`, peso: 0.08 },

  // Dados empresariais (5 fontes)
  { nome: 'CNPJ.biz', url: (cnpj: string) => `https://www.cnpj.biz/${cnpj}`, peso: 0.10 },
  { nome: 'ReceitaWS', url: (cnpj: string) => `https://www.receitaws.com.br/v1/cnpj/${cnpj}`, peso: 0.12 },
  { nome: 'EmpresAqui', url: (cnpj: string) => `https://www.empresaqui.com.br/empresa/${cnpj}`, peso: 0.09 },
  { nome: 'Consulta CNPJ', url: (cnpj: string) => `https://www.consultacnpj.com/cnpj/${cnpj}`, peso: 0.08 },
  { nome: 'Sintegra', url: (cnpj: string) => `http://www.sintegra.gov.br`, peso: 0.07 },

  // Financeiro (3 fontes)
  { nome: 'Bloomberg', url: (empresa: string) => `https://www.bloomberg.com/search?query=${encodeURIComponent(empresa)}`, peso: 0.10 },
  { nome: 'Valor Econômico', url: (empresa: string) => `https://valor.globo.com/busca/?q=${encodeURIComponent(empresa)}`, peso: 0.08 },
  { nome: 'InfoMoney', url: (empresa: string) => `https://www.infomoney.com.br/busca/?q=${encodeURIComponent(empresa)}`, peso: 0.07 },

  // Vagas (4 fontes)
  { nome: 'LinkedIn Jobs', url: (empresa: string) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(empresa)}`, peso: 0.09 },
  { nome: 'Catho', url: (empresa: string) => `https://www.catho.com.br/vagas/${encodeURIComponent(empresa)}`, peso: 0.06 },
  { nome: 'Infojobs', url: (empresa: string) => `https://www.infojobs.com.br/empregos.aspx?Palabra=${encodeURIComponent(empresa)}`, peso: 0.05 },
  { nome: 'Trabalha Brasil', url: (empresa: string) => `https://www.trabalhabrasil.com.br/vagas/${encodeURIComponent(empresa)}`, peso: 0.04 },

  // Outros (5 fontes)
  { nome: 'Wikipedia', url: (empresa: string) => `https://pt.wikipedia.org/wiki/${encodeURIComponent(empresa)}`, peso: 0.06 },
  { nome: 'Crunchbase', url: (empresa: string) => `https://www.crunchbase.com/textsearch?q=${encodeURIComponent(empresa)}`, peso: 0.12 },
  { nome: 'PitchBook', url: (empresa: string) => `https://pitchbook.com/search?q=${encodeURIComponent(empresa)}`, peso: 0.10 },
  { nome: 'AngelList', url: (empresa: string) => `https://angel.co/company/${encodeURIComponent(empresa)}`, peso: 0.08 },
  { nome: 'Owler', url: (empresa: string) => `https://www.owler.com/company/${encodeURIComponent(empresa)}`, peso: 0.07 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[ICP SCRAPER] 🚀 Iniciando análise REAL com 40+ plataformas...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { empresa, cnpj, domain, analysis_id } = await req.json();

    if (!empresa && !cnpj) {
      return new Response(
        JSON.stringify({ error: 'Empresa ou CNPJ são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ICP SCRAPER] 📊 Analisando:', empresa, cnpj);

    const evidencias: any[] = [];
    const logs: any[] = [];
    let totalPontos = 0;
    const startTimeTotal = Date.now();

    // SCRAPING REAL DE CADA PLATAFORMA
    for (const plataforma of PLATAFORMAS) {
      const startTime = Date.now();
      
      try {
        console.log(`[ICP SCRAPER] 🔍 Buscando em: ${plataforma.nome}`);
        
        // Escolher argumento correto (empresa, cnpj ou domain)
        let searchArg = empresa;
        if (plataforma.nome.includes('CNPJ') || plataforma.nome === 'ReceitaWS' || plataforma.nome === 'Sintegra') {
          searchArg = cnpj || empresa;
        } else if (plataforma.nome === 'BuiltWith' || plataforma.nome === 'Wappalyzer' || plataforma.nome === 'SimilarTech') {
          searchArg = domain || empresa;
        }

        const url = plataforma.url(searchArg);
        
        // FAZER REQUISIÇÃO REAL com timeout de 10s por plataforma
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const tempo = Date.now() - startTime;

        if (response.ok) {
          const html = await response.text();
          
          // EXTRAIR DADOS RELEVANTES
          const dadosExtraidos = extrairDados(html, plataforma.nome, empresa, cnpj);
          
          if (dadosExtraidos.encontrado) {
            const pontos = Math.round(plataforma.peso * 100);
            
            // SALVAR EVIDÊNCIA
            evidencias.push({
              criterio: dadosExtraidos.criterio,
              categoria: dadosExtraidos.categoria,
              evidencia: dadosExtraidos.evidencia,
              fonte_url: url,
              fonte_nome: plataforma.nome,
              dados_extraidos: dadosExtraidos.dados,
              pontos_atribuidos: pontos,
              peso_criterio: plataforma.peso,
              confiabilidade: dadosExtraidos.confiabilidade,
            });

            totalPontos += pontos;
          }

          // LOG DE SUCESSO
          logs.push({
            plataforma: plataforma.nome,
            url_buscada: url,
            status: 'sucesso',
            dados_encontrados: dadosExtraidos.encontrado,
            tempo_resposta_ms: tempo,
          });

          console.log(`[ICP SCRAPER] ✅ ${plataforma.nome}: ${dadosExtraidos.encontrado ? 'Dados encontrados (' + tempo + 'ms)' : 'Sem dados'}`);

        } else {
          // LOG DE ERRO HTTP
          logs.push({
            plataforma: plataforma.nome,
            url_buscada: url,
            status: 'erro',
            dados_encontrados: false,
            tempo_resposta_ms: tempo,
            erro_mensagem: `HTTP ${response.status}`,
          });

          console.log(`[ICP SCRAPER] ❌ ${plataforma.nome}: Erro ${response.status}`);
        }

      } catch (error: any) {
        const tempo = Date.now() - startTime;
        
        // LOG DE TIMEOUT/ERRO
        const status = error.name === 'AbortError' ? 'timeout' : (error.message.includes('blocked') ? 'bloqueado' : 'erro');
        
        logs.push({
          plataforma: plataforma.nome,
          url_buscada: plataforma.url(empresa || cnpj),
          status,
          dados_encontrados: false,
          tempo_resposta_ms: tempo,
          erro_mensagem: error.message,
        });

        console.log(`[ICP SCRAPER] ⚠️ ${plataforma.nome}: ${error.message}`);
      }

      // DELAY entre requisições (evitar bloqueio) - 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // CALCULAR SCORE FINAL
    const scoreICP = Math.min(100, Math.round(totalPontos));
    const temperatura = scoreICP >= 70 ? 'hot' : scoreICP >= 40 ? 'warm' : 'cold';
    const tempoTotal = Math.round((Date.now() - startTimeTotal) / 1000);

    console.log('[ICP SCRAPER] 📊 Score final:', scoreICP, temperatura);
    console.log('[ICP SCRAPER] 📝 Evidências encontradas:', evidencias.length);
    console.log('[ICP SCRAPER] ⏱️ Tempo total:', tempoTotal, 'segundos');

    // SALVAR EVIDÊNCIAS NO BANCO
    if (evidencias.length > 0 && analysis_id) {
      const { error: evidError } = await supabase
        .from('icp_evidence')
        .insert(
          evidencias.map(e => ({
            ...e,
            analysis_id,
            cnpj: cnpj || '',
          }))
        );

      if (evidError) {
        console.error('[ICP SCRAPER] ❌ Erro ao salvar evidências:', evidError);
      } else {
        console.log('[ICP SCRAPER] ✅ Evidências salvas:', evidencias.length);
      }
    }

    // SALVAR LOGS NO BANCO
    if (logs.length > 0 && analysis_id) {
      const { error: logError } = await supabase
        .from('icp_scraping_log')
        .insert(
          logs.map(l => ({
            ...l,
            analysis_id,
            cnpj: cnpj || '',
          }))
        );

      if (logError) {
        console.error('[ICP SCRAPER] ❌ Erro ao salvar logs:', logError);
      } else {
        console.log('[ICP SCRAPER] ✅ Logs salvos:', logs.length);
      }
    }

    // ATUALIZAR ANÁLISE (se analysis_id fornecido)
    if (analysis_id) {
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({
          icp_score: scoreICP,
          temperatura,
          criterios_atendidos: evidencias.filter(e => e.pontos_atribuidos > 0).map(e => ({
            criterio: e.criterio,
            pontos: e.pontos_atribuidos,
            fonte: e.fonte_nome,
          })),
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', analysis_id);

      if (updateError) {
        console.error('[ICP SCRAPER] ❌ Erro ao atualizar análise:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: scoreICP,
        temperatura,
        evidencias_encontradas: evidencias.length,
        plataformas_consultadas: PLATAFORMAS.length,
        logs_gerados: logs.length,
        tempo_total_segundos: tempoTotal,
        plataformas_sucesso: logs.filter(l => l.status === 'sucesso').length,
        plataformas_erro: logs.filter(l => l.status === 'erro').length,
        plataformas_timeout: logs.filter(l => l.status === 'timeout').length,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[ICP SCRAPER] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// FUNÇÃO PARA EXTRAIR DADOS DO HTML
function extrairDados(html: string, plataforma: string, empresa: string, cnpj: string): any {
  // Verificação básica: HTML deve ter conteúdo substancial
  if (!html || html.length < 500) {
    return { encontrado: false };
  }

  const htmlLower = html.toLowerCase();
  const empresaLower = empresa?.toLowerCase() || '';
  const cnpjLimpo = cnpj?.replace(/\D/g, '') || '';

  // Verificar se a empresa ou CNPJ aparecem no HTML
  const temEmpresa = empresaLower && htmlLower.includes(empresaLower);
  const temCNPJ = cnpjLimpo && htmlLower.includes(cnpjLimpo);

  if (!temEmpresa && !temCNPJ) {
    return { encontrado: false };
  }

  // Extrair dados específicos baseado na plataforma
  switch (plataforma) {
    case 'LinkedIn':
      return {
        encontrado: true,
        criterio: 'Presença no LinkedIn',
        categoria: 'digital',
        evidencia: `Empresa ${empresa} encontrada no LinkedIn`,
        dados: { 
          plataforma: 'LinkedIn',
          tem_perfil: temEmpresa,
        },
        confiabilidade: 'alta',
      };
    
    case 'Reclame Aqui':
      // Extrair nota se possível
      const notaMatch = html.match(/nota["\s:]+(\d+[.,]?\d*)/i);
      return {
        encontrado: true,
        criterio: 'Reputação Online',
        categoria: 'reputacao',
        evidencia: `Empresa encontrada no Reclame Aqui${notaMatch ? ` (Nota: ${notaMatch[1]})` : ''}`,
        dados: { 
          plataforma: 'Reclame Aqui',
          nota: notaMatch ? notaMatch[1] : null,
        },
        confiabilidade: 'alta',
      };
    
    case 'Glassdoor':
      return {
        encontrado: true,
        criterio: 'Reputação como Empregador',
        categoria: 'reputacao',
        evidencia: `Empresa encontrada no Glassdoor`,
        dados: { plataforma: 'Glassdoor' },
        confiabilidade: 'alta',
      };
    
    case 'LinkedIn Jobs':
      // Tentar contar vagas
      const vagasMatch = html.match(/(\d+)\s*vagas?/i);
      return {
        encontrado: true,
        criterio: 'Vagas Abertas',
        categoria: 'sinais_compra',
        evidencia: `Empresa com vagas no LinkedIn${vagasMatch ? ` (${vagasMatch[1]} vagas)` : ''}`,
        dados: { 
          plataforma: 'LinkedIn Jobs',
          vagas: vagasMatch ? parseInt(vagasMatch[1]) : null,
        },
        confiabilidade: 'alta',
      };

    case 'BuiltWith':
    case 'Wappalyzer':
      return {
        encontrado: true,
        criterio: 'Stack Tecnológico',
        categoria: 'tecnologia',
        evidencia: `Tecnologias detectadas em ${plataforma}`,
        dados: { plataforma },
        confiabilidade: 'alta',
      };

    case 'ReceitaWS':
    case 'CNPJ.biz':
      return {
        encontrado: true,
        criterio: 'Dados Cadastrais Válidos',
        categoria: 'financeiro',
        evidencia: `CNPJ encontrado em ${plataforma}`,
        dados: { plataforma, cnpj: cnpjLimpo },
        confiabilidade: 'alta',
      };

    case 'Crunchbase':
    case 'PitchBook':
      return {
        encontrado: true,
        criterio: 'Perfil Investidor',
        categoria: 'financeiro',
        evidencia: `Empresa encontrada em ${plataforma}`,
        dados: { plataforma },
        confiabilidade: 'alta',
      };

    case 'Vagas.com':
    case 'Catho':
    case 'Infojobs':
    case 'Indeed':
      return {
        encontrado: true,
        criterio: 'Contratação Ativa',
        categoria: 'sinais_compra',
        evidencia: `Empresa com vagas abertas em ${plataforma}`,
        dados: { plataforma },
        confiabilidade: 'media',
      };

    default:
      return {
        encontrado: true,
        criterio: 'Presença Digital',
        categoria: 'digital',
        evidencia: `Empresa encontrada em ${plataforma}`,
        dados: { plataforma },
        confiabilidade: 'media',
      };
  }
}
