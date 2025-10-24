import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    // Usar SERVICE ROLE KEY para ter permissões completas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'get_stats') {
      // Retornar estatísticas das tabelas legacy
      const tables = [
        'governance_signals',
        'digital_maturity',
        'digital_presence',
        'financial_data',
        'legal_data',
        'reputation_data',
        'news_mentions',
        'pitches',
        'insights',
        'risks'
      ];
      
      const counts: Record<string, number> = {};
      
      for (const table of tables) {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          counts[table] = count || 0;
        } else {
          console.error(`Erro ao contar ${table}:`, error);
          counts[table] = 0;
        }
      }
      
      console.log('📊 Estatísticas das tabelas legacy:', counts);
      
      return new Response(
        JSON.stringify({ success: true, counts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'cleanup') {
      // Executar limpeza completa
      const tables = [
        'governance_signals',
        'digital_maturity',
        'digital_presence',
        'financial_data',
        'legal_data',
        'reputation_data',
        'news_mentions',
        'pitches',
        'insights',
        'risks'
      ];
      
      let totalDeleted = 0;
      const results: Record<string, any> = {};
      
      for (const table of tables) {
        try {
          // Primeiro, contar quantos registros existem
          const { count: beforeCount } = await supabaseAdmin
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          console.log(`🗑️ Deletando ${beforeCount || 0} registros de ${table}...`);
          
          // Deletar TODOS os registros (sem condições)
          const { error, count } = await supabaseAdmin
            .from(table)
            .delete()
            .gte('created_at', '1970-01-01'); // Condição que pega tudo
          
          if (error) {
            console.error(`❌ Erro ao deletar ${table}:`, error);
            results[table] = { 
              success: false, 
              error: error.message,
              deleted: 0,
              before: beforeCount || 0
            };
          } else {
            const deleted = count || beforeCount || 0;
            totalDeleted += deleted;
            results[table] = { 
              success: true, 
              deleted,
              before: beforeCount || 0
            };
            console.log(`✅ ${table}: ${deleted} registros deletados`);
          }
        } catch (err) {
          console.error(`❌ Exceção ao processar ${table}:`, err);
          results[table] = { 
            success: false, 
            error: String(err),
            deleted: 0
          };
        }
      }
      
      console.log(`🎉 Limpeza concluída! Total deletado: ${totalDeleted} registros`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          totalDeleted,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
