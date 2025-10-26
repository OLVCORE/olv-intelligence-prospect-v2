import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import { createErrorResponse } from '../_shared/errors.ts';
import { safeExecute, createSuccessResponse } from '../_shared/safeExecute.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { container_id, company_id } = await req.json();
    
    if (!container_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'container_id é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[LinkedIn Fetch] Buscando resultados:', container_id);

    const phantomApiKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    
    if (!phantomApiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'PhantomBuster não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Buscar resultados do PhantomBuster
    const phantomResult = await safeExecute({
      functionName: 'linkedin-fetch-results',
      retries: 2,
      timeout: 15000,
      logDetails: { container_id },
      operation: async () => {
        const response = await fetch(`https://api.phantombuster.com/api/v2/containers/fetch-result?id=${container_id}`, {
          headers: {
            'X-Phantombuster-Key': phantomApiKey
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[LinkedIn Fetch] Erro:', response.status, errorText);
          throw new Error(`Falha ao buscar resultados (${response.status}): ${errorText}`);
        }

        return await response.json();
      }
    });

    if (!phantomResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: phantomResult.error || 'Erro ao buscar resultados do PhantomBuster',
          attempts: phantomResult.attempts
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const results = phantomResult.data;
    console.log('[LinkedIn Fetch] ✅ Resultados:', results?.length || 0, 'perfis');

    // Salvar resultados como sinais de compra
    if (company_id && results && Array.isArray(results) && results.length > 0) {
      await safeExecute({
        functionName: 'linkedin-fetch-save-signals',
        retries: 3,
        logDetails: { company_id, results_count: results.length },
        operation: async () => {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          // Salvar cada perfil como sinal
          const signals = results.map((profile: any) => ({
            company_id: company_id,
            signal_type: 'linkedin_profile',
            description: `Perfil LinkedIn: ${profile.fullName || 'Desconhecido'} - ${profile.headline || ''}`,
            source: 'PhantomBuster',
            confidence_score: 0.8,
            raw_data: profile
          }));

          const { error } = await supabase.from('governance_signals').insert(signals);
          if (error) throw error;
          
          console.log('[LinkedIn Fetch] ✅', signals.length, 'sinais salvos');
        }
      });
    }

    return createSuccessResponse({
      message: 'Resultados obtidos com sucesso',
      count: results?.length || 0,
      data: results
    });

  } catch (error: any) {
    return createErrorResponse(error, corsHeaders, 500);
  }
});
