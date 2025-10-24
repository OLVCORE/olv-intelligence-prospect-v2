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
    const { company_id, cnpj } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError) throw companyError;

    console.log(`[PREMIUM REPORT] Generating for ${company.name} (${cnpj})`);

    // 🔴 TODO: Integração Real Serasa
    // const serasaApiKey = Deno.env.get('SERASA_API_KEY');
    // const serasaData = await fetchSerasaPremiumData(cnpj, serasaApiKey);

    // 🟡 MOCK: Dados simulados realísticos
    const premiumData = generateMockSerasaData(company);

    // Salvar dados financeiros premium
    const { error: financialError } = await supabase
      .from('financial_data')
      .upsert({
        company_id,
        credit_score: premiumData.creditScore,
        risk_classification: premiumData.riskClassification,
        serasa_data: premiumData.serasaData,
        scpc_data: premiumData.scpcData,
        payment_history: premiumData.paymentHistory,
        debt_indicators: premiumData.debtIndicators,
        predictive_risk_score: premiumData.predictiveRiskScore,
        financial_indicators: {
          trends: premiumData.trends,
          alerts: premiumData.alerts,
          recommendations: premiumData.recommendations
        },
        last_updated: new Date().toISOString()
      });

    if (financialError) throw financialError;

    // Atualizar raw_data da empresa
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        raw_data: {
          ...company.raw_data,
          serasa_premium: premiumData,
          premium_report_generated_at: new Date().toISOString()
        }
      })
      .eq('id', company_id);

    if (updateError) throw updateError;

    console.log(`[PREMIUM REPORT] ✅ Generated successfully for ${company.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatório Premium gerado com sucesso',
        data: premiumData,
        cost_estimate: 'R$ 30-50',
        mock_mode: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PREMIUM REPORT] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        mock_mode: true 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// 🟡 MOCK: Gerar dados Serasa simulados realísticos
function generateMockSerasaData(company: any) {
  const baseScore = 600 + Math.floor(Math.random() * 300); // 600-900
  
  return {
    creditScore: baseScore,
    riskClassification: baseScore >= 800 ? 'A' : baseScore >= 700 ? 'B' : baseScore >= 600 ? 'C' : 'D',
    serasaData: {
      score: baseScore + 5,
      negativacoes: Math.floor(Math.random() * 3),
      protestos: Math.floor(Math.random() * 2),
      chequesSemFundo: 0,
      acoesJudiciais: Math.floor(Math.random() * 5),
      falencias: 0,
      recuperacoesJudiciais: 0
    },
    scpcData: {
      score: baseScore - 10,
      pendenciasFinanceiras: Math.floor(Math.random() * 3),
      valorTotal: Math.floor(Math.random() * 50000)
    },
    paymentHistory: {
      onTimePayments: 120 + Math.floor(Math.random() * 80),
      latePayments: Math.floor(Math.random() * 20),
      defaultPayments: Math.floor(Math.random() * 3),
      avgPaymentDelay: Math.random() * 10
    },
    debtIndicators: {
      totalDebt: Math.floor(Math.random() * 500000),
      currentDebt: Math.floor(Math.random() * 100000),
      overdueDebt: Math.floor(Math.random() * 20000),
      debtToRevenueRatio: 0.2 + Math.random() * 0.4
    },
    predictiveRiskScore: baseScore / 10,
    trends: {
      improving: baseScore > 750,
      stable: baseScore >= 650 && baseScore <= 750,
      deteriorating: baseScore < 650
    },
    alerts: [
      baseScore < 700 ? 'Score de crédito abaixo do ideal' : null,
      company.raw_data?.legal?.active_processes > 3 ? 'Alto número de processos ativos' : null
    ].filter(Boolean),
    recommendations: [
      'Manter histórico de pagamentos em dia',
      'Reduzir dívidas vencidas',
      'Monitorar processos judiciais'
    ]
  };
}
