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

// ============================================
// LÓGICA CORRETA DE MATCHING - VERSÃO FINAL
// ============================================
export function analyzeMatchLevel(
  text: string,
  companyName: string
): {
  matchLevel: 2 | 3 | 4 | 5;
  components: string[];
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const lowerCompany = companyName.toLowerCase();

  // Extrair palavras-chave da empresa (remover stopwords/termos curtos)
  const companyKeywords = lowerCompany
    .replace(/\s*-\s*/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Produtos TOTVS e variações comuns
  const totvsProducts = ['totvs', 'protheus', 'rm totvs', 'datasul', 'fluig', 'winthor'];
  const hasTOTVS = totvsProducts.some((p) => lowerText.includes(p));

  // Empresa presente (match parcial por palavras-chave)
  const hasCompany = companyKeywords.some((kw) => lowerText.includes(kw));

  // Termos de uso/implementação
  const usageTerms = [
    'cliente',
    'usa',
    'utiliza',
    'implementou',
    'adotou',
    'implantou',
    'contratou',
    'escolheu',
    'migrou',
    'sistema',
    'erp',
    'gestão',
    'solução',
    'software',
    'plataforma',
  ];
  const hasUsage = usageTerms.some((t) => lowerText.includes(t));

  // Termos de confirmação forte
  const strongTerms = ['cliente totvs', 'usa totvs', 'utiliza totvs', 'implementou totvs'];
  const hasStrong = strongTerms.some((t) => lowerText.includes(t));

  // ========================================
  // CLASSIFICAÇÃO (5 níveis)
  // ========================================

  // QUINTUPLE (5 pontos): Empresa + TOTVS + Confirmação Forte
  if (hasCompany && hasTOTVS && hasStrong) {
    return {
      matchLevel: 5,
      components: [companyName, 'TOTVS', 'Confirmação Forte'],
      confidence: 98,
    };
  }

  // QUADRUPLE (4 pontos): Empresa + TOTVS + Uso
  if (hasCompany && hasTOTVS && hasUsage) {
    return {
      matchLevel: 4,
      components: [companyName, 'TOTVS', 'Contexto de Uso'],
      confidence: 90,
    };
  }

  // TRIPLE (3 pontos): Empresa + TOTVS (ambos presentes)
  if (hasCompany && hasTOTVS) {
    return {
      matchLevel: 3,
      components: [companyName, 'TOTVS'],
      confidence: 75,
    };
  }

  // DOUBLE (2 pontos): Apenas um dos dois
  if (hasCompany || hasTOTVS) {
    return {
      matchLevel: 2,
      components: hasTOTVS ? ['TOTVS'] : [companyName],
      confidence: 50,
    };
  }

  // Rejeitar se não tem nada relacionado
  return {
    matchLevel: 2,
    components: [],
    confidence: 0,
  };
}

// ============================================
// PROCESSAR EVIDÊNCIA
// ============================================
export function processEvidence(
  rawText: string,
  companyName: string,
  source: string,
  url: string,
  type: Evidence['type']
): Evidence | null {
  const analysis = analyzeMatchLevel(rawText, companyName);

  // Aceitar apenas se confidence > 0
  if (analysis.confidence === 0) {
    return null;
  }

  // Extrair snippet (200 chars ao redor do contexto mais relevante)
  const lowerText = rawText.toLowerCase();
  const lowerCompany = companyName.toLowerCase();

  let contextPos = lowerText.indexOf(lowerCompany);
  if (contextPos === -1) contextPos = lowerText.indexOf('totvs');
  if (contextPos === -1) contextPos = 0;

  const start = Math.max(0, contextPos - 50);
  const end = Math.min(rawText.length, start + 200);
  const snippet = rawText.slice(start, end) + (end < rawText.length ? '...' : '');

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
    timestamp: new Date().toISOString(),
  };
}
