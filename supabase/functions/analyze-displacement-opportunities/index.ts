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
    const { company_id, company_name, competitors } = await req.json();

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

    console.log('[Displacement] Analisando oportunidades para:', company_name);

    const opportunities: any[] = [];

    // Lista de concorrentes comuns do mercado ERP/CRM/Software empresarial
    const commonCompetitors = competitors || [
      'SAP',
      'Oracle',
      'Microsoft Dynamics',
      'Salesforce',
      'Senior',
      'Linx',
      'Omie',
      'Bling',
      'Protheus',
      'RM Totvs',
    ];

    // 1. Buscar menções negativas dos concorrentes
    if (serperKey) {
      console.log('[Displacement] Buscando sinais de insatisfação...');

      for (const competitor of commonCompetitors) {
        try {
          // Buscar reviews e reclamações
          const queries = [
            `${company_name} trocou ${competitor}`,
            `${company_name} migrou ${competitor}`,
            `${competitor} problemas ${company_name}`,
            `${competitor} reclamações suporte`,
          ];

          for (const query of queries) {
            const searchResponse: Response = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: {
                'X-API-KEY': serperKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ q: query, num: 5 }),
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const results = searchData.organic || [];

              for (const result of results) {
                const fullText = `${result.title} ${result.snippet}`.toLowerCase();

                // Detectar sinais de insatisfação ou troca
                const displacementSignals = [
                  { keyword: /trocou|migrou|substituiu|abandonou/i, reason: 'migração_confirmada', score: 0.9 },
                  { keyword: /problemas|falhas|bugs|lento/i, reason: 'problemas_técnicos', score: 0.7 },
                  { keyword: /caro|preço alto|custo elevado/i, reason: 'custo_alto', score: 0.75 },
                  { keyword: /suporte ruim|atendimento péssimo|sem suporte/i, reason: 'suporte_inadequado', score: 0.8 },
                  { keyword: /insatisfeito|decepcionado|frustrado/i, reason: 'insatisfação_geral', score: 0.7 },
                  { keyword: /descontinuado|fim do suporte|obsoleto/i, reason: 'produto_descontinuado', score: 0.95 },
                ];

                for (const signal of displacementSignals) {
                  if (signal.keyword.test(fullText)) {
                    opportunities.push({
                      company_id,
                      competitor_name: competitor,
                      competitor_type: detectCompetitorType(competitor),
                      displacement_reason: signal.reason,
                      evidence: `${result.title} - ${result.snippet}`,
                      opportunity_score: signal.score,
                      raw_data: result,
                      detected_at: new Date(),
                      status: 'open',
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`[Displacement] Erro ao analisar ${competitor}:`, error);
        }
      }
    }

    // 2. Analisar com IA para enriquecer oportunidades
    if (lovableApiKey && opportunities.length > 0) {
      console.log('[Displacement] Enriquecendo oportunidades com IA...');

      try {
        const topOpportunities = opportunities.slice(0, 3);
        
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
                content: 'You are a competitive displacement sales strategist. Analyze competitive weaknesses and recommend sales tactics.',
              },
              {
                role: 'user',
                content: `Company: ${company_name}\n\nDisplacement Opportunities:\n${JSON.stringify(topOpportunities, null, 2)}\n\nProvide:\n1. Best displacement strategy for each opportunity\n2. Key talking points to win against each competitor\n3. Estimated deal value\n4. Recommended next action\n\nRespond in JSON format with 'next_action' and 'estimated_revenue' for each opportunity.`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiAnalysis = aiData.choices?.[0]?.message?.content;
          console.log('[Displacement] Análise IA:', aiAnalysis);

          // Tentar parsear e enriquecer oportunidades
          try {
            const parsed = JSON.parse(aiAnalysis);
            if (Array.isArray(parsed)) {
              parsed.forEach((analysis: any, index: number) => {
                if (opportunities[index]) {
                  opportunities[index].next_action = analysis.next_action;
                  opportunities[index].estimated_revenue = analysis.estimated_revenue;
                }
              });
            }
          } catch (e) {
            console.log('[Displacement] Não foi possível parsear análise IA');
          }
        }
      } catch (error) {
        console.error('[Displacement] Erro na análise IA:', error);
      }
    }

    // 3. Salvar oportunidades no banco
    if (opportunities.length > 0) {
      console.log(`[Displacement] Salvando ${opportunities.length} oportunidades...`);

      const { error: insertError } = await supabase
        .from('displacement_opportunities')
        .insert(opportunities);

      if (insertError) {
        console.error('[Displacement] Erro ao salvar oportunidades:', insertError);
        throw insertError;
      }
    }

    console.log(`[Displacement] ✅ Análise concluída: ${opportunities.length} oportunidades encontradas`);

    return new Response(
      JSON.stringify({
        success: true,
        opportunities_detected: opportunities.length,
        opportunities: opportunities,
        company_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Displacement] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function detectCompetitorType(name: string): string {
  const normalized = name.toLowerCase();
  
  if (normalized.includes('sap') || normalized.includes('oracle')) return 'erp';
  if (normalized.includes('salesforce') || normalized.includes('dynamics')) return 'crm';
  if (normalized.includes('senior') || normalized.includes('protheus')) return 'erp';
  if (normalized.includes('linx') || normalized.includes('omie')) return 'financial';
  if (normalized.includes('bling')) return 'ecommerce';
  
  return 'software';
}
