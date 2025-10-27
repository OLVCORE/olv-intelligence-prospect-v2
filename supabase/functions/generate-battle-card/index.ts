import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyContext {
  id: string;
  name: string;
  sector?: string;
  employees?: number;
  revenue?: number;
  city?: string;
  state?: string;
  totvs_detection_score?: number;
  digital_maturity_score?: number;
  intent_signals?: any[];
  current_erp?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id } = await req.json();

    if (!company_id) {
      throw new Error('company_id is required');
    }

    console.log(`[Battle Card] Generating for company: ${company_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar dados completos da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError) throw companyError;

    // 2. Buscar sinais de intenção
    const { data: intentSignals } = await supabase
      .from('intent_signals')
      .select('*')
      .eq('company_id', company_id)
      .order('detected_at', { ascending: false })
      .limit(5);

    // 3. Buscar detecção de TOTVS
    const { data: totvsDetection } = await supabase
      .from('totvs_detection_results')
      .select('*')
      .eq('company_id', company_id)
      .order('detected_at', { ascending: false })
      .limit(1);

    const totvsScore = totvsDetection?.[0]?.score || company.totvs_detection_score || 0;
    const currentErp = totvsDetection?.[0]?.detected_erp || 'Desconhecido';

    // 4. Montar contexto completo
    const context: CompanyContext = {
      id: company.id,
      name: company.name,
      sector: company.sector || company.vertical,
      employees: company.employees,
      revenue: company.annual_revenue,
      city: company.city,
      state: company.state,
      totvs_detection_score: totvsScore,
      digital_maturity_score: company.digital_maturity_score,
      intent_signals: intentSignals || undefined,
      current_erp: currentErp,
    };

    console.log('[Battle Card] Context:', JSON.stringify(context, null, 2));

    // 5. Gerar Battle Card com IA
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = `Você é um especialista em análise competitiva de ERPs no mercado brasileiro.

Sua missão: Gerar um Battle Card PERSONALIZADO para ajudar um vendedor TOTVS a vencer contra o concorrente atual da empresa.

IMPORTANTE:
- Se TOTVS Score < 30: Empresa provavelmente NÃO usa ERP estruturado → competir contra "Planilhas Excel" ou sistemas legados
- Se TOTVS Score 30-70: Empresa pode usar SAP, Oracle, Microsiga, Protheus, ou outro ERP
- Se TOTVS Score > 70: Empresa JÁ USA TOTVS → foco em upsell/cross-sell

Estruture o Battle Card em JSON com:
{
  "competitor_name": "Nome do principal concorrente detectado",
  "competitor_type": "erp" | "legacy" | "spreadsheet" | "other",
  "detection_confidence": 0-100,
  "win_strategy": "Estratégia de 2-3 parágrafos para vencer esse competidor NESTA empresa específica",
  "objection_handling": [
    {
      "objection": "Objeção comum deste competidor",
      "response": "Resposta personalizada com dados desta empresa"
    }
  ],
  "proof_points": [
    {
      "title": "Caso de sucesso ou métrica relevante",
      "type": "case_study" | "metric" | "testimonial",
      "result": "Resultado específico",
      "relevance": "Por que isso importa para ESTA empresa"
    }
  ],
  "totvs_advantages": [
    "Vantagem específica para o setor/tamanho desta empresa",
    "Vantagem relacionada aos sinais de intenção detectados",
    "Vantagem comparando com o competidor atual"
  ],
  "next_steps": [
    "Ação concreta 1",
    "Ação concreta 2"
  ]
}`;

    const userPrompt = `Analise esta empresa e gere um Battle Card personalizado:

**EMPRESA:**
- Nome: ${context.name}
- Setor: ${context.sector || 'Não especificado'}
- Funcionários: ${context.employees || 'Não informado'}
- Receita: ${context.revenue ? `R$ ${(context.revenue / 1000000).toFixed(1)}M` : 'Não informado'}
- Localização: ${context.city}, ${context.state}

**ANÁLISE COMPETITIVA:**
- TOTVS Detection Score: ${totvsScore}/100
- ERP Atual Detectado: ${currentErp}
- Maturidade Digital: ${context.digital_maturity_score || 'Não avaliado'}/100

**SINAIS DE INTENÇÃO (${intentSignals?.length || 0} detectados):**
${intentSignals?.map(s => `- ${s.signal_type}: ${s.signal_title} (${s.confidence_score} pts)`).join('\n') || 'Nenhum sinal detectado ainda'}

**INTERPRETAÇÃO:**
${totvsScore < 30 ? '⚠️ Baixo score TOTVS = Provavelmente usa planilhas/sistemas legados' : ''}
${totvsScore >= 30 && totvsScore < 70 ? '🎯 Score médio = Pode usar SAP, Oracle, Microsiga ou outro ERP' : ''}
${totvsScore >= 70 ? '✅ Alto score = Já é cliente TOTVS - foco em expansão' : ''}

Gere um Battle Card ULTRA ESPECÍFICO para esta empresa. Use os sinais de intenção para personalizar a estratégia.`;

    console.log('[Battle Card] Calling OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Battle Card] OpenAI error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const battleCard = JSON.parse(aiData.choices[0].message.content);

    console.log('[Battle Card] Generated:', JSON.stringify(battleCard, null, 2));

    // 6. Salvar no banco
    const { data: savedCard, error: saveError } = await supabase
      .from('company_battle_cards')
      .upsert({
        company_id,
        competitor_name: battleCard.competitor_name,
        competitor_type: battleCard.competitor_type,
        detection_confidence: battleCard.detection_confidence,
        win_strategy: battleCard.win_strategy,
        objection_handling: battleCard.objection_handling,
        proof_points: battleCard.proof_points,
        totvs_advantages: battleCard.totvs_advantages,
        next_steps: battleCard.next_steps,
        context_snapshot: context,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('[Battle Card] Save error:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        battle_card: savedCard || battleCard,
        context,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Battle Card] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});