import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ Consulta CNEP (Cadastro Nacional de Empresas Punidas) - API PÚBLICA
async function checkCNEP(cnpj: string) {
  try {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    console.log('[CNEP] Consultando:', cleanCNPJ);
    
    // Portal da Transparência - API Pública do Governo Federal
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/cnep?cnpjSancionado=${cleanCNPJ}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'chave-api-dados': 'chave-publica-gratuita' // API pública - sem necessidade de chave
      }
    });
    
    if (!response.ok) {
      console.log('[CNEP] Sem registros ou erro:', response.status);
      return { found: false, sanctions: [] };
    }
    
    const data = await response.json();
    console.log('[CNEP] ✅ Resposta recebida:', data.length || 0, 'sanções');
    
    return {
      found: data && data.length > 0,
      sanctions: data || [],
      total: data?.length || 0,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('[CNEP] Erro:', error);
    return { found: false, sanctions: [], error: String(error) };
  }
}

// ✅ Consulta CEIS (Cadastro de Empresas Inidôneas e Suspensas) - API PÚBLICA
async function checkCEIS(cnpj: string) {
  try {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    console.log('[CEIS] Consultando:', cleanCNPJ);
    
    // Portal da Transparência - API Pública do Governo Federal
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/ceis?cnpjSancionado=${cleanCNPJ}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'chave-api-dados': 'chave-publica-gratuita' // API pública - sem necessidade de chave
      }
    });
    
    if (!response.ok) {
      console.log('[CEIS] Sem registros ou erro:', response.status);
      return { found: false, records: [] };
    }
    
    const data = await response.json();
    console.log('[CEIS] ✅ Resposta recebida:', data.length || 0, 'registros');
    
    return {
      found: data && data.length > 0,
      records: data || [],
      total: data?.length || 0,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('[CEIS] Erro:', error);
    return { found: false, records: [], error: String(error) };
  }
}

// ✅ Consulta CEAF (Cadastro de Entidades sem Fins Lucrativos Impedidas)
async function checkCEAF(cnpj: string) {
  try {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    console.log('[CEAF] Consultando:', cleanCNPJ);
    
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/ceaf?cnpj=${cleanCNPJ}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'chave-api-dados': 'chave-publica-gratuita'
      }
    });
    
    if (!response.ok) {
      return { found: false, records: [] };
    }
    
    const data = await response.json();
    console.log('[CEAF] ✅ Resposta recebida:', data.length || 0, 'registros');
    
    return {
      found: data && data.length > 0,
      records: data || [],
      total: data?.length || 0
    };
  } catch (error) {
    console.error('[CEAF] Erro:', error);
    return { found: false, records: [], error: String(error) };
  }
}

// ✅ Calcular risco legal baseado nos dados públicos
function calculateLegalRisk(cnep: any, ceis: any, ceaf: any) {
  let riskScore = 100; // Começa com 100 (perfeito)
  let riskLevel = 'baixo';
  const issues: string[] = [];
  
  // CNEP - sanções federais (peso alto)
  if (cnep.found && cnep.total > 0) {
    riskScore -= cnep.total * 25;
    issues.push(`${cnep.total} sanção(ões) federal(is) - CNEP`);
  }
  
  // CEIS - inidoneidade/suspensão (peso alto)
  if (ceis.found && ceis.total > 0) {
    riskScore -= ceis.total * 30;
    issues.push(`${ceis.total} registro(s) de inidoneidade - CEIS`);
  }
  
  // CEAF - impedimentos (peso médio)
  if (ceaf.found && ceaf.total > 0) {
    riskScore -= ceaf.total * 15;
    issues.push(`${ceaf.total} impedimento(s) - CEAF`);
  }
  
  riskScore = Math.max(0, riskScore);
  
  // Classificar risco
  if (riskScore >= 80) riskLevel = 'baixo';
  else if (riskScore >= 60) riskLevel = 'medio';
  else if (riskScore >= 40) riskLevel = 'alto';
  else riskLevel = 'critico';
  
  return {
    score: riskScore,
    level: riskLevel,
    issues,
    hasRestrictions: cnep.found || ceis.found || ceaf.found,
    summary: issues.length > 0 
      ? issues.join('; ') 
      : 'Nenhuma restrição encontrada nos cadastros públicos'
  };
}

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
    
    console.log('[Legal Check] Iniciando verificação pública para:', cnpj);
    
    // Executar consultas em paralelo
    const [cnepData, ceisData, ceafData] = await Promise.all([
      checkCNEP(cnpj),
      checkCEIS(cnpj),
      checkCEAF(cnpj)
    ]);
    
    // Calcular risco legal
    const legalRisk = calculateLegalRisk(cnepData, ceisData, ceafData);
    
    console.log('[Legal Check] ✅ Análise concluída:', {
      cnep: cnepData.total || 0,
      ceis: ceisData.total || 0,
      ceaf: ceafData.total || 0,
      risco: legalRisk.level
    });
    
    // Se company_id fornecido, salvar no banco
    if (company_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('legal_data').upsert({
        company_id,
        cnep_data: cnepData,
        ceis_data: ceisData,
        legal_health_score: legalRisk.score,
        risk_level: legalRisk.level,
        total_processes: (cnepData.total || 0) + (ceisData.total || 0) + (ceafData.total || 0),
        active_processes: cnepData.total || 0,
        last_checked: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      });
      
      console.log('[Legal Check] ✅ Dados salvos no banco');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        cnpj,
        legal_analysis: {
          cnep: cnepData,
          ceis: ceisData,
          ceaf: ceafData,
          risk: legalRisk
        },
        sources: [
          'Portal da Transparência - CNEP',
          'Portal da Transparência - CEIS',
          'Portal da Transparência - CEAF'
        ],
        disclaimer: 'Dados públicos do Governo Federal. Não substitui análise jurídica profissional.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Legal Check] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao consultar dados legais públicos'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
