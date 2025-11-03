import { Evidence, processEvidence } from './matching.ts';

// ============================================
// FUNÇÕES DE NORMALIZAÇÃO
// ============================================
function normalizeName(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\bLTDA\.?\b/gi, '')
    .replace(/\bS\.?A\.?\b/gi, '')
    .replace(/\bS\/A\b/gi, '')
    .replace(/\bME\b/gi, '')
    .replace(/\bEPP\b/gi, '')
    .replace(/\bEIRELI\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function getCompanyVariations(name: string): string[] {
  const base = normalizeName(name);
  const words = base.split(/\s+/);
  
  return [
    base,
    words.slice(0, 2).join(' '),
    words[0],
    `"${base}"`,
  ];
}

// ============================================
// APIs EXTERNAS
// ============================================
export async function githubSearch(company: string): Promise<any[]> {
  const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
  if (!GITHUB_TOKEN) return [];
  
  const query = `${company} TOTVS`;
  const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  const data = await response.json();
  return data?.items || [];
}

// ============================================
// CATÁLOGO COMPLETO TOTVS (100+ MÓDULOS)
// ============================================
const TOTVS_COMPLETE_CATALOG = [
  // ERP Core
  'TOTVS', 'Protheus', 'RM TOTVS', 'Datasul', 'Fluig', 'WinThor', 'ADVPL', 'Logix', 'Backoffice',
  // IA & Analytics
  'Carol AI', 'TOTVS BI', 'Advanced Analytics', 'Data Platform',
  // CRM & Vendas
  'TOTVS CRM', 'SFA', 'Sales Force Automation', 'Funil de Vendas', 'Lead Scoring',
  // RH
  'TOTVS RH', 'Folha de Pagamento', 'Ponto Eletrônico', 'Recrutamento',
  // Financeiro & Pagamentos
  'TOTVS Pay', 'PIX', 'Techfin', 'Antecipação de Recebíveis',
  // Outros Módulos
  'iPaaS', 'API Management', 'Assinatura Eletrônica', 'WhatsApp Business'
];

const totvsKeywords = TOTVS_COMPLETE_CATALOG.slice(0, 20); // Top 20 para queries
const totvsOr = `(${totvsKeywords.map(k => k.includes(' ') ? `"${k}"` : k).join(' OR ')})`;

export async function serperSearch(query: string): Promise<any> {
  try {
    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    if (!SERPER_API_KEY) {
      console.warn('[SERPER] API KEY não configurada');
      return {};
    }
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: 10
      })
    });
    
    if (!response.ok) {
      console.error(`[SERPER] Erro HTTP: ${response.status}`);
      return {};
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`[SERPER] Erro: ${error.message}`);
    return {};
  }
}

export async function jinaScrape(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain'
      }
    });
    
    if (!response.ok) return '';
    
    const text = await response.text();
    return text.slice(0, 50000); // Limite de 50k caracteres
  } catch (error: any) {
    console.error(`[JINA] Erro em ${url}: ${error.message}`);
    return '';
  }
}

export async function youtubeSearch(company: string): Promise<any[]> {
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) return [];
  
  const query = `${company} TOTVS`;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
  );
  
  if (!response.ok) return [];
  
  const data = await response.json();
  return data?.items || [];
}

// ============================================
// COLLECT 50 SOURCES (AGORA 70 COM ONDA 7)
// ============================================
export async function collect50Sources(companyName: string, companyCnpj: string, companyWebsite: string): Promise<Evidence[]> {
  console.log(`[50 SOURCES] Iniciando coleta para: ${companyName}`);
  const allEvidences: Evidence[] = [];
  const normalized = normalizeName(companyName);
  const variations = getCompanyVariations(normalized);
  
  // ============================================
  // BUSCAR WEBSITE DO BANCO (se não fornecido)
  // ============================================
  let finalWebsite = companyWebsite;
  if (!finalWebsite && companyCnpj) {
    try {
      console.log('[50 SOURCES] 🔍 Buscando website no banco icp_analysis_results...');
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data } = await supabase
          .from('icp_analysis_results')
          .select('website')
          .eq('cnpj', companyCnpj)
          .maybeSingle();
        
        if (data?.website) {
          finalWebsite = data.website;
          console.log(`[50 SOURCES] ✅ Website encontrado no banco: ${finalWebsite}`);
        }
      }
    } catch (error: any) {
      console.warn(`[50 SOURCES] ⚠️ Erro ao buscar website: ${error.message}`);
    }
  }
  
  const searchName = variations[0];
  
  // ONDA 1: BUSCA GERAL (5 fontes - Serper)
  console.log(`[50 SOURCES] 🔍 ONDA 1: Busca Geral`);
  const wave1Queries = [
    `"${companyName}" ${totvsOr}`,
    `"${companyName}" Protheus`,
    `"${companyName}" ERP TOTVS`,
    `site:news.google.com "${companyName}" TOTVS`,
  ];
  
  for (const query of wave1Queries) {
    try {
      const results = await serperSearch(query);
      const items = [
        ...(results?.organic || []),
        ...(results?.news || []),
      ];
      
      for (const item of items.slice(0, 5)) {
        const evidence = processEvidence(
          `${item.title || ''} ${item.snippet || item.description || ''} ${(item.link || item.url || '')}`,
          companyName,
          'Serper (Wave 1)',
          item.link || item.url || '#',
          'news'
        );
        if (evidence) allEvidences.push(evidence);
      }
    } catch (error: any) {
      console.error(`[50 SOURCES] Erro wave1: ${error.message}`);
    }
  }
  
  // ONDA 2: REDES SOCIAIS (6 fontes - Serper)
  console.log(`[50 SOURCES] 📱 ONDA 2: Redes Sociais`);
  const wave2Queries = [
    `site:linkedin.com/company "${companyName}" ${totvsOr}`,
    `site:linkedin.com/posts "${companyName}" ${totvsOr}`,
    `site:facebook.com "${companyName}" ${totvsOr}`,
    `site:instagram.com "${companyName}" ${totvsOr}`,
    `site:twitter.com OR site:x.com "${companyName}" ${totvsOr}`,
    `site:youtube.com "${companyName}" ${totvsOr}`
  ];
  
  for (const query of wave2Queries) {
    try {
      const results = await serperSearch(query);
      const items = [...(results?.organic || [])];
      
      for (const item of items.slice(0, 3)) {
        const evidence = processEvidence(
          `${item.title || ''} ${item.snippet || ''}`,
          companyName,
          'Redes Sociais',
          item.link || '#',
          'social'
        );
        if (evidence) allEvidences.push(evidence);
      }
    } catch (error: any) {
      console.error(`[50 SOURCES] Erro wave2: ${error.message}`);
    }
  }
  
  // ONDA 3: VAGAS DE EMPREGO (15 fontes - Serper)
  console.log(`[50 SOURCES] 💼 ONDA 3: Vagas de Emprego`);
  const wave3Sites = [
    'linkedin.com/jobs', 'glassdoor.com.br', 'indeed.com.br', 'vagas.com.br', 
    'catho.com.br', 'infojobs.com.br', 'gupy.io'
  ];
  
  for (const site of wave3Sites) {
    try {
      const query = `site:${site} "${companyName}" ${totvsOr}`;
      const results = await serperSearch(query);
      const items = [...(results?.organic || [])];
      
      for (const item of items.slice(0, 2)) {
        const evidence = processEvidence(
          `${item.title || ''} ${item.snippet || ''}`,
          companyName,
          'Vagas de Emprego',
          item.link || '#',
          'job'
        );
        if (evidence) allEvidences.push(evidence);
      }
    } catch (error: any) {
      console.error(`[50 SOURCES] Erro wave3: ${error.message}`);
    }
  }
  
  // ONDA 4: PORTAIS TÉCNICOS (6 fontes - Serper + GitHub API)
  console.log(`[50 SOURCES] 💻 ONDA 4: Portais Técnicos`);
  
  // GitHub API
  try {
    const repos = await githubSearch(companyName);
    for (const repo of repos.slice(0, 3)) {
      const evidence = processEvidence(
        `${repo.name} ${repo.description || ''}`,
        companyName,
        'GitHub API',
        repo.html_url,
        'code'
      );
      if (evidence) allEvidences.push(evidence);
    }
  } catch (error: any) {
    console.error(`[50 SOURCES] Erro GitHub: ${error.message}`);
  }
  
  // Stack Overflow
  const techQuery = `site:stackoverflow.com "${companyName}" ${totvsOr}`;
  const techResults = await serperSearch(techQuery);
  for (const item of (techResults?.organic || []).slice(0, 3)) {
    const evidence = processEvidence(
      `${item.title || ''} ${item.snippet || ''}`,
      companyName,
      'Stack Overflow',
      item.link || '#',
      'code'
    );
    if (evidence) allEvidences.push(evidence);
  }
  
  // ONDA 5: MARKETPLACES B2B (7 fontes - Serper)
  console.log(`[50 SOURCES] 🏪 ONDA 5: Marketplaces B2B`);
  const wave5Sites = ['mercadolivre.com.br', 'b2brazil.com.br', 'guiamais.com.br'];
  
  for (const site of wave5Sites) {
    try {
      const query = `site:${site} "${companyName}"`;
      const results = await serperSearch(query);
      
      for (const item of (results?.organic || []).slice(0, 1)) {
        const evidence = processEvidence(
          `${item.title || ''} ${item.snippet || ''}`,
          companyName,
          'Marketplace B2B',
          item.link || '#',
          'website'
        );
        if (evidence) allEvidences.push(evidence);
      }
    } catch (error: any) {
      console.error(`[50 SOURCES] Erro wave5: ${error.message}`);
    }
  }
  
  // ONDA 6: SCRAPING DE WEBSITE (11 fontes - Jina AI + YouTube API)
  if (finalWebsite) {
    console.log(`[50 SOURCES] 🌐 ONDA 6: Scraping website: ${finalWebsite}`);
    
    try {
      // 1. Website corporativo principal
      const mainSite = await jinaScrape(finalWebsite);
      if (mainSite) {
        const evidence = processEvidence(mainSite, companyName, 'Website Corporativo', finalWebsite, 'website');
        if (evidence) allEvidences.push(evidence);
      }
      
      // 2-4. Páginas específicas
      const pages = ['/carreiras', '/tecnologia', '/sobre'];
      for (const page of pages) {
        try {
          const content = await jinaScrape(`${finalWebsite}${page}`);
          if (content) {
            const evidence = processEvidence(content, companyName, `Website${page}`, `${finalWebsite}${page}`, 'website');
            if (evidence) allEvidences.push(evidence);
          }
        } catch (error: any) {
          console.warn(`[ONDA 6] Erro em ${page}: ${error.message}`);
        }
      }
    } catch (error: any) {
      console.error(`[ONDA 6] Erro: ${error.message}`);
    }
  }
  
  // Portal TOTVS
  const totvsQuery = `site:totvs.com "${companyName}"`;
  const totvsResults = await serperSearch(totvsQuery);
  for (const item of (totvsResults?.organic || []).slice(0, 3)) {
    const evidence = processEvidence(
      `${item.title} ${item.snippet}`,
      companyName,
      'Portal TOTVS',
      item.link,
      'website'
    );
    if (evidence) allEvidences.push(evidence);
  }
  
  // YouTube API
  const youtubeVideos = await youtubeSearch(searchName);
  for (const video of youtubeVideos) {
    const evidence = processEvidence(
      `${video.snippet.title} ${video.snippet.description}`,
      companyName,
      'YouTube API',
      `https://youtube.com/watch?v=${video.id.videoId}`,
      'video'
    );
    if (evidence) allEvidences.push(evidence);
  }
  
  // ============================================
  // ONDA 7: CLIENT DISCOVERY (20 fontes)
  // ============================================
  if (finalWebsite) {
    console.log(`[50 SOURCES] 👥 ONDA 7: Descoberta de Clientes`);
    
    try {
      // Scraping de páginas de clientes
      const clientPages = ['/clientes', '/clientes-e-cases', '/portfolio', '/cases', '/parceiros'];
      for (const page of clientPages) {
        try {
          const content = await jinaScrape(`${finalWebsite}${page}`);
          if (content) {
            const evidence = processEvidence(content, companyName, 'Client Discovery', `${finalWebsite}${page}`, 'website');
            if (evidence) allEvidences.push(evidence);
          }
        } catch (error: any) {
          console.warn(`[ONDA 7] Erro em ${page}: ${error.message}`);
        }
      }
      
      // Press releases
      const domain = new URL(finalWebsite).hostname;
      const pressQuery = `site:${domain} "cliente"`;
      const pressResults = await serperSearch(pressQuery);
      const pressItems = [
        ...(pressResults?.organic || []),
        ...(pressResults?.news || []),
      ];
      
      for (const item of pressItems.slice(0, 5)) {
        const evidence = processEvidence(
          `${item.title || ''} ${item.snippet || ''}`,
          companyName,
          'Press Release',
          item.link || '#',
          'news'
        );
        if (evidence) allEvidences.push(evidence);
      }
      
      // Case studies
      const caseQuery = `"${companyName}" case study cliente`;
      const caseResults = await serperSearch(caseQuery);
      const caseItems = [...(caseResults?.organic || [])];
      
      for (const item of caseItems.slice(0, 5)) {
        const evidence = processEvidence(
          `${item.title || ''} ${item.snippet || ''}`,
          companyName,
          'Case Study',
          item.link || '#',
          'website'
        );
        if (evidence) allEvidences.push(evidence);
      }
      
      console.log(`[ONDA 7] ✅ Client discovery concluída`);
    } catch (error: any) {
      console.error(`[ONDA 7] Erro: ${error.message}`);
    }
  }
  
  console.log(`[50 SOURCES] ✅ Total de evidências coletadas: ${allEvidences.length}`);
  return allEvidences;
}

// ============================================
// ANÁLISE DE KEYWORDS SEO
// ============================================
export async function analyzeKeywords(domain: string): Promise<string[]> {
  try {
    console.log(`[KEYWORDS] 🔎 Analisando keywords de: ${domain}`);
    const content = await jinaScrape(domain);
    
    if (!content) return [];
    
    const keywords: string[] = [];
    
    // Extrair meta keywords
    const metaMatch = content.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch) {
      keywords.push(...metaMatch[1].split(',').map(k => k.trim()));
    }
    
    // Extrair títulos
    const h1Matches = content.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
    const h2Matches = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
    
    for (const h of [...h1Matches, ...h2Matches]) {
      const text = h.replace(/<[^>]+>/g, '').trim();
      if (text.length > 5 && text.length < 80) {
        keywords.push(text);
      }
    }
    
    // Extrair palavras frequentes (tf-idf simplificado)
    const words = content
      .toLowerCase()
      .replace(/<[^>]+>/g, ' ')
      .match(/\b[a-záàâãéèêíïóôõöúçñ]{4,15}\b/g) || [];
    
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
    
    const topWords = Array.from(freq.entries())
      .filter(([word, count]) => count > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
    
    keywords.push(...topWords);
    
    // Remover duplicatas e limitar
    const uniqueKeywords = Array.from(new Set(keywords))
      .filter(k => k.length > 3)
      .slice(0, 50);
    
    console.log(`[KEYWORDS] ✅ ${uniqueKeywords.length} keywords extraídas`);
    return uniqueKeywords;
    
  } catch (error: any) {
    console.error(`[KEYWORDS] Erro: ${error.message}`);
    return [];
  }
}
