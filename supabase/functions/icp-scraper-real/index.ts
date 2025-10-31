import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Categorias de busca para análise ICP com TOTVS usando Google Custom Search API
const CATEGORIAS_BUSCA = [
  { nome: 'LinkedIn Jobs TOTVS', query: (empresa: string) => `site:linkedin.com/jobs "${empresa}" TOTVS`, peso: 0.25, categoria: 'vagas_totvs' },
  { nome: 'LinkedIn Profile TOTVS', query: (empresa: string) => `site:linkedin.com "${empresa}" "TOTVS" OR "Protheus" OR "RM" OR "Datasul"`, peso: 0.20, categoria: 'presenca_digital' },
  { nome: 'Vagas TOTVS Geral', query: (empresa: string) => `"${empresa}" vagas TOTVS OR Protheus OR RM OR Datasul`, peso: 0.15, categoria: 'vagas_totvs' },
  { nome: 'Notícias TOTVS', query: (empresa: string) => `"${empresa}" TOTVS implantação OR implementação OR cliente`, peso: 0.12, categoria: 'noticias' },
  { nome: 'Site Próprio TOTVS', query: (empresa: string, domain?: string) => domain ? `site:${domain} TOTVS OR Protheus OR RM OR Datasul` : `"${empresa}" TOTVS`, peso: 0.18, categoria: 'site_proprio' },
  { nome: 'Reclame Aqui TOTVS', query: (empresa: string) => `site:reclameaqui.com.br "${empresa}" TOTVS`, peso: 0.10, categoria: 'reputacao' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[ICP SCRAPER] 🚀 Iniciando análise ICP com Google Custom Search API...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!googleApiKey || !googleCseId) {
      console.error('[ICP SCRAPER] ❌ Google API não configurada');
      return new Response(
        JSON.stringify({ 
          error: 'Google API não configurada',
          hint: 'Configure GOOGLE_API_KEY e GOOGLE_CSE_ID nos secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { empresa, cnpj, domain, analysis_id } = await req.json();

    if (!empresa && !cnpj) {
      return new Response(
        JSON.stringify({ error: 'Empresa ou CNPJ são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ICP SCRAPER] 📊 Analisando:', empresa, cnpj, domain);

    const evidencias: any[] = [];
    const logs: any[] = [];
    let totalPontos = 0;
    const startTimeTotal = Date.now();

    // BUSCAR COM GOOGLE CUSTOM SEARCH API
    for (const categoria of CATEGORIAS_BUSCA) {
      const startTime = Date.now();
      
      try {
        const searchQuery = categoria.nome.includes('Site Próprio') && domain
          ? categoria.query(empresa, domain)
          : categoria.query(empresa);
          
        console.log(`[ICP SCRAPER] 🔍 ${categoria.nome}: ${searchQuery}`);
        
        const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(searchQuery)}&num=10`;
        
        const response = await fetch(googleUrl);
        const tempo = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            const pontos = Math.round(categoria.peso * 100);
            
            // Processar cada resultado encontrado
            for (const item of data.items) {
              evidencias.push({
                criterio: categoria.nome,
                categoria: categoria.categoria,
                evidencia: `${item.title} - ${item.snippet || 'Sem descrição'}`,
                fonte_url: item.link,
                fonte_nome: new URL(item.link).hostname,
                dados_extraidos: {
                  titulo: item.title,
                  snippet: item.snippet,
                  link: item.link,
                  displayLink: item.displayLink,
                },
                pontos_atribuidos: pontos / data.items.length, // Distribuir pontos
                peso_criterio: categoria.peso,
                confiabilidade: 'alta',
              });
            }

            totalPontos += pontos;
            
            logs.push({
              plataforma: categoria.nome,
              url_buscada: googleUrl.replace(googleApiKey, 'HIDDEN'),
              status: 'sucesso',
              dados_encontrados: true,
              tempo_resposta_ms: tempo,
              resultados_encontrados: data.items.length,
            });

            console.log(`[ICP SCRAPER] ✅ ${categoria.nome}: ${data.items.length} resultados (${tempo}ms)`);
          } else {
            logs.push({
              plataforma: categoria.nome,
              url_buscada: googleUrl.replace(googleApiKey, 'HIDDEN'),
              status: 'sem_resultados',
              dados_encontrados: false,
              tempo_resposta_ms: tempo,
            });
            
            console.log(`[ICP SCRAPER] ⚠️ ${categoria.nome}: Nenhum resultado encontrado`);
          }
        } else {
          const errorText = await response.text();
          logs.push({
            plataforma: categoria.nome,
            url_buscada: googleUrl.replace(googleApiKey, 'HIDDEN'),
            status: 'erro',
            dados_encontrados: false,
            tempo_resposta_ms: tempo,
            erro_mensagem: `HTTP ${response.status}: ${errorText}`,
          });

          console.log(`[ICP SCRAPER] ❌ ${categoria.nome}: Erro ${response.status}`);
        }

      } catch (error: any) {
        const tempo = Date.now() - startTime;
        
        logs.push({
          plataforma: categoria.nome,
          url_buscada: 'Google Custom Search API',
          status: 'erro',
          dados_encontrados: false,
          tempo_resposta_ms: tempo,
          erro_mensagem: error.message,
        });

        console.log(`[ICP SCRAPER] ⚠️ ${categoria.nome}: ${error.message}`);
      }

      // Pequeno delay entre buscas (200ms)
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // CALCULAR SCORE FINAL
    const scoreICP = Math.min(100, Math.round(totalPontos));
    const temperatura = scoreICP >= 70 ? 'hot' : scoreICP >= 40 ? 'warm' : 'cold';
    const tempoTotal = Math.round((Date.now() - startTimeTotal) / 1000);
    const buscasRealizadas = logs.length;
    const buscasComResultados = logs.filter(l => l.dados_encontrados).length;

    console.log('[ICP SCRAPER] 📊 Score final:', scoreICP, temperatura);
    console.log('[ICP SCRAPER] 📝 Evidências encontradas:', evidencias.length);
    console.log('[ICP SCRAPER] 🔍 Buscas realizadas:', buscasRealizadas);
    console.log('[ICP SCRAPER] ✅ Buscas com resultados:', buscasComResultados);
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
            link: e.fonte_url,
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
        categorias_consultadas: CATEGORIAS_BUSCA.length,
        logs_gerados: logs.length,
        tempo_total_segundos: tempoTotal,
        buscas_sucesso: logs.filter(l => l.status === 'sucesso').length,
        buscas_sem_resultados: logs.filter(l => l.status === 'sem_resultados').length,
        buscas_erro: logs.filter(l => l.status === 'erro').length,
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
