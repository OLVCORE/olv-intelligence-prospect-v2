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
    console.log('[Enrich Receita] Iniciando função');
    
    const { company_id, cnpj: directCnpj } = await req.json();
    
    console.log('[Enrich Receita] company_id:', company_id, 'cnpj direto:', directCnpj);

    // Aceitar CNPJ direto ou buscar pelo company_id
    let cnpj = directCnpj;

    if (!cnpj && !company_id) {
      console.error('[Enrich Receita] Nem company_id nem cnpj foram fornecidos');
      return new Response(
        JSON.stringify({ error: 'company_id ou cnpj são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const receitaToken = Deno.env.get('RECEITAWS_API_TOKEN');
    
    console.log('[Enrich Receita] Conectando ao Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se recebeu company_id, buscar e atualizar empresa
    if (company_id) {
      console.log('[Enrich Receita] Buscando empresa:', company_id);
      
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, cnpj, headquarters_state, headquarters_city, raw_data')
        .eq('id', company_id)
        .maybeSingle();

      if (companyError || !company) {
        console.error('[Enrich Receita] Erro ao buscar empresa:', companyError);
        return new Response(
          JSON.stringify({ success: false, error: 'Empresa não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se já tem dados básicos
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

      cnpj = company.cnpj;
    }

    // Se não tem CNPJ neste ponto, não pode enriquecer
    if (!cnpj) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'CNPJ não disponível' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar na ReceitaWS
    const cnpjClean = cnpj.replace(/\D/g, '');
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

    // Se não tem company_id, retornar apenas os dados da ReceitaWS
    if (!company_id) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dados consultados com sucesso',
          data: receitaData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se tem company_id, atualizar no banco
    const updateData: any = {
      raw_data: receitaData,
    };

    // Apenas atualizar campos vazios
    if (receitaData.uf) updateData.headquarters_state = receitaData.uf;
    if (receitaData.municipio) updateData.headquarters_city = receitaData.municipio;
    if (receitaData.atividade_principal?.[0]?.text) updateData.industry = receitaData.atividade_principal[0].text;
    if (receitaData.porte) updateData.size = receitaData.porte;

    // Atualizar empresa no banco
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
