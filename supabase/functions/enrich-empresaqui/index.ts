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
    const { cnpj, companyId } = await req.json();
    
    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const EMPRESAQUI_API_KEY = Deno.env.get('EMPRESAQUI_API_KEY');
    if (!EMPRESAQUI_API_KEY) {
      throw new Error('EMPRESAQUI_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[EmpresaQui] 🚀 Iniciando enriquecimento para CNPJ:', cnpj);

    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Buscar dados completos da empresa
    const response = await fetch(`https://api.empresaqui.com.br/v1/empresas/${cleanCNPJ}/completo`, {
      headers: {
        'Authorization': `Bearer ${EMPRESAQUI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('[EmpresaQui] ❌ Erro na API:', response.status);
      return new Response(
        JSON.stringify({ error: `API retornou status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[EmpresaQui] ✅ Dados recebidos:', data.razao_social);

    // Atualizar empresa no banco
    if (companyId) {
      const updateData: any = {
        enriched_at: new Date().toISOString(),
        enrichment_source: 'empresaqui',
      };

      if (data.razao_social) updateData.name = data.razao_social;
      if (data.nome_fantasia) updateData.trade_name = data.nome_fantasia;
      if (data.website) updateData.website = data.website;
      if (data.porte) updateData.size = data.porte;
      if (data.natureza_juridica) updateData.legal_nature = data.natureza_juridica;
      if (data.data_abertura) updateData.foundation_date = data.data_abertura;
      if (data.situacao_cadastral) updateData.status = data.situacao_cadastral;

      // Endereço
      if (data.logradouro || data.cep || data.municipio) {
        updateData.address = {
          street: data.logradouro,
          number: data.numero,
          complement: data.complemento,
          neighborhood: data.bairro,
          city: data.municipio,
          state: data.uf,
          zip_code: data.cep
        };
      }

      // CNAEs
      if (data.cnae_principal) {
        updateData.main_activity = data.cnae_principal.descricao;
        updateData.cnae_code = data.cnae_principal.codigo;
      }
      
      if (data.cnaes_secundarios && data.cnaes_secundarios.length > 0) {
        updateData.secondary_activities = data.cnaes_secundarios.map((c: any) => c.descricao);
      }

      // Contatos
      if (data.telefones && data.telefones.length > 0) {
        updateData.phone = data.telefones[0];
        updateData.additional_phones = data.telefones.slice(1);
      }
      
      if (data.emails && data.emails.length > 0) {
        updateData.email = data.emails[0];
      }

      // Dados financeiros
      if (data.capital_social) updateData.share_capital = parseFloat(data.capital_social);
      if (data.faturamento_presumido) updateData.estimated_revenue = data.faturamento_presumido;
      if (data.funcionarios_presumido) updateData.employees_count = data.funcionarios_presumido;

      const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (updateError) {
        console.error('[EmpresaQui] ❌ Erro ao atualizar empresa:', updateError);
      } else {
        console.log('[EmpresaQui] ✅ Empresa atualizada com sucesso');
      }

      // Salvar sócios como decisores
      if (data.socios && data.socios.length > 0) {
        for (const socio of data.socios) {
          const { error: decisorError } = await supabase
            .from('decision_makers')
            .upsert({
              company_id: companyId,
              name: socio.nome,
              role: socio.qualificacao || 'Sócio',
              source: 'empresaqui',
              enriched_at: new Date().toISOString()
            }, {
              onConflict: 'company_id,name'
            });

          if (decisorError) {
            console.error('[EmpresaQui] ❌ Erro ao salvar sócio:', decisorError);
          }
        }
        console.log('[EmpresaQui] ✅ Sócios salvos:', data.socios.length);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        source: 'empresaqui',
        enriched_fields: Object.keys(data).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[EmpresaQui] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
