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

    console.log('💰 Buscando dados financeiros/mercado:', { company_name, cnpj });

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    const marketData: any = {
      sources: [],
      isPubliclyTraded: false,
      hasFinancialData: false
    };

    // 1. B3 (Bolsa de Valores)
    try {
      const b3Query = `site:b3.com.br "${company_name}"${cnpj ? ` ${cnpj}` : ''} ações`;
      const b3Response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: b3Query,
          num: 3
        }),
      });

      if (b3Response.ok) {
        const b3Data = await b3Response.json();
        if (b3Data.organic?.length > 0) {
          marketData.sources.push({
            name: 'B3 - Bolsa de Valores',
            url: b3Data.organic[0].link,
            snippet: b3Data.organic[0].snippet,
            hasData: true,
            official: true
          });
          marketData.isPubliclyTraded = true;
          marketData.hasFinancialData = true;
          console.log('✅ B3: empresa listada encontrada');
        }
      }
    } catch (error) {
      console.error('❌ Erro B3:', error);
    }

    // 2. CVM (Comissão de Valores Mobiliários)
    try {
      const cvmQuery = `site:gov.br/cvm "${company_name}"${cnpj ? ` ${cnpj}` : ''}`;
      const cvmResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: cvmQuery,
          num: 3
        }),
      });

      if (cvmResponse.ok) {
        const cvmData = await cvmResponse.json();
        if (cvmData.organic?.length > 0) {
          marketData.sources.push({
            name: 'CVM - Comissão de Valores Mobiliários',
            url: cvmData.organic[0].link,
            snippet: cvmData.organic[0].snippet,
            hasData: true,
            official: true
          });
          marketData.hasFinancialData = true;
          console.log('✅ CVM: registro encontrado');
        }
      }
    } catch (error) {
      console.error('❌ Erro CVM:', error);
    }

    // 3. ANBIMA (Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais)
    try {
      const anbimaQuery = `site:anbima.com.br "${company_name}"${cnpj ? ` ${cnpj}` : ''}`;
      const anbimaResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: anbimaQuery,
          num: 3
        }),
      });

      if (anbimaResponse.ok) {
        const anbimaData = await anbimaResponse.json();
        if (anbimaData.organic?.length > 0) {
          marketData.sources.push({
            name: 'ANBIMA',
            url: anbimaData.organic[0].link,
            snippet: anbimaData.organic[0].snippet,
            hasData: true
          });
          marketData.hasFinancialData = true;
          console.log('✅ ANBIMA: dados encontrados');
        }
      }
    } catch (error) {
      console.error('❌ Erro ANBIMA:', error);
    }

    // 4. Busca geral por demonstrativos financeiros
    try {
      const financialQuery = `"${company_name}" ${cnpj ? cnpj : ''} "balanço patrimonial" OR "demonstrativo financeiro" OR "DRE"`;
      const financialResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: financialQuery,
          num: 3
        }),
      });

      if (financialResponse.ok) {
        const financialData = await financialResponse.json();
        if (financialData.organic?.length > 0) {
          marketData.sources.push({
            name: 'Demonstrativos Financeiros',
            results: financialData.organic.slice(0, 2).map((item: any) => ({
              title: item.title,
              url: item.link,
              snippet: item.snippet
            })),
            hasData: true
          });
          marketData.hasFinancialData = true;
          console.log('✅ Demonstrativos: documentos encontrados');
        }
      }
    } catch (error) {
      console.error('❌ Erro demonstrativos:', error);
    }

    // Calcular score de transparência financeira (0-100)
    if (marketData.hasFinancialData) {
      const officialSources = marketData.sources.filter((s: any) => s.official).length;
      marketData.transparencyScore = Math.round((marketData.sources.length / 4) * 100);
      
      // Empresa na bolsa tem peso maior
      if (marketData.isPubliclyTraded) {
        marketData.transparencyScore = Math.min(100, marketData.transparencyScore + 20);
      }
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
            financial_market: marketData,
            financial_market_updated_at: new Date().toISOString()
          }
        })
        .eq('id', company_id);

      console.log('💾 Dados de mercado salvos no Supabase');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: marketData,
        message: marketData.hasFinancialData 
          ? `Encontrados dados em ${marketData.sources.length} fontes`
          : 'Nenhum dado financeiro/mercado encontrado'
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
