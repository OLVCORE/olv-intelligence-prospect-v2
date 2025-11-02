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
  
  // Verificar se empresa e TOTVS estão no mesmo contexto (distância < 500 chars)
  const companyPos = lowerText.indexOf(lowerCompany);
  const totvsPos = lowerText.indexOf('totvs');
  
  if (companyPos === -1 || totvsPos === -1) {
    return { matchLevel: 2, components: [], confidence: 0 };
  }
  
  const distance = Math.abs(companyPos - totvsPos);
  if (distance > 500) {
    return { matchLevel: 2, components: [], confidence: 0 };
  }
  
  // Extrair snippet (contexto ao redor)
  const start = Math.max(0, Math.min(companyPos, totvsPos) - 100);
  const end = Math.max(companyPos, totvsPos) + 100;
  const snippet = lowerText.slice(start, end);
  
  // Iniciar com DOUBLE MATCH
  let matchLevel: 2 | 3 | 4 | 5 = 2;
  const components = [companyName, 'TOTVS'];
  
  // TRIPLE: Solução mencionada?
  const solutions = ['protheus', 'rm', 'datasul', 'fluig', 'winthor'];
  if (solutions.some(sol => snippet.includes(sol))) {
    matchLevel = 3;
    components.push('Solução');
  }
  
  // QUADRUPLE: Módulo mencionado?
  const modules = ['financeiro', 'controladoria', 'estoque', 'compras', 'produção', 'fiscal', 'contábil'];
  if (modules.some(mod => snippet.includes(mod))) {
    matchLevel = 4;
    components.push('Módulo');
  }
  
  // QUINTUPLE: Detalhes técnicos?
  const technical = ['advpl', 'sql', 'integração', 'customização', 'versão', 'implementação', 'módulo'];
  if (technical.some(tech => snippet.includes(tech))) {
    matchLevel = 5;
    components.push('Técnico');
  }
  
  // Calcular confiança
  const confidence = matchLevel === 5 ? 98 : 
                     matchLevel === 4 ? 90 : 
                     matchLevel === 3 ? 75 : 50;
  
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
  
  // Extrair snippet (primeiras 200 chars do contexto)
  const companyPos = rawText.toLowerCase().indexOf(companyName.toLowerCase());
  const start = Math.max(0, companyPos - 50);
  const snippet = rawText.slice(start, start + 200) + '...';
  
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
