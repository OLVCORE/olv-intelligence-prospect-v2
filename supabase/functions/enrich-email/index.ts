import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import { emailEnrichSchema } from '../_shared/validation.ts';
import { createErrorResponse } from '../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validated = emailEnrichSchema.parse(body);
    const { name, company_domain, decision_maker_id } = validated;
    console.log('[Enrich Email] Iniciando:', { name, company_domain });

    const hunterApiKey = Deno.env.get('HUNTER_API_KEY');
    if (!hunterApiKey) {
      throw new Error('HUNTER_API_KEY não configurada');
    }

    // Buscar email no Hunter.io
    const response = await fetch(
      `https://api.hunter.io/v2/email-finder?domain=${company_domain}&first_name=${name.split(' ')[0]}&last_name=${name.split(' ').slice(-1)[0]}&api_key=${hunterApiKey}`
    );

    if (!response.ok) {
      console.error('[Enrich Email] Erro Hunter:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Hunter API error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const data = await response.json();
    console.log('[Enrich Email] Resposta Hunter:', data);

    if (!data.data?.email) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Atualizar o decisor no banco se decision_maker_id fornecido
    if (decision_maker_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('decision_makers')
        .update({
          email: data.data.email,
          verified_email: data.data.score > 70
        })
        .eq('id', decision_maker_id);

      console.log('[Enrich Email] ✅ Email atualizado no banco');
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: data.data.email,
        score: data.data.score,
        verified: data.data.score > 70
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    // Handle validation errors with details
    if (error instanceof z.ZodError) {
      console.error('[Enrich Email] Validation error:', error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use safe error mapping for all other errors
    return createErrorResponse(error, corsHeaders, 500);
  }
});
