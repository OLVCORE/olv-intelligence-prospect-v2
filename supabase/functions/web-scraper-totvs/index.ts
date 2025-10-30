import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIMEOUT_POR_PORTAL = 3000; // 3 segundos por portal

// Portais de vagas para verificar
const PORTAIS_VAGAS = [
  { name: 'LinkedIn', domain: 'linkedin.com/jobs' },
  { name: 'Vagas.com', domain: 'vagas.com.br' },
  { name: 'Indeed', domain: 'indeed.com.br' },
  { name: 'Catho', domain: 'catho.com.br' },
  { name: 'InfoJobs', domain: 'infojobs.com.br' },
  { name: 'Gupy', domain: 'gupy.io' },
  { name: 'Trampos.co', domain: 'trampos.co' },
  { name: 'Glassdoor', domain: 'glassdoor.com.br' },
  { name: 'Trabalha Brasil', domain: 'trabalhabrasil.com.br' },
  { name: 'Empregos.com.br', domain: 'empregos.com.br' },
  { name: 'Curriculum.com.br', domain: 'curriculum.com.br' },
  { name: 'Manager', domain: 'manager.com.br' },
  { name: 'Sine', domain: 'sine.com.br' },
  { name: 'Abler', domain: 'abler.com.br' },
  { name: 'Vagas para TI', domain: 'vagasparati.com.br' },
  { name: 'Workana', domain: 'workana.com' },
  { name: 'GetNinjas', domain: 'getninjas.com.br' },
  { name: '99Jobs', domain: '99jobs.com' },
  { name: 'Love Mondays', domain: 'lovemondays.com.br' },
  { name: 'Adzuna', domain: 'adzuna.com.br' },
  { name: 'Jooble', domain: 'br.jooble.org' },
  { name: 'Jobatus', domain: 'jobatus.com.br' },
  { name: 'Neuvoo', domain: 'neuvoo.com.br' },
  { name: 'Monster', domain: 'monster.com.br' },
  { name: 'CareerBuilder', domain: 'careerbuilder.com.br' },
  { name: 'Apinfo', domain: 'apinfo.com' },
  { name: 'BNE', domain: 'bne.com.br' },
  { name: 'Curriculum Simples', domain: 'curriculumsimples.com' },
  { name: 'Empregos.net', domain: 'empregos.net' },
  { name: 'Vagas Online', domain: 'vagasonline.com.br' },
  { name: 'Rio Vagas', domain: 'riovagas.com.br' },
  { name: 'SP Empregos', domain: 'spempregos.com.br' },
  { name: 'Vagas RJ', domain: 'vagasrj.com.br' },
  { name: 'Vagas SP', domain: 'vagassp.com.br' },
  { name: 'Vagas MG', domain: 'vagasmg.com.br' },
  { name: 'Vagas RS', domain: 'vagasrs.com.br' },
  { name: 'Vagas PR', domain: 'vagaspr.com.br' },
  { name: 'Vagas SC', domain: 'vagassc.com.br' },
  { name: 'Vagas BA', domain: 'vagasba.com.br' },
  { name: 'Vagas CE', domain: 'vagasce.com.br' },
  { name: 'TOTVS Carreiras', domain: 'totvs.com/carreiras' },
  { name: 'TOTVS Cases', domain: 'totvs.com/cases' },
];

// Produtos TOTVS para detectar
const PRODUTOS_TOTVS = [
  'protheus',
  'datasul',
  'rm totvs',
  'fluig',
  'carol',
  'techfin',
  'totvs',
  'winthor',
  'microsiga',
  'logix',
  'backoffice',
  'gestão empresarial totvs',
  'erp totvs',
];

// Variações de nomes comuns
const VARIACOES_TOTVS = [
  'sistema totvs',
  'sistemas totvs',
  'produto totvs',
  'produtos totvs',
  'solução totvs',
  'soluções totvs',
  'software totvs',
  'plataforma totvs',
  'erp totvs',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj, razao_social, domain } = await req.json();

    if (!cnpj && !razao_social && !domain) {
      return new Response(
        JSON.stringify({ error: 'CNPJ, razão social ou domínio obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const GOOGLE_CSE_ID = Deno.env.get('GOOGLE_CSE_ID');

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      console.error('Google API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Google API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultados = {
      encontrou_totvs: false,
      evidencias: [] as any[],
      portais_verificados: 0,
      total_portais: PORTAIS_VAGAS.length,
      empresa: razao_social || cnpj,
      timestamp: new Date().toISOString(),
    };

    // Construir termos de busca
    const searchTerms = [];
    if (razao_social) searchTerms.push(razao_social);
    if (domain) searchTerms.push(domain);
    if (cnpj) searchTerms.push(cnpj.replace(/[^\d]/g, ''));

    // Varrer cada produto TOTVS usando Google Search API
    for (const produto of PRODUTOS_TOTVS.slice(0, 5)) { // Limitar a 5 produtos principais
      try {
        // Buscar por empresa + produto TOTVS
        const query = `${searchTerms.join(' OR ')} ${produto}`;
        
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=10`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_POR_PORTAL);
        
        const response = await fetch(searchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Google Search API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        resultados.portais_verificados++;

        // Analisar resultados
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            const snippet = (item.snippet || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            const combinedText = `${title} ${snippet}`;

            // Verificar se menciona produtos TOTVS
            const produtoEncontrado = PRODUTOS_TOTVS.find(p => combinedText.includes(p.toLowerCase()));
            const variacaoEncontrada = VARIACOES_TOTVS.find(v => combinedText.includes(v.toLowerCase()));

            if (produtoEncontrado || variacaoEncontrada) {
              // Verificar se realmente menciona a empresa
              const mencionaEmpresa = searchTerms.some(term => 
                combinedText.includes(term.toLowerCase().substring(0, 15))
              );

              if (mencionaEmpresa) {
                resultados.encontrou_totvs = true;
                resultados.evidencias.push({
                  fonte: item.link,
                  titulo: item.title,
                  snippet: item.snippet,
                  produto: produtoEncontrado || variacaoEncontrada,
                  tipo: item.link.includes('linkedin.com') ? 'vaga' : 
                        item.link.includes('totvs.com') ? 'case_oficial' : 'web',
                  data_encontrado: new Date().toISOString(),
                });
              }
            }
          }
        }

        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Erro ao verificar ${produto}:`, error);
      }
    }

    // Se encontrou TOTVS, fazer buscas adicionais específicas
    if (resultados.encontrou_totvs) {
      try {
        // Buscar vagas específicas no LinkedIn
        const linkedinQuery = `site:linkedin.com/jobs ${searchTerms[0]} (protheus OR datasul OR "rm totvs" OR fluig)`;
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(linkedinQuery)}&num=5`;
        
        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.items) {
            for (const item of data.items) {
              resultados.evidencias.push({
                fonte: item.link,
                titulo: item.title,
                snippet: item.snippet,
                produto: 'TOTVS (vaga LinkedIn)',
                tipo: 'vaga_linkedin',
                data_encontrado: new Date().toISOString(),
              });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar vagas LinkedIn:', error);
      }
    }

    console.log(`Verificação concluída para ${razao_social || cnpj}:`, {
      encontrou: resultados.encontrou_totvs,
      evidencias: resultados.evidencias.length,
      portais: resultados.portais_verificados,
    });

    return new Response(JSON.stringify(resultados), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no web scraper:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        encontrou_totvs: false,
        evidencias: [],
        portais_verificados: 0,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
