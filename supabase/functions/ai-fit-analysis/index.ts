// ✅ Edge Function para análise de FIT TOTVS com OpenAI
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOTVS_PRODUCTS = [
  { name: 'TOTVS Protheus', category: 'BÁSICO', description: 'ERP completo para estruturar processos básicos' },
  { name: 'Fluig', category: 'BÁSICO', description: 'Plataforma de gestão de processos e documentos' },
  { name: 'TOTVS Backoffice', category: 'BÁSICO', description: 'Gestão administrativa simplificada' },
  { name: 'TOTVS BI', category: 'INTERMEDIÁRIO', description: 'Business Intelligence e Analytics' },
  { name: 'TOTVS RH', category: 'INTERMEDIÁRIO', description: 'Gestão completa de recursos humanos' },
  { name: 'TOTVS Procurement', category: 'INTERMEDIÁRIO', description: 'Gestão de compras e suprimentos' },
  { name: 'TOTVS Manufatura', category: 'INTERMEDIÁRIO', description: 'Gestão industrial e produção' },
  { name: 'Carol AI', category: 'AVANÇADO', description: 'Plataforma de Inteligência Artificial' },
  { name: 'TOTVS Advanced Analytics', category: 'AVANÇADO', description: 'Analytics preditiva e prescritiva' },
  { name: 'TOTVS Data Platform', category: 'AVANÇADO', description: 'Plataforma de dados unificada' },
  { name: 'TOTVS Techfin', category: 'ESPECIALIZADO', description: 'Soluções financeiras' },
  { name: 'TOTVS Varejo', category: 'ESPECIALIZADO', description: 'Gestão para varejo' },
  { name: 'TOTVS Agro', category: 'ESPECIALIZADO', description: 'Gestão para agronegócio' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, industry, employees, technologies, maturityScores } = await req.json();

    if (!companyName || !maturityScores) {
      return new Response(
        JSON.stringify({ error: 'companyName e maturityScores são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('AI_FIT_ANALYSIS', 'Analyzing fit', { companyName });

    const systemPrompt = `Você é um especialista em análise de fit de produtos TOTVS para empresas brasileiras.

**Produtos TOTVS disponíveis:**

${TOTVS_PRODUCTS.map(p => `- ${p.name} (${p.category}): ${p.description}`).join('\n')}

Sua tarefa é analisar as tecnologias atuais, maturidade digital e necessidades da empresa para recomendar os produtos TOTVS mais adequados.`;

    const userPrompt = `Analise esta empresa e gere recomendações de produtos TOTVS:

**EMPRESA:** ${companyName}
**INDÚSTRIA:** ${industry || 'Não especificada'}
**FUNCIONÁRIOS:** ${employees || 'Não especificado'}
**TECNOLOGIAS ATUAIS:** ${technologies?.join(', ') || 'Não detectadas'}

**SCORES DE MATURIDADE DIGITAL:**
- Score Geral: ${maturityScores.overall}/10
- Infraestrutura: ${maturityScores.infrastructure}/10
- Sistemas: ${maturityScores.systems}/10
- Processos: ${maturityScores.processes}/10
- Segurança: ${maturityScores.security}/10
- Inovação: ${maturityScores.innovation}/10

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
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI_FIT_ANALYSIS', 'OpenAI error', { status: response.status, error: errorText });
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI');
    }

    const analysis = JSON.parse(analysisText);
    console.log('AI_FIT_ANALYSIS', 'Analysis completed', { fitScore: analysis.fitScore });

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI_FIT_ANALYSIS', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        analysis: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
