import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CopilotContext {
  userId: string;
  currentPage?: string;
  activeDeal?: {
    id: string;
    stage: string;
    value: number;
    probability: number;
    daysInStage: number;
    company: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { context } = await req.json() as { context: CopilotContext };
    
    console.log('[AI Copilot] Gerando sugestões para contexto:', context);

    const suggestions = [];

    // 1. ANALISAR DEALS ESTAGNADOS
    const { data: staleDeals } = await supabase
      .from('sdr_deals')
      .select('*, companies(*)')
      .eq('status', 'open')
      .lt('last_activity_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (staleDeals && staleDeals.length > 0) {
      for (const deal of staleDeals.slice(0, 3)) {
        const daysStale = Math.floor((Date.now() - new Date(deal.last_activity_at).getTime()) / (24 * 60 * 60 * 1000));
        
        suggestions.push({
          id: `stale-deal-${deal.id}`,
          type: 'alert',
          priority: daysStale > 14 ? 'urgent' : 'high',
          title: `Deal parado há ${daysStale} dias`,
          description: `${deal.title} não tem atividade há ${daysStale} dias. Risco de perder oportunidade.`,
          action: {
            label: 'Agendar Follow-up',
            type: 'create_task',
            payload: {
              dealId: deal.id,
              taskType: 'follow_up'
            }
          },
          metadata: {
            dealId: deal.id,
            companyId: deal.company_id,
            reason: 'no_recent_activity',
            confidence: 0.95
          },
          createdAt: new Date()
        });
      }
    }

    // 2. DEALS PRÓXIMOS DO FECHAMENTO
    const { data: closingDeals } = await supabase
      .from('sdr_deals')
      .select('*, companies(*)')
      .eq('status', 'open')
      .gte('probability', 70)
      .is('proposal_id', null);

    if (closingDeals && closingDeals.length > 0) {
      for (const deal of closingDeals.slice(0, 2)) {
        suggestions.push({
          id: `create-proposal-${deal.id}`,
          type: 'opportunity',
          priority: 'high',
          title: `${deal.title} pronto para proposta`,
          description: `Probabilidade de ${deal.probability}% mas ainda sem proposta. Hora de enviar!`,
          action: {
            label: 'Criar Proposta',
            type: 'create_proposal',
            payload: {
              dealId: deal.id,
              companyId: deal.company_id
            }
          },
          metadata: {
            dealId: deal.id,
            companyId: deal.company_id,
            reason: 'high_probability_no_proposal',
            confidence: 0.88
          },
          createdAt: new Date()
        });
      }
    }

    // 3. DEALS SEM DECISOR IDENTIFICADO
    const { data: dealsWithoutDecisor } = await supabase
      .from('sdr_deals')
      .select(`
        *,
        companies!inner(
          id,
          name,
          decision_makers(id)
        )
      `)
      .eq('status', 'open')
      .in('stage', ['discovery', 'qualification']);

    if (dealsWithoutDecisor) {
      for (const deal of dealsWithoutDecisor.filter(d => !d.companies?.decision_makers?.length).slice(0, 2)) {
        suggestions.push({
          id: `find-decisor-${deal.id}`,
          type: 'action',
          priority: 'medium',
          title: 'Identificar decisor',
          description: `${deal.title} ainda não tem decisor mapeado. Crucial para avançar.`,
          action: {
            label: 'Buscar Decisores',
            type: 'navigate',
            payload: {
              url: `/companies/${deal.company_id}`
            }
          },
          metadata: {
            dealId: deal.id,
            companyId: deal.company_id,
            reason: 'no_decision_maker',
            confidence: 0.92
          },
          createdAt: new Date()
        });
      }
    }

    // 4. EMPRESAS ENRIQUECIDAS RECENTEMENTE (sem deal)
    const { data: enrichedCompanies } = await supabase
      .from('companies')
      .select(`
        *,
        sdr_deals!left(id)
      `)
      .not('digital_maturity_score', 'is', null)
      .gte('updated_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .is('sdr_deals.id', null)
      .limit(3);

    if (enrichedCompanies && enrichedCompanies.length > 0) {
      for (const company of enrichedCompanies) {
        suggestions.push({
          id: `new-opportunity-${company.id}`,
          type: 'opportunity',
          priority: company.digital_maturity_score > 70 ? 'high' : 'medium',
          title: `Nova oportunidade: ${company.name}`,
          description: `Empresa enriquecida com score ${company.digital_maturity_score}/100. Potencial cliente!`,
          action: {
            label: 'Criar Deal',
            type: 'navigate',
            payload: {
              url: `/sdr/workspace?create_deal=${company.id}`
            }
          },
          metadata: {
            companyId: company.id,
            reason: 'recently_enriched',
            confidence: company.digital_maturity_score / 100
          },
          createdAt: new Date()
        });
      }
    }

    // 5. ANÁLISE CONTEXTUAL DO DEAL ATIVO
    if (context.activeDeal) {
      const deal = context.activeDeal;
      
      // Deal está muito tempo no mesmo estágio
      if (deal.daysInStage > 30) {
        suggestions.push({
          id: `stuck-stage-${deal.id}`,
          type: 'warning',
          priority: 'high',
          title: 'Deal travado no estágio',
          description: `${deal.daysInStage} dias em "${deal.stage}". Considere revisão ou mudança de abordagem.`,
          action: {
            label: 'Analisar Deal',
            type: 'navigate',
            payload: {
              url: `/sdr/workspace?deal=${deal.id}`
            }
          },
          metadata: {
            dealId: deal.id,
            reason: 'too_long_in_stage',
            confidence: 0.85
          },
          createdAt: new Date()
        });
      }

      // Probabilidade baixa mas em estágio avançado
      if (deal.probability < 40 && ['negotiation', 'proposal'].includes(deal.stage)) {
        suggestions.push({
          id: `low-prob-advanced-${deal.id}`,
          type: 'warning',
          priority: 'high',
          title: 'Probabilidade baixa em estágio avançado',
          description: `${deal.probability}% em "${deal.stage}". Identifique objeções ou reavalie qualificação.`,
          action: {
            label: 'Revisar Qualificação',
            type: 'navigate',
            payload: {
              url: `/sdr/workspace?deal=${deal.id}`
            }
          },
          metadata: {
            dealId: deal.id,
            reason: 'low_probability_advanced_stage',
            confidence: 0.78
          },
          createdAt: new Date()
        });
      }
    }

    // 6. INSIGHTS BASEADOS EM IA (Lovable AI)
    if (suggestions.length < 5) {
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        
        if (LOVABLE_API_KEY) {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'Você é um assistente de vendas especializado em CRM. Analise o contexto e sugira 1-2 ações estratégicas específicas e acionáveis.'
                },
                {
                  role: 'user',
                  content: `Contexto do vendedor:
- Página atual: ${context.currentPage || 'dashboard'}
- Deals estagnados: ${staleDeals?.length || 0}
- Deals sem proposta: ${closingDeals?.length || 0}
- Deal ativo: ${context.activeDeal ? JSON.stringify(context.activeDeal) : 'nenhum'}

Sugira 1-2 ações estratégicas que o vendedor deve tomar AGORA.`
                }
              ],
              max_tokens: 500
            })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiInsight = aiData.choices[0]?.message?.content;

            if (aiInsight) {
              suggestions.push({
                id: `ai-insight-${Date.now()}`,
                type: 'insight',
                priority: 'medium',
                title: '💡 Insight da IA',
                description: aiInsight,
                metadata: {
                  reason: 'ai_generated',
                  confidence: 0.75
                },
                createdAt: new Date()
              });
            }
          }
        }
      } catch (aiError) {
        console.error('[AI Copilot] Erro ao gerar insight IA:', aiError);
      }
    }

    // Ordenar por prioridade
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

    console.log(`[AI Copilot] ${suggestions.length} sugestões geradas`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Copilot] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
