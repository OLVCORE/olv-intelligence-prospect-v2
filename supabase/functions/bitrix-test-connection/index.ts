import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_url } = await req.json();

    if (!webhook_url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Webhook URL é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[Bitrix Test] Testing connection to:', webhook_url);

    // Test connection by calling the Bitrix API info method
    const testUrl = `${webhook_url}/crm.deal.list?SELECT[]=ID&FILTER[ID]=1`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('[Bitrix Test] Response:', data);

    if (response.ok && !data.error) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Conexão estabelecida com sucesso!',
          bitrix_data: {
            time: data.time || null,
            total: data.total || 0
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: data.error_description || 'Falha ao conectar com Bitrix24',
          error: data.error || 'unknown_error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('[Bitrix Test] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão';
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        error: 'connection_failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
