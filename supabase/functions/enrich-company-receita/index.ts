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

    // Buscar na ReceitaWS com retry automático
    const cnpjClean = cnpj.replace(/\D/g, '');
    const receitaUrl = `https://receitaws.com.br/v1/cnpj/${cnpjClean}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (receitaToken) {
      headers['Authorization'] = `Bearer ${receitaToken}`;
    }

    // Função de retry com exponential backoff
    let receitaData: ReceitaWSResponse | null = null;
    let lastError: any = null;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Delay progressivo: 1s, 3s, 6s
        if (attempt > 0) {
          const delay = attempt * 2000 + 1000;
          console.log(`[Enrich Receita] Aguardando ${delay}ms antes da tentativa ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log(`[Enrich Receita] Consultando ReceitaWS (tentativa ${attempt + 1}/${maxRetries})...`);
        const receitaResponse = await fetch(receitaUrl, { headers });

        if (receitaResponse.status === 429) {
          console.warn(`[Enrich Receita] Rate limit atingido (429) - tentativa ${attempt + 1}/${maxRetries}`);
          lastError = { status: 429, message: 'Rate limit atingido' };
          continue;
        }

        if (!receitaResponse.ok) {
          console.error(`[Enrich Receita] Erro HTTP ${receitaResponse.status} na tentativa ${attempt + 1}`);
          lastError = { 
            status: receitaResponse.status, 
            message: `Erro HTTP ${receitaResponse.status}` 
          };
          
          // Não retenta erros 4xx exceto 429
          if (receitaResponse.status >= 400 && receitaResponse.status < 500 && receitaResponse.status !== 429) {
            break;
          }
          continue;
        }

        receitaData = await receitaResponse.json();
        console.log(`[Enrich Receita] ✅ Sucesso na tentativa ${attempt + 1}!`);
        break;
        
      } catch (error) {
        console.error(`[Enrich Receita] Erro na tentativa ${attempt + 1}:`, error);
        lastError = error;
      }
    }

    // Se todas as tentativas falharam - tentar fallback BrasilAPI antes de falhar
    if (!receitaData) {
      console.warn('[Enrich Receita] Tentando fallback BrasilAPI...');
      try {
        const brasilApiUrl = `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`;
        const brasilResp = await fetch(brasilApiUrl, { headers: { 'Content-Type': 'application/json' } });
        if (brasilResp.ok) {
          const b = await brasilResp.json();
          receitaData = {
            status: b.descricao_situacao_cadastral || 'OK',
            uf: b.uf || b.estado,
            municipio: b.municipio || b.cidade,
            bairro: b.bairro || '',
            logradouro: b.logradouro || '',
            numero: b.numero?.toString?.() || '',
            complemento: b.complemento || '',
            cep: (b.cep || '').toString(),
            atividade_principal: b.cnae_fiscal
              ? [{ code: String(b.cnae_fiscal), text: b.cnae_fiscal_descricao || '' }]
              : [],
            atividades_secundarias: Array.isArray(b.cnaes_secundarios)
              ? b.cnaes_secundarios.map((i: any) => ({ code: String(i.codigo || i.code || ''), text: i.descricao || i.text || '' }))
              : [],
            natureza_juridica: b.natureza_juridica || '',
            porte: b.porte || b.porte_empresa || ''
          } as ReceitaWSResponse;
          console.log('[Enrich Receita] ✅ Fallback BrasilAPI bem-sucedido');
        } else {
          console.error('[Enrich Receita] Fallback BrasilAPI falhou com status', brasilResp.status);
          lastError = { status: brasilResp.status, message: 'BrasilAPI falhou' };
        }
      } catch (err) {
        console.error('[Enrich Receita] Erro no fallback BrasilAPI:', err);
        lastError = err;
      }

      if (!receitaData) {
        const statusCode = lastError?.status === 429 ? 429 : 500;
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Erro ao consultar fontes de CNPJ',
            status: lastError?.status || statusCode,
            details: lastError?.message || 'Erro desconhecido',
            provider: 'receitaws|brasilapi'
          }),
          { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
