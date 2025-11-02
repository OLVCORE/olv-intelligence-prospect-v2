export interface Evidence {
  id: string;
  source: string;
  type: 'news' | 'job' | 'video' | 'code' | 'social' | 'website';
  title: string;
  snippet: string;
  url: string;
  matchLevel: 2 | 3 | 4 | 5;
  components: string[];
  confidence: number;
  publishedAt?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export function analyzeMatchLevel(text: string, companyName: string): {
  matchLevel: 2 | 3 | 4 | 5;
  components: string[];
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const lowerCompany = companyName.toLowerCase();
  
  // Extrair palavras-chave do nome da empresa (ignorar "ltda", "sa", etc)
  const companyKeywords = lowerCompany
    .replace(/\s*-\s*/g, ' ')
    .replace(/\b(ltda|sa|s\.a\.|industria|de|produtos|e|do|da|dos|das)\b/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Verificar presença de TOTVS
  const hasTOTVS = lowerText.includes('totvs') || 
                   lowerText.includes('protheus') || 
                   lowerText.includes('rm totvs') ||
                   lowerText.includes('datasul') ||
                   lowerText.includes('fluig');
  
  // Verificar presença da empresa (match parcial)
  const hasCompany = companyKeywords.some(kw => lowerText.includes(kw));
  
  // Se não tem nem empresa nem TOTVS, rejeitar
  if (!hasTOTVS && !hasCompany) {
    return { matchLevel: 2, components: [], confidence: 0 };
  }
  
  // Se tem apenas TOTVS mas não a empresa, aceitar mas com confiança baixa
  if (hasTOTVS && !hasCompany) {
    return { 
      matchLevel: 2, 
      components: ['TOTVS'], 
      confidence: 30 
    };
  }
  
  // Se tem empresa mas não TOTVS, rejeitar
  if (!hasTOTVS && hasCompany) {
    return { matchLevel: 2, components: [], confidence: 0 };
  }
  
  // Match completo: empresa + TOTVS
  let matchLevel: 2 | 3 | 4 | 5 = 2;
  const components = [companyName, 'TOTVS'];
  
  // TRIPLE: Solução mencionada?
  const solutions = ['protheus', 'rm', 'datasul', 'fluig', 'winthor', 'logix'];
  if (solutions.some(sol => lowerText.includes(sol))) {
    matchLevel = 3;
    components.push('Solução');
  }
  
  // QUADRUPLE: Módulo mencionado?
  const modules = ['financeiro', 'controladoria', 'estoque', 'compras', 'produção', 'fiscal', 'contábil', 'rh', 'folha'];
  if (modules.some(mod => lowerText.includes(mod))) {
    matchLevel = 4;
    components.push('Módulo');
  }
  
  // QUINTUPLE: Detalhes técnicos?
  const technical = ['advpl', 'sql', 'integração', 'customização', 'versão', 'implementação', 'api'];
  if (technical.some(tech => lowerText.includes(tech))) {
    matchLevel = 5;
    components.push('Técnico');
  }
  
  // Calcular confiança
  const confidence = matchLevel === 5 ? 98 : 
                     matchLevel === 4 ? 90 : 
                     matchLevel === 3 ? 75 : 60;
  
  return { matchLevel, components, confidence };
}

export function processEvidence(
  rawText: string,
  companyName: string,
  source: string,
  url: string,
  type: Evidence['type']
): Evidence | null {
  const analysis = analyzeMatchLevel(rawText, companyName);
  
  // Só retornar se for match válido (matchLevel >= 2 e confidence > 0)
  if (analysis.confidence === 0) {
    return null;
  }
  
  // Extrair snippet inteligente
  let snippet = '';
  const lowerText = rawText.toLowerCase();
  
  // Tentar encontrar contexto ao redor de TOTVS
  const totvsPos = lowerText.indexOf('totvs');
  if (totvsPos >= 0) {
    const start = Math.max(0, totvsPos - 80);
    snippet = rawText.slice(start, totvsPos + 120);
  } else {
    // Fallback: primeiros 200 chars
    snippet = rawText.slice(0, 200);
  }
  
  snippet = snippet.trim() + '...';
  
  return {
    id: `${source}-${Date.now()}-${Math.random()}`,
    source,
    type,
    title: rawText.slice(0, 100),
    snippet,
    url,
    matchLevel: analysis.matchLevel,
    components: analysis.components,
    confidence: analysis.confidence,
    timestamp: new Date().toISOString()
  };
}
