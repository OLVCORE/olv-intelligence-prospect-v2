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
    const { companyId, accountStrategyId, inputs } = await req.json();

    console.log('[Advanced ROI] Calculating for company:', companyId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados da empresa para contextualizar benchmarks
    const { data: company } = await supabase
      .from('companies')
      .select('industry, employees, revenue')
      .eq('id', companyId)
      .single();

    // =========================================
    // 1. CÁLCULO DE CUSTOS E BENEFÍCIOS
    // =========================================

    const currentTotalCost = (Object.values(inputs.currentCosts) as number[]).reduce((a, b) => a + b, 0);
    
    const firstYearInvestment = (Object.values(inputs.proposedInvestment) as number[]).reduce((a, b) => a + b, 0);

    // Cálculo de benefícios anuais
    const timeSavingsValue = 
      (inputs.expectedBenefits.employeesAffected * inputs.expectedBenefits.avgSalary) * 
      (inputs.expectedBenefits.timeReductionPercent / 100);

    const errorReductionValue = 
      currentTotalCost * (inputs.expectedBenefits.errorReductionPercent / 100) * 0.15; // 15% do custo atual é impacto de erros

    const revenueGrowthValue = 
      currentTotalCost * (inputs.expectedBenefits.revenueIncreasePercent / 100) * 2; // Multiplicador de receita

    const totalAnnualBenefit = timeSavingsValue + errorReductionValue + revenueGrowthValue;

    // =========================================
    // 2. PROJEÇÃO ANO A ANO
    // =========================================

    const projectYears = inputs.projectYears || 3;
    const yearByYear = [];
    let cumulativeCashFlow = -firstYearInvestment; // Investimento inicial negativo
    let paybackMonth = 0;
    let paybackFound = false;

    for (let year = 1; year <= projectYears; year++) {
      // Custos anuais (manutenção cresce 5% ao ano)
      const yearCosts = inputs.proposedInvestment.firstYearMaintenance * Math.pow(1.05, year - 1);
      
      // Benefícios crescem conforme adoção (80% no ano 1, 100% anos seguintes)
      const adoptionRate = year === 1 ? 0.8 : 1.0;
      const yearBenefits = totalAnnualBenefit * adoptionRate;
      
      const netCashFlow = yearBenefits - yearCosts;
      cumulativeCashFlow += netCashFlow;

      // Calcular payback
      if (!paybackFound && cumulativeCashFlow >= 0) {
        paybackMonth = (year - 1) * 12 + Math.ceil((firstYearInvestment - cumulativeCashFlow + netCashFlow) / (netCashFlow / 12));
        paybackFound = true;
      }

      yearByYear.push({
        year,
        costs: year === 1 ? firstYearInvestment : yearCosts,
        benefits: yearBenefits,
        netCashFlow,
        cumulativeCashFlow,
      });
    }

    // =========================================
    // 3. CÁLCULO DE MÉTRICAS FINANCEIRAS
    // =========================================

    // NPV (Net Present Value)
    const discountRate = inputs.discountRate / 100;
    let npv = -firstYearInvestment;
    for (const year of yearByYear) {
      npv += year.netCashFlow / Math.pow(1 + discountRate, year.year);
    }

    // ROI
    const totalBenefits = yearByYear.reduce((sum, y) => sum + y.benefits, 0);
    const totalCosts = firstYearInvestment + yearByYear.reduce((sum, y) => sum + (y.year === 1 ? 0 : (y.costs as number)), 0);
    const roi = ((totalBenefits - totalCosts) / totalCosts) * 100;

    // IRR (Internal Rate of Return) - Aproximação
    const irr = calculateIRR([-firstYearInvestment, ...yearByYear.map(y => y.netCashFlow)]);

    // =========================================
    // 4. BENCHMARKS DA INDÚSTRIA
    // =========================================

    // Benchmarks baseados na indústria (simulado - em produção viria de database)
    const industryBenchmarks: Record<string, { avgROI: number; avgPayback: number }> = {
      'Manufatura': { avgROI: 85, avgPayback: 18 },
      'Varejo': { avgROI: 95, avgPayback: 14 },
      'Serviços': { avgROI: 110, avgPayback: 12 },
      'Tecnologia': { avgROI: 120, avgPayback: 10 },
      'default': { avgROI: 90, avgPayback: 16 },
    };

    const benchmark = industryBenchmarks[company?.industry || 'default'] || industryBenchmarks['default'];
    
    const percentileRank = Math.round(
      roi > benchmark.avgROI 
        ? 75 + ((roi - benchmark.avgROI) / benchmark.avgROI) * 25 
        : 25 + (roi / benchmark.avgROI) * 50
    );

    // =========================================
    // 5. RESULTADO FINAL
    // =========================================

    const results = {
      netPresentValue: Math.round(npv),
      returnOnInvestment: Math.round(roi * 10) / 10,
      paybackPeriodMonths: paybackMonth || projectYears * 12,
      internalRateOfReturn: Math.round(irr * 10) / 10,
      yearByYear,
      breakdownBenefits: {
        timeSavingsValue: Math.round(timeSavingsValue),
        errorReductionValue: Math.round(errorReductionValue),
        revenueGrowthValue: Math.round(revenueGrowthValue),
        totalAnnualBenefit: Math.round(totalAnnualBenefit),
      },
      industryBenchmark: {
        averageROI: benchmark.avgROI,
        averagePayback: benchmark.avgPayback,
        percentileRank,
      },
    };

    // Salvar cálculo no account_strategy se fornecido
    if (accountStrategyId) {
      await supabase
        .from('account_strategies')
        .update({
          projected_roi: results.returnOnInvestment,
          payback_period: `${paybackMonth} meses`,
          investment_required: totalCosts,
          annual_value: totalAnnualBenefit,
          ai_insights: {
            ...inputs,
            calculated_at: new Date().toISOString(),
            results: results,
          },
        })
        .eq('id', accountStrategyId);
    }

    console.log('[Advanced ROI] ✅ Calculation complete. ROI:', results.returnOnInvestment, '%');

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `ROI calculado: ${results.returnOnInvestment}% | Payback: ${paybackMonth} meses`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Advanced ROI] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// =========================================
// HELPER: Cálculo de IRR (Newton-Raphson)
// =========================================
function calculateIRR(cashFlows: number[]): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let irr = 0.1; // guess inicial de 10%

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + irr, j);
      dnpv -= (j * cashFlows[j]) / Math.pow(1 + irr, j + 1);
    }

    const newIrr = irr - npv / dnpv;

    if (Math.abs(newIrr - irr) < tolerance) {
      return newIrr * 100; // Retornar como percentual
    }

    irr = newIrr;
  }

  return irr * 100;
}
