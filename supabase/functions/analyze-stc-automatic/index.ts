import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeSTCRequest {
  companyId: string;
  cnpj?: string;
  companyName: string;
  domain?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body: AnalyzeSTCRequest = await req.json();
    const { companyId, cnpj, companyName, domain } = body;

    console.log('[ANALYZE-STC] Analisando:', companyName);

    // Invocar Edge Function simple-totvs-check existente
    const { data: stcResult, error: stcError } = await supabaseClient.functions.invoke(
      'simple-totvs-check',
      {
        body: {
          cnpj,
          companyName,
          domain
        }
      }
    );

    if (stcError) {
      console.error('[ANALYZE-STC] Erro ao invocar STC:', stcError);
      throw stcError;
    }

    console.log('[ANALYZE-STC] STC Result:', {
      status: stcResult?.status,
      confidence: stcResult?.confidence,
      evidences: stcResult?.evidences?.length || 0
    });

    // Determinar status baseado na confiança
    let stcStatus = 'unknown';
    const confidence = stcResult?.confidence || 0;
    
    if (confidence >= 70) {
      stcStatus = 'no-go'; // Cliente TOTVS confirmado
    } else if (confidence >= 40) {
      stcStatus = 'revisar'; // Revisar manualmente
    } else {
      stcStatus = 'go'; // Não é cliente TOTVS
    }

    // Extrair produtos detectados
    const detectedProducts = stcResult?.detected_products || [];
    const evidences = stcResult?.evidences || [];
    const totalWeight = stcResult?.total_weight || 0;

    // Salvar resultado na tabela suggested_companies
    const updateData = {
      stc_result: stcResult,
      stc_status: stcStatus,
      stc_confidence: confidence,
      stc_total_weight: totalWeight,
      stc_evidences_count: evidences.length,
      detected_products: detectedProducts,
      stc_analyzed_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseClient
      .from('suggested_companies')
      .update(updateData)
      .eq('id', companyId);

    if (updateError) {
      console.error('[ANALYZE-STC] Erro ao atualizar banco:', updateError);
      throw updateError;
    }

    // Se for NO-GO (cliente TOTVS), marcar como não qualificado
    if (stcStatus === 'no-go') {
      await supabaseClient
        .from('suggested_companies')
        .update({
          is_qualified: false,
          disqualification_reason: 'Cliente TOTVS existente'
        })
        .eq('id', companyId);
    }

    console.log('[ANALYZE-STC] Análise concluída:', stcStatus);

    return new Response(
      JSON.stringify({
        success: true,
        stcResult: {
          status: stcStatus,
          confidence,
          total_weight: totalWeight,
          evidences_count: evidences.length,
          detected_products: detectedProducts
        },
        message: stcStatus === 'no-go' 
          ? 'Cliente TOTVS confirmado - Desqualificado'
          : stcStatus === 'go'
          ? 'Não é cliente TOTVS - Qualificado'
          : 'Revisar manualmente',
        action: stcStatus === 'no-go' ? 'disqualify' : 'qualify'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[ANALYZE-STC] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao executar análise STC automática'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

