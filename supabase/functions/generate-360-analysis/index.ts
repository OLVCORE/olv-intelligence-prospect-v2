import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { companyId, companyName, stcResult, similarCompanies } = await req.json();

    console.log('[360] Gerando análise para:', { companyId, companyName, stcStatus: stcResult?.status });

    let opportunityScore = 0;
    const scoreBreakdown: any = {};
    let timing = 'medium_term';
    const recommendedProducts = [];
    const finalInsights = [];

    // ====== CLIENTE EXISTENTE (NO-GO) - ESTRATÉGIA DE UPSELL/CROSS-SELL ======
    if (stcResult?.status === 'no-go') {
      console.log('[360] Empresa é NO-GO (já cliente TOTVS)');

      scoreBreakdown['stc_status'] = {
        points: 0,
        max: 100,
        description: '❌ Empresa JÁ É CLIENTE TOTVS - Não é oportunidade de nova venda'
      };

      finalInsights.push('❌ CLIENTE EXISTENTE - Não é oportunidade de NOVO contrato.');
      finalInsights.push('');
      finalInsights.push('💰 ESTRATÉGIA DE UPSELL/CROSS-SELL:');

      if (similarCompanies?.statistics?.using_totvs > 0) {
        const clientsWithTotvs = (similarCompanies.similar_companies || [])
          .filter((c: any) => c.uses_totvs)
          .slice(0, 3);

        if (clientsWithTotvs.length > 0) {
          finalInsights.push('');
          finalInsights.push('🎯 BENCHMARKING - Analise o que OUTROS CLIENTES TOTVS do mesmo setor estão usando:');
          clientsWithTotvs.forEach((client: any) => {
            finalInsights.push(`   • ${client.name} (${client.employees || '?'} funcionários) - Verificar stack de produtos`);
          });
          finalInsights.push('');
          finalInsights.push('📞 AÇÃO: Contatar gerente de contas e comparar produtos:');
          finalInsights.push('   • Se concorrentes têm Fluig e cliente não → CROSS-SELL');
          finalInsights.push('   • Se concorrentes têm módulos adicionais → UPSELL');
          finalInsights.push('   • Se concorrentes migraram para cloud → UPGRADE');
        }
      }

      finalInsights.push('');
      finalInsights.push('💡 PRODUTOS PARA EXPLORAR:');
      finalInsights.push('   • TOTVS Fluig (automação de processos)');
      finalInsights.push('   • TOTVS Techfin (gestão financeira avançada)');
      finalInsights.push('   • TOTVS Carol (IA e analytics)');
      finalInsights.push('   • Migração para TOTVS Cloud');
      finalInsights.push('');
      finalInsights.push('🔥 PITCH: "Seus concorrentes estão expandindo o uso de TOTVS. Vamos garantir que você não fique para trás?"');
      finalInsights.push('');
      finalInsights.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      finalInsights.push('📞 PRÓXIMO PASSO: Contatar gerente de contas para explorar upsell/cross-sell');

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            opportunity_score: 0,
            score_breakdown: scoreBreakdown,
            timing: 'not_applicable',
            recommended_products: [],
            insights: finalInsights,
            generated_at: new Date().toISOString()
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ====== NÃO É CLIENTE (GO) - ANÁLISE COM VISÃO DE HUNTER ======

    // 1. STATUS STC (0-20 pts)
    if (stcResult?.status === 'go') {
      opportunityScore += 20;
      scoreBreakdown['stc_status'] = {
        points: 20,
        max: 20,
        description: '✅ NÃO é cliente TOTVS - Oportunidade confirmada'
      };
    } else if (stcResult?.status === 'revisar') {
      opportunityScore += 10;
      scoreBreakdown['stc_status'] = {
        points: 10,
        max: 20,
        description: '⚠️ Status inconclusivo - Requer validação manual'
      };
    } else {
      opportunityScore += 5;
      scoreBreakdown['stc_status'] = {
        points: 5,
        max: 20,
        description: '⚠️ Verificação TOTVS não realizada'
      };
    }

    // 2. CONTEXTO DE MERCADO (0-30 pts) - baseado em penetração TOTVS
    const marketPenetration = similarCompanies?.statistics?.percentage_totvs || 0;
    let marketPoints = 0;

    if (marketPenetration >= 50) {
      marketPoints = 30; // Mercado maduro = alta urgência
    } else if (marketPenetration >= 30) {
      marketPoints = 20; // Penetração moderada
    } else if (marketPenetration >= 10) {
      marketPoints = 10; // Mercado em expansão
    } else {
      marketPoints = 5; // Oceano azul
    }

    opportunityScore += marketPoints;
    scoreBreakdown['market_context'] = {
      points: marketPoints,
      max: 30,
      description: `${marketPenetration.toFixed(0)}% dos concorrentes usam TOTVS`,
      factors: [
        `Total de similares: ${similarCompanies?.statistics?.total || 0}`,
        `Clientes TOTVS: ${similarCompanies?.statistics?.using_totvs || 0}`
      ]
    };

    // 3. TAMANHO DA EMPRESA (0-25 pts)
    opportunityScore += 15;
    scoreBreakdown['company_size'] = {
      points: 15,
      max: 25,
        description: 'Porte médio - fit com soluções TOTVS'
    };

    // 4. ENGAGEMENT (0-25 pts)
    opportunityScore += 10;
    scoreBreakdown['engagement'] = {
      points: 10,
      max: 25,
      description: 'Engajamento em análise - requer prospecção ativa'
    };

    // DEFINIR TIMING
    if (opportunityScore >= 80) {
      timing = 'immediate';
    } else if (opportunityScore >= 60) {
      timing = 'short_term';
    } else if (opportunityScore >= 40) {
      timing = 'medium_term';
    } else {
      timing = 'long_term';
    }

    // ====== INSIGHTS COM VISÃO DE HUNTER ======

    if (opportunityScore >= 80) {
      finalInsights.push('🔥🔥🔥 LEAD ULTRA-QUENTE! PRIORIDADE MÁXIMA!');
      finalInsights.push('');
      finalInsights.push('⚡ AÇÃO IMEDIATA (próximas 24-48h):');
      finalInsights.push('   1. Ligar AGORA e agendar reunião presencial');
      finalInsights.push('   2. Preparar proposta personalizada com ROI calculado');
      finalInsights.push('   3. Envolver C-Level: CEO/CFO/CTO');
      finalInsights.push('   4. Oferecer demonstração técnica in-loco');
      finalInsights.push('');
      finalInsights.push('💰 ESTRATÉGIA DE FECHAMENTO:');
      finalInsights.push('   • Usar URGÊNCIA: "Janela de oportunidade limitada"');
      finalInsights.push('   • Mostrar PROVA SOCIAL: Cases de concorrentes');
      finalInsights.push('   • Oferecer DESCONTO por fechamento rápido');
      finalInsights.push('   • Garantir SUPORTE VIP nos primeiros 90 dias');

    } else if (opportunityScore >= 60) {
      finalInsights.push('🔥 LEAD QUENTE! Alta probabilidade de conversão.');
      finalInsights.push('');
      finalInsights.push('🎯 PLANO DE ATAQUE (próximos 7 dias):');
      finalInsights.push('   1. Contato inicial: Email + LinkedIn + Telefone');
      finalInsights.push('   2. Agendar call de discovery (30min)');
      finalInsights.push('   3. Identificar DOR principal do negócio');
      finalInsights.push('   4. Enviar case de sucesso de empresa similar');
      finalInsights.push('   5. Proposta comercial em até 48h após discovery');

    } else if (opportunityScore >= 40) {
      finalInsights.push('⚠️ LEAD MORNO. Requer nurturing estratégico.');
      finalInsights.push('');
      finalInsights.push('📅 ESTRATÉGIA DE MÉDIO PRAZO (30-60 dias):');
      finalInsights.push('   1. Adicionar em sequência de email marketing');
      finalInsights.push('   2. Enviar conteúdo educativo sobre transformação digital');
      finalInsights.push('   3. Convidar para webinar/evento TOTVS');
      finalInsights.push('   4. Monitorar sinais de intenção (contratações, expansão)');
      finalInsights.push('   5. Reavaliar score mensalmente');

    } else {
      finalInsights.push('❄️ LEAD FRIO. Nurturing de longo prazo.');
      finalInsights.push('');
      finalInsights.push('📆 ESTRATÉGIA DE LONGO PRAZO (90-180 dias):');
      finalInsights.push('   1. Manter em lista de newsletter');
      finalInsights.push('   2. Monitorar mudanças no negócio');
      finalInsights.push('   3. Reavaliar trimestralmente');
      finalInsights.push('   4. Aguardar sinais de intenção de compra');
    }

    // CONTEXTO DE MERCADO
    if (similarCompanies?.statistics) {
      const { percentage_totvs, using_totvs } = similarCompanies.statistics;

      finalInsights.push('');
      finalInsights.push('📊 CONTEXTO DE MERCADO:');

      if (percentage_totvs >= 50) {
        finalInsights.push(`   • ${percentage_totvs.toFixed(0)}% dos concorrentes JÁ USAM TOTVS`);
        finalInsights.push(`   • Empresa está ATRASADA em relação ao mercado`);
        finalInsights.push(`   • ARGUMENTO: "Você está perdendo competitividade"`);
      } else if (percentage_totvs >= 30) {
        finalInsights.push(`   • ${percentage_totvs.toFixed(0)}% do mercado já migrou para TOTVS`);
        finalInsights.push(`   • Janela de oportunidade ABERTA`);
        finalInsights.push(`   • ARGUMENTO: "Seja parte da transformação digital do setor"`);
      } else {
        finalInsights.push(`   • Apenas ${percentage_totvs.toFixed(0)}% do mercado usa TOTVS`);
        finalInsights.push(`   • Oportunidade de ser PIONEIRO`);
        finalInsights.push(`   • ARGUMENTO: "Ganhe vantagem competitiva sendo early adopter"`);
      }

      if (using_totvs > 0) {
        finalInsights.push('');
        finalInsights.push('🎯 PROVA SOCIAL DISPONÍVEL:');
        finalInsights.push(`   • ${using_totvs} concorrentes diretos já são clientes`);
        finalInsights.push(`   • Use como cases de sucesso na apresentação`);
      }
    }

    // CALL-TO-ACTION FINAL
    finalInsights.push('');
    finalInsights.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (opportunityScore >= 60) {
      finalInsights.push('📞 PRÓXIMO PASSO: LIGAR AGORA e agendar reunião');
    } else if (opportunityScore >= 40) {
      finalInsights.push('📧 PRÓXIMO PASSO: Iniciar sequência de nurturing');
    } else {
      finalInsights.push('📊 PRÓXIMO PASSO: Monitorar e reavaliar trimestralmente');
    }

    console.log('[360] Análise concluída:', { opportunityScore, timing });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          opportunity_score: opportunityScore,
          score_breakdown: scoreBreakdown,
          timing,
          recommended_products: recommendedProducts,
          insights: finalInsights,
          generated_at: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[360] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});