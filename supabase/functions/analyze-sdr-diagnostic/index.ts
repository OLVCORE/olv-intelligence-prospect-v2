import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, diagnosticText, fileName } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('[Analyze Diagnostic] Analisando diagnóstico:', { companyId, fileName });

    // Buscar dados da empresa
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    // Buscar catálogo de produtos TOTVS
    const { data: products } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('active', true);

    // Buscar concorrentes conhecidos
    const { data: competitors } = await supabase
      .from('competitors')
      .select('name, category, strengths, weaknesses')
      .eq('active', true);

    // Prompt para análise com IA
    const systemPrompt = `Você é um especialista em análise de diagnósticos tecnológicos e recomendação de produtos TOTVS.

Analise o diagnóstico fornecido e retorne:
1. technologies_found: Lista de tecnologias/softwares mencionados
2. gaps_identified: Lacunas e problemas identificados
3. competitive_analysis: Análise de concorrentes mencionados
4. recommended_products: Produtos TOTVS recomendados com justificativa

Empresa: ${company?.name || 'N/A'}
Indústria: ${company?.industry || 'N/A'}

Produtos TOTVS disponíveis:
${products?.map(p => `- ${p.name} (${p.category}): ${p.description}`).join('\n')}

Concorrentes conhecidos:
${competitors?.map(c => `- ${c.name} (${c.category})`).join('\n')}`;

    const userPrompt = `Diagnóstico técnico (${fileName}):

${diagnosticText}

Retorne uma análise estruturada em JSON.`;

    // Chamar OpenAI com estruturação via tool calling
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_diagnostic',
            description: 'Retorna análise estruturada do diagnóstico',
            parameters: {
              type: 'object',
              properties: {
                technologies_found: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      category: { type: 'string' },
                      version: { type: 'string' }
                    }
                  }
                },
                gaps_identified: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      area: { type: 'string' },
                      problem: { type: 'string' },
                      severity: { type: 'string', enum: ['low', 'medium', 'high'] }
                    }
                  }
                },
                competitive_analysis: {
                  type: 'object',
                  properties: {
                    competitors_mentioned: { type: 'array', items: { type: 'string' } },
                    totvs_advantages: { type: 'array', items: { type: 'string' } }
                  }
                },
                recommended_products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      product_sku: { type: 'string' },
                      reason: { type: 'string' },
                      priority: { type: 'string', enum: ['low', 'medium', 'high'] }
                    }
                  }
                },
                summary: { type: 'string' }
              },
              required: ['technologies_found', 'gaps_identified', 'recommended_products', 'summary']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_diagnostic' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Analyze Diagnostic] AI error:', errorText);
      throw new Error('Erro ao analisar com IA');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('IA não retornou análise estruturada');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    console.log('[Analyze Diagnostic] Análise concluída:', {
      technologies: analysis.technologies_found?.length || 0,
      gaps: analysis.gaps_identified?.length || 0,
      recommendations: analysis.recommended_products?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          technologies_found: analysis.technologies_found || [],
          gaps_identified: analysis.gaps_identified || [],
          competitive_analysis: analysis.competitive_analysis || {},
          recommended_products: analysis.recommended_products || [],
          ai_insights: analysis.summary || ''
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Analyze Diagnostic] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
