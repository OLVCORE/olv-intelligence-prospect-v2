import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

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
          const response = await fetch('https://google.serper.dev/news', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num: 5 }),
          });

          if (response.ok) {
            const data = await response.json();
            const news = data.news || [];

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

    // 2. Refinar sinais com OpenAI GPT-4o-mini (análise avançada)
    if (signals.length > 0 && openaiKey) {
      console.log(`[BuyingSignals] 🤖 Refinando ${signals.length} sinais com OpenAI GPT-4o-mini...`);
      
      const refinedSignals = [];
      
      for (const signal of signals) {
        try {
          const prompt = `Analise o seguinte sinal de compra e determine se é relevante e verdadeiro:

Empresa: ${company_name}
Tipo: ${signal.signal_type}
Título: ${signal.signal_title}
Descrição: ${signal.signal_description}

Retorne JSON com:
{
  "is_relevant": true/false,
  "confidence_adjustment": -0.3 a +0.3,
  "refined_description": "descrição melhorada",
  "key_insights": ["insight1", "insight2"]
}`;

          const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Você é especialista em sales intelligence. Retorne APENAS JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              response_format: { type: 'json_object' },
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const refinement = JSON.parse(aiData.choices[0].message.content);
            
            if (refinement.is_relevant) {
              refinedSignals.push({
                ...signal,
                confidence_score: Math.min(1.0, Math.max(0, signal.confidence_score + refinement.confidence_adjustment)),
                signal_description: refinement.refined_description || signal.signal_description,
                key_insights: refinement.key_insights,
              });
            }
          } else {
            refinedSignals.push(signal); // Fallback sem refinamento
          }
        } catch (error) {
          console.error('[BuyingSignals] Erro ao refinar sinal:', error);
          refinedSignals.push(signal);
        }
      }
      
      signals.length = 0;
      signals.push(...refinedSignals);
      console.log(`[BuyingSignals] ✅ ${refinedSignals.length} sinais refinados pela IA`);
    }

    // 3. Salvar sinais no banco
    if (signals.length > 0) {
      console.log(`[BuyingSignals] Salvando ${signals.length} sinais...`);
      
      const { error: insertError } = await supabase
        .from('buying_signals')
        .insert(signals);

      if (insertError) {
        console.error('[BuyingSignals] Erro ao salvar sinais:', insertError);
        throw insertError;
      }
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
