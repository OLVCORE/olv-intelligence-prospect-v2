import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import { totvsAnalysisSchema } from '../_shared/validation.ts';
import { createErrorResponse } from '../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validated = totvsAnalysisSchema.parse(body);
    const { companyId } = validated;
    console.log('[TOTVS Fit] Analisando empresa:', companyId);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar dados da empresa
    const { data: company } = await supabase
      .from('companies')
      .select(`
        *,
        digital_maturity (*)
      `)
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    const maturity = company.digital_maturity?.[0];
    const technologies = company.technologies || [];
    const industry = company.industry || 'Não especificado';
    const employees = company.employees || 0;

    // Buscar catálogo real de produtos TOTVS
    const { data: products, error: productsError } = await supabase
      .from('totvs_products')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true });

    if (productsError) {
      console.error('[TOTVS Fit] Erro ao buscar produtos:', productsError);
    }

    // Organizar produtos por categoria
    const productsByCategory = (products || []).reduce((acc: any, product: any) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, any[]>);

    // Preparar lista de produtos para a IA
    const productsDescription = Object.entries(productsByCategory)
      .map(([category, items]) => {
        const productsList = (items as any[]).map(p => {
          let sectors = 'Não especificado';
          try {
            const parsed = JSON.parse(p.target_sectors || '[]');
            sectors = Array.isArray(parsed) && parsed.length > 0 ? parsed.join(', ') : 'Todos';
          } catch {
            sectors = p.target_sectors || 'Todos';
          }
          const priceStr = typeof p.base_price === 'number' ? `R$ ${p.base_price.toLocaleString('pt-BR')}` : 'Preço sob consulta';
          return `- ${p.name} (${p.sku}): ${p.description} | Preço: ${priceStr} | Setores: ${sectors}`;
        }).join('\n');
        return `**${category}:**\n${productsList}`;
      }).join('\n\n');

    // Preparar contexto para IA
    const systemPrompt = `Você é um especialista em análise de fit de produtos TOTVS para empresas brasileiras.

**Catálogo REAL de Produtos TOTVS:**

${productsDescription}

Sua tarefa é analisar as tecnologias atuais, maturidade digital e necessidades da empresa para recomendar os produtos TOTVS mais adequados do catálogo acima.`;

    const userPrompt = `Analise esta empresa e gere recomendações de produtos TOTVS:

**EMPRESA:** ${company.name}
**INDÚSTRIA:** ${industry}
**FUNCIONÁRIOS:** ${employees}
**TECNOLOGIAS ATUAIS:** ${technologies.join(', ') || 'Não detectadas'}

**SCORES DE MATURIDADE DIGITAL:**
- Score Geral: ${maturity?.overall_score || 0}/10
- Infraestrutura: ${maturity?.infrastructure_score || 0}/10
- Sistemas: ${maturity?.systems_score || 0}/10
- Processos: ${maturity?.processes_score || 0}/10
- Segurança: ${maturity?.security_score || 0}/10
- Inovação: ${maturity?.innovation_score || 0}/10

**INSTRUÇÕES:**
1. Analise as tecnologias atuais e identifique gaps e dores específicas
2. Considere o nível de maturidade digital da empresa
3. Recomende 3-5 produtos TOTVS específicos do catálogo
4. Para CADA produto recomendado, forneça:
   - **painPoint**: Qual é a DOR específica do cliente (problema atual, ineficiência, risco)
   - **solution**: Como este produto RESOLVE essa dor (benefício direto)
   - **reason**: Por que este produto é o mais indicado para este perfil
   - **impact**: Resultado mensurável esperado (ex: "Redução de 40% em retrabalho")
   - **implementation**: Prazo e complexidade de implementação
5. Sugira uma estratégia de implementação (curto/médio/longo prazo)
6. Calcule um score de FIT (0-100) baseado na aderência total

**IMPORTANTE:** Seja específico nas dores e soluções. Evite genéricos.

Retorne APENAS um JSON válido com esta estrutura:
{
  "fitScore": 85,
  "recommendations": [
    {
      "product": "TOTVS Protheus",
      "sku": "TOT-PROT-001",
      "category": "BÁSICO",
      "priority": "ALTA",
      "painPoint": "Falta de controle financeiro integrado causa retrabalho manual e erros de conciliação",
      "solution": "ERP unificado que integra financeiro, estoque e vendas em tempo real",
      "reason": "Empresa sem ERP precisa estruturar processos básicos antes de evoluir",
      "impact": "Redução de 40% em retrabalho operacional e 30% menos erros",
      "implementation": "Curto prazo (3-6 meses)"
    }
  ],
  "gaps": ["Falta de ERP integrado", "Processos manuais", "Sem visibilidade financeira"],
  "strategy": {
    "shortTerm": ["Implementar Protheus Core"],
    "mediumTerm": ["Adicionar módulos de BI"],
    "longTerm": ["Evoluir para Carol AI"]
  },
  "tcoBenefit": "Redução estimada de 30% no TCO ao consolidar sistemas",
  "summary": "Empresa com potencial para transformação digital completa"
}`;

    console.log('[TOTVS Fit] Chamando IA...');

    // Chamar OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[TOTVS Fit] Erro AI completo:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        body: errorText
      });
      throw new Error(`Erro ao chamar IA: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    console.log('[TOTVS Fit] Resposta IA recebida');

    // Extrair JSON da resposta
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (e) {
      console.error('[TOTVS Fit] Erro ao parsear JSON:', e);
      console.log('[TOTVS Fit] Resposta completa:', analysisText);
      throw new Error('Erro ao processar análise da IA');
    }

    // Salvar análise no banco
    const { data: savedAnalysis } = await supabase
      .from('governance_signals')
      .insert({
        company_id: companyId,
        signal_type: 'totvs_fit_analysis',
        description: analysis.summary,
        confidence_score: analysis.fitScore,
        source: 'ai_analysis',
        raw_data: analysis
      })
      .select()
      .single();

    console.log('[TOTVS Fit] ✅ Análise concluída');

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        savedId: savedAnalysis?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    // Handle validation errors with details
    if (error instanceof z.ZodError) {
      console.error('[TOTVS Fit] Validation error:', error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use safe error mapping for all other errors
    return createErrorResponse(error, corsHeaders, 500);
  }
});
