import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id, company_name, sector } = await req.json();

    console.log('🔍 [STC Competitors] Iniciando busca para:', company_name);

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    // Lista de ERPs comuns (excluindo TOTVS)
    const commonERPs = [
      'SAP', 'Oracle ERP', 'Microsoft Dynamics', 'Salesforce',
      'Senior Sistemas', 'Linx', 'Omie', 'Bling', 'Sankhya',
      'Protheus', 'RM Totvs', 'Microsiga', 'Sage', 'Infor',
      'NetSuite', 'Epicor', 'IFS', 'QAD', 'Syspro'
    ];

    const competitors: any[] = [];
    const processedCompetitors = new Set<string>();

    // Buscar menções de ERPs junto com a empresa
    const searchQueries = [
      `"${company_name}" ERP sistema gestão`,
      `"${company_name}" software gestão empresarial`,
      `${company_name} migração sistema`,
      `${company_name} implementação ERP`,
    ];

    for (const query of searchQueries) {
      try {
        console.log(`🔍 Buscando: ${query}`);
        
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            num: 10,
            gl: 'br',
            hl: 'pt-br',
          }),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const results = data.organic || [];

        for (const result of results) {
          const fullText = `${result.title} ${result.snippet}`.toLowerCase();
          
          // Double/Triple Match: empresa + ERP + contexto
          const hasCompanyName = fullText.includes(company_name.toLowerCase());
          
          for (const erp of commonERPs) {
            const erpLower = erp.toLowerCase();
            const hasERP = fullText.includes(erpLower);
            
            // Contextos que indicam uso/competição
            const contexts = [
              /utiliza|usa|adotou|implementou|migrou/i,
              /sistema|software|plataforma|solução/i,
              /gestão|erp|integração/i,
            ];
            
            let matchCount = 0;
            if (hasCompanyName) matchCount++;
            if (hasERP) matchCount++;
            
            for (const context of contexts) {
              if (context.test(fullText)) matchCount++;
            }

            // Double Match (2+) ou Triple Match (3+)
            if (matchCount >= 2 && hasCompanyName && hasERP) {
              const competitorKey = erp.toLowerCase();
              
              if (!processedCompetitors.has(competitorKey)) {
                processedCompetitors.add(competitorKey);
                
                const isTripleMatch = matchCount >= 3;
                const confidence = isTripleMatch ? 0.85 : 0.65;
                
                competitors.push({
                  name: erp,
                  match_type: isTripleMatch ? 'triple_match' : 'double_match',
                  confidence,
                  evidence: result.snippet,
                  source_url: result.link,
                  source_title: result.title,
                  detected_at: new Date().toISOString(),
                });
                
                console.log(`✅ ${isTripleMatch ? 'TRIPLE' : 'DOUBLE'} MATCH: ${erp} (${confidence})`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Erro na query "${query}":`, error);
      }
    }

    // Ordenar por confidence
    competitors.sort((a, b) => b.confidence - a.confidence);

    // Salvar no banco
    if (competitors.length > 0) {
      const { error: insertError } = await supabase
        .from('competitor_stc_matches')
        .insert(
          competitors.map(c => ({
            company_id,
            competitor_name: c.name,
            match_type: c.match_type,
            confidence: c.confidence,
            evidence: c.evidence,
            source_url: c.source_url,
            source_title: c.source_title,
          }))
        );

      if (insertError) {
        console.error('❌ Erro ao salvar competitors:', insertError);
      }
    }

    console.log(`✅ [STC Competitors] ${competitors.length} concorrentes encontrados`);

    return new Response(
      JSON.stringify({
        success: true,
        competitors,
        total_found: competitors.length,
        company_name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ [STC Competitors] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
