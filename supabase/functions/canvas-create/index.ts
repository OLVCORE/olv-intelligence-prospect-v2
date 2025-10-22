import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    const { companyId, title, purpose, template } = await req.json();

    if (!companyId || !title) {
      throw new Error('company_id e title são obrigatórios');
    }

    // Criar canvas
    const { data: canvas, error: canvasError } = await supabase
      .from('canvas')
      .insert({
        company_id: companyId,
        title,
        purpose,
        template,
        created_by: user.id,
        last_edited_by: user.id,
        owners: [user.id],
        status: 'active'
      })
      .select()
      .single();

    if (canvasError) throw canvasError;

    // Criar permissão de owner para o criador
    await supabase
      .from('canvas_permissions')
      .insert({
        canvas_id: canvas.id,
        user_id: user.id,
        role: 'owner'
      });

    // Registrar atividade
    await supabase
      .from('canvas_activity')
      .insert({
        canvas_id: canvas.id,
        user_id: user.id,
        action_type: 'created',
        description: `Canvas "${title}" criado`,
        metadata: { template, purpose }
      });

    // Se template fornecido, criar blocos padrão
    if (template) {
      const templates = {
        'descoberta': [
          { type: 'note', content: { html: '<h2>Descoberta Inicial</h2><p>Use este canvas para documentar a fase de descoberta.</p>' }, order_index: 0 },
          { type: 'task', content: { title: 'Mapear stakeholders', status: 'todo' }, order_index: 1 },
          { type: 'insight', content: { title: 'Principais dores identificadas', hypothesis: '', status: 'open' }, order_index: 2 },
        ],
        'qualificacao': [
          { type: 'note', content: { html: '<h2>Qualificação de Oportunidade</h2>' }, order_index: 0 },
          { type: 'decision', content: { title: 'Próximos passos', why: '', status: 'pending' }, order_index: 1 },
        ]
      };

      const blocks = templates[template as keyof typeof templates] || [];
      
      if (blocks.length > 0) {
        const blocksToInsert = blocks.map(b => ({
          ...b,
          canvas_id: canvas.id,
          created_by: user.id,
          content: b.content
        }));
        
        await supabase.from('canvas_blocks').insert(blocksToInsert);
      }
    }

    return new Response(
      JSON.stringify({ success: true, canvas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao criar canvas:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});