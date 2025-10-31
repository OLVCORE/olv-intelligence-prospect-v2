import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EconodataEnrichmentRequest {
  companyId: string;
  cnpj: string;
}

interface EconodataResponse {
  // 87 campos que virão da API Econodata
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  data_abertura?: string;
  situacao_cadastral?: string;
  natureza_juridica?: string;
  porte?: string;
  capital_social?: number;
  
  // Endereço
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  
  // Contatos
  telefone_1?: string;
  telefone_2?: string;
  email?: string;
  
  // CNAEs
  cnae_principal?: string;
  cnae_principal_descricao?: string;
  cnae_secundarios?: string[];
  
  // Sócios e Decisores
  socios?: Array<{
    nome: string;
    cpf?: string;
    qualificacao: string;
    data_entrada?: string;
    participacao?: number;
  }>;
  
  // Financeiro
  receita_estimada?: number;
  faturamento_presumido?: number;
  numero_funcionarios?: number;
  range_funcionarios?: string;
  
  // Dados adicionais (total 87 campos)
  // TODO: Adicionar todos os 87 campos quando recebermos a documentação completa
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { companyId, cnpj: directCnpj } = await req.json() as Partial<EconodataEnrichmentRequest> & { cnpj?: string };

    console.log(`[Econodata] companyId:`, companyId, 'cnpj direto:', directCnpj);

    // Aceitar CNPJ direto ou buscar pelo companyId
    let cnpj = directCnpj;

    if (!cnpj && !companyId) {
      throw new Error('companyId ou cnpj são obrigatórios');
    }

    // Se não tem CNPJ mas tem companyId, buscar CNPJ da empresa
    if (!cnpj && companyId) {
      const { data: company } = await supabaseClient
        .from('companies')
        .select('cnpj')
        .eq('id', companyId)
        .single();
      
      if (!company?.cnpj) {
        throw new Error('Empresa não possui CNPJ cadastrado');
      }
      cnpj = company.cnpj;
    }

    console.log(`[Econodata] Starting enrichment for CNPJ ${cnpj}`);

    // ============================================
    // FASE 1: BUSCAR DADOS DA API ECONODATA
    // ============================================
    
    // TODO: Estas credenciais serão adicionadas via Secrets depois
    const ECONODATA_API_URL = Deno.env.get('ECONODATA_API_URL');
    const ECONODATA_API_KEY = Deno.env.get('ECONODATA_API_KEY');

    if (!ECONODATA_API_URL || !ECONODATA_API_KEY) {
      console.warn('[Econodata] API credentials not configured yet');
      return new Response(
        JSON.stringify({ 
          error: 'Econodata API not configured. Please add ECONODATA_API_URL and ECONODATA_API_KEY secrets.',
          status: 'pending_configuration'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Chamada à API Econodata
    const econodataResponse = await fetch(`${ECONODATA_API_URL}/companies/${cnpj}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ECONODATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!econodataResponse.ok) {
      const errorText = await econodataResponse.text();
      console.error('[Econodata] API error:', econodataResponse.status, errorText);
      
      if (econodataResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Econodata API error: ${econodataResponse.status}`);
    }

    const econodataData: EconodataResponse = await econodataResponse.json();
    console.log('[Econodata] Data retrieved successfully');

    // Se não tem companyId, retornar apenas os dados da API
    if (!companyId) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dados consultados com sucesso',
          data: econodataData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se tem companyId, atualizar no banco
    // ============================================
    // FASE 2: BUSCAR DADOS EXISTENTES DA EMPRESA
    // ============================================
    
    const { data: existingCompany, error: fetchError } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (fetchError) {
      console.error('[Econodata] Error fetching existing company:', fetchError);
      throw fetchError;
    }

    // ============================================
    // FASE 3: MERGE INTELIGENTE (NUNCA SOBRESCREVER VALORES VÁLIDOS)
    // ============================================
    
    const isEmptyValue = (value: any): boolean => {
      return value === null || 
             value === undefined || 
             value === '' || 
             value === 'NA' || 
             value === 'N/A' ||
             (Array.isArray(value) && value.length === 0);
    };

    const mergeField = (existingValue: any, newValue: any, fieldName: string): any => {
      // Regra de ouro: NUNCA sobrescrever valor válido com vazio
      if (isEmptyValue(newValue)) {
        console.log(`[Merge] Keeping existing value for ${fieldName} (new value is empty)`);
        return existingValue;
      }
      
      if (isEmptyValue(existingValue)) {
        console.log(`[Merge] Using new value for ${fieldName} (existing was empty)`);
        return newValue;
      }
      
      // Ambos têm valores: ECONODATA tem prioridade (Layer 1)
      console.log(`[Merge] Econodata override for ${fieldName}`);
      return newValue;
    };

    // Merge dos dados
    const mergedData: any = {
      // Campos básicos
      name: mergeField(existingCompany.name, econodataData.razao_social, 'name'),
      fantasy_name: mergeField(existingCompany.fantasy_name, econodataData.nome_fantasia, 'fantasy_name'),
      cnpj: cnpj, // CNPJ nunca muda
      
      // Situação e porte
      status: mergeField(existingCompany.status, econodataData.situacao_cadastral, 'status'),
      size: mergeField(existingCompany.size, econodataData.porte, 'size'),
      legal_nature: mergeField(existingCompany.legal_nature, econodataData.natureza_juridica, 'legal_nature'),
      
      // Datas
      foundation_date: mergeField(existingCompany.foundation_date, econodataData.data_abertura, 'foundation_date'),
      
      // Endereço
      address: mergeField(existingCompany.address, econodataData.logradouro, 'address'),
      address_number: mergeField(existingCompany.address_number, econodataData.numero, 'address_number'),
      address_complement: mergeField(existingCompany.address_complement, econodataData.complemento, 'address_complement'),
      neighborhood: mergeField(existingCompany.neighborhood, econodataData.bairro, 'neighborhood'),
      city: mergeField(existingCompany.city, econodataData.municipio, 'city'),
      state: mergeField(existingCompany.state, econodataData.uf, 'state'),
      zipcode: mergeField(existingCompany.zipcode, econodataData.cep, 'zipcode'),
      
      // Contatos
      phone: mergeField(existingCompany.phone, econodataData.telefone_1, 'phone'),
      secondary_phone: mergeField(existingCompany.secondary_phone, econodataData.telefone_2, 'secondary_phone'),
      email: mergeField(existingCompany.email, econodataData.email, 'email'),
      
      // CNAEs
      main_activity: mergeField(existingCompany.main_activity, econodataData.cnae_principal_descricao, 'main_activity'),
      
      // Financeiro
      capital_social: mergeField(existingCompany.capital_social, econodataData.capital_social, 'capital_social'),
      estimated_revenue: mergeField(existingCompany.estimated_revenue, econodataData.receita_estimada, 'estimated_revenue'),
      employee_count: mergeField(existingCompany.employee_count, econodataData.numero_funcionarios, 'employee_count'),
      
      // Metadata
      enriched_at: new Date().toISOString(),
      enrichment_source: 'econodata',
      raw_data: {
        ...existingCompany.raw_data,
        econodata: econodataData,
        econodata_enriched_at: new Date().toISOString()
      }
    };

    // ============================================
    // FASE 4: SALVAR DADOS MERGED
    // ============================================
    
    const { data: updatedCompany, error: updateError } = await supabaseClient
      .from('companies')
      .update(mergedData)
      .eq('id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('[Econodata] Error updating company:', updateError);
      throw updateError;
    }

    console.log('[Econodata] Company updated successfully');

    // ============================================
    // FASE 5: PROCESSAR SÓCIOS/DECISORES
    // ============================================
    
    if (econodataData.socios && econodataData.socios.length > 0) {
      console.log(`[Econodata] Processing ${econodataData.socios.length} partners`);
      
      for (const socio of econodataData.socios) {
        // Verificar se o sócio já existe
        const { data: existingDecisor } = await supabaseClient
          .from('decision_makers')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', socio.nome)
          .maybeSingle();

        if (!existingDecisor) {
          // Criar novo decisor
          await supabaseClient
            .from('decision_makers')
            .insert({
              company_id: companyId,
              name: socio.nome,
              role: socio.qualificacao,
              email: null, // Econodata pode não ter email de sócios
              phone: null,
              linkedin_url: null,
              seniority: 'C-Level', // Sócios geralmente são C-Level
              decision_power: 'high',
              source: 'econodata',
              raw_data: socio
            });
          
          console.log(`[Econodata] Created decision maker: ${socio.nome}`);
        } else {
          console.log(`[Econodata] Decision maker already exists: ${socio.nome}`);
        }
      }
    }

    // ============================================
    // RETORNO
    // ============================================
    
    return new Response(
      JSON.stringify({
        success: true,
        companyId,
        source: 'econodata',
        fieldsEnriched: Object.keys(mergedData).length,
        decisorsAdded: econodataData.socios?.length || 0,
        data: updatedCompany
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Econodata] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});