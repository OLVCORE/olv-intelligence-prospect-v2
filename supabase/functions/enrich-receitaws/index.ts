// ✅ Edge Function para buscar dados cadastrais via ReceitaWS
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
    const { cnpj } = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiToken = Deno.env.get('RECEITAWS_API_TOKEN');
    const hasToken = !!apiToken;

    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('ENRICH_RECEITAWS', 'Fetching company data', { cnpj: cleanCNPJ });

    let primaryError: string | null = null;
    let data: any | null = null;

    // Try primary provider (ReceitaWS) if token is available
    if (hasToken) {
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });

      if (response.ok) {
        const d = await response.json();
        if (d?.status !== 'ERROR') {
          data = d;
        } else {
          primaryError = d?.message || 'Erro desconhecido na ReceitaWS';
          console.error('ENRICH_RECEITAWS', 'API Error:', primaryError);
        }
      } else {
        primaryError = `ReceitaWS HTTP ${response.status}`;
        console.error('ENRICH_RECEITAWS', 'HTTP Error:', primaryError);
      }
    } else {
      console.warn('ENRICH_RECEITAWS', 'RECEITAWS_API_TOKEN not configured - using fallback provider');
    }

    // Fallback to BrasilAPI if primary failed or not configured
    if (!data) {
      try {
        const br = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
        if (br.ok) {
          const b = await br.json();
          // Map BrasilAPI shape to Receita-like shape expected by frontend
          data = {
            status: 'OK',
            nome: b.razao_social || b.nome_fantasia || '',
            fantasia: b.nome_fantasia || '',
            cnpj: b.cnpj || cleanCNPJ,
            natureza_juridica: b.natureza_juridica || b.natureza_juridica_descricao,
            atividade_principal: b.cnae_fiscal ? [{ code: String(b.cnae_fiscal), text: b.cnae_fiscal_descricao || '' }] : [],
            atividades_secundarias: Array.isArray(b.cnaes_secundarias) ? b.cnaes_secundarias.map((c: any) => ({ code: String(c.codigo), text: c.descricao })) : [],
            logradouro: b.logradouro,
            numero: b.numero,
            complemento: b.complemento,
            cep: b.cep,
            bairro: b.bairro,
            municipio: b.municipio,
            uf: b.uf,
            telefone: b.ddd_telefone_1 || b.ddd_telefone_2,
            email: b.email,
            abertura: b.data_inicio_atividade,
            situacao: b.descricao_situacao_cadastral || b.situacao_cadastral || undefined,
            capital_social: b.capital_social,
          };
          console.log('ENRICH_RECEITAWS', 'Company data fetched (fallback)', { nome: data.nome });
        } else {
          const t = await br.text();
          throw new Error(`BrasilAPI HTTP ${br.status}: ${t}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const errorMsg = primaryError || msg || 'Erro desconhecido';
        return new Response(
          JSON.stringify({ error: errorMsg, data: null }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Success response
    console.log('ENRICH_RECEITAWS', 'Company data fetched', { nome: data.nome });
    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ENRICH_RECEITAWS', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
