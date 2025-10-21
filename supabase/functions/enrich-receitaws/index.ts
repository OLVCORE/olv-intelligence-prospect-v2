// ✅ Edge Function para buscar dados cadastrais via ReceitaWS
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj } = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiToken = Deno.env.get('RECEITAWS_API_TOKEN');
    if (!apiToken) {
      throw new Error('RECEITAWS_API_TOKEN not configured');
    }

    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('ENRICH_RECEITAWS', 'Fetching company data', { cnpj: cleanCNPJ });

    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`ReceitaWS API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'ERROR') {
      console.error('ENRICH_RECEITAWS', 'API Error:', data.message);
      return new Response(
        JSON.stringify({ error: data.message, data: null }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('ENRICH_RECEITAWS', 'Company data fetched', { nome: data.nome });

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ENRICH_RECEITAWS', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
