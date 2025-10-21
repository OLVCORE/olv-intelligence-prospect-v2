// ✅ Engine de detecção de sinais de compra
import type { SerperAdapter, SerperNewsResult } from '@/lib/adapters/search/serper';

export type SignalType = 
  | 'funding_round'
  | 'leadership_change'
  | 'expansion'
  | 'technology_adoption'
  | 'partnership'
  | 'market_entry'
  | 'digital_transformation'
  | 'linkedin_activity';

export interface BuyingSignal {
  type: SignalType;
  description: string;
  confidence_score: number;
  source: string;
  detected_at: Date;
  raw_data?: any;
}

export interface SignalDetectionEngine {
  detectFromNews(companyName: string): Promise<BuyingSignal[]>;
  detectFromSearch(companyName: string, domain: string): Promise<BuyingSignal[]>;
  analyzeSignals(signals: BuyingSignal[]): SignalAnalysis;
}

export interface SignalAnalysis {
  totalSignals: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  signalsByType: Record<SignalType, number>;
  overallScore: number;
  recommendation: 'high_priority' | 'medium_priority' | 'low_priority';
}

export class SignalDetectionEngineImpl implements SignalDetectionEngine {
  private signalPatterns = {
    funding_round: /investimento|rodada|captação|aporte|funding|series [a-z]/i,
    leadership_change: /novo ceo|novo cto|novo diretor|contratou|nomeou|appointed|hired/i,
    expansion: /expansão|novo escritório|nova unidade|crescimento|expansion/i,
    technology_adoption: /adotou|implementou|migrou para|deployed|adopted/i,
    partnership: /parceria|acordo|contrato|partnership|agreement/i,
    market_entry: /lançamento|nova operação|entrando em|novo mercado|entering/i,
    digital_transformation: /transformação digital|digitalização|modernização|cloud/i
  };

  constructor(private serper: SerperAdapter) {}

  async detectFromNews(companyName: string): Promise<BuyingSignal[]> {
    console.log('[SignalDetection] Buscando notícias:', companyName);
    
    const news = await this.serper.searchNews(`${companyName} investimento tecnologia`);
    
    if (!news || news.length === 0) {
      console.log('[SignalDetection] Nenhuma notícia encontrada');
      return [];
    }

    const signals: BuyingSignal[] = [];

    for (const article of news) {
      const fullText = `${article.title} ${article.snippet}`.toLowerCase();
      
      for (const [type, pattern] of Object.entries(this.signalPatterns)) {
        if (pattern.test(fullText)) {
          signals.push({
            type: type as SignalType,
            description: article.title,
            confidence_score: this.calculateConfidence(article, type as SignalType),
            source: article.source,
            detected_at: new Date(article.date),
            raw_data: article
          });
        }
      }
    }

    console.log('[SignalDetection] ✅ Sinais detectados:', signals.length);
    return signals;
  }

  async detectFromSearch(companyName: string, domain: string): Promise<BuyingSignal[]> {
    console.log('[SignalDetection] Analisando atividade digital:', companyName);
    
    const searchResults = await this.serper.search(
      `${companyName} ${domain} tecnologia inovação digital`
    );

    if (!searchResults) {
      return [];
    }

    const signals: BuyingSignal[] = [];
    const resultsText = JSON.stringify(searchResults).toLowerCase();

    // Detectar transformação digital
    if (resultsText.includes('cloud') || resultsText.includes('digital')) {
      signals.push({
        type: 'digital_transformation',
        description: 'Evidências de transformação digital e adoção de cloud',
        confidence_score: 0.7,
        source: 'Google Search',
        detected_at: new Date()
      });
    }

    // Detectar adoção de tecnologia
    const techKeywords = ['implementou', 'adotou', 'migrou', 'deployed'];
    if (techKeywords.some(kw => resultsText.includes(kw))) {
      signals.push({
        type: 'technology_adoption',
        description: 'Sinais de adoção recente de novas tecnologias',
        confidence_score: 0.65,
        source: 'Google Search',
        detected_at: new Date()
      });
    }

    console.log('[SignalDetection] ✅ Sinais de atividade digital:', signals.length);
    return signals;
  }

  analyzeSignals(signals: BuyingSignal[]): SignalAnalysis {
    const highConfidence = signals.filter(s => s.confidence_score >= 0.8).length;
    const mediumConfidence = signals.filter(s => s.confidence_score >= 0.6 && s.confidence_score < 0.8).length;
    const lowConfidence = signals.filter(s => s.confidence_score < 0.6).length;

    const signalsByType: Record<SignalType, number> = {
      funding_round: 0,
      leadership_change: 0,
      expansion: 0,
      technology_adoption: 0,
      partnership: 0,
      market_entry: 0,
      digital_transformation: 0,
      linkedin_activity: 0
    };

    signals.forEach(signal => {
      signalsByType[signal.type]++;
    });

    const overallScore = signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence_score, 0) / signals.length
      : 0;

    let recommendation: 'high_priority' | 'medium_priority' | 'low_priority';
    if (highConfidence >= 3 || overallScore >= 0.75) {
      recommendation = 'high_priority';
    } else if (signals.length >= 2 || overallScore >= 0.5) {
      recommendation = 'medium_priority';
    } else {
      recommendation = 'low_priority';
    }

    return {
      totalSignals: signals.length,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      signalsByType,
      overallScore,
      recommendation
    };
  }

  private calculateConfidence(article: SerperNewsResult, type: SignalType): number {
    let confidence = 0.6; // Base confidence

    // Boost para fontes confiáveis
    const reliableSources = ['valor econômico', 'exame', 'forbes', 'techcrunch', 'infomoney'];
    if (reliableSources.some(source => article.source.toLowerCase().includes(source))) {
      confidence += 0.15;
    }

    // Boost para artigos recentes
    const articleDate = new Date(article.date);
    const daysSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 30) {
      confidence += 0.1;
    }

    // Boost específico por tipo
    if (type === 'funding_round' && article.title.toLowerCase().includes('milhões')) {
      confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }
}

export function createSignalDetectionEngine(serper: SerperAdapter): SignalDetectionEngine {
  return new SignalDetectionEngineImpl(serper);
}
