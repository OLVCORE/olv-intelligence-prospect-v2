import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, company_name, totvs_score, intent_score } = await req.json();

    if (!company_id || !company_name) {
      console.error('[AI Qualification] Missing required fields');
      throw new Error('company_id and company_name are required');
    }

    console.log(`[AI Qualification] Starting analysis for: ${company_name}`);
    console.log(`[AI Qualification] Scores - TOTVS: ${totvs_score}, Intent: ${intent_score}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[AI Qualification] Missing Supabase credentials');
      throw new Error('Supabase configuration error');
    }

    if (!openaiApiKey) {
      console.error('[AI Qualification] Missing OPENAI_API_KEY');
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar dados da empresa
    console.log('[AI Qualification] Fetching company data...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError) {
      console.error('[AI Qualification] Error fetching company:', companyError);
      throw new Error('Failed to fetch company data');
    }

    // 2. Buscar fontes de detecção TOTVS (filtrar links da própria TOTVS)
    const rawTotvsources = company?.totvs_detection_sources || [];
    const totvsources = rawTotvsources.filter((source: any) => {
      const url = source.url?.toLowerCase() || '';
      const isTotvsDomain = url.includes('totvs.com') || 
                           url.includes('produtos.totvs.com') ||
                           url.includes('tecnologia.totvs.com');
      return !isTotvsDomain;
    });

    console.log(`[AI Qualification] TOTVS sources: ${rawTotvsources.length} raw, ${totvsources.length} filtered`);

    // 3. Buscar sinais de intenção
    console.log('[AI Qualification] Fetching intent signals...');
    const { data: intentSignals, error: signalsError } = await supabase
      .from('intent_signals')
      .select('*')
      .eq('company_id', company_id)
      .order('detected_at', { ascending: false })
      .limit(10);

    if (signalsError) {
      console.error('[AI Qualification] Error fetching signals:', signalsError);
    }

    console.log(`[AI Qualification] Intent signals found: ${intentSignals?.length || 0}`);

    // 4. Buscar competitive intelligence
    console.log('[AI Qualification] Fetching monitoring data...');
    const { data: competitors } = await supabase
      .from('company_monitoring')
      .select('*')
      .eq('company_id', company_id)
      .single();

    // Construir contexto rico para IA
    const context = `
# ANÁLISE DE QUALIFICAÇÃO 360° - ${company_name}

## 📊 SCORES ATUAIS
- **TOTVS Detection Score**: ${totvs_score}/100
- **Intent Score**: ${intent_score}/100

## 🔍 FONTES DE DETECÇÃO TOTVS (${totvsources.length} fonte(s))
${totvsources.map((s: any, i: number) => `
### Fonte ${i + 1}: ${s.source}
- **Confiança**: ${s.confidence}%
- **Evidência**: ${s.evidence}
- **URL**: ${s.url || 'N/A'}
- **Data**: ${new Date(s.detected_at).toLocaleDateString('pt-BR')}
`).join('\n')}

## 💡 SINAIS DE INTENÇÃO (${intentSignals?.length || 0} sinal(is))
${intentSignals?.map((sig: any, i: number) => `
### Sinal ${i + 1}: ${sig.signal_type}
- **Tipo**: ${sig.signal_type}
- **Confiança**: ${sig.confidence_score}/100
- **Descrição**: ${sig.description || 'N/A'}
- **Fonte**: ${sig.source || 'N/A'}
- **Data**: ${new Date(sig.detected_at).toLocaleDateString('pt-BR')}
`).join('\n') || 'Nenhum sinal detectado'}

## 🏢 DADOS DA EMPRESA
- **Nome**: ${company?.name}
- **CNPJ**: ${company?.cnpj || 'N/A'}
- **Segmento**: ${company?.segment || 'N/A'}
- **Funcionários**: ${company?.employees || 'N/A'}
- **Receita**: ${company?.revenue ? `R$ ${company.revenue.toLocaleString('pt-BR')}` : 'N/A'}
- **Website**: ${company?.domain || 'N/A'}
- **Digital Maturity**: ${company?.digital_maturity_score || 'N/A'}/100

## 🎯 MONITORAMENTO
${competitors ? `
- **Monitoramento ativo**: Sim
- **Última verificação TOTVS**: ${competitors.last_totvs_check_at ? new Date(competitors.last_totvs_check_at).toLocaleDateString('pt-BR') : 'Nunca'}
- **Última verificação Intent**: ${competitors.last_intent_check_at ? new Date(competitors.last_intent_check_at).toLocaleDateString('pt-BR') : 'Nunca'}
` : '- **Monitoramento ativo**: Não'}
`;

    const systemPrompt = `Você é um analista sênior de vendas B2B especializado em qualificação de leads para soluções ERP.

**SUA MISSÃO**: Analisar PROFUNDAMENTE todos os dados coletados sobre a empresa e gerar uma recomendação FUNDAMENTADA sobre GO (seguir com prospecção) ou NO-GO (desqualificar lead).

**REGRAS DE DECISÃO**:
1. **NO-GO AUTOMÁTICO** se TOTVS Score >= 70 (alta evidência de uso de TOTVS)
2. **GO CAUTELOSO** se TOTVS Score entre 40-69 (possível uso, investigar mais)
3. **GO QUENTE** se Intent Score >= 70 + TOTVS Score < 40 (alta intenção + não usa TOTVS)
4. **GO MORNO** se Intent Score entre 40-69 + TOTVS Score < 40 (alguma intenção)
5. **GO FRIO** se Intent Score < 40 + TOTVS Score < 40 (baixa intenção mas qualificado)

**FORMATO DE RESPOSTA** (JSON):
{
  "decision": "GO" | "NO-GO",
  "confidence": "high" | "medium" | "low",
  "priority": "hot" | "warm" | "cold" | "disqualified",
  "executive_summary": "Resumo executivo em 2-3 linhas do porquê da decisão",
  "deep_analysis": {
    "totvs_analysis": "Análise detalhada das evidências de uso de TOTVS (ou ausência delas)",
    "intent_analysis": "Análise dos sinais de intenção de compra encontrados",
    "opportunity_analysis": "Análise do potencial de negócio e fit com solução",
    "risk_analysis": "Análise de riscos e pontos de atenção"
  },
  "action_plan": {
    "immediate_actions": ["ação 1", "ação 2", "ação 3"],
    "talking_points": ["ponto 1", "ponto 2", "ponto 3"],
    "objections_to_anticipate": ["objeção 1", "objeção 2"]
  },
  "sources_summary": {
    "strongest_evidence": "Qual a evidência mais forte encontrada?",
    "weakest_point": "Qual o ponto mais fraco da análise?",
    "data_quality": "high" | "medium" | "low"
  }
}

**IMPORTANTE**: 
- Seja ESPECÍFICO citando as fontes reais encontradas
- Não invente dados, use APENAS o que foi coletado
- Se faltar informação, mencione isso claramente
- Pense como um SDR experiente: contexto, timing, fit, urgência`;

    // Chamar OpenAI (GPT-5)
    console.log('[AI Qualification] Calling OpenAI GPT-5 for deep analysis...');
    console.log('[AI Qualification] Context length:', context.length, 'characters');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[AI Qualification] OpenAI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit excedido. Aguarde alguns instantes e tente novamente.');
      }
      if (aiResponse.status === 401) {
        throw new Error('Chave da OpenAI inválida. Verifique a configuração.');
      }
      if (aiResponse.status === 402 || aiResponse.status === 403) {
        throw new Error('Créditos da OpenAI esgotados. Adicione créditos na sua conta OpenAI.');
      }
      
      throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      console.error('[AI Qualification] Invalid OpenAI response structure:', aiData);
      throw new Error('Invalid OpenAI response structure');
    }

    const aiContent = aiData.choices[0].message.content;

    console.log('[AI Qualification] OpenAI response received, length:', aiContent.length);

    // Parse resposta da IA
    let analysis;
    try {
      // Extrair JSON da resposta (pode vir com markdown)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('[AI Qualification] Failed to parse AI response:', parseError);
      // Fallback se parsing falhar
      analysis = {
        decision: totvs_score >= 70 ? 'NO-GO' : 'GO',
        confidence: 'low',
        priority: totvs_score >= 70 ? 'disqualified' : 'cold',
        executive_summary: 'Análise automática baseada apenas em scores numéricos.',
        deep_analysis: {
          totvs_analysis: `TOTVS Score: ${totvs_score}/100`,
          intent_analysis: `Intent Score: ${intent_score}/100`,
          opportunity_analysis: 'Dados insuficientes para análise profunda',
          risk_analysis: 'Requer investigação manual'
        },
        action_plan: {
          immediate_actions: ['Investigar manualmente', 'Validar dados'],
          talking_points: ['Verificar contexto'],
          objections_to_anticipate: []
        },
        sources_summary: {
          strongest_evidence: 'N/A',
          weakest_point: 'Falta de dados estruturados',
          data_quality: 'low'
        }
      };
    }

    // Salvar análise no banco
    const { error: saveError } = await supabase
      .from('ai_interactions')
      .insert({
        interaction_type: 'qualification_analysis',
        prompt: context,
        response: analysis,
        metadata: {
          company_id,
          company_name,
          totvs_score,
          intent_score,
          sources_count: totvsources.length,
          signals_count: intentSignals?.length || 0
        }
      });

    if (saveError) {
      console.error('[AI Qualification] Error saving analysis:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        raw_context: {
          totvs_sources: totvsources,
          intent_signals: intentSignals,
          company_data: company
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Qualification] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
