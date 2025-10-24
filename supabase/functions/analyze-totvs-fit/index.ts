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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
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

    // Preparar contexto para IA
    const systemPrompt = `Você é um especialista em análise de fit de produtos TOTVS para empresas brasileiras.

**Produtos TOTVS disponíveis:**

**BÁSICO (Empresas com baixa maturidade):**
- TOTVS Protheus: ERP completo, ideal para estruturar processos básicos
- Fluig: Plataforma de gestão de processos e documentos
- TOTVS Backoffice: Gestão administrativa simplificada

**INTERMEDIÁRIO (Empresas em crescimento):**
- TOTVS BI: Business Intelligence e Analytics
- TOTVS RH: Gestão completa de recursos humanos
- TOTVS Procurement: Gestão de compras e suprimentos
- TOTVS Manufatura: Gestão industrial e produção

**AVANÇADO (Empresas maduras digitalmente):**
- Carol AI: Plataforma de Inteligência Artificial
- TOTVS Advanced Analytics: Analytics preditiva e prescritiva
- TOTVS Data Platform: Plataforma de dados unificada

**ESPECIALIZADOS:**
- TOTVS Techfin: Soluções financeiras
- TOTVS Varejo: Gestão para varejo
- TOTVS Agro: Gestão para agronegócio

Sua tarefa é analisar as tecnologias atuais, maturidade digital e necessidades da empresa para recomendar os produtos TOTVS mais adequados.`;

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
1. Analise as tecnologias atuais e identifique gaps
2. Considere o nível de maturidade digital
3. Recomende 3-5 produtos TOTVS específicos
4. Para cada produto, explique:
   - Por que é indicado
   - Que problema resolve
   - Impacto esperado
5. Sugira uma estratégia de implementação (curto/médio/longo prazo)
6. Calcule um score de FIT (0-100) baseado na aderência total

Retorne APENAS um JSON válido com esta estrutura:
{
  "fitScore": 85,
  "recommendations": [
    {
      "product": "TOTVS Protheus",
      "category": "BÁSICO",
      "priority": "ALTA",
      "reason": "Empresa precisa estruturar processos básicos de ERP",
      "impact": "Redução de 40% em retrabalho operacional",
      "implementation": "Curto prazo (3-6 meses)"
    }
  ],
  "gaps": ["Falta de ERP integrado", "Processos manuais"],
  "strategy": {
    "shortTerm": ["Implementar Protheus Core"],
    "mediumTerm": ["Adicionar módulos de BI"],
    "longTerm": ["Evoluir para Carol AI"]
  },
  "tcoBenefit": "Redução estimada de 30% no TCO ao consolidar sistemas",
  "summary": "Empresa com potencial para transformação digital completa"
}`;

    console.log('[TOTVS Fit] Chamando IA...');

    // Chamar Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[TOTVS Fit] Erro AI:', errorText);
      throw new Error(`Erro ao chamar IA: ${aiResponse.status}`);
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
