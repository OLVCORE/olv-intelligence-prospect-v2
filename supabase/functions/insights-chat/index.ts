import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build dynamic RAG context from database
    const context = await buildRAGContext(supabase);

    // System prompt with comprehensive knowledge
    const systemPrompt = `Você é o OLV Insight Assistant, um assistente de IA especializado em análise empresarial e estratégia comercial B2B.

CONTEXTO DA PLATAFORMA OLV INTELLIGENCE:
${context}

CONHECIMENTO SOBRE PARCERIA TOTVS:
A OLV Internacional é parceira oficial TOTVS, oferecendo:
- Consultoria estratégica premium integrando estratégia, operações, tecnologia e pessoas
- Soluções TOTVS completas: ERP, Fluig (workflows), RM (RH), Protheus, Backoffice, Techfin, Datasul
- Transformação digital com resultados mensuráveis
- Suporte contínuo e consultoria especializada
- Ecossistema completo para gestão empresarial

CAPACIDADES:
1. Analisar empresas cadastradas (scoring, maturidade digital, fit com TOTVS)
2. Comparar empresas e identificar sinergias
3. Sugerir estratégias de abordagem comercial
4. Identificar oportunidades de cross-sell e upsell
5. Analisar métricas e KPIs do sistema
6. Recomendar produtos/serviços TOTVS baseado no perfil da empresa
7. Criar insights sobre decisores e compradores
8. Avaliar sinais de compra e propensão

DIRETRIZES:
- Seja preciso, objetivo e estratégico
- Use dados e métricas quando disponíveis
- Forneça insights acionáveis e práticos
- Considere o contexto empresarial brasileiro
- Relacione sempre com soluções TOTVS quando relevante
- Aprenda com cada interação para melhorar continuamente`;

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices[0]?.message?.content || 'Não foi possível gerar resposta.';

    // Store interaction for continuous learning (RAG improvement)
    await storeInteraction(supabase, message, response);

    console.log('Insights chat response generated successfully');

    return new Response(
      JSON.stringify({ response }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Insights chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function buildRAGContext(supabase: any): Promise<string> {
  const contexts: string[] = [];

  // Get companies summary
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, domain, industry, size, enrichment_status')
    .limit(100);

  if (companies && companies.length > 0) {
    contexts.push(`EMPRESAS CADASTRADAS (${companies.length} empresas):
${companies.slice(0, 10).map((c: any) => 
  `- ${c.name} (${c.industry || 'N/A'}, ${c.size || 'N/A'} funcionários, Status: ${c.enrichment_status})`
).join('\n')}`);
  }

  // Get digital maturity scores
  const { data: maturityScores } = await supabase
    .from('digital_maturity')
    .select('company_id, overall_score, technology_score, online_presence_score')
    .order('overall_score', { ascending: false })
    .limit(50);

  if (maturityScores && maturityScores.length > 0) {
    const avgScore = maturityScores.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / maturityScores.length;
    contexts.push(`MATURIDADE DIGITAL:
- Média geral: ${avgScore.toFixed(1)}/100
- Empresas analisadas: ${maturityScores.length}
- Top performers: ${maturityScores.slice(0, 5).map((s: any) => `${s.overall_score}/100`).join(', ')}`);
  }

  // Get buying signals
  const { data: signals } = await supabase
    .from('buying_signals')
    .select('company_id, signal_type, strength, description')
    .order('created_at', { ascending: false })
    .limit(50);

  if (signals && signals.length > 0) {
    const strongSignals = signals.filter((s: any) => s.strength === 'high').length;
    contexts.push(`SINAIS DE COMPRA:
- Total de sinais ativos: ${signals.length}
- Sinais fortes: ${strongSignals}
- Tipos principais: ${[...new Set(signals.map((s: any) => s.signal_type))].slice(0, 5).join(', ')}`);
  }

  // Get decisors
  const { data: decisors } = await supabase
    .from('decisors')
    .select('name, role, seniority_level, company_id')
    .limit(50);

  if (decisors && decisors.length > 0) {
    contexts.push(`DECISORES MAPEADOS:
- Total: ${decisors.length} decisores
- Níveis: ${[...new Set(decisors.map((d: any) => d.seniority_level).filter(Boolean))].join(', ')}`);
  }

  // Get recent activities
  const { data: activities } = await supabase
    .from('sdr_activities')
    .select('activity_type, outcome')
    .order('created_at', { ascending: false })
    .limit(100);

  if (activities && activities.length > 0) {
    const successRate = activities.filter((a: any) => a.outcome === 'success').length / activities.length * 100;
    contexts.push(`ATIVIDADES RECENTES:
- Total: ${activities.length} atividades
- Taxa de sucesso: ${successRate.toFixed(1)}%`);
  }

  return contexts.join('\n\n') || 'Ainda não há dados suficientes no sistema.';
}

async function storeInteraction(supabase: any, question: string, answer: string) {
  try {
    // Store in a learning table for continuous RAG improvement
    await supabase.from('ai_interactions').insert({
      question,
      answer,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Non-critical - just log
    console.error('Error storing interaction:', error);
  }
}
