import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import { linkedinScrapeSchema } from '../_shared/validation.ts';
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
    // Parse and validate input (+ alias support linkedinUrl)
    const raw = await req.json();
    const body = raw && raw.linkedinUrl && !raw.linkedin_url ? { ...raw, linkedin_url: raw.linkedinUrl } : raw;
    const validated = linkedinScrapeSchema.parse(body);
    const { linkedin_url, company_id } = validated;
    console.log('[LinkedIn Scrape] Iniciando:', linkedin_url);

    const phantomApiKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    const phantomAgentId = Deno.env.get('PHANTOMBUSTER_AGENT_ID');
    const phantomSessionCookie = Deno.env.get('PHANTOMBUSTER_SESSION_COOKIE');
    if (!phantomApiKey || !phantomAgentId || !phantomSessionCookie) {
      console.error('[LinkedIn Scrape] Configuração ausente', { hasKey: !!phantomApiKey, hasAgent: !!phantomAgentId });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'PhantomBuster não configurado (Agent ID/Session Cookie ausentes).',
          missing: {
            apiKey: !phantomApiKey,
            agentId: !phantomAgentId,
            sessionCookie: !phantomSessionCookie
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Iniciar PhantomBuster
    const response = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': phantomApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: phantomAgentId,
        argument: {
          sessionCookie: phantomSessionCookie,
          profileUrls: [linkedin_url]
        }
      })
    });

    if (!response.ok) {
      console.error('[LinkedIn Scrape] Erro PhantomBuster:', response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'PhantomBuster precisa ser configurado com Agent ID e Session Cookie' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const data = await response.json();
    console.log('[LinkedIn Scrape] Resposta:', data);

    // Salvar sinais de compra detectados
    if (company_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase.from('governance_signals').insert({
        company_id: company_id,
        signal_type: 'linkedin_activity',
        description: 'Análise de atividade no LinkedIn iniciada',
        source: 'PhantomBuster',
        confidence_score: 0.7,
        raw_data: data
      });

      console.log('[LinkedIn Scrape] ✅ Sinal de compra registrado');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Análise do LinkedIn iniciada',
        data: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    // Handle validation errors with details
    if (error instanceof z.ZodError) {
      console.error('[LinkedIn Scrape] Validation error:', error.errors);
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
