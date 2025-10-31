import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 50 Plataformas de vagas - busca vasta e distribuída
const JOB_PLATFORMS = [
  // Top 10 - maior peso
  { name: 'LinkedIn', domain: 'linkedin.com/jobs', weight: 30 },
  { name: 'Indeed', domain: 'indeed.com.br', weight: 25 },
  { name: 'Catho', domain: 'catho.com.br', weight: 20 },
  { name: 'Vagas.com', domain: 'vagas.com.br', weight: 20 },
  { name: 'InfoJobs', domain: 'infojobs.com.br', weight: 20 },
  { name: 'Gupy', domain: 'portal.gupy.io', weight: 20 },
  { name: 'Glassdoor', domain: 'glassdoor.com.br', weight: 18 },
  { name: 'Sólides', domain: 'vagas.solides.com.br', weight: 15 },
  { name: 'BNE', domain: 'bne.com.br', weight: 15 },
  { name: 'Trabalha Brasil', domain: 'trabalhabrasil.com.br', weight: 15 },
  
  // Agregadores e portais - peso médio
  { name: 'Emprega Brasil', domain: 'empregabrasil.mte.gov.br', weight: 12 },
  { name: 'Jooble', domain: 'jooble.org', weight: 12 },
  { name: 'Adzuna', domain: 'adzuna.com.br', weight: 12 },
  { name: 'Talent.com', domain: 'talent.com', weight: 12 },
  { name: 'Jora', domain: 'jora.com', weight: 10 },
  { name: 'Jobrapido', domain: 'jobrapido.com', weight: 10 },
  { name: 'Jobsora', domain: 'jobsora.com', weight: 10 },
  { name: 'JobisJob', domain: 'jobisjob.com.br', weight: 10 },
  { name: 'Jobatus', domain: 'jobatus.com.br', weight: 10 },
  { name: 'Empregos.com.br', domain: 'empregos.com.br', weight: 10 },
  
  // Portais especializados
  { name: 'Manager', domain: 'manager.com.br', weight: 8 },
  { name: 'Curriculum', domain: 'curriculum.com.br', weight: 8 },
  { name: 'Emprego.net', domain: 'emprego.net', weight: 8 },
  { name: 'Recruta Simples', domain: 'recrutasimples.com.br', weight: 8 },
  { name: 'Emprego Ligado', domain: 'empregoligado.com.br', weight: 8 },
  { name: 'Jobbol', domain: 'jobbol.com.br', weight: 8 },
  { name: 'Elancers', domain: 'elancers.net', weight: 8 },
  { name: 'Abler', domain: 'jobs.abler.com.br', weight: 8 },
  { name: 'JobConvo', domain: 'jobconvo.com', weight: 8 },
  { name: 'Trampos.co', domain: 'trampos.co', weight: 8 },
  
  // Estágio/Trainee
  { name: 'CIEE', domain: 'portal.ciee.org.br', weight: 8 },
  { name: 'Nube', domain: 'nube.com.br', weight: 8 },
  { name: 'IEL', domain: 'iel.org.br', weight: 8 },
  
  // Outros portais
  { name: '99jobs', domain: '99jobs.com', weight: 6 },
  { name: 'Trabalhando', domain: 'trabalhando.com.br', weight: 6 },
  { name: 'Remotar', domain: 'remotar.com.br', weight: 6 },
  { name: 'GeekHunter', domain: 'geekhunter.com.br', weight: 6 },
  { name: 'EmpregosTI', domain: 'empregosti.com.br', weight: 6 },
  { name: 'BuscoJobs', domain: 'buscojobs.com.br', weight: 6 },
  { name: 'VagasPCD', domain: 'vagaspcd.com.br', weight: 6 },
  
  // Consultorias
  { name: 'Michael Page', domain: 'michaelpage.com.br', weight: 5 },
  { name: 'Page Personnel', domain: 'pagepersonnel.com.br', weight: 5 },
  { name: 'Robert Half', domain: 'roberthalf.com.br', weight: 5 },
  { name: 'Randstad', domain: 'randstad.com.br', weight: 5 },
  { name: 'ManpowerGroup', domain: 'manpowergroup.com.br', weight: 5 },
  { name: 'Adecco', domain: 'adecco.com.br', weight: 5 },
  { name: 'Hays', domain: 'hays.com.br', weight: 5 },
  { name: 'Luandre', domain: 'luandre.com.br', weight: 5 },
  { name: 'Gi Group', domain: 'gigroup.com', weight: 5 },
  { name: 'Kelly Services', domain: 'kellyservices.com.br', weight: 5 }
];

// Produtos TOTVS para detectar
const TOTVS_PRODUCTS = [
  'Protheus', 'RM TOTVS', 'Datasul', 'Fluig', 'TOTVS Backoffice',
  'TOTVS Manufatura', 'TOTVS Gestão', 'TOTVS ERP', 'Linha Protheus',
  'Linha RM', 'Microsiga'
];

const TOTVS_KEYWORDS = [
  'TOTVS', 'Protheus', 'Datasul', 'RM TOTVS', 'Fluig', 'Microsiga'
];

// Normalizar nome para comparação
function normalizeName(raw: string): string {
  return raw
    .replace(/[^\w\s]/g, " ")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Gerar variantes do nome da empresa
function tokenVariants(name: string): string[] {
  const tokens = normalizeName(name).split(" ").filter(w => w.length > 2);
  const variants: string[] = [];
  if (tokens.length >= 1) variants.push(tokens[0]);
  if (tokens.length >= 2) variants.push(tokens.slice(0, 2).join(" "));
  if (tokens.length >= 3) variants.push(tokens.slice(0, 3).join(" "));
  return variants;
}

// Validar se o texto menciona a empresa
function validateMention(text: string, companyName: string): boolean {
  const normalized = normalizeName(text);
  const variants = tokenVariants(companyName);
  return variants.some(v => normalized.includes(v));
}

// Detectar produtos TOTVS mencionados
function detectTotvsProducts(text: string): string[] {
  const detected: string[] = [];
  const normalized = text.toLowerCase();
  
  for (const product of TOTVS_PRODUCTS) {
    if (normalized.includes(product.toLowerCase())) {
      detected.push(product);
    }
  }
  
  return [...new Set(detected)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[ICP SCRAPER] 🚀 Iniciando análise ICP com validação de evidências...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!googleApiKey || !googleCseId) {
      console.error('[ICP SCRAPER] ❌ Google API não configurada');
      return new Response(
        JSON.stringify({ 
          error: 'Google API não configurada',
          hint: 'Configure GOOGLE_API_KEY e GOOGLE_CSE_ID nos secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { empresa, cnpj, domain, analysis_id } = await req.json();

    if (!empresa && !cnpj) {
      return new Response(
        JSON.stringify({ error: 'Empresa ou CNPJ são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ICP SCRAPER] 📊 Analisando:', empresa, cnpj, domain);

    const evidencias: any[] = [];
    const logs: any[] = [];
    const scoreBreakdown: any[] = [];
    let totalPontos = 0;
    const startTimeTotal = Date.now();
    const variants = tokenVariants(empresa);
    const platformsScanned: string[] = [];

    // ========================================
    // 1. BUSCAR VAGAS DE EMPREGO
    // ========================================
    for (const platform of JOB_PLATFORMS) {
      const startTime = Date.now();
      
      try {
        // Query: empresa + produtos TOTVS + site específico
        const query = `"${variants[0]}" AND (${TOTVS_KEYWORDS.map(k => `"${k}"`).join(' OR ')}) site:${platform.domain}`;
        console.log(`[ICP SCRAPER] 🔍 ${platform.name}: ${query}`);
        
        const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=5`;
        
        const response = await fetch(googleUrl);
        const tempo = Date.now() - startTime;
        platformsScanned.push(platform.name);
        let pointsAwarded = 0;

        if (response.ok) {
          const data = await response.json();
          const items = data.items || [];
          
          // Validar cada resultado
          for (const item of items) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const fullText = `${title} ${snippet}`;
            
            // VALIDAÇÃO CRÍTICA: Verifica se menciona a empresa E produtos TOTVS
            if (validateMention(fullText, empresa)) {
              const products = detectTotvsProducts(fullText);
              
              if (products.length > 0) {
                // EVIDÊNCIA VÁLIDA! Empresa + TOTVS encontrados
                evidencias.push({
                  criterio: `Vaga de Emprego - ${platform.name}`,
                  categoria: 'vagas_totvs',
                  evidencia: `${title} - ${snippet}`,
                  fonte_url: item.link,
                  fonte_nome: platform.name,
                  dados_extraidos: {
                    titulo: title,
                    snippet: snippet,
                    link: item.link,
                    produtos_totvs: products,
                    displayLink: item.displayLink,
                  },
                  pontos_atribuidos: platform.weight,
                  peso_criterio: platform.weight / 100,
                  confiabilidade: 'alta',
                  motivo: `Vaga em ${platform.name} menciona ${empresa} + ${products.join(', ')}`,
                });
                
                pointsAwarded = platform.weight;
                totalPontos += platform.weight;
                
                console.log(`[ICP SCRAPER] ✅ ${platform.name}: Evidência válida! ${products.join(', ')}`);
                break; // Já encontrou evidência nesta plataforma
              }
            }
          }
          
          logs.push({
            plataforma: platform.name,
            url_buscada: googleUrl.replace(googleApiKey, 'HIDDEN'),
            status: pointsAwarded > 0 ? 'evidencia_valida' : 'sem_evidencia',
            dados_encontrados: pointsAwarded > 0,
            tempo_resposta_ms: tempo,
            resultados_encontrados: items.length,
            resultados_validos: pointsAwarded > 0 ? 1 : 0,
          });
          
        } else {
          const errorText = await response.text();
          logs.push({
            plataforma: platform.name,
            url_buscada: googleUrl.replace(googleApiKey, 'HIDDEN'),
            status: 'erro',
            dados_encontrados: false,
            tempo_resposta_ms: tempo,
            erro_mensagem: `HTTP ${response.status}: ${errorText}`,
          });
        }
        
        scoreBreakdown.push({
          source: platform.name,
          points_awarded: pointsAwarded,
          max_points: platform.weight,
          reason: pointsAwarded > 0 
            ? `Vaga encontrada mencionando ${empresa} + produtos TOTVS`
            : `Nenhuma vaga válida encontrada mencionando ${empresa} + TOTVS`
        });

      } catch (error: any) {
        const tempo = Date.now() - startTime;
        logs.push({
          plataforma: platform.name,
          url_buscada: 'Google Custom Search API',
          status: 'erro',
          dados_encontrados: false,
          tempo_resposta_ms: tempo,
          erro_mensagem: error.message,
        });
        
        scoreBreakdown.push({
          source: platform.name,
          points_awarded: 0,
          max_points: platform.weight,
          reason: `Erro na busca: ${error.message}`
        });
      }

      // Delay entre buscas
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // ========================================
    // 2. BUSCAR DOCUMENTOS FINANCEIROS
    // ========================================
    const startTime = Date.now();
    try {
      const financialQuery = `"${variants[0]}" AND (balanço OR DRE) AND (TOTVS OR Protheus OR Datasul) filetype:pdf`;
      console.log(`[ICP SCRAPER] 🔍 Documentos Financeiros: ${financialQuery}`);
      
      const financialUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(financialQuery)}&num=10`;
      
      const response = await fetch(financialUrl);
      const tempo = Date.now() - startTime;
      platformsScanned.push('Financial Docs');
      let financialPoints = 0;

      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        
        for (const item of items) {
          const title = item.title || '';
          const snippet = item.snippet || '';
          const fullText = `${title} ${snippet}`;
          
          // VALIDAÇÃO CRÍTICA: Verifica se menciona a empresa
          if (validateMention(fullText, empresa)) {
            // Verificar se TOTVS aparece como CREDORA (fornecedor)
            const isTotvsCreditor = fullText.toLowerCase().includes('credora') || 
                                   fullText.toLowerCase().includes('fornecedor');
            
            const points = isTotvsCreditor ? 50 : 25;
            const confidence = isTotvsCreditor ? 'alta' : 'media';
            
            evidencias.push({
              criterio: 'Documento Financeiro',
              categoria: 'financeiro',
              evidencia: `${title} - ${snippet}`,
              fonte_url: item.link,
              fonte_nome: 'Financial Docs',
              dados_extraidos: {
                titulo: title,
                snippet: snippet,
                link: item.link,
                tipo: isTotvsCreditor ? 'TOTVS como credora' : 'Menção TOTVS',
              },
              pontos_atribuidos: points,
              peso_criterio: points / 100,
              confiabilidade: confidence,
              motivo: isTotvsCreditor 
                ? `⚠️ TOTVS aparece como CREDORA no balanço - empresa JÁ COMPROU software TOTVS`
                : `Documento financeiro menciona TOTVS`,
            });
            
            financialPoints = points;
            totalPontos += points;
            
            console.log(`[ICP SCRAPER] ✅ Financial Docs: ${isTotvsCreditor ? 'CREDORA!' : 'Menção'}`);
            break;
          }
        }
        
        logs.push({
          plataforma: 'Financial Docs',
          url_buscada: financialUrl.replace(googleApiKey, 'HIDDEN'),
          status: financialPoints > 0 ? 'evidencia_valida' : 'sem_evidencia',
          dados_encontrados: financialPoints > 0,
          tempo_resposta_ms: tempo,
          resultados_encontrados: items.length,
        });
      }
      
      scoreBreakdown.push({
        source: 'Financial Docs',
        points_awarded: financialPoints,
        max_points: 50,
        reason: financialPoints === 50 
          ? `TOTVS como credora em balanço - empresa JÁ É CLIENTE`
          : financialPoints === 25
          ? `Documento menciona TOTVS mas não como credora`
          : `Nenhum documento financeiro válido encontrado`
      });
      
    } catch (error: any) {
      console.log(`[ICP SCRAPER] ⚠️ Financial Docs: ${error.message}`);
    }

    // ========================================
    // 3. CALCULAR SCORE FINAL E STATUS
    // ========================================
    const scoreICP = Math.min(totalPontos, 100);
    
    // Score >= 70 = DESQUALIFICAR (empresa JÁ USA TOTVS)
    // Score < 70 = QUALIFICAR (empresa NÃO USA TOTVS)
    const status = scoreICP >= 70 ? 'disqualified' : 'qualified';
    const temperatura = scoreICP >= 70 ? 'cold' : scoreICP >= 40 ? 'warm' : 'hot';
    const tempoTotal = Math.round((Date.now() - startTimeTotal) / 1000);

    let disqualificationReason = null;
    if (status === 'disqualified') {
      const highestScoreEvidence = evidencias.reduce((max, e) => 
        e.pontos_atribuidos > max.pontos_atribuidos ? e : max, 
        evidencias[0]
      );
      disqualificationReason = highestScoreEvidence?.motivo || 'Empresa já usa TOTVS';
    }

    console.log('[ICP SCRAPER] 📊 Score final:', scoreICP);
    console.log('[ICP SCRAPER] 📊 Status:', status);
    console.log('[ICP SCRAPER] 📝 Evidências válidas:', evidencias.length);
    console.log('[ICP SCRAPER] ⏱️ Tempo total:', tempoTotal, 'segundos');

    // ========================================
    // 4. SALVAR NO BANCO
    // ========================================
    if (evidencias.length > 0 && analysis_id) {
      const { error: evidError } = await supabase
        .from('icp_evidence')
        .insert(
          evidencias.map(e => ({
            ...e,
            analysis_id,
            cnpj: cnpj || '',
          }))
        );

      if (evidError) {
        console.error('[ICP SCRAPER] ❌ Erro ao salvar evidências:', evidError);
      } else {
        console.log('[ICP SCRAPER] ✅ Evidências salvas:', evidencias.length);
      }
    }

    if (logs.length > 0 && analysis_id) {
      const { error: logError } = await supabase
        .from('icp_scraping_log')
        .insert(
          logs.map(l => ({
            ...l,
            analysis_id,
            cnpj: cnpj || '',
          }))
        );

      if (logError) {
        console.error('[ICP SCRAPER] ❌ Erro ao salvar logs:', logError);
      } else {
        console.log('[ICP SCRAPER] ✅ Logs salvos:', logs.length);
      }
    }

    if (analysis_id) {
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({
          icp_score: scoreICP,
          temperatura,
          status,
          disqualification_reason: disqualificationReason,
          criterios_atendidos: evidencias.map(e => ({
            criterio: e.criterio,
            pontos: e.pontos_atribuidos,
            fonte: e.fonte_nome,
            link: e.fonte_url,
            motivo: e.motivo,
            produtos_totvs: e.dados_extraidos?.produtos_totvs || [],
          })),
          methodology: {
            total_sources_checked: platformsScanned.length,
            sources_with_results: [...new Set(evidencias.map(e => e.fonte_nome))],
            sources_without_results: platformsScanned.filter(p => 
              !evidencias.some(e => e.fonte_nome === p)
            ),
            score_breakdown: scoreBreakdown,
            calculation_formula: 'Score = Σ(pontos de cada fonte com evidência VALIDADA). Máximo: 100 pontos.',
            threshold_applied: {
              qualified_if_below: 70,
              disqualified_if_above: 70
            }
          },
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', analysis_id);

      if (updateError) {
        console.error('[ICP SCRAPER] ❌ Erro ao atualizar análise:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: scoreICP,
        status,
        temperatura,
        disqualification_reason: disqualificationReason,
        evidencias_validas: evidencias.length,
        fontes_consultadas: platformsScanned.length,
        logs_gerados: logs.length,
        tempo_total_segundos: tempoTotal,
        message: status === 'disqualified' 
          ? `⚠️ DESQUALIFICAR: Empresa já usa TOTVS (score: ${scoreICP}/100)`
          : `✅ QUALIFICADO: Empresa não usa TOTVS (score: ${scoreICP}/100)`,
        evidencias,
        score_breakdown: scoreBreakdown,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[ICP SCRAPER] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
