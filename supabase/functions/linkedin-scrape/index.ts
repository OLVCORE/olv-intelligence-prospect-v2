import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import { linkedinScrapeSchema } from '../_shared/validation.ts';
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
    const validated = linkedinScrapeSchema.parse(body);
    const { linkedin_url, company_id } = validated;
    console.log('[LinkedIn Scrape] Iniciando:', linkedin_url);

    const phantomApiKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    if (!phantomApiKey) {
      throw new Error('PHANTOMBUSTER_API_KEY não configurada');
    }

    // Iniciar PhantomBuster
    const response = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': phantomApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'your-phantom-id', // Precisa ser configurado
        argument: {
          sessionCookie: 'your-session-cookie', // Precisa ser configurado
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

      await supabase.from('buying_signals').insert({
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
    console.error('[LinkedIn Scrape] Erro:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar sua requisição' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
