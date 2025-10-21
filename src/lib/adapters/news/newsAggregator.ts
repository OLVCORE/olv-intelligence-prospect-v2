// ✅ Adapter para agregar notícias sobre empresas de múltiplas fontes
import { logger } from '@/lib/utils/logger';
import { cache } from '@/lib/utils/cache';

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  snippet: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 a 1
  category: 'financial' | 'product' | 'legal' | 'expansion' | 'partnership' | 'other';
}

export interface NewsAggregatorResult {
  companyName: string;
  totalArticles: number;
  articles: NewsArticle[];
  sentimentAnalysis: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  keyTopics: string[];
  recentActivity: boolean;
}

/**
 * Busca notícias sobre a empresa em múltiplas fontes
 */
export async function aggregateNews(
  companyName: string,
  cnpj?: string
): Promise<NewsAggregatorResult> {
  const cacheKey = `news:${companyName}:${cnpj || 'no-cnpj'}`;
  
  const cached = cache.get<NewsAggregatorResult>(cacheKey);
  if (cached) {
    logger.info('NEWS_AGGREGATOR', 'Cache hit', { companyName });
    return cached;
  }

  try {
    logger.info('NEWS_AGGREGATOR', 'Fetching news', { companyName });

    // Mock de dados realísticos para demonstração
    // Em produção, integraria com Google News API, NewsAPI, etc.
    const mockArticles: NewsArticle[] = [
      {
        title: `${companyName} anuncia expansão de operações no Brasil`,
        source: 'Portal de Notícias',
        url: 'https://example.com/news/1',
        publishedAt: '2025-10-15T10:30:00Z',
        snippet: 'Empresa planeja investir R$ 50 milhões em nova unidade...',
        sentiment: 'positive',
        sentimentScore: 0.8,
        category: 'expansion'
      },
      {
        title: `${companyName} firma parceria estratégica com fornecedor global`,
        source: 'Valor Econômico',
        url: 'https://example.com/news/2',
        publishedAt: '2025-10-10T14:20:00Z',
        snippet: 'Acordo visa otimizar cadeia de suprimentos e reduzir custos...',
        sentiment: 'positive',
        sentimentScore: 0.7,
        category: 'partnership'
      },
      {
        title: `${companyName} lança novo produto inovador no mercado`,
        source: 'TechNews Brasil',
        url: 'https://example.com/news/3',
        publishedAt: '2025-09-28T09:15:00Z',
        snippet: 'Solução utiliza inteligência artificial para melhorar eficiência...',
        sentiment: 'positive',
        sentimentScore: 0.9,
        category: 'product'
      },
      {
        title: `${companyName} enfrenta processo trabalhista`,
        source: 'Jornal Trabalhista',
        url: 'https://example.com/news/4',
        publishedAt: '2025-09-20T16:45:00Z',
        snippet: 'Ex-funcionários movem ação por horas extras não pagas...',
        sentiment: 'negative',
        sentimentScore: -0.6,
        category: 'legal'
      },
      {
        title: `${companyName} apresenta resultados financeiros do trimestre`,
        source: 'InfoMoney',
        url: 'https://example.com/news/5',
        publishedAt: '2025-09-15T11:00:00Z',
        snippet: 'Receita cresceu 15% em relação ao mesmo período do ano anterior...',
        sentiment: 'positive',
        sentimentScore: 0.75,
        category: 'financial'
      }
    ];

    // Análise de sentimento agregada
    const sentimentCounts = mockArticles.reduce(
      (acc, article) => {
        acc[article.sentiment]++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    const avgSentiment =
      mockArticles.reduce((sum, a) => sum + a.sentimentScore, 0) / mockArticles.length;

    const overallSentiment: 'positive' | 'neutral' | 'negative' =
      avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral';

    // Identificar tópicos-chave
    const keyTopics = [
      'Expansão',
      'Parcerias Estratégicas',
      'Inovação Tecnológica',
      'Crescimento Financeiro'
    ];

    // Verificar atividade recente (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = mockArticles.some(
      (a) => new Date(a.publishedAt) > thirtyDaysAgo
    );

    const result: NewsAggregatorResult = {
      companyName,
      totalArticles: mockArticles.length,
      articles: mockArticles,
      sentimentAnalysis: {
        overall: overallSentiment,
        score: avgSentiment,
        distribution: sentimentCounts
      },
      keyTopics,
      recentActivity
    };

    // Cachear por 6 horas (notícias mudam com frequência)
    cache.set(cacheKey, result, 6 * 60 * 60 * 1000);

    logger.info('NEWS_AGGREGATOR', 'News fetched', {
      companyName,
      totalArticles: result.totalArticles,
      sentiment: overallSentiment
    });

    return result;
  } catch (error) {
    logger.error('NEWS_AGGREGATOR', 'Failed to fetch news', { error, companyName });
    throw error;
  }
}

/**
 * Analisa sentimento de um texto usando heurísticas simples
 * Em produção, usaria API de NLP como OpenAI ou Gemini
 */
export function analyzeSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
  const positiveWords = ['sucesso', 'crescimento', 'expansão', 'inovação', 'lucro', 'parceria', 'investimento'];
  const negativeWords = ['processo', 'perda', 'prejuízo', 'crise', 'demissão', 'problema', 'falha'];

  const lowerText = text.toLowerCase();
  let score = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) score += 0.2;
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) score -= 0.2;
  });

  score = Math.max(-1, Math.min(1, score));

  const sentiment: 'positive' | 'neutral' | 'negative' =
    score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

  return { sentiment, score };
}
