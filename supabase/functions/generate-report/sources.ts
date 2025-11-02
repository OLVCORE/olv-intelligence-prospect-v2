import { Evidence, processEvidence } from './matching.ts';

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

export async function serperSearch(query: string): Promise<any> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: query, 
        num: 10,
        gl: 'br',
        hl: 'pt'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Serper error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Serper search failed for query: ${query}`, error);
    return { organic: [] };
  }
}

export async function jinaScrape(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Jina AI error: ${response.status}`);
    }
    
    return await response.text();
  } catch (error: any) {
    console.error(`Jina scraping failed for: ${url}`, error);
    return '';
  }
}

export async function githubSearch(company: string): Promise<any[]> {
  try {
    const query = `${company} TOTVS OR Protheus OR ADVPL`;
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error: any) {
    console.error('GitHub search failed', error);
    return [];
  }
}

export async function youtubeSearch(company: string): Promise<any[]> {
  try {
    const query = `${company} TOTVS`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error: any) {
    console.error('YouTube search failed', error);
    return [];
  }
}

export async function collect50Sources(companyName: string, companyCnpj: string, companyWebsite: string): Promise<Evidence[]> {
  const allEvidences: Evidence[] = [];
  
  console.log('[50 SOURCES] Starting collection...');
  
  // ONDA 1: BUSCA GERAL (5 fontes)
  const wave1Queries = [
    `"${companyName}" TOTVS cliente`,
    `"${companyName}" Protheus`,
    `"${companyName}" ERP TOTVS`,
    `site:news.google.com "${companyName}" TOTVS`,
    `"${companyName}" TOTVS`
  ];
  
  for (const query of wave1Queries) {
    const results = await serperSearch(query);
    for (const item of (results.organic || [])) {
      const evidence = processEvidence(
        `${item.title} ${item.snippet}`,
        companyName,
        'Serper (Wave 1)',
        item.link,
        'news'
      );
      if (evidence) allEvidences.push(evidence);
    }
  }
  
  console.log(`[50 SOURCES] Wave 1 complete: ${allEvidences.length} evidences`);
  
  // ONDA 2: REDES SOCIAIS (6 fontes)
  const wave2Queries = [
    `site:linkedin.com/company "${companyName}" TOTVS`,
    `site:linkedin.com/posts "${companyName}" TOTVS`,
    `site:facebook.com "${companyName}" TOTVS`,
    `site:instagram.com "${companyName}" TOTVS`,
    `site:twitter.com OR site:x.com "${companyName}" TOTVS`,
    `site:youtube.com "${companyName}" TOTVS`
  ];
  
  for (const query of wave2Queries) {
    const results = await serperSearch(query);
    for (const item of (results.organic || [])) {
      const evidence = processEvidence(
        `${item.title} ${item.snippet}`,
        companyName,
        'Serper (Wave 2 - Social)',
        item.link,
        'social'
      );
      if (evidence) allEvidences.push(evidence);
    }
  }
  
  console.log(`[50 SOURCES] Wave 2 complete: ${allEvidences.length} evidences`);
  
  // ONDA 3: VAGAS DE EMPREGO (15 fontes)
  const wave3Sites = [
    'linkedin.com/jobs',
    'glassdoor.com.br',
    'indeed.com.br',
    'vagas.com.br',
    'catho.com.br',
    'infojobs.com.br',
    'empregos.com.br',
    'trampos.co',
    'gupy.io',
    'kenoby.com',
    'revelo.com.br',
    'michaelpage.com.br',
    'roberthalf.com.br',
    'hays.com.br',
    'manager.com.br'
  ];
  
  for (const site of wave3Sites) {
    const query = `site:${site} "${companyName}" TOTVS OR Protheus OR ADVPL`;
    const results = await serperSearch(query);
    for (const item of (results.organic || [])) {
      const evidence = processEvidence(
        `${item.title} ${item.snippet}`,
        companyName,
        `Jobs (${site})`,
        item.link,
        'job'
      );
      if (evidence) allEvidences.push(evidence);
    }
  }
  
  console.log(`[50 SOURCES] Wave 3 complete: ${allEvidences.length} evidences`);
  
  // ONDA 4: PORTAIS TÉCNICOS (6 fontes)
  const wave4Queries = [
    `site:stackoverflow.com "${companyName}" TOTVS OR Protheus OR ADVPL`,
    `site:github.com "${companyName}" TOTVS`,
    `site:gitlab.com "${companyName}" TOTVS`,
    `site:bitbucket.org "${companyName}" TOTVS`,
    `site:dev.to "${companyName}" TOTVS`
  ];
  
  for (const query of wave4Queries) {
    const results = await serperSearch(query);
    for (const item of (results.organic || [])) {
      const evidence = processEvidence(
        `${item.title} ${item.snippet}`,
        companyName,
        'Tech Portal',
        item.link,
        'code'
      );
      if (evidence) allEvidences.push(evidence);
    }
  }
  
  // GitHub API
  const githubRepos = await githubSearch(companyName);
  for (const repo of githubRepos) {
    const evidence = processEvidence(
      `${repo.name} ${repo.description || ''}`,
      companyName,
      'GitHub API',
      repo.html_url,
      'code'
    );
    if (evidence) allEvidences.push(evidence);
  }
  
  console.log(`[50 SOURCES] Wave 4 complete: ${allEvidences.length} evidences`);
  
  // ONDA 5: MARKETPLACES B2B (7 fontes)
  const wave5Sites = [
    'mercadolivre.com.br',
    'b2brazil.com.br',
    'solucoesindustriais.com.br',
    'cosmos.com.br',
    'aondetem.com.br',
    'guiamais.com.br',
    'solucoesb2b.com.br'
  ];
  
  for (const site of wave5Sites) {
    const query = `site:${site} "${companyName}"`;
    const results = await serperSearch(query);
    for (const item of (results.organic || [])) {
      const evidence = processEvidence(
        `${item.title} ${item.snippet}`,
        companyName,
        `B2B (${site})`,
        item.link,
        'website'
      );
      if (evidence) allEvidences.push(evidence);
    }
  }
  
  console.log(`[50 SOURCES] Wave 5 complete: ${allEvidences.length} evidences`);
  
  // ONDA 6: SCRAPING & APIs (11 fontes)
  if (companyWebsite) {
    try {
      const websiteContent = await jinaScrape(companyWebsite);
      if (websiteContent) {
        const evidence = processEvidence(
          websiteContent.slice(0, 2000),
          companyName,
          'Website Scraping',
          companyWebsite,
          'website'
        );
        if (evidence) allEvidences.push(evidence);
      }
    } catch (error: any) {
      console.error('Website scraping failed', error);
    }
  }
  
  // Portal TOTVS
  const totvsQueries = [
    `site:totvs.com/clientes "${companyName}"`,
    `site:totvs.com/blog "${companyName}"`
  ];
  
  for (const query of totvsQueries) {
    const results = await serperSearch(query);
    for (const item of (results.organic || [])) {
      const evidence = processEvidence(
        `${item.title} ${item.snippet}`,
        companyName,
        'Portal TOTVS',
        item.link,
        'website'
      );
      if (evidence) allEvidences.push(evidence);
    }
  }
  
  // YouTube API
  const youtubeVideos = await youtubeSearch(companyName);
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
  
  console.log(`[50 SOURCES] Wave 6 complete: ${allEvidences.length} evidences`);
  console.log(`[50 SOURCES] FINAL COUNT: ${allEvidences.length} total evidences`);
  
  return allEvidences;
}
