import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_name, cnpj, company_id } = await req.json();

    if (!company_name) {
      throw new Error('company_name é obrigatório');
    }

    console.log('🔍 Buscando dados de reputação:', { company_name, cnpj });

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    const reputationData: any = {
      sources: [],
      overallScore: 0,
      totalComplaints: 0,
      hasData: false
    };

    // 1. RECLAME AQUI - via Google Search
    try {
      const reclameAquiQuery = `site:reclameaqui.com.br ${company_name}${cnpj ? ` CNPJ ${cnpj}` : ''}`;
      const reclameAquiResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: reclameAquiQuery,
          num: 3
        }),
      });

      if (reclameAquiResponse.ok) {
        const reclameAquiData = await reclameAquiResponse.json();
        if (reclameAquiData.organic?.length > 0) {
          const firstResult = reclameAquiData.organic[0];
          reputationData.sources.push({
            name: 'Reclame Aqui',
            url: firstResult.link,
            snippet: firstResult.snippet,
            hasData: true
          });
          reputationData.hasData = true;
          console.log('✅ Reclame Aqui: dados encontrados');
        }
      }
    } catch (error) {
      console.error('❌ Erro Reclame Aqui:', error);
    }

    // 2. CONSUMIDOR.GOV.BR - via Google Search
    try {
      const consumidorQuery = `site:consumidor.gov.br ${company_name}${cnpj ? ` ${cnpj}` : ''}`;
      const consumidorResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: consumidorQuery,
          num: 3
        }),
      });

      if (consumidorResponse.ok) {
        const consumidorData = await consumidorResponse.json();
        if (consumidorData.organic?.length > 0) {
          const firstResult = consumidorData.organic[0];
          reputationData.sources.push({
            name: 'Consumidor.gov.br',
            url: firstResult.link,
            snippet: firstResult.snippet,
            hasData: true,
            official: true
          });
          reputationData.hasData = true;
          console.log('✅ Consumidor.gov: dados encontrados');
        }
      }
    } catch (error) {
      console.error('❌ Erro Consumidor.gov:', error);
    }

    // 3. JUSBRASIL - via Google Search
    try {
      const jusbrasilQuery = `site:jusbrasil.com.br ${company_name}${cnpj ? ` CNPJ ${cnpj}` : ''} processo`;
      const jusbrasilResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: jusbrasilQuery,
          num: 5
        }),
      });

      if (jusbrasilResponse.ok) {
        const jusbrasilData = await jusbrasilResponse.json();
        if (jusbrasilData.organic?.length > 0) {
          reputationData.sources.push({
            name: 'JusBrasil',
            url: 'https://www.jusbrasil.com.br',
            totalProcesses: jusbrasilData.organic.length,
            processes: jusbrasilData.organic.slice(0, 3).map((item: any) => ({
              title: item.title,
              url: item.link,
              snippet: item.snippet
            })),
            hasData: true
          });
          reputationData.hasData = true;
          console.log('✅ JusBrasil: processos encontrados');
        }
      }
    } catch (error) {
      console.error('❌ Erro JusBrasil:', error);
    }

    // 4. PROCON - via Google Search
    try {
      const proconQuery = `site:procon.sp.gov.br ${company_name}${cnpj ? ` ${cnpj}` : ''}`;
      const proconResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: proconQuery,
          num: 3
        }),
      });

      if (proconResponse.ok) {
        const proconData = await proconResponse.json();
        if (proconData.organic?.length > 0) {
          reputationData.sources.push({
            name: 'Procon SP',
            url: proconData.organic[0].link,
            snippet: proconData.organic[0].snippet,
            hasData: true,
            official: true
          });
          reputationData.hasData = true;
          console.log('✅ Procon: dados encontrados');
        }
      }
    } catch (error) {
      console.error('❌ Erro Procon:', error);
    }

    // Calcular score geral (0-100)
    if (reputationData.hasData) {
      const officialSources = reputationData.sources.filter((s: any) => s.official).length;
      const totalSources = reputationData.sources.length;
      
      // Score base: mais fontes oficiais = melhor
      reputationData.overallScore = Math.round((totalSources / 4) * 100);
      
      // Se tem muitas reclamações, reduz score
      if (reputationData.sources.find((s: any) => s.name === 'Reclame Aqui')) {
        reputationData.overallScore -= 10;
      }
      
      reputationData.overallScore = Math.max(0, Math.min(100, reputationData.overallScore));
    }

    // Salvar no Supabase se company_id fornecido
    if (company_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('companies')
        .update({
          raw_data: {
            reputation: reputationData,
            reputation_updated_at: new Date().toISOString()
          }
        })
        .eq('id', company_id);

      console.log('💾 Dados de reputação salvos no Supabase');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: reputationData,
        message: reputationData.hasData 
          ? `Encontrados dados em ${reputationData.sources.length} fontes`
          : 'Nenhum dado de reputação encontrado'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
