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

    const { canvasId, format = 'json' } = await req.json();

    if (!canvasId) {
      throw new Error('canvasId é obrigatório');
    }

    // Buscar canvas completo
    const { data: canvas, error: canvasError } = await supabase
      .from('canvas')
      .select(`
        *,
        companies (name, cnpj, industry)
      `)
      .eq('id', canvasId)
      .single();

    if (canvasError) throw canvasError;

    // Buscar blocos
    const { data: blocks } = await supabase
      .from('canvas_blocks')
      .select('*')
      .eq('canvas_id', canvasId)
      .order('order_index');

    // Buscar comentários
    const { data: comments } = await supabase
      .from('canvas_comments')
      .select('*')
      .eq('canvas_id', canvasId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Buscar links
    const { data: links } = await supabase
      .from('canvas_links')
      .select('*')
      .eq('canvas_id', canvasId);

    // Buscar atividades recentes
    const { data: activities } = await supabase
      .from('canvas_activity')
      .select('*')
      .eq('canvas_id', canvasId)
      .order('created_at', { ascending: false })
      .limit(50);

    const exportData = {
      canvas,
      blocks: blocks || [],
      comments: comments || [],
      links: links || [],
      activities: activities || [],
      exported_at: new Date().toISOString(),
      exported_by: user.id
    };

    if (format === 'json') {
      return new Response(
        JSON.stringify(exportData, null, 2),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="canvas-${canvasId}.json"`
          } 
        }
      );
    }

    if (format === 'html') {
      const html = generateHTMLReport(exportData);
      return new Response(
        html,
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="canvas-${canvasId}.html"`
          } 
        }
      );
    }

    throw new Error('Formato não suportado');

  } catch (error) {
    console.error('Erro ao exportar canvas:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateHTMLReport(data: any): string {
  const { canvas, blocks, comments, links, activities } = data;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${canvas.title} - Relatório Canvas</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #f5f5f5; }
    .header { background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .section h2 { margin-top: 0; color: #1a1a1a; border-bottom: 2px solid #6366f1; padding-bottom: 0.5rem; }
    .block { background: #f9fafb; padding: 1rem; border-left: 4px solid #6366f1; margin-bottom: 1rem; border-radius: 4px; }
    .block-type { display: inline-block; background: #6366f1; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; margin-bottom: 0.5rem; }
    .comment { background: #fef3c7; padding: 0.75rem; border-left: 3px solid #f59e0b; margin-bottom: 0.5rem; border-radius: 4px; }
    .activity { font-size: 0.875rem; color: #666; padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
    .meta { color: #666; font-size: 0.875rem; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${canvas.title}</h1>
    ${canvas.companies ? `<p class="meta"><strong>Empresa:</strong> ${canvas.companies.name} ${canvas.companies.cnpj ? `(${canvas.companies.cnpj})` : ''}</p>` : ''}
    ${canvas.purpose ? `<p class="meta"><strong>Propósito:</strong> ${canvas.purpose}</p>` : ''}
    <p class="meta"><strong>Criado em:</strong> ${new Date(canvas.created_at).toLocaleString('pt-BR')}</p>
    <p class="meta"><strong>Exportado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
  </div>

  ${blocks.length > 0 ? `
  <div class="section">
    <h2>📋 Blocos (${blocks.length})</h2>
    ${blocks.map((block: any) => `
      <div class="block">
        <span class="block-type">${getBlockTypeLabel(block.type)}</span>
        <pre>${JSON.stringify(block.content, null, 2)}</pre>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${comments.length > 0 ? `
  <div class="section">
    <h2>💡 Comentários Ativos (${comments.length})</h2>
    ${comments.map((comment: any) => `
      <div class="comment">
        <strong>${comment.type}</strong>: ${comment.content}
        <div class="meta">${new Date(comment.created_at).toLocaleString('pt-BR')}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${links.length > 0 ? `
  <div class="section">
    <h2>🔗 Links com Outros Módulos (${links.length})</h2>
    ${links.map((link: any) => `
      <div class="activity">
        <strong>${link.target_type}</strong> → ${link.target_id}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${activities.length > 0 ? `
  <div class="section">
    <h2>📊 Atividades Recentes (${Math.min(activities.length, 20)})</h2>
    ${activities.slice(0, 20).map((activity: any) => `
      <div class="activity">
        <strong>${activity.action_type}</strong>: ${activity.description}
        <span class="meta"> • ${new Date(activity.created_at).toLocaleString('pt-BR')}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>
  `.trim();
}

function getBlockTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    note: '📝 Nota',
    insight: '💡 Insight',
    decision: '✅ Decisão',
    task: '📋 Tarefa',
    reference: '📎 Referência',
    attachment: '📄 Anexo',
    timeline: '⏰ Linha do Tempo'
  };
  return labels[type] || type;
}