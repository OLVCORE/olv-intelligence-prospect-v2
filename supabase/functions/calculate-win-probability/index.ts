import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WinProbabilityContext {
  company: {
    name: string;
    sector?: string;
    employees?: number;
    revenue?: number;
    location?: string;
  };
  totvs_score: number;
  intent_score: number;
  intent_signals_count: number;
  deal_value?: number;
  days_in_pipeline?: number;
  competitor_detected?: string;
  historical_wins: number;
  historical_losses: number;
  total_deals: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, deal_value, days_in_pipeline } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company data
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    // Calculate intent score
    const { data: intentSignals } = await supabase
      .from('intent_signals')
      .select('confidence_score')
      .eq('company_id', company_id)
      .gte('detected_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    const intentScore = intentSignals?.length 
      ? Math.min(Math.round(intentSignals.reduce((sum, s) => sum + s.confidence_score, 0) / intentSignals.length), 100)
      : 0;

    // Get battle card (competitor info)
    const { data: battleCard } = await supabase
      .from('company_battle_cards')
      .select('competitor_name')
      .eq('company_id', company_id)
      .maybeSingle();

    // Get historical win/loss data
    const { data: winLossHistory } = await supabase
      .from('win_loss_analysis')
      .select('outcome')
      .eq('company_id', company_id);

    const historicalWins = winLossHistory?.filter(w => w.outcome === 'won').length || 0;
    const historicalLosses = winLossHistory?.filter(w => w.outcome === 'lost').length || 0;
    const totalDeals = historicalWins + historicalLosses;

    const context: WinProbabilityContext = {
      company: {
        name: company.name,
        sector: company.industry_sector,
        employees: company.employees,
        revenue: company.annual_revenue,
        location: company.city,
      },
      totvs_score: company.totvs_detection_score || 0,
      intent_score: intentScore,
      intent_signals_count: intentSignals?.length || 0,
      deal_value,
      days_in_pipeline,
      competitor_detected: battleCard?.competitor_name,
      historical_wins: historicalWins,
      historical_losses: historicalLosses,
      total_deals: totalDeals,
    };

    console.log('Win Probability Context:', JSON.stringify(context, null, 2));

    // Calculate base probability using heuristics
    let baseProbability = 50;

    // Intent signals boost (0-30 points)
    if (intentScore >= 80) baseProbability += 30;
    else if (intentScore >= 60) baseProbability += 20;
    else if (intentScore >= 40) baseProbability += 10;

    // TOTVS usage penalty (-40 points if high)
    if (context.totvs_score >= 70) baseProbability -= 40;
    else if (context.totvs_score >= 50) baseProbability -= 20;
    else if (context.totvs_score >= 30) baseProbability -= 10;

    // Historical win rate boost
    if (totalDeals > 0) {
      const winRate = historicalWins / totalDeals;
      baseProbability += Math.round(winRate * 20 - 10); // -10 to +10
    }

    // Pipeline time penalty (longer = lower probability)
    if (days_in_pipeline) {
      if (days_in_pipeline > 180) baseProbability -= 15;
      else if (days_in_pipeline > 90) baseProbability -= 10;
      else if (days_in_pipeline > 60) baseProbability -= 5;
    }

    baseProbability = Math.max(5, Math.min(95, baseProbability));

    // AI Enhancement (if available)
    let aiProbability = baseProbability;
    let aiInsights = '';
    let keyFactors: string[] = [];
    let recommendations: string[] = [];

    if (openaiApiKey) {
      const systemPrompt = `You are a B2B sales AI analyzing win probability for TOTVS ERP deals.
Analyze the context and provide:
1. Adjusted win probability (5-95%)
2. Key factors affecting probability
3. Actionable recommendations to increase win rate

Be data-driven and specific.`;

      const userPrompt = `Analyze this deal context:

Company: ${context.company.name}
Sector: ${context.company.sector || 'N/A'}
Employees: ${context.company.employees || 'N/A'}
Revenue: ${context.company.revenue ? `R$ ${context.company.revenue.toLocaleString()}` : 'N/A'}

TOTVS Detection Score: ${context.totvs_score}/100 ${context.totvs_score >= 70 ? '(HIGH RISK - Already using TOTVS)' : context.totvs_score >= 30 ? '(MEDIUM - Some TOTVS usage)' : '(LOW - Minimal TOTVS)'}
Intent Score: ${context.intent_score}/100 (${context.intent_signals_count} signals)
Competitor Detected: ${context.competitor_detected || 'Unknown'}

Historical Performance:
- Wins: ${historicalWins}
- Losses: ${historicalLosses}
- Win Rate: ${totalDeals > 0 ? `${Math.round((historicalWins / totalDeals) * 100)}%` : 'N/A'}

Deal Value: ${deal_value ? `R$ ${deal_value.toLocaleString()}` : 'N/A'}
Days in Pipeline: ${days_in_pipeline || 'N/A'}

Base Calculated Probability: ${baseProbability}%

Provide your analysis in JSON format:
{
  "adjusted_probability": <number 5-95>,
  "confidence": <"high" | "medium" | "low">,
  "key_factors": [<array of 3-5 key factors affecting probability>],
  "recommendations": [<array of 3-5 specific actions to increase win rate>],
  "insights": "<2-3 sentence strategic insight>"
}`;

      try {
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
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices[0].message.content;
          
          console.log('AI Response:', aiContent);

          // Parse JSON from AI response
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiResult = JSON.parse(jsonMatch[0]);
            aiProbability = aiResult.adjusted_probability;
            keyFactors = aiResult.key_factors || [];
            recommendations = aiResult.recommendations || [];
            aiInsights = aiResult.insights || '';
          }
        }
      } catch (aiError) {
        console.error('AI enhancement error:', aiError);
        // Fallback to base probability
      }
    }

    // Default factors if AI didn't provide
    if (keyFactors.length === 0) {
      if (context.totvs_score >= 70) keyFactors.push('🚨 Alto uso de TOTVS detectado - risco crítico');
      if (intentScore >= 70) keyFactors.push('✅ Sinais de intenção fortes detectados');
      if (totalDeals > 0 && historicalWins / totalDeals > 0.6) keyFactors.push('📊 Histórico positivo de conversão');
      if (days_in_pipeline && days_in_pipeline > 90) keyFactors.push('⏰ Deal longo no pipeline - atenção necessária');
      if (context.competitor_detected) keyFactors.push(`⚔️ Competidor detectado: ${context.competitor_detected}`);
    }

    // Default recommendations if AI didn't provide
    if (recommendations.length === 0) {
      if (context.totvs_score < 30) recommendations.push('Acelerar apresentação de proposta - empresa não usa TOTVS');
      if (intentScore >= 60) recommendations.push('Aproveitar momentum dos sinais de intenção - contato imediato');
      if (days_in_pipeline && days_in_pipeline > 60) recommendations.push('Realizar follow-up estratégico - evitar perda de momentum');
      recommendations.push('Usar Battle Card para preparar objeções competitivas');
      recommendations.push('Apresentar proof points relevantes ao setor');
    }

    const result = {
      company_id,
      company_name: company.name,
      base_probability: baseProbability,
      ai_probability: aiProbability,
      final_probability: aiProbability,
      confidence: aiProbability >= 70 ? 'high' : aiProbability >= 40 ? 'medium' : 'low',
      key_factors: keyFactors,
      recommendations: recommendations,
      insights: aiInsights,
      context_summary: {
        totvs_risk: context.totvs_score >= 70 ? 'high' : context.totvs_score >= 30 ? 'medium' : 'low',
        intent_level: intentScore >= 70 ? 'hot' : intentScore >= 40 ? 'warm' : 'cold',
        historical_win_rate: totalDeals > 0 ? Math.round((historicalWins / totalDeals) * 100) : null,
        competitor: context.competitor_detected,
      },
      calculated_at: new Date().toISOString(),
    };

    console.log('Win Probability Result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error calculating win probability:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
