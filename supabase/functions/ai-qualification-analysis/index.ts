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

    // Construir contexto RICO e DETALHADO para IA
    const context = `
# ANÁLISE DE QUALIFICAÇÃO 360° - ${company_name}

## MÉTRICAS DE QUALIFICAÇÃO
- **TOTVS Detection Score**: ${totvs_score}/100
- **Intent Score**: ${intent_score}/100

## FONTES DE DETECÇÃO TOTVS (${totvsources.length} fonte(s) válida(s))

${totvsources.length > 0 ? totvsources.map((s: any, i: number) => `
**Fonte ${i + 1}:**
- Tipo: ${s.source}
- Confiança: ${s.confidence}%
- Evidência Encontrada: "${s.evidence}"
- URL de Referência: ${s.url || 'Não disponível'}
- Contexto da Detecção: ${s.context || 'N/A'}
- Data: ${(s.detected_at && !isNaN(new Date(s.detected_at).getTime())) ? new Date(s.detected_at).toLocaleDateString('pt-BR') : 'Data não registrada'}
`).join('\n') : 'Nenhuma fonte de detecção TOTVS encontrada.'}

## SINAIS DE INTENÇÃO DE COMPRA (${intentSignals?.length || 0} sinal(is) detectado(s))

${intentSignals && intentSignals.length > 0 ? intentSignals.map((sig: any, i: number) => `
**Sinal ${i + 1}:**
- Categoria: ${sig.signal_type}
- Score de Confiança: ${sig.confidence_score}/100
- Descrição Completa: "${sig.description || 'Sem descrição disponível'}"
- Fonte de Informação: ${sig.source || 'Fonte não especificada'}
- URL/Referência: ${sig.url || 'N/A'}
- Metadata Adicional: ${sig.metadata ? JSON.stringify(sig.metadata) : 'N/A'}
- Data de Detecção: ${(sig.detected_at && !isNaN(new Date(sig.detected_at).getTime())) ? new Date(sig.detected_at).toLocaleDateString('pt-BR') : 'Data não registrada'}
- Validade: ${sig.expires_at ? `Válido até ${new Date(sig.expires_at).toLocaleDateString('pt-BR')}` : 'Sem expiração'}
`).join('\n') : 'Nenhum sinal de intenção detectado para esta empresa.'}

## DADOS CORPORATIVOS DA EMPRESA
- Nome Oficial: ${company?.name}
- CNPJ: ${company?.cnpj || 'Não disponível'}
- Segmento de Atuação: ${company?.segment || 'Não identificado'}
- Porte (Funcionários): ${company?.employees || 'Não disponível'}
- Receita Anual Estimada: ${company?.revenue ? `R$ ${company.revenue.toLocaleString('pt-BR')}` : 'Não disponível'}
- Website Oficial: ${company?.domain || 'Não disponível'}
- Maturidade Digital (Score): ${company?.digital_maturity_score || 'Não avaliado'}/100
- Localização: ${company?.city || 'N/A'}, ${company?.state || 'N/A'}

## STATUS DE MONITORAMENTO
${competitors ? `
- Monitoramento Ativo: Sim
- Última Verificação TOTVS: ${(competitors.last_totvs_check_at && !isNaN(new Date(competitors.last_totvs_check_at).getTime())) ? new Date(competitors.last_totvs_check_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nunca verificado'}
- Última Verificação Intent: ${(competitors.last_intent_check_at && !isNaN(new Date(competitors.last_intent_check_at).getTime())) ? new Date(competitors.last_intent_check_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nunca verificado'}
- Frequência de Verificação: A cada ${competitors.check_frequency_hours || 24} horas
` : '- Monitoramento Ativo: Não configurado'}

---

## INSTRUÇÕES PARA ANÁLISE CONTEXTUAL:

1. **ANALISE PROFUNDAMENTE** cada fonte e sinal listado acima
2. **CITE ESPECIFICAMENTE** as evidências encontradas (URLs, descrições, contextos)
3. **INTERPRETE O CONTEXTO**: não basta listar scores, explique O QUE FOI ENCONTRADO e POR QUE IMPORTA
4. **VALIDE A QUALIDADE**: questione se as fontes são realmente relevantes para a empresa específica
5. **SEJA CRÍTICO**: identifique falsos positivos (ex: "funcionário lista TOTVS" vs "empresa usa TOTVS")
6. **DECISÃO LÓGICA**: sua recomendação DEVE ser consistente com os dados:
   - Se confidence = "low" e priority = "cold" → NÃO pode ser decision = "GO"
   - Se TOTVS Score alto → NÃO pode recomendar prospecção
   - Se Intent Score baixo + poucos sinais válidos → deve ser "cold" ou "monitor", não "hot"
`;

    const systemPrompt = `Você é um Analista Sênior de Inteligência Comercial B2B, especializado em qualificação estratégica de leads para soluções ERP corporativas.

**RESPONSABILIDADES PRINCIPAIS:**
- Conduzir análise 360° profunda baseada em múltiplas fontes de inteligência de mercado
- Avaliar viabilidade comercial com base em dados concretos, não suposições
- Gerar recomendações executivas fundamentadas em evidências verificáveis
- Identificar riscos, oportunidades e pontos de atenção críticos

**REGRAS DE DECISÃO (CRITÉRIOS RÍGIDOS):**

1. **NO-GO IMEDIATO** → TOTVS Score ≥ 70
   - Alta evidência de uso atual de TOTVS
   - Recursos devem ser alocados para leads mais promissores

2. **GO COM CAUTELA** → TOTVS Score 40-69
   - Evidências inconclusivas de uso de TOTVS
   - Requer investigação adicional antes de investimento comercial

3. **GO PRIORIDADE HOT** → Intent Score ≥ 70 + TOTVS Score < 40
   - Alta intenção de compra + sem uso confirmado de TOTVS
   - Momento ideal para abordagem comercial agressiva

4. **GO PRIORIDADE WARM** → Intent Score 40-69 + TOTVS Score < 40
   - Sinais moderados de interesse + não usa TOTVS
   - Oportunidade válida com abordagem estratégica

5. **GO PRIORIDADE COLD** → Intent Score < 40 + TOTVS Score < 40
   - Baixos sinais de intenção, mas qualificado para nurturing
   - Monitoramento contínuo e relacionamento de longo prazo

**LÓGICA DE CONFIANÇA (CONSISTENCY CHECK):**
- Se data_quality = "low" → confidence DEVE ser "low"
- Se poucos sinais válidos (< 2) → confidence DEVE ser "low" ou "medium"
- Se contradições nos dados → confidence DEVE ser "low"
- NUNCA retorne decision = "GO" com confidence = "low" E priority = "cold"
  - Nesse caso, ajuste para "monitor" ou aumente confidence se justificável

**FORMATO DE RESPOSTA ESTRUTURADO (JSON):**
{
  "decision": "GO" | "NO-GO",
  "confidence": "high" | "medium" | "low",
  "priority": "hot" | "warm" | "cold" | "disqualified",
  "executive_summary": "Resumo executivo de 2-4 linhas explicando CLARAMENTE a decisão, citando AS EVIDÊNCIAS ESPECÍFICAS encontradas e o raciocínio estratégico por trás da recomendação.",
  "deep_analysis": {
    "totvs_analysis": "Análise crítica e detalhada de CADA fonte de detecção TOTVS listada. Cite URLs, contextos específicos, e avalie se são realmente indicativos de uso pela EMPRESA (não apenas menções genéricas). Identifique falsos positivos. Mínimo 4 linhas.",
    "intent_analysis": "Análise aprofundada de CADA sinal de intenção detectado. Cite as descrições completas, fontes, URLs e explique O QUE cada sinal significa no contexto comercial. Avalie a qualidade e relevância de cada sinal. Mínimo 4 linhas.",
    "opportunity_analysis": "Avaliação estratégica do potencial de negócio. Considere: tamanho da empresa, segmento, maturidade digital, sinais de crescimento/investimento. Identifique fit com solução e tamanho de deal potencial. Seja específico sobre VALOR e TIMING. Mínimo 3 linhas.",
    "risk_analysis": "Identificação crítica de riscos comerciais: uso de TOTVS, concorrência, timing inadequado, falta de budget, falta de dor identificada. Seja honesto sobre limitações dos dados. Mínimo 3 linhas."
  },
  "action_plan": {
    "immediate_actions": [
      "Ação específica e acionável 1 (ex: 'Ligar para João Silva, Diretor de TI, telefone encontrado no LinkedIn')",
      "Ação específica e acionável 2 (ex: 'Enviar case de ROI do segmento X baseado em métrica Y identificada')",
      "Ação específica e acionável 3 (ex: 'Pesquisar mais sobre projeto Z mencionado na notícia de DD/MM/AAAA')"
    ],
    "talking_points": [
      "Argumento de venda específico 1 baseado nos dados coletados",
      "Argumento de venda específico 2 que conecta à dor/oportunidade identificada",
      "Argumento de venda específico 3 que diferencia da concorrência"
    ],
    "objections_to_anticipate": [
      "Objeção provável 1 com base nos dados (ex: 'Já usamos TOTVS há X anos')",
      "Objeção provável 2 (ex: 'Não temos budget aprovado para mudança de ERP')"
    ]
  },
  "sources_summary": {
    "strongest_evidence": "Cite ESPECIFICAMENTE qual foi a evidência mais forte encontrada (fonte, descrição, URL) e POR QUE ela é relevante.",
    "weakest_point": "Identifique HONESTAMENTE qual é a maior lacuna ou ponto fraco na análise. O que falta saber?",
    "data_quality": "high" | "medium" | "low" (baseado na quantidade, relevância e confiabilidade das fontes)"
  }
}

**DIRETRIZES CRÍTICAS DE ANÁLISE:**

✅ FAÇA:
- Cite URLs, descrições e contextos específicos das fontes
- Seja crítico e questione a relevância de cada fonte
- Identifique falsos positivos (ex: "vaga menciona TOTVS" ≠ "empresa usa TOTVS")
- Conecte os sinais ao contexto de negócio da empresa específica
- Seja honesto sobre limitações e lacunas nos dados
- Garanta consistência lógica entre decision, confidence e priority

❌ NÃO FAÇA:
- Gerar respostas genéricas sem citar fontes específicas
- Repetir os scores sem interpretar o que significam
- Inventar dados que não foram fornecidos
- Ignorar contradições ou dados de baixa qualidade
- Recomendar "GO" quando confidence é "low" e priority é "cold"
- Usar termos vagos como "alguns sinais" - seja específico: "3 sinais encontrados: X, Y, Z"

**CHECKLIST FINAL ANTES DE RESPONDER:**
1. ✓ Citei fontes específicas com URLs e contextos?
2. ✓ Minha decisão é logicamente consistente com os scores e prioridade?
3. ✓ Identifiquei falsos positivos e avaliei qualidade das fontes?
4. ✓ Fui específico nas ações imediatas (não genérico "pesquisar mais")?
5. ✓ Avaliei honestamente as limitações dos dados disponíveis?`;

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
        max_completion_tokens: 4000, // Aumentado para permitir análises mais detalhadas
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
