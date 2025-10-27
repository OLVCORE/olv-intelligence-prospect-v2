import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { suggestionId, action } = await req.json();
    
    if (!action) {
      throw new Error("Action is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: any = { success: true };

    switch (action.type) {
      case "navigate":
        // Apenas retornar a URL para navegação no frontend
        result = {
          success: true,
          url: action.payload.url || `/sdr/deals/${action.payload.dealId}`
        };
        break;

      case "create_task":
        // Criar tarefa no SDR
        const { data: task, error: taskError } = await supabase
          .from("sdr_tasks")
          .insert({
            deal_id: action.payload.dealId,
            title: action.payload.title || "Ação sugerida pelo Copilot",
            description: action.payload.description,
            status: "todo",
            priority: action.payload.priority || "high",
            due_date: action.payload.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (taskError) throw taskError;
        
        result = {
          success: true,
          taskId: task.id,
          url: `/sdr/tasks`
        };
        break;

      case "update_deal":
        // Atualizar deal
        const { data: deal, error: dealError } = await supabase
          .from("sdr_deals")
          .update({
            stage: action.payload.stage,
            priority: action.payload.priority,
            last_activity_at: new Date().toISOString()
          })
          .eq("id", action.payload.dealId)
          .select()
          .single();

        if (dealError) throw dealError;

        // Registrar atividade
        await supabase
          .from("sdr_deal_activities")
          .insert({
            deal_id: action.payload.dealId,
            activity_type: "stage_change",
            description: `Estágio alterado pelo AI Copilot para ${action.payload.stage}`,
            new_value: { stage: action.payload.stage }
          });

        result = {
          success: true,
          dealId: deal.id,
          url: `/sdr/pipeline`
        };
        break;

      case "send_message":
        // Preparar mensagem (não enviar automaticamente)
        result = {
          success: true,
          url: `/sdr/inbox?compose=true&dealId=${action.payload.dealId}&template=${action.payload.template || "follow_up"}`
        };
        break;

      case "create_proposal":
        // Navegar para criar proposta
        result = {
          success: true,
          url: `/company/${action.payload.companyId}/proposals/new`
        };
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Copilot execute error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
