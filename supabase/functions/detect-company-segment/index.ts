import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, website, description, activities } = await req.json();
    
    console.log('[Segment Detection] Analisando:', companyName);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Construir contexto para análise
    const context = `
Empresa: ${companyName}
Website: ${website || 'Não informado'}
Descrição: ${description || 'Não informada'}
Atividades: ${activities ? JSON.stringify(activities) : 'Não informadas'}
    `.trim();

    // Chamar OpenAI para análise inteligente
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em classificação de empresas e mercados B2B no Brasil.
Analise os dados fornecidos e identifique:
1. Setor principal (ex: Tecnologia, Varejo, Indústria, Serviços, etc.)
2. Subsetor específico (ex: SaaS, E-commerce, Manufatura, Consultoria, etc.)
3. Segmento de mercado (ex: SMB, Mid-Market, Enterprise)
4. Vertical de atuação (ex: Saúde, Educação, Financeiro, etc.)
5. Palavras-chave relevantes para vendas

Retorne APENAS um JSON válido no formato:
{
  "setor": "string",
  "subsetor": "string",
  "segmento": "string",
  "vertical": "string",
  "keywords": ["string"],
  "confianca": number (0-100)
}

Seja preciso e baseie-se em evidências reais dos dados fornecidos.`
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Segment Detection] Erro na API:', response.status, errorText);
      throw new Error(`Erro ao chamar OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    console.log('[Segment Detection] Resposta da IA:', content);

    // Parse do JSON retornado
    let result;
    try {
      // Extrair JSON se vier com markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[Segment Detection] Erro ao fazer parse do JSON:', parseError);
      // Fallback com análise básica
      result = {
        setor: 'Não identificado',
        subsetor: 'Requer análise manual',
        segmento: 'SMB',
        vertical: 'Geral',
        keywords: [companyName],
        confianca: 30
      };
    }

    console.log('[Segment Detection] ✅ Análise concluída:', result);

    return new Response(
      JSON.stringify({ 
        success: true,
        ...result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Segment Detection] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
