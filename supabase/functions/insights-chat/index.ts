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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build dynamic RAG context from database
    const context = await buildRAGContext(supabase);

    // System prompt with comprehensive knowledge
    const systemPrompt = `Você é o STRATEVO Insight Assistant, um assistente de IA especializado em análise empresarial e estratégia comercial B2B.

CONTEXTO DA PLATAFORMA STRATEVO INTELLIGENCE:
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

    // Call OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

  try {
    // Get companies summary
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, domain, industry, employees')
      .limit(100);

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
    } else if (companies && companies.length > 0) {
      contexts.push(`EMPRESAS CADASTRADAS (${companies.length} empresas):
${companies.slice(0, 10).map((c: any) => 
  `- ${c.name} (${c.industry || 'Setor não informado'}, ${c.employees || 'N/A'} funcionários)`
).join('\n')}
${companies.length > 10 ? `\n... e mais ${companies.length - 10} empresas` : ''}`);
    }

    // Get digital maturity scores
    const { data: maturityScores, error: maturityError } = await supabase
      .from('digital_maturity')
      .select('company_id, overall_score, infrastructure_score, systems_score')
      .order('overall_score', { ascending: false })
      .limit(50);

    if (maturityError) {
      console.error('Error fetching maturity scores:', maturityError);
    } else if (maturityScores && maturityScores.length > 0) {
      const avgScore = maturityScores.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / maturityScores.length;
      contexts.push(`MATURIDADE DIGITAL:
- Média geral: ${avgScore.toFixed(1)}/100
- Empresas analisadas: ${maturityScores.length}
- Top 5 scores: ${maturityScores.slice(0, 5).map((s: any) => `${(s.overall_score || 0).toFixed(1)}`).join(', ')}`);
    }

    // Get buying signals
    const { data: signals, error: signalsError } = await supabase
      .from('governance_signals')
      .select('company_id, signal_type, confidence_score, description')
      .order('detected_at', { ascending: false })
      .limit(50);

    if (signalsError) {
      console.error('Error fetching signals:', signalsError);
    } else if (signals && signals.length > 0) {
      const highConfidence = signals.filter((s: any) => (s.confidence_score || 0) > 0.7).length;
      contexts.push(`SINAIS DE COMPRA:
- Total de sinais ativos: ${signals.length}
- Alta confiança: ${highConfidence}
- Tipos: ${[...new Set(signals.map((s: any) => s.signal_type))].slice(0, 5).join(', ')}`);
    }

    // Get decision makers
    const { data: decisionMakers, error: decisorsError } = await supabase
      .from('decision_makers')
      .select('name, title, seniority, department, company_id')
      .limit(50);

    if (decisorsError) {
      console.error('Error fetching decision makers:', decisorsError);
    } else if (decisionMakers && decisionMakers.length > 0) {
      contexts.push(`DECISORES MAPEADOS:
- Total: ${decisionMakers.length} decisores
- Senioridades: ${[...new Set(decisionMakers.map((d: any) => d.seniority).filter(Boolean))].slice(0, 5).join(', ')}`);
    }

    // Get financial data summary
    const { data: financial, error: financialError } = await supabase
      .from('financial_data')
      .select('company_id, credit_score, risk_classification')
      .limit(50);

    if (financialError) {
      console.error('Error fetching financial data:', financialError);
    } else if (financial && financial.length > 0) {
      const avgCredit = financial.reduce((sum: number, f: any) => sum + (f.credit_score || 0), 0) / financial.length;
      contexts.push(`DADOS FINANCEIROS:
- Empresas com análise: ${financial.length}
- Score de crédito médio: ${avgCredit.toFixed(1)}`);
    }

    // Get digital presence data
    const { data: presence, error: presenceError } = await supabase
      .from('digital_presence')
      .select('company_id, overall_score, social_score, web_score')
      .order('overall_score', { ascending: false })
      .limit(30);

    if (presenceError) {
      console.error('Error fetching digital presence:', presenceError);
    } else if (presence && presence.length > 0) {
      const avgPresence = presence.reduce((sum: number, p: any) => sum + (p.overall_score || 0), 0) / presence.length;
      contexts.push(`PRESENÇA DIGITAL:
- Empresas analisadas: ${presence.length}
- Score médio: ${avgPresence.toFixed(1)}/100`);
    }

  } catch (error) {
    console.error('Error building RAG context:', error);
  }

  if (contexts.length === 0) {
    return `Sistema ainda em fase de inicialização. 
    
Para melhor análise, recomendo:
1. Cadastrar empresas no sistema
2. Executar enriquecimento de dados
3. Analisar maturidade digital das empresas cadastradas`;
  }

  return contexts.join('\n\n');
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
