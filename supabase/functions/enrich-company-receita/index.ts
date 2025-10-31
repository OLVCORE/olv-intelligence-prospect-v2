import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceitaWSResponse {
  status: string;
  uf: string;
  municipio: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  cep: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  atividades_secundarias?: Array<{
    code: string;
    text: string;
  }>;
  natureza_juridica: string;
  porte: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const receitaToken = Deno.env.get('RECEITAWS_API_TOKEN');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar empresa no banco
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, cnpj, headquarters_state, headquarters_city, niche_code, raw_data')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verificar se já tem dados básicos (Estado e Município são os essenciais)
    if (company.headquarters_state && company.headquarters_city) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Empresa já possui dados de localização',
          data: company
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Se não tem CNPJ, não pode enriquecer
    if (!company.cnpj) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Empresa não possui CNPJ cadastrado' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Buscar na ReceitaWS
    const cnpjClean = company.cnpj.replace(/\D/g, '');
    const receitaUrl = `https://receitaws.com.br/v1/cnpj/${cnpjClean}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (receitaToken) {
      headers['Authorization'] = `Bearer ${receitaToken}`;
    }

    const receitaResponse = await fetch(receitaUrl, { headers });

    if (!receitaResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erro ao consultar ReceitaWS',
          status: receitaResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const receitaData: ReceitaWSResponse = await receitaResponse.json();

    // 5. Preparar dados para atualização
    const updateData: any = {
      raw_data: receitaData, // Salvar dados completos
    };

    // Apenas atualizar campos que estão vazios
    if (!company.headquarters_state && receitaData.uf) {
      updateData.headquarters_state = receitaData.uf;
    }

    if (!company.headquarters_city && receitaData.municipio) {
      updateData.headquarters_city = receitaData.municipio;
    }

    // CNAEs primários e secundários (OPCIONAL - não obrigatório)
    if (receitaData.atividade_principal?.[0]?.code) {
      updateData.niche_code = receitaData.atividade_principal[0].code;
    }

    if (receitaData.atividade_principal?.[0]?.text) {
      updateData.niche = receitaData.atividade_principal[0].text;
    }

    // Adicionar dados extras se disponíveis
    if (receitaData.porte) {
      updateData.size = receitaData.porte;
    }

    // CNAEs já estão em raw_data, não precisa duplicar

    // 6. Atualizar empresa no banco
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', company_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar empresa:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Erro ao atualizar empresa no banco',
          error: updateError 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Empresa enriquecida com sucesso',
        data: updatedCompany,
        enriched_fields: Object.keys(updateData).filter(k => k !== 'raw_data')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função enrich-company-receita:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
