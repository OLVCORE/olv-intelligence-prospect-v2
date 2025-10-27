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

    // 4. 🎯 BUSCAR CONCORRENTES REAIS DOS 41 PORTAIS
    console.log('[Battle Card] Buscando concorrentes reais nos portais...');
    let competitorSearchData = null;
    
    try {
      const searchResponse = await supabase.functions.invoke('search-competitors', {
        body: {
          company_name: company.name,
          sector: company.sector || company.vertical,
          productCategory: company.sector || 'ERP',
          keywords: 'PME SMB Brasil ERP',
          totvs_product: currentErp || 'TOTVS'
        }
      });
      
      if (searchResponse.data && searchResponse.data.success) {
        competitorSearchData = searchResponse.data;
        console.log('[Battle Card] ✅ Encontrados', competitorSearchData.competitors?.length || 0, 'concorrentes reais');
      }
    } catch (searchError) {
      console.warn('[Battle Card] ⚠️ Erro ao buscar concorrentes:', searchError);
    }

    // 5. Montar contexto completo COM DADOS REAIS DE CONCORRENTES
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

    // 5. Gerar Battle Card com IA usando Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Você é um especialista em análise competitiva de ERPs no mercado brasileiro para PMEs.

🎯 **CONCORRENTES REAIS DETECTADOS EM 41 PORTAIS DE COMPARAÇÃO:**

${competitorSearchData && competitorSearchData.competitors?.length > 0 ? `
✅ **BUSCA REALIZADA EM ${competitorSearchData.total_portals || 41} PORTAIS**
- Portais pesquisados: ${competitorSearchData.portals_searched || 0}/${competitorSearchData.total_portals || 41}
- Total de comparações encontradas: ${competitorSearchData.total_comparisons_found || 0}
- Produto pesquisado: ${competitorSearchData.product_searched || 'ERP'}

**TOP ${competitorSearchData.competitors.length} CONCORRENTES REAIS ENCONTRADOS:**

${competitorSearchData.competitors.slice(0, 10).map((comp: any, idx: number) => `
${idx + 1}. **${comp.name}**
   - Menções em portais: ${comp.mentions}
   - Portais onde aparece: ${comp.portals?.join(', ') || 'N/A'}
   - Score de relevância: ${comp.relevance_score}
   - Links de comparação: ${comp.comparison_links?.length || 0} encontrados
   ${comp.comparison_links?.slice(0, 3).map((link: any) => `
     • ${link.portal}: "${link.title}"
       Snippet: "${link.snippet?.substring(0, 100)}..."
       URL: ${link.url}
   `).join('') || ''}
`).join('\n')}

🔥 **INSIGHTS DOS PORTAIS:**
Use esses dados REAIS dos portais (G2, Capterra, Gartner, B2B Stack, etc.) para:
1. Identificar o concorrente MAIS PROVÁVEL que esta empresa usa
2. Criar objeções baseadas nas comparações REAIS encontradas
3. Usar os snippets dos portais como proof points
4. Focar nos concorrentes com MAIS menções e MAIOR relevância
` : `
⚠️ **BUSCA EM PORTAIS NÃO REALIZADA - USANDO LISTA PADRÃO:**

CONCORRENTES CONHECIDOS DE TOTVS PARA PMEs:
- **Bling**: Forte em e-commerce, marketplaces
- **Conta Azul**: Financeiro para micro/pequenas
- **Omie**: ERP completo para PMEs, preço competitivo
- **Tiny**: E-commerce, integrações populares
- **vhsys**: ERP completo PME, diversas áreas
- **Senior Sistemas**: Consolidado, PMEs e grandes
- **Sankhya**: Médias empresas, bem posicionado
- **eGestor**: 100% online, PMEs
`}

IMPORTANTE - REGRAS DE DETECÇÃO:
- Se TOTVS Score < 30 E empresa pequena (< 50 func): Provavelmente usa Bling, Conta Azul, Omie ou Planilhas
- Se TOTVS Score 30-70 E média empresa (50-200 func): Pode usar Senior, Sankhya, vhsys, Omie
- Se TOTVS Score > 70: Já é cliente TOTVS → upsell/cross-sell
- PRIORIZE concorrentes que apareceram na busca real dos portais!

Estruture o Battle Card em JSON com:
{
  "competitor_name": "Nome do concorrente SMB detectado (Bling, Omie, Conta Azul, etc)",
  "competitor_type": "erp" | "legacy" | "spreadsheet" | "other",
  "detection_confidence": 0-100,
  "win_strategy": "Estratégia específica para vencer este concorrente SMB",
  "objection_handling": [
    {
      "objection": "Objeção comum (ex: preço, integração, suporte)",
      "response": "Resposta focada em ROI e valor para PME"
    }
  ],
  "proof_points": [
    {
      "title": "Caso de sucesso PME similar",
      "type": "case_study" | "metric" | "testimonial",
      "result": "Resultado quantificável",
      "relevance": "Relevância para esta empresa PME"
    }
  ],
  "totvs_advantages": [
    "Vantagens TOTVS vs concorrente SMB específico",
    "Escala, suporte nacional, integrações",
    "TCO e ROI para PMEs"
  ],
  "next_steps": [
    "Ação concreta para PME",
    "Demo focada no concorrente"
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

    console.log('[Battle Card] Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Battle Card] Lovable AI error:', error);
      throw new Error(`Lovable AI error: ${response.status}`);
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