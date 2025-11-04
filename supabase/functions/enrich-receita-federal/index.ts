import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichReceitaRequest {
  companyId: string;
  cnpj: string;
}

// Simplificar dados da BrasilAPI (40+ campos) para campos essenciais
function simplificarDadosBrasilAPI(data: any) {
  return {
    cnpj: data.cnpj,
    razao_social: data.razao_social || data.nome,
    nome_fantasia: data.nome_fantasia || data.fantasia,
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao,
    porte: data.porte,
    natureza_juridica: data.natureza_juridica || data.codigo_natureza_juridica,
    situacao_cadastral: data.situacao_cadastral || data.descricao_situacao_cadastral,
    data_situacao_cadastral: data.data_situacao_cadastral,
    data_inicio_atividade: data.data_inicio_atividade,
    capital_social: data.capital_social,
    // Endereço
    logradouro: data.logradouro || data.descricao_tipo_de_logradouro,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep,
    // Contato
    ddd_telefone_1: data.ddd_telefone_1 || data.ddd_telefone1,
    telefone_1: data.telefone_1 || data.telefone1,
    ddd_telefone_2: data.ddd_telefone_2 || data.ddd_telefone2,
    telefone_2: data.telefone_2 || data.telefone2,
    email: data.email,
    // QSA (Quadro de Sócios)
    qsa: data.qsa || [],
    // Regime tributário
    opcao_pelo_simples: data.opcao_pelo_simples,
    data_opcao_pelo_simples: data.data_opcao_pelo_simples,
    opcao_pelo_mei: data.opcao_pelo_mei
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: EnrichReceitaRequest = await req.json();
    const { companyId, cnpj } = body;

    console.log('[ENRICH-RECEITA] Enriquecendo CNPJ:', cnpj);

    // Limpar CNPJ (remover pontos, barras, hífens)
    const cnpjClean = cnpj.replace(/[^\d]/g, '');

    let enrichedData: any = null;
    let source = '';

    // ESTRATÉGIA 1: Tentar BrasilAPI primeiro (GRÁTIS, 40+ campos)
    try {
      console.log('[ENRICH-RECEITA] Tentando BrasilAPI...');
      const brasilApiResponse = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`,
        {
          headers: { 'Accept': 'application/json' }
        }
      );

      if (brasilApiResponse.ok) {
        const brasilData = await brasilApiResponse.json();
        enrichedData = simplificarDadosBrasilAPI(brasilData);
        source = 'brasilapi';
        console.log('[ENRICH-RECEITA] Sucesso via BrasilAPI');
      } else {
        console.log('[ENRICH-RECEITA] BrasilAPI falhou:', brasilApiResponse.status);
      }
    } catch (error) {
      console.log('[ENRICH-RECEITA] BrasilAPI error:', error);
    }

    // ESTRATÉGIA 2: Fallback para ReceitaWS
    if (!enrichedData) {
      try {
        console.log('[ENRICH-RECEITA] Tentando ReceitaWS...');
        const receitaToken = Deno.env.get('VITE_RECEITAWS_API_TOKEN');
        
        const receitaResponse = await fetch(
          `https://www.receitaws.com.br/v1/cnpj/${cnpjClean}`,
          {
            headers: {
              'Authorization': `Bearer ${receitaToken}`,
              'Accept': 'application/json'
            }
          }
        );

        if (receitaResponse.ok) {
          const receitaData = await receitaResponse.json();
          
          if (receitaData.status !== 'ERROR') {
            enrichedData = {
              cnpj: receitaData.cnpj,
              razao_social: receitaData.nome,
              nome_fantasia: receitaData.fantasia,
              cnae_fiscal: receitaData.atividade_principal?.[0]?.code,
              cnae_fiscal_descricao: receitaData.atividade_principal?.[0]?.text,
              porte: receitaData.porte,
              natureza_juridica: receitaData.natureza_juridica,
              situacao_cadastral: receitaData.situacao,
              data_situacao_cadastral: receitaData.data_situacao,
              data_inicio_atividade: receitaData.abertura,
              capital_social: receitaData.capital_social,
              logradouro: receitaData.logradouro,
              numero: receitaData.numero,
              complemento: receitaData.complemento,
              bairro: receitaData.bairro,
              municipio: receitaData.municipio,
              uf: receitaData.uf,
              cep: receitaData.cep,
              ddd_telefone_1: receitaData.telefone?.split(' ')[0],
              telefone_1: receitaData.telefone?.split(' ')[1],
              email: receitaData.email,
              qsa: receitaData.qsa || []
            };
            source = 'receitaws';
            console.log('[ENRICH-RECEITA] Sucesso via ReceitaWS');
          } else {
            throw new Error('CNPJ não encontrado na ReceitaWS');
          }
        } else {
          console.log('[ENRICH-RECEITA] ReceitaWS falhou:', receitaResponse.status);
        }
      } catch (error) {
        console.log('[ENRICH-RECEITA] ReceitaWS error:', error);
      }
    }

    if (!enrichedData) {
      throw new Error('Não foi possível enriquecer o CNPJ em nenhuma fonte');
    }

    // Atualizar empresa no banco
    const updateData: any = {
      razao_social: enrichedData.razao_social,
      nome_fantasia: enrichedData.nome_fantasia,
      cnae: enrichedData.cnae_fiscal,
      cnae_descricao: enrichedData.cnae_fiscal_descricao,
      porte: enrichedData.porte,
      natureza_juridica: enrichedData.natureza_juridica,
      situacao_cadastral: enrichedData.situacao_cadastral,
      data_abertura: enrichedData.data_inicio_atividade,
      capital_social: enrichedData.capital_social,
      logradouro: enrichedData.logradouro,
      numero: enrichedData.numero,
      complemento: enrichedData.complemento,
      bairro: enrichedData.bairro,
      city: enrichedData.municipio,
      state: enrichedData.uf,
      cep: enrichedData.cep,
      phone: enrichedData.telefone_1 ? `${enrichedData.ddd_telefone_1} ${enrichedData.telefone_1}` : null,
      email: enrichedData.email,
      qsa: enrichedData.qsa,
      regime_tributario: enrichedData.opcao_pelo_simples ? 'Simples Nacional' : 
                         enrichedData.opcao_pelo_mei ? 'MEI' : 'Lucro Real/Presumido',
      enriched_at: new Date().toISOString(),
      enrichment_source: source
    };

    const { error: updateError } = await supabaseClient
      .from('suggested_companies')
      .update(updateData)
      .eq('id', companyId);

    if (updateError) {
      console.error('[ENRICH-RECEITA] Erro ao atualizar banco:', updateError);
      throw updateError;
    }

    console.log('[ENRICH-RECEITA] Empresa atualizada com sucesso via', source);

    return new Response(
      JSON.stringify({
        success: true,
        source,
        data: enrichedData,
        message: `Enriquecido com sucesso via ${source === 'brasilapi' ? 'BrasilAPI' : 'ReceitaWS'}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[ENRICH-RECEITA] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao enriquecer dados da Receita Federal'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

