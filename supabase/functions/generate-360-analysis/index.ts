import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { 
      companyId, 
      companyName, 
      stcResult, 
      similarCompanies 
    } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[360] Gerando análise 360° para:', companyName);

    // BUSCAR DADOS DA EMPRESA
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Empresa não encontrada');
    }

    // CALCULAR SCORE DE OPORTUNIDADE (0-100)
    let opportunityScore = 0;
    const scoreBreakdown: Record<string, any> = {};

    // 1. SIMILARES USANDO TOTVS (0-15 pts)
    if (similarCompanies?.statistics) {
      const percentage = similarCompanies.statistics.percentage_totvs || 0;
      const points = Math.min(15, Math.round(percentage / 100 * 15));
      opportunityScore += points;
      scoreBreakdown['similar_companies'] = {
        points,
        max: 15,
        description: `${percentage}% das empresas similares usam TOTVS`
      };
    } else {
      scoreBreakdown['similar_companies'] = {
        points: 0,
        max: 15,
        description: 'Dados de empresas similares não disponíveis'
      };
    }

    // 2. STATUS STC (0-20 pts)
    if (stcResult?.status === 'go') {
      opportunityScore += 20;
      scoreBreakdown['stc_status'] = {
        points: 20,
        max: 20,
        description: '✅ Não é cliente TOTVS (GO confirmado)'
      };
    } else if (stcResult?.status === 'revisar') {
      opportunityScore += 10;
      scoreBreakdown['stc_status'] = {
        points: 10,
        max: 20,
        description: '⚠️ Status inconclusivo (REVISAR)'
      };
    } else {
      opportunityScore += 0;
      scoreBreakdown['stc_status'] = {
        points: 0,
        max: 20,
        description: '❌ Já é cliente TOTVS (NO-GO)'
      };
    }

    // 3. GAPS TECNOLÓGICOS (0-20 pts)
    const gaps = [];
    let gapPoints = 0;

    // Inferir gaps baseado em dados disponíveis
    if (!company.digital_maturity_score || company.digital_maturity_score < 50) {
      gaps.push({
        gap: 'Maturidade Digital Baixa',
        description: 'Empresa possui baixa maturidade digital',
        opportunity: 'TOTVS Protheus + Fluig',
        value: 'R$ 260.000',
        fit: 88
      });
      gapPoints += 10;
    }

    if (company.employees && company.employees > 50 && !company.totvs_detection_score) {
      gaps.push({
        gap: 'Gestão Empresarial',
        description: 'Empresa de médio porte sem ERP detectado',
        opportunity: 'TOTVS Protheus ERP',
        value: 'R$ 180.000',
        fit: 92
      });
      gapPoints += 10;
    }

    if (gaps.length === 0) {
      // Gap padrão se nenhum específico foi identificado
      gaps.push({
        gap: 'Oportunidade de Modernização',
        description: 'Potencial para soluções de gestão integrada',
        opportunity: 'TOTVS Suite',
        value: 'R$ 150.000',
        fit: 75
      });
      gapPoints += 5;
    }

    opportunityScore += Math.min(20, gapPoints);
    scoreBreakdown['tech_gaps'] = {
      points: Math.min(20, gapPoints),
      max: 20,
      description: `${gaps.length} gap${gaps.length > 1 ? 's' : ''} tecnológico${gaps.length > 1 ? 's' : ''} identificado${gaps.length > 1 ? 's' : ''}`,
      gaps
    };

    // 4. SINAIS DE INTENÇÃO (0-25 pts)
    const intentSignals = [];
    let intentPoints = 0;

    // Buscar sinais de intenção recentes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: signals } = await supabase
      .from('intent_signals')
      .select('signal_type, confidence_score, keywords, source')
      .eq('company_id', companyId)
      .gte('detected_at', sixMonthsAgo.toISOString())
      .order('detected_at', { ascending: false })
      .limit(10);

    if (signals && signals.length > 0) {
      signals.forEach(signal => {
        const points = signal.confidence_score >= 80 ? 10 : 
                      signal.confidence_score >= 60 ? 5 : 3;
        
        intentSignals.push({
          type: signal.confidence_score >= 80 ? 'strong' : 'medium',
          signal: signal.signal_type,
          source: signal.source || 'Sistema',
          points,
          keywords: signal.keywords
        });
        
        intentPoints += points;
      });
    }

    opportunityScore += Math.min(25, intentPoints);
    scoreBreakdown['intent_signals'] = {
      points: Math.min(25, intentPoints),
      max: 25,
      description: `${intentSignals.length} sinai${intentSignals.length !== 1 ? 's' : ''} de intenção detectado${intentSignals.length !== 1 ? 's' : ''}`,
      signals: intentSignals
    };

    // 5. TAMANHO/PORTE DA EMPRESA (0-15 pts)
    let sizePoints = 0;
    let sizeDescription = 'Porte não identificado';

    if (company.employees) {
      if (company.employees >= 500) {
        sizePoints = 15;
        sizeDescription = 'Grande porte (500+ funcionários)';
      } else if (company.employees >= 100) {
        sizePoints = 12;
        sizeDescription = 'Médio porte (100-499 funcionários)';
      } else if (company.employees >= 50) {
        sizePoints = 8;
        sizeDescription = 'Pequeno-médio porte (50-99 funcionários)';
      } else {
        sizePoints = 5;
        sizeDescription = 'Pequeno porte (<50 funcionários)';
      }
    }

    opportunityScore += sizePoints;
    scoreBreakdown['company_size'] = {
      points: sizePoints,
      max: 15,
      description: sizeDescription,
      employees: company.employees
    };

    // 6. MATURIDADE DIGITAL (0-10 pts)
    let digitalPoints = 0;
    const digitalFactors = [];

    if (company.domain || company.website) {
      digitalPoints += 3;
      digitalFactors.push('✅ Site/domínio identificado');
    }
    if (company.digital_maturity_score && company.digital_maturity_score >= 50) {
      digitalPoints += 4;
      digitalFactors.push('✅ Maturidade digital média/alta');
    }
    if (company.linkedin_url) {
      digitalPoints += 2;
      digitalFactors.push('✅ Presença no LinkedIn');
    }
    if (company.social_networks) {
      digitalPoints += 1;
      digitalFactors.push('✅ Redes sociais ativas');
    }

    if (digitalFactors.length === 0) {
      digitalFactors.push('⚠️ Dados digitais limitados');
    }

    opportunityScore += digitalPoints;
    scoreBreakdown['digital_maturity'] = {
      points: digitalPoints,
      max: 10,
      description: `${digitalFactors.length} fator${digitalFactors.length > 1 ? 'es' : ''} de presença digital`,
      factors: digitalFactors
    };

    // 7. LOCALIZAÇÃO ESTRATÉGICA (0-10 pts)
    let locationPoints = 0;
    let locationDescription = 'Localização não identificada';

    if (company.uf) {
      const strategicStates = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC'];
      if (strategicStates.includes(company.uf)) {
        locationPoints = 10;
        locationDescription = `Estado estratégico (${company.uf})`;
      } else {
        locationPoints = 5;
        locationDescription = `Região em expansão (${company.uf})`;
      }
    }

    opportunityScore += locationPoints;
    scoreBreakdown['location'] = {
      points: locationPoints,
      max: 10,
      description: locationDescription,
      state: company.uf
    };

    // 8. STATUS DA EMPRESA (0-5 pts)
    let statusPoints = 5; // Assume ativa por padrão
    let statusDescription = 'Empresa ativa';

    if (company.cnpj_status === 'ativa') {
      statusPoints = 5;
      statusDescription = '✅ CNPJ ativo';
    } else if (company.cnpj_status === 'inativo') {
      statusPoints = 0;
      statusDescription = '❌ CNPJ inativo';
    } else if (company.cnpj_status === 'pendente') {
      statusPoints = 3;
      statusDescription = '⚠️ Status a verificar';
    }

    opportunityScore += statusPoints;
    scoreBreakdown['company_status'] = {
      points: statusPoints,
      max: 5,
      description: statusDescription
    };

    // CLASSIFICAR TIMING
    let timing = 'long_term'; // 6-12 meses
    if (intentPoints >= 20) {
      timing = 'immediate'; // Imediato
    } else if (intentPoints >= 10) {
      timing = 'short_term'; // 1-3 meses
    } else if (intentPoints >= 5) {
      timing = 'medium_term'; // 3-6 meses
    }

    // GERAR RECOMENDAÇÕES DE PRODUTOS
    const recommendedProducts = gaps.map(gap => ({
      product: gap.opportunity,
      fit_score: gap.fit,
      value: gap.value,
      reason: gap.description,
      roi_months: gap.opportunity.includes('Protheus') ? 18 : 
                  gap.opportunity.includes('Fluig') ? 12 : 
                  gap.opportunity.includes('Suite') ? 24 : 15,
      benefits: [
        'Integração completa de processos',
        'Redução de custos operacionais em até 30%',
        'Aumento de produtividade em até 40%',
        'Melhor controle gerencial e tomada de decisão'
      ]
    }));

    // GERAR INSIGHTS FINAIS
    const finalInsights = [];

    if (opportunityScore >= 70) {
      finalInsights.push('🔥 HOT LEAD! Alta probabilidade de conversão. Abordar imediatamente.');
    } else if (opportunityScore >= 50) {
      finalInsights.push('⚠️ WARM LEAD. Oportunidade viável com abordagem adequada. Iniciar nurturing.');
    } else {
      finalInsights.push('❄️ COLD LEAD. Requer nurturing antes de abordagem comercial direta.');
    }

    if (similarCompanies?.statistics?.percentage_totvs > 50) {
      finalInsights.push(`📊 Empresa está FORA DO PADRÃO: ${similarCompanies.statistics.percentage_totvs}% dos concorrentes usam TOTVS.`);
    }

    if (gaps.length >= 2) {
      finalInsights.push(`🎯 Múltiplos gaps identificados (${gaps.length}) indicam oportunidade para solução integrada.`);
    }

    if (intentSignals.length >= 3) {
      finalInsights.push(`💡 Sinais fortes de intenção detectados (${intentSignals.length} sinais). Momento ideal para abordagem.`);
    }

    if (company.employees && company.employees >= 100) {
      finalInsights.push(`🏢 Porte da empresa (${company.employees} funcionários) justifica investimento em solução robusta.`);
    }

    console.log('[360] Análise concluída:', {
      score: opportunityScore,
      timing,
      gaps: gaps.length,
      signals: intentSignals.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          opportunity_score: Math.min(100, opportunityScore),
          score_breakdown: scoreBreakdown,
          timing,
          recommended_products: recommendedProducts,
          insights: finalInsights,
          generated_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[360] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
