import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  metadata?: any;
  score?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchTerm = `%${query}%`;
    const results: SearchResult[] = [];

    // 1. Buscar em Companies (campos principais)
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, cnpj, industry, revenue, digital_maturity_score')
      .or(`name.ilike.${searchTerm},cnpj.ilike.${searchTerm},industry.ilike.${searchTerm}`)
      .limit(10);

    if (companies) {
      companies.forEach(company => {
        results.push({
          id: company.id,
          type: 'empresa',
          title: company.name,
          subtitle: `${company.industry || 'Indústria não definida'} • Score: ${company.digital_maturity_score || 'N/A'}`,
          url: `/companies/${company.id}`,
          metadata: { cnpj: company.cnpj, revenue: company.revenue },
          score: company.digital_maturity_score
        });
      });
    }

    // 1b. Buscar em raw_data (sócios, atividades, dados da Receita Federal)
    if (results.length < 10) {
      const { data: companiesRawData } = await supabase
        .from('companies')
        .select('id, name, cnpj, industry, raw_data')
        .not('raw_data', 'is', null)
        .limit(50); // Buscar em mais empresas mas filtrar no backend

      if (companiesRawData) {
        const queryLower = query.toLowerCase();
        
        companiesRawData.forEach(company => {
          const rawDataString = JSON.stringify(company.raw_data).toLowerCase();
          
          if (rawDataString.includes(queryLower)) {
            // Tentar identificar o contexto da busca
            let context = 'Dados da Receita Federal';
            const rawData = company.raw_data as any;
            
            // Buscar em sócios
            if (rawData?.qsa) {
              const socio = rawData.qsa.find((s: any) => 
                JSON.stringify(s).toLowerCase().includes(queryLower)
              );
              if (socio) {
                context = `Sócio: ${socio.nome || 'Nome não especificado'}`;
              }
            }
            
            // Buscar em atividades
            if (rawData?.atividade_principal || rawData?.atividades_secundarias) {
              const atividadePrincipal = JSON.stringify(rawData.atividade_principal || '').toLowerCase();
              if (atividadePrincipal.includes(queryLower)) {
                context = `Atividade: ${rawData.atividade_principal?.[0]?.text || 'Não especificada'}`;
              }
            }
            
            results.push({
              id: company.id,
              type: 'empresa',
              title: company.name,
              subtitle: `${context} • ${company.industry || 'Indústria não definida'}`,
              url: `/companies/${company.id}`,
              metadata: { cnpj: company.cnpj, source: 'raw_data' }
            });
          }
        });
      }
    }

    // 2. Buscar em Canvas
    if (results.length < 10) {
      const { data: canvas } = await supabase
        .from('canvas')
        .select('id, title, purpose, status, created_at')
        .or(`title.ilike.${searchTerm},purpose.ilike.${searchTerm}`)
        .limit(10 - results.length);

      if (canvas) {
        canvas.forEach(item => {
          results.push({
            id: item.id,
            type: 'canvas',
            title: item.title,
            subtitle: `${item.purpose || 'War Room'} • ${item.status}`,
            url: `/canvas/${item.id}`,
            metadata: { created_at: item.created_at }
          });
        });
      }
    }

    // 3. Buscar em Decision Makers
    if (results.length < 10) {
      const { data: decisors } = await supabase
        .from('decision_makers')
        .select('id, name, title, email, company_id, companies(name)')
        .or(`name.ilike.${searchTerm},title.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(10 - results.length);

      if (decisors) {
        decisors.forEach(decisor => {
          results.push({
            id: decisor.id,
            type: 'decisor',
            title: decisor.name,
            subtitle: `${decisor.title} • ${(decisor as any).companies?.name || 'Empresa não vinculada'}`,
            url: `/intelligence?decisor=${decisor.id}`,
            metadata: { email: decisor.email }
          });
        });
      }
    }

    // 4. Buscar em Insights
    if (results.length < 10) {
      const { data: insights } = await supabase
        .from('insights')
        .select('id, title, description, insight_type, priority, company_id, companies(name)')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(10 - results.length);

      if (insights) {
        insights.forEach(insight => {
          results.push({
            id: insight.id,
            type: 'insight',
            title: insight.title,
            subtitle: `${insight.insight_type} • ${(insight as any).companies?.name || 'Geral'}`,
            url: `/intelligence-360?insight=${insight.id}`,
            metadata: { priority: insight.priority }
          });
        });
      }
    }

    // 5. Buscar em Buying Signals
    if (results.length < 10) {
      const { data: signals } = await supabase
        .from('buying_signals')
        .select('id, signal_type, description, confidence_score, company_id, companies(name)')
        .or(`signal_type.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(10 - results.length);

      if (signals) {
        signals.forEach(signal => {
          results.push({
            id: signal.id,
            type: 'sinal',
            title: `Sinal: ${signal.signal_type}`,
            subtitle: `${(signal as any).companies?.name || 'Empresa'} • Confiança: ${signal.confidence_score}%`,
            url: `/intelligence-360?company=${signal.company_id}`,
            metadata: { description: signal.description }
          });
        });
      }
    }

    // 6. Buscar termos especiais (fit 100%, análise 360, etc)
    if (results.length < 10 && query.toLowerCase().includes('fit') && query.match(/\d+/)) {
      const fitScore = parseInt(query.match(/\d+/)![0]);
      const { data: fitCompanies } = await supabase
        .from('companies')
        .select('id, name, digital_maturity_score')
        .gte('digital_maturity_score', fitScore - 5)
        .lte('digital_maturity_score', fitScore + 5)
        .limit(10 - results.length);

      if (fitCompanies) {
        fitCompanies.forEach(company => {
          results.push({
            id: company.id,
            type: 'fit-totvs',
            title: `${company.name} - Fit TOTVS`,
            subtitle: `Score: ${company.digital_maturity_score}% • Alta aderência TOTVS`,
            url: `/fit-totvs?company=${company.id}`,
            score: company.digital_maturity_score
          });
        });
      }
    }

    // Limitar a 10 resultados totais
    const limitedResults = results.slice(0, 10);

    console.log(`[Global Search] Query: "${query}" - Found ${limitedResults.length} results`);

    return new Response(
      JSON.stringify({ results: limitedResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Global Search] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
