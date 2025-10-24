import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  metadata?: any;
  score?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchTerm = `%${query}%`;
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    // Helper para adicionar resultado sem duplicatas
    const addResult = (result: SearchResult) => {
      if (results.length < 10 && !results.find(r => r.id === result.id && r.type === result.type)) {
        results.push(result);
      }
    };

    // 1. Companies (principais + raw_data profundo)
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, cnpj, industry, revenue, digital_maturity_score, raw_data')
      .limit(30); // Buscar mais empresas para filtrar no backend

    if (companies) {
      companies.forEach(company => {
        let found = false;
        let subtitle = `${company.industry || 'Indústria'} • Score: ${company.digital_maturity_score || 'N/A'}`;
        
        // Busca em campos principais
        if (
          company.name?.toLowerCase().includes(queryLower) ||
          company.cnpj?.includes(query) ||
          company.industry?.toLowerCase().includes(queryLower)
        ) {
          found = true;
        }
        
        // Busca profunda em raw_data (sócios, atividades, etc)
        if (!found && company.raw_data) {
          try {
            const rawData = company.raw_data as any;
            
            // Buscar em sócios (QSA)
            if (rawData?.qsa && Array.isArray(rawData.qsa)) {
              for (const socio of rawData.qsa) {
                if (socio?.nome?.toLowerCase().includes(queryLower)) {
                  found = true;
                  subtitle = `Sócio: ${socio.nome} • ${socio.qual || 'Cargo não especificado'}`;
                  break;
                }
              }
            }
            
            // Buscar em atividade principal
            if (!found && rawData?.atividade_principal) {
              const atividadeStr = JSON.stringify(rawData.atividade_principal).toLowerCase();
              if (atividadeStr.includes(queryLower)) {
                found = true;
                subtitle = `Atividade: ${rawData.atividade_principal[0]?.text || 'Não especificada'}`;
              }
            }
            
            // Buscar em atividades secundárias
            if (!found && rawData?.atividades_secundarias && Array.isArray(rawData.atividades_secundarias)) {
              for (const atividade of rawData.atividades_secundarias) {
                if (atividade?.text?.toLowerCase().includes(queryLower)) {
                  found = true;
                  subtitle = `Atividade Secundária: ${atividade.text}`;
                  break;
                }
              }
            }
            
            // Buscar em outros campos (fantasia, endereço, etc)
            if (!found) {
              const fieldsToSearch = [
                rawData?.fantasia,
                rawData?.logradouro,
                rawData?.bairro,
                rawData?.municipio,
                rawData?.uf,
                rawData?.situacao,
                rawData?.abertura
              ];
              
              for (const field of fieldsToSearch) {
                if (field && String(field).toLowerCase().includes(queryLower)) {
                  found = true;
                  break;
                }
              }
            }
          } catch (e) {
            console.error('Error parsing raw_data:', e);
          }
        }

        if (found) {
          addResult({
            id: company.id,
            type: 'empresa',
            title: company.name,
            subtitle,
            url: `/companies/${company.id}`,
            metadata: { cnpj: company.cnpj },
            score: company.digital_maturity_score
          });
        }
      });
    }

    // 2. Canvas
    if (results.length < 10) {
      const { data: canvas } = await supabase
        .from('canvas')
        .select('id, title, purpose, status, created_at, company_id')
        .or(`title.ilike.${searchTerm},purpose.ilike.${searchTerm}`)
        .limit(5);

      if (canvas) {
        canvas.forEach(item => addResult({
          id: item.id,
          type: 'canvas',
          title: item.title,
          subtitle: `${item.purpose || 'War Room'} • ${item.status}`,
          url: `/canvas/${item.id}`,
          metadata: { created_at: item.created_at }
        }));
      }
    }

    // 3. Decision Makers
    if (results.length < 10) {
      const { data: decisors } = await supabase
        .from('decision_makers')
        .select('id, name, title, email, company_id, companies(name)')
        .or(`name.ilike.${searchTerm},title.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5);

      if (decisors) {
        decisors.forEach(decisor => addResult({
          id: decisor.id,
          type: 'decisor',
          title: decisor.name,
          subtitle: `${decisor.title} • ${(decisor as any).companies?.name || 'Empresa'}`,
          url: `/intelligence?decisor=${decisor.id}`,
          metadata: { email: decisor.email }
        }));
      }
    }

    // 4. SDR Tasks
    if (results.length < 10) {
      const { data: tasks } = await supabase
        .from('sdr_tasks')
        .select('id, title, description, status, due_date, companies(name)')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (tasks) {
        tasks.forEach(task => addResult({
          id: task.id,
          type: 'tarefa',
          title: task.title,
          subtitle: `${task.status} • ${(task as any).companies?.name || 'Sem empresa'} • Vence: ${task.due_date || 'N/A'}`,
          url: `/sdr/tasks?task=${task.id}`
        }));
      }
    }

    // 5. Messages / Inbox
    if (results.length < 10) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id, body, channel, direction, created_at, conversations(id, contacts(name))')
        .ilike('body', searchTerm)
        .limit(5);

      if (messages) {
        messages.forEach(msg => addResult({
          id: msg.id,
          type: 'mensagem',
          title: msg.body?.substring(0, 60) + '...' || 'Mensagem',
          subtitle: `${msg.channel} • ${msg.direction} • ${(msg as any).conversations?.contacts?.name || 'Contato'}`,
          url: `/sdr/inbox?message=${msg.id}`
        }));
      }
    }

    // 6. Canvas Comments
    if (results.length < 10) {
      const { data: comments } = await supabase
        .from('canvas_comments')
        .select('id, content, type, canvas_id, canvas(title)')
        .ilike('content', searchTerm)
        .limit(5);

      if (comments) {
        comments.forEach(comment => addResult({
          id: comment.id,
          type: 'comentário',
          title: comment.content.substring(0, 60) + '...',
          subtitle: `${comment.type} • Canvas: ${(comment as any).canvas?.title || 'Sem título'}`,
          url: `/canvas/${comment.canvas_id}`
        }));
      }
    }

    // 7. Insights
    if (results.length < 10) {
      const { data: insights } = await supabase
        .from('insights')
        .select('id, title, description, insight_type, priority, companies(name)')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (insights) {
        insights.forEach(insight => addResult({
          id: insight.id,
          type: 'insight',
          title: insight.title,
          subtitle: `${insight.insight_type} • ${(insight as any).companies?.name || 'Geral'} • Prioridade: ${insight.priority}`,
          url: `/intelligence-360?insight=${insight.id}`
        }));
      }
    }

    // 8. Buying Signals
    if (results.length < 10) {
      const { data: signals } = await supabase
        .from('governance_signals')
        .select('id, signal_type, description, confidence_score, companies(name)')
        .or(`signal_type.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (signals) {
        signals.forEach(signal => addResult({
          id: signal.id,
          type: 'sinal',
          title: `Sinal: ${signal.signal_type}`,
          subtitle: `${(signal as any).companies?.name || 'Empresa'} • Confiança: ${signal.confidence_score}%`,
          url: `/intelligence-360?signal=${signal.id}`
        }));
      }
    }

    // 9. News Mentions
    if (results.length < 10) {
      const { data: news } = await supabase
        .from('news_mentions')
        .select('id, title, content_summary, source, published_at, companies(name)')
        .or(`title.ilike.${searchTerm},content_summary.ilike.${searchTerm}`)
        .limit(5);

      if (news) {
        news.forEach(item => addResult({
          id: item.id,
          type: 'notícia',
          title: item.title,
          subtitle: `${item.source} • ${(item as any).companies?.name || 'Empresa'} • ${new Date(item.published_at || '').toLocaleDateString()}`,
          url: `/digital-presence?news=${item.id}`
        }));
      }
    }

    // 10. Risks
    if (results.length < 10) {
      const { data: risks } = await supabase
        .from('risks')
        .select('id, risk_type, description, severity, status, companies(name)')
        .or(`risk_type.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (risks) {
        risks.forEach(risk => addResult({
          id: risk.id,
          type: 'risco',
          title: `Risco: ${risk.risk_type}`,
          subtitle: `${risk.severity} • ${(risk as any).companies?.name || 'Empresa'} • Status: ${risk.status}`,
          url: `/intelligence-360?risk=${risk.id}`
        }));
      }
    }

    // 11. Pitches
    if (results.length < 10) {
      const { data: pitches } = await supabase
        .from('pitches')
        .select('id, pitch_type, content, target_persona, companies(name)')
        .or(`pitch_type.ilike.${searchTerm},content.ilike.${searchTerm},target_persona.ilike.${searchTerm}`)
        .limit(5);

      if (pitches) {
        pitches.forEach(pitch => addResult({
          id: pitch.id,
          type: 'pitch',
          title: `Pitch: ${pitch.pitch_type}`,
          subtitle: `${pitch.target_persona || 'Persona'} • ${(pitch as any).companies?.name || 'Empresa'}`,
          url: `/playbooks?pitch=${pitch.id}`
        }));
      }
    }

    // 12. SDR Templates
    if (results.length < 10) {
      const { data: templates } = await supabase
        .from('sdr_templates')
        .select('id, name, content, channel, subject')
        .or(`name.ilike.${searchTerm},content.ilike.${searchTerm},subject.ilike.${searchTerm}`)
        .limit(5);

      if (templates) {
        templates.forEach(template => addResult({
          id: template.id,
          type: 'template',
          title: template.name,
          subtitle: `${template.channel} • ${template.subject || 'Sem assunto'}`,
          url: `/sdr/sequences?template=${template.id}`
        }));
      }
    }

    // 13. Contacts
    if (results.length < 10) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, phone, companies(name)')
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .limit(5);

      if (contacts) {
        contacts.forEach(contact => addResult({
          id: contact.id,
          type: 'contato',
          title: contact.name || contact.email || 'Contato',
          subtitle: `${contact.email || contact.phone || 'Sem email/telefone'} • ${(contact as any).companies?.name || 'Sem empresa'}`,
          url: `/sdr/inbox?contact=${contact.id}`
        }));
      }
    }

    console.log(`[Global Search] Query: "${query}" - Found ${results.length} results across all tables`);

    return new Response(
      JSON.stringify({ results: results.slice(0, 10) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Global Search] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
