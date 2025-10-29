// ✅ Edge Function para buscar dados cadastrais via ReceitaWS
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj, company_id } = await req.json();

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
      try {
        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        });

        if (response.ok) {
          const d = await response.json();
          if (d?.status !== 'ERROR') {
            data = d;
            console.log('ENRICH_RECEITAWS', 'Company data fetched (ReceitaWS)', { nome: data.nome });
          } else {
            primaryError = d?.message || 'Erro desconhecido na ReceitaWS';
            console.warn('ENRICH_RECEITAWS', 'ReceitaWS returned ERROR status:', primaryError);
          }
        } else {
          primaryError = `ReceitaWS HTTP ${response.status}`;
          console.warn('ENRICH_RECEITAWS', 'HTTP Error:', primaryError);
        }
      } catch (e) {
        primaryError = `ReceitaWS exception: ${e instanceof Error ? e.message : String(e)}`;
        console.warn('ENRICH_RECEITAWS', 'Exception:', primaryError);
      }
    } else {
      console.warn('ENRICH_RECEITAWS', 'RECEITAWS_API_TOKEN not configured - using fallback provider');
    }

    // Fallback to BrasilAPI if primary failed or not configured
    if (!data) {
      try {
        console.log('ENRICH_RECEITAWS', 'Trying BrasilAPI fallback...');
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
            porte: b.porte || undefined,
          };
          console.log('ENRICH_RECEITAWS', 'Company data fetched (BrasilAPI fallback)', { nome: data.nome });
        } else {
          const t = await br.text();
          throw new Error(`BrasilAPI HTTP ${br.status}: ${t}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const errorMsg = primaryError ? `${primaryError} | Fallback: ${msg}` : msg;
        console.error('ENRICH_RECEITAWS', 'All providers failed:', errorMsg);
        return new Response(
          JSON.stringify({ error: errorMsg, data: null }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Success + optional persistence if company_id provided
    // Determinar status do CNPJ
    let cnpjStatus = 'inexistente';
    if (data.situacao) {
      const situacao = data.situacao.toLowerCase();
      if (situacao.includes('ativa')) {
        cnpjStatus = 'ativo';
      } else if (situacao.includes('inapta') || situacao.includes('suspensa') || situacao.includes('baixada')) {
        cnpjStatus = 'inativo';
      }
    }
    
    console.log('[ReceitaWS] Status do CNPJ:', cnpjStatus);
    
    try {
      if (company_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sb = createClient(supabaseUrl, supabaseKey);

        // Buscar empresa para merge seguro
        const { data: company } = await sb
          .from('companies')
          .select('id, raw_data')
          .eq('id', company_id)
          .single();

        const existingRaw = (company?.raw_data && typeof company.raw_data === 'object') ? company.raw_data : {};
        const mergedRaw = {
          ...existingRaw,
          receita: data,
          enriched_at: new Date().toISOString(),
          ...(existingRaw.apollo && { apollo: existingRaw.apollo }),
          ...(existingRaw.segment && { segment: existingRaw.segment }),
          ...(existingRaw.refinamentos && { refinamentos: existingRaw.refinamentos })
        };

        const updatePayload: any = { 
          raw_data: mergedRaw,
          cnpj_status: cnpjStatus
        };
        // Atualizar também o nome oficial (Razão Social) quando disponível
        if (data?.nome || data?.fantasia) {
          updatePayload.name = data.nome || data.fantasia;
        }
        if (data?.atividade_principal?.[0]?.text) {
          updatePayload.industry = data.atividade_principal[0].text;
        }
        if (data?.municipio && data?.uf) {
          updatePayload.location = {
            city: data.municipio,
            state: data.uf,
            country: 'Brasil',
            address: [data.logradouro, data.numero, data.complemento, data.bairro, data.cep].filter(Boolean).join(', ')
          };
        }

        const { error: updErr } = await sb
          .from('companies')
          .update(updatePayload)
          .eq('id', company_id);
        if (updErr) console.warn('ENRICH_RECEITAWS update companies warning:', updErr.message);

        // Persistir histórico em company_enrichment (blindagem)
        const { error: enrErr } = await sb
          .from('company_enrichment')
          .upsert({ company_id, source: 'receitaws', data }, { onConflict: 'company_id,source' });
        if (enrErr) console.warn('ENRICH_RECEITAWS upsert enrichment warning:', enrErr.message);
      }
    } catch (persistErr) {
      console.error('ENRICH_RECEITAWS persistence error:', persistErr);
    }

    return new Response(
      JSON.stringify({ 
        data, 
        cnpj_status: cnpjStatus,
        persisted: !!company_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ENRICH_RECEITAWS', 'Error:', error);
    
    // Marcar como inexistente se fornecido company_id
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.company_id) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const sb = createClient(supabaseUrl, supabaseKey);
          
          await sb
            .from('companies')
            .update({ cnpj_status: 'inexistente' })
            .eq('id', body.company_id);
        }
      } catch (e) {
        console.error('Failed to mark as inexistente:', e);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        cnpj_status: 'inexistente',
        data: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
