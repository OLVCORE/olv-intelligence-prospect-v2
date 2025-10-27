import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de concorrentes SMB/PME conhecidos
const SMB_COMPETITORS = [
  'Bling', 'Conta Azul', 'Omie', 'Tiny', 'vhsys', 
  'Senior Sistemas', 'Sankhya', 'eGestor', 'Jiva ERP',
  'Procfy', 'Keruak', 'Mastermaq', 'WebMais', 'Mysoft',
  'Wolken Sistemas', 'RD Station', 'HubSpot', 'Zoho CRM'
];

// Portais de comparação de tecnologia
const COMPARISON_PORTALS = [
  'g2.com',
  'capterra.com.br',
  'capterra.com',
  'softwareadvice.com',
  'getapp.com',
  'trustradius.com',
  'crozdesk.com',
  'b2bstack.com.br'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, company_name, sector, employees } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!serperApiKey) {
      console.warn('[Competitor Search] SERPER_API_KEY not configured, using default list');
    }

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Competitor Search] Searching for company: ${company_name}, sector: ${sector}`);

    let detectedCompetitors: Array<{
      name: string;
      type: 'erp' | 'crm' | 'financial' | 'ecommerce';
      confidence: number;
      source: string;
      priceRange?: string;
      targetMarket?: string;
    }> = [];

    // 1. Busca em portais de comparação usando Serper
    if (serperApiKey) {
      const searchQueries = [
        `TOTVS alternativas PME Brasil site:${COMPARISON_PORTALS.join(' OR site:')}`,
        `ERP para pequenas empresas Brasil comparação`,
        `${sector} ERP software comparação`,
        `sistemas gestão empresarial PME Brasil`
      ];

      for (const query of searchQueries) {
        try {
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              q: query,
              num: 10,
              gl: 'br',
              hl: 'pt-br'
            })
          });

          if (response.ok) {
            const data = await response.json();
            const results = data.organic || [];
            
            // Extrair menções de concorrentes
            for (const result of results) {
              const snippet = result.snippet?.toLowerCase() || '';
              const title = result.title?.toLowerCase() || '';
              const text = `${title} ${snippet}`;

              for (const competitor of SMB_COMPETITORS) {
                if (text.includes(competitor.toLowerCase())) {
                  const existing = detectedCompetitors.find(c => c.name === competitor);
                  if (!existing) {
                    detectedCompetitors.push({
                      name: competitor,
                      type: detectCompetitorType(competitor),
                      confidence: 75,
                      source: result.link,
                      targetMarket: 'PME'
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`[Competitor Search] Error searching: ${query}`, error);
        }
      }
    }

    // 2. Se não encontrou via busca, usar lista padrão baseada no perfil
    if (detectedCompetitors.length === 0) {
      console.log('[Competitor Search] No web results, using default SMB competitors');
      
      // Selecionar concorrentes com base no perfil da empresa
      const employeeCount = employees || 0;
      
      if (employeeCount < 50) {
        // Micro/pequenas empresas
        detectedCompetitors = [
          { name: 'Bling', type: 'ecommerce', confidence: 80, source: 'default', priceRange: 'R$ 59-299/mês', targetMarket: 'Micro/Pequena' },
          { name: 'Conta Azul', type: 'financial', confidence: 85, source: 'default', priceRange: 'R$ 90-300/mês', targetMarket: 'Micro/Pequena' },
          { name: 'Omie', type: 'erp', confidence: 90, source: 'default', priceRange: 'R$ 149-899/mês', targetMarket: 'Pequena/Média' },
          { name: 'Tiny', type: 'ecommerce', confidence: 75, source: 'default', priceRange: 'R$ 69-399/mês', targetMarket: 'Micro/Pequena' }
        ];
      } else if (employeeCount < 200) {
        // Médias empresas
        detectedCompetitors = [
          { name: 'Omie', type: 'erp', confidence: 90, source: 'default', priceRange: 'R$ 149-899/mês', targetMarket: 'Pequena/Média' },
          { name: 'Senior Sistemas', type: 'erp', confidence: 85, source: 'default', priceRange: 'Sob consulta', targetMarket: 'Média/Grande' },
          { name: 'Sankhya', type: 'erp', confidence: 80, source: 'default', priceRange: 'Sob consulta', targetMarket: 'Média' },
          { name: 'vhsys', type: 'erp', confidence: 75, source: 'default', priceRange: 'R$ 89-599/mês', targetMarket: 'Pequena/Média' }
        ];
      } else {
        // Empresas maiores
        detectedCompetitors = [
          { name: 'Senior Sistemas', type: 'erp', confidence: 90, source: 'default', priceRange: 'Sob consulta', targetMarket: 'Média/Grande' },
          { name: 'Sankhya', type: 'erp', confidence: 85, source: 'default', priceRange: 'Sob consulta', targetMarket: 'Média' },
          { name: 'SAP Business One', type: 'erp', confidence: 70, source: 'default', priceRange: 'Premium', targetMarket: 'Média/Grande' }
        ];
      }
    }

    // 3. Usar IA para ranquear e analisar concorrentes
    const aiPrompt = `Analise os concorrentes detectados para esta empresa e ranqueie por relevância:

EMPRESA:
- Nome: ${company_name}
- Setor: ${sector || 'Não especificado'}
- Funcionários: ${employees || 'Não informado'}

CONCORRENTES DETECTADOS:
${detectedCompetitors.map((c, i) => `${i + 1}. ${c.name} (${c.type}) - Confiança: ${c.confidence}% - Mercado: ${c.targetMarket || 'N/A'}`).join('\n')}

Retorne JSON com os TOP 5 concorrentes mais relevantes ordenados por probabilidade de uso:
{
  "top_competitors": [
    {
      "name": "Nome",
      "type": "erp|crm|financial|ecommerce",
      "relevance_score": 0-100,
      "reasoning": "Por que este é o concorrente mais provável",
      "key_differentiators": ["Diferencial 1", "Diferencial 2"],
      "typical_objections": ["Objeção comum 1", "Objeção 2"]
    }
  ]
}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um especialista em análise competitiva de ERPs no mercado SMB brasileiro.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    let rankedCompetitors = detectedCompetitors.slice(0, 5);

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const aiContent = aiData.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(aiContent);
        rankedCompetitors = parsed.top_competitors || rankedCompetitors;
      } catch (e) {
        console.error('[Competitor Search] Failed to parse AI response:', e);
      }
    }

    console.log(`[Competitor Search] Found ${rankedCompetitors.length} competitors for ${company_name}`);

    return new Response(
      JSON.stringify({
        company_id,
        company_name,
        competitors: rankedCompetitors,
        search_date: new Date().toISOString(),
        sources_checked: COMPARISON_PORTALS.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Competitor Search] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function detectCompetitorType(name: string): 'erp' | 'crm' | 'financial' | 'ecommerce' {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('bling') || lowerName.includes('tiny')) return 'ecommerce';
  if (lowerName.includes('conta azul') || lowerName.includes('procfy')) return 'financial';
  if (lowerName.includes('rd station') || lowerName.includes('hubspot') || lowerName.includes('zoho')) return 'crm';
  
  return 'erp';
}
