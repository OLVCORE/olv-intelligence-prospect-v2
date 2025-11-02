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
  
  // ⚠️ CRUCIAL: NÃO REJEITAR EVIDÊNCIAS!
  // O Serper só retorna resultados relacionados à query (que já inclui TOTVS)
  // Aceitar qualquer evidência que tenha TOTVS OU empresa
  
  if (!hasTOTVS && !hasCompany) {
    // Apenas rejeitar se não tem NADA
    return { matchLevel: 2, components: [], confidence: 0 };
  }
  
  // Iniciar classificação
  let matchLevel: 2 | 3 | 4 | 5 = 2;
  const components: string[] = [];
  
  if (hasCompany) components.push(companyName);
  if (hasTOTVS) components.push('TOTVS');
  
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
  
  // Calcular confiança base
  let baseConfidence = 40; // mínimo para aceitar
  
  if (hasTOTVS && hasCompany) {
    // Match completo: empresa + TOTVS no mesmo texto
    baseConfidence = 70;
  } else if (hasTOTVS) {
    // Apenas TOTVS (mas Serper já filtrou por relevância)
    baseConfidence = 50;
  } else if (hasCompany) {
    // Apenas empresa (mas query tinha TOTVS)
    baseConfidence = 40;
  }
  
  // Aplicar multiplicador do matchLevel
  const confidence = matchLevel === 5 ? Math.min(98, baseConfidence + 30) : 
                     matchLevel === 4 ? Math.min(90, baseConfidence + 20) : 
                     matchLevel === 3 ? Math.min(75, baseConfidence + 10) : 
                     baseConfidence;
  
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
