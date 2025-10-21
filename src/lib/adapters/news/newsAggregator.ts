// ✅ Adapter para agregar notícias sobre empresas via Serper API (Google News)
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
 * Busca notícias sobre a empresa via Serper API (Google News)
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
    logger.info('NEWS_AGGREGATOR', 'Fetching news via Serper API', { companyName });

    const serperApiKey = import.meta.env.VITE_SERPER_API_KEY;
    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY not configured');
    }

    // Buscar notícias via Serper API
    const searchQuery = cnpj 
      ? `"${companyName}" OR "${cnpj}"` 
      : `"${companyName}"`;

    const response = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 20,
        gl: 'br',
        hl: 'pt-br'
      })
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`);
    }

    const data = await response.json();
    const articles: NewsArticle[] = (data.news || []).map((item: any) => {
      const fullText = item.title + ' ' + (item.snippet || '');
      const sentimentAnalysis = analyzeSentiment(fullText);
      
      return {
        title: item.title,
        url: item.link,
        source: item.source,
        publishedAt: item.date,
        snippet: item.snippet || '',
        sentiment: sentimentAnalysis.sentiment,
        sentimentScore: sentimentAnalysis.score,
        category: categorizeNews(fullText)
      };
    });

    // Análise de sentimento agregada
    const sentimentCounts = articles.reduce(
      (acc, article) => {
        acc[article.sentiment]++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    const avgSentiment = articles.length > 0
      ? articles.reduce((sum, a) => sum + a.sentimentScore, 0) / articles.length
      : 0;

    const overallSentiment: 'positive' | 'neutral' | 'negative' =
      avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral';

    // Identificar tópicos-chave baseado nas categorias
    const categoryCount: Record<string, number> = {};
    articles.forEach(a => {
      categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
    });

    const keyTopics = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category]) => {
        const categoryNames: Record<string, string> = {
          financial: 'Finanças',
          product: 'Produtos',
          legal: 'Jurídico',
          expansion: 'Expansão',
          partnership: 'Parcerias',
          other: 'Geral'
        };
        return categoryNames[category] || category;
      });

    // Verificar atividade recente (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = articles.some(
      (a) => new Date(a.publishedAt) > thirtyDaysAgo
    );

    const result: NewsAggregatorResult = {
      companyName,
      totalArticles: articles.length,
      articles,
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
    
    // Retornar dados vazios em caso de erro
    return {
      companyName,
      totalArticles: 0,
      articles: [],
      sentimentAnalysis: {
        overall: 'neutral',
        score: 0,
        distribution: {
          positive: 0,
          neutral: 0,
          negative: 0
        }
      },
      keyTopics: [],
      recentActivity: false
    };
  }
}

/**
 * Analisa sentimento de um texto usando heurísticas
 */
function analyzeSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
  const positiveWords = ['sucesso', 'crescimento', 'expansão', 'inovação', 'lucro', 'parceria', 'investimento', 'aumento', 'melhora', 'prêmio'];
  const negativeWords = ['processo', 'perda', 'prejuízo', 'crise', 'demissão', 'problema', 'falha', 'queda', 'multa', 'escândalo'];

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

/**
 * Categoriza notícia por tópico
 */
function categorizeNews(text: string): NewsArticle['category'] {
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/financ|lucro|receita|faturamento|invest|bolsa/)) return 'financial';
  if (lowerText.match(/produto|lança|inova|tecnolog|software/)) return 'product';
  if (lowerText.match(/expan|filial|nova|abre|mercado/)) return 'expansion';
  if (lowerText.match(/parceria|acordo|contrato|aliança/)) return 'partnership';
  if (lowerText.match(/processo|justi|tribunal|multa|condena/)) return 'legal';
  
  return 'other';
}
