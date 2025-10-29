import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, company_name, domain } = await req.json();

    if (!company_id || !company_name) {
      return new Response(JSON.stringify({ error: 'company_id and company_name são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[BuyingSignals] Iniciando detecção para:', company_name);

    const signals: any[] = [];

    // 1. Buscar notícias recentes usando Serper
    if (serperKey) {
      console.log('[BuyingSignals] Buscando notícias com Serper...');
      
      const newsQueries = [
        `${company_name} investimento captação funding`,
        `${company_name} expansão crescimento`,
        `${company_name} novo CEO CTO diretor contratação`,
        `${company_name} parceria acordo contrato`,
        `${company_name} transformação digital cloud tecnologia`,
      ];

      for (const query of newsQueries) {
        try {
          const newsResponse: Response = await fetch('https://google.serper.dev/news', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num: 5 }),
          });

          if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            const news = newsData.news || [];

            for (const article of news) {
              const fullText = `${article.title} ${article.snippet}`.toLowerCase();
              
              // Detectar tipos de sinais
              const signalDetectors = [
                { type: 'funding_round', patterns: [/investimento|rodada|captação|aporte|funding|series [a-z]/i], priority: 'urgent' },
                { type: 'leadership_change', patterns: [/novo ceo|novo cto|novo diretor|contratou|nomeou|appointed|hired/i], priority: 'high' },
                { type: 'expansion', patterns: [/expansão|novo escritório|nova unidade|crescimento|expansion/i], priority: 'high' },
                { type: 'technology_adoption', patterns: [/adotou|implementou|migrou para|deployed|adopted/i], priority: 'medium' },
                { type: 'partnership', patterns: [/parceria|acordo|contrato|partnership|agreement/i], priority: 'medium' },
                { type: 'market_entry', patterns: [/lançamento|nova operação|entrando em|novo mercado|entering/i], priority: 'high' },
                { type: 'digital_transformation', patterns: [/transformação digital|digitalização|modernização|cloud/i], priority: 'high' },
              ];

              for (const detector of signalDetectors) {
                if (detector.patterns.some(p => p.test(fullText))) {
                  const confidence = calculateConfidence(article);
                  
                  signals.push({
                    company_id,
                    signal_type: detector.type,
                    signal_title: article.title,
                    signal_description: article.snippet,
                    confidence_score: confidence,
                    source_url: article.link,
                    source_type: 'news',
                    priority: detector.priority,
                    detected_at: new Date(article.date || new Date()),
                    raw_data: article,
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error(`[BuyingSignals] Erro ao buscar notícias para "${query}":`, error);
        }
      }
    }

    // 2. Buscar vagas de emprego (indicador de crescimento)
    if (domain) {
      console.log('[BuyingSignals] Buscando vagas de emprego...');
      try {
        const jobsQuery = `${company_name} vagas emprego carreira`;
        const jobsResponse: Response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: jobsQuery, num: 10 }),
        });

        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          const jobResults = jobsData.organic || [];
          
          const jobPostings = jobResults.filter((r: any) => 
            r.link && (
              r.link.includes('linkedin.com/jobs') ||
              r.link.includes('vagas.com') ||
              r.link.includes('catho.com') ||
              r.link.includes('gupy.io')
            )
          );

          if (jobPostings.length > 5) {
            signals.push({
              company_id,
              signal_type: 'job_posting',
              signal_title: `${jobPostings.length} vagas abertas detectadas`,
              signal_description: `A empresa está contratando ativamente com ${jobPostings.length} vagas abertas em portais de emprego`,
              confidence_score: 0.75,
              source_url: jobPostings[0].link,
              source_type: 'job_board',
              priority: 'high',
              detected_at: new Date(),
              raw_data: { count: jobPostings.length, postings: jobPostings.slice(0, 5) },
            });
          }
        }
      } catch (error) {
        console.error('[BuyingSignals] Erro ao buscar vagas:', error);
      }
    }

    // 3. Usar IA para enriquecer e priorizar sinais
    if (lovableApiKey && signals.length > 0) {
      console.log('[BuyingSignals] Enriquecendo sinais com IA...');
      
      try {
        const aiResponse: Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a B2B sales intelligence analyst. Analyze buying signals and provide strategic insights for sales teams.',
              },
              {
                role: 'user',
                content: `Analyze these buying signals for ${company_name}:\n\n${JSON.stringify(signals.slice(0, 5), null, 2)}\n\nProvide:\n1. Overall buying readiness (0-100)\n2. Best time to approach\n3. Recommended talking points\n\nRespond in JSON format.`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const analysis = aiData.choices?.[0]?.message?.content;
          console.log('[BuyingSignals] Análise IA:', analysis);
        }
      } catch (error) {
        console.error('[BuyingSignals] Erro na análise IA:', error);
      }
    }

    // 4. Salvar sinais no banco
    if (signals.length > 0) {
      console.log(`[BuyingSignals] Salvando ${signals.length} sinais...`);
      
      const { error: insertError } = await supabase
        .from('buying_signals')
        .insert(signals);

      if (insertError) {
        console.error('[BuyingSignals] Erro ao salvar sinais:', insertError);
        throw insertError;
      }

      // Atualizar lead score da empresa
      await supabase.rpc('calculate_lead_score', { p_company_id: company_id });
    }

    console.log(`[BuyingSignals] ✅ Detecção concluída: ${signals.length} sinais encontrados`);

    return new Response(
      JSON.stringify({
        success: true,
        signals_detected: signals.length,
        signals: signals,
        company_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[BuyingSignals] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateConfidence(article: any): number {
  let confidence = 0.6; // Base

  // Boost para fontes confiáveis
  const reliableSources = ['valor econômico', 'exame', 'forbes', 'techcrunch', 'infomoney', 'estadão', 'folha'];
  if (reliableSources.some(source => article.source?.toLowerCase().includes(source))) {
    confidence += 0.2;
  }

  // Boost para artigos recentes
  if (article.date) {
    const articleDate = new Date(article.date);
    const daysSince = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) confidence += 0.15;
    else if (daysSince < 30) confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}
