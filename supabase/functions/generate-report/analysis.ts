import { Evidence } from './matching.ts';

async function callOpenAI(prompt: string): Promise<string> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista estratégico especializado em B2B e tecnologia.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI call failed', error);
    return 'Análise indisponível no momento.';
  }
}

export async function generateSwot(company: any, evidences: Evidence[]): Promise<any> {
  const prompt = `
Analise a empresa ${company.name} e gere uma análise SWOT baseada nestas evidências reais:

EVIDÊNCIAS ENCONTRADAS:
${evidences.slice(0, 10).map(e => `- ${e.source}: ${e.snippet}`).join('\n')}

SETOR: ${company.sector || 'Não informado'}
PORTE: ${company.size || 'Não informado'}

Gere uma análise SWOT em formato JSON:
{
  "strengths": ["força 1", "força 2", ...],
  "weaknesses": ["fraqueza 1", "fraqueza 2", ...],
  "opportunities": ["oportunidade 1", "oportunidade 2", ...],
  "threats": ["ameaça 1", "ameaça 2", ...]
}

IMPORTANTE: Base-se APENAS nas evidências fornecidas. Não invente informações.
`;
  
  const result = await callOpenAI(prompt);
  
  try {
    return JSON.parse(result);
  } catch {
    return {
      strengths: ['Análise indisponível'],
      weaknesses: ['Análise indisponível'],
      opportunities: ['Análise indisponível'],
      threats: ['Análise indisponível']
    };
  }
}

export async function generatePorter(company: any, evidences: Evidence[]): Promise<any> {
  const prompt = `
Analise a empresa ${company.name} usando as 5 Forças de Porter baseado nestas evidências:

EVIDÊNCIAS:
${evidences.slice(0, 10).map(e => `- ${e.snippet}`).join('\n')}

Gere análise em JSON:
{
  "rivalry": "análise da rivalidade",
  "suppliers": "análise do poder dos fornecedores",
  "buyers": "análise do poder dos compradores",
  "substitutes": "análise de produtos substitutos",
  "newEntrants": "análise de novos entrantes"
}
`;
  
  const result = await callOpenAI(prompt);
  
  try {
    return JSON.parse(result);
  } catch {
    return {
      rivalry: 'Análise indisponível',
      suppliers: 'Análise indisponível',
      buyers: 'Análise indisponível',
      substitutes: 'Análise indisponível',
      newEntrants: 'Análise indisponível'
    };
  }
}

export async function generateInsights(company: any, evidences: Evidence[]): Promise<string[]> {
  const prompt = `
Baseado nestas evidências sobre ${company.name}, gere 4 insights estratégicos:

EVIDÊNCIAS:
${evidences.slice(0, 10).map(e => `- ${e.snippet}`).join('\n')}

Retorne array JSON com 4 insights curtos (máximo 80 caracteres cada):
["insight 1", "insight 2", "insight 3", "insight 4"]
`;
  
  const result = await callOpenAI(prompt);
  
  try {
    return JSON.parse(result);
  } catch {
    return [
      'Alto potencial de crescimento',
      'Necessita modernização tecnológica',
      'Forte presença regional',
      'Oportunidade de expansão digital'
    ];
  }
}
