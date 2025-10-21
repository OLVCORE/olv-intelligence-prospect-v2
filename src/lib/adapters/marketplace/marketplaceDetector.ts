// ✅ Adapter para detectar presença em marketplaces
import { logger } from '@/lib/utils/logger';
import { cache } from '@/lib/utils/cache';

export interface MarketplacePresence {
  platform: 'mercadolivre' | 'alibaba' | 'shopee' | 'amazon' | 'b2w' | 'magalu';
  hasPresence: boolean;
  storeUrl?: string;
  storeName?: string;
  productCount?: number;
  rating?: number;
  reviewCount?: number;
  salesVolume?: 'low' | 'medium' | 'high' | 'very_high';
  categories?: string[];
  verified?: boolean;
  registeredSince?: string;
}

export interface MarketplaceAnalysis {
  companyName: string;
  overallPresence: boolean;
  platforms: MarketplacePresence[];
  ecommerceMaturity: 'none' | 'beginner' | 'intermediate' | 'advanced';
  score: number; // 0-100
  opportunities: string[];
}

/**
 * Detecta presença da empresa em marketplaces
 */
export async function detectMarketplacePresence(
  companyName: string,
  domain?: string
): Promise<MarketplaceAnalysis> {
  const cacheKey = `marketplace:${companyName}:${domain || 'no-domain'}`;
  
  const cached = cache.get<MarketplaceAnalysis>(cacheKey);
  if (cached) {
    logger.info('MARKETPLACE_DETECTOR', 'Cache hit', { companyName });
    return cached;
  }

  try {
    logger.info('MARKETPLACE_DETECTOR', 'Detecting marketplace presence', { companyName });

    // Mock de dados realísticos para demonstração
    // Em produção, faria scraping ou usaria APIs dos marketplaces
    const mockPresence: MarketplacePresence[] = [
      {
        platform: 'mercadolivre',
        hasPresence: true,
        storeUrl: 'https://mercadolivre.com.br/lojas/empresa-demo',
        storeName: 'Loja Oficial Empresa Demo',
        productCount: 245,
        rating: 4.7,
        reviewCount: 1840,
        salesVolume: 'high',
        categories: ['Eletrônicos', 'Informática', 'Acessórios'],
        verified: true,
        registeredSince: '2020-03-15'
      },
      {
        platform: 'shopee',
        hasPresence: true,
        storeUrl: 'https://shopee.com.br/empresa-demo',
        storeName: 'Empresa Demo Official',
        productCount: 180,
        rating: 4.5,
        reviewCount: 890,
        salesVolume: 'medium',
        categories: ['Eletrônicos', 'Casa e Jardim'],
        verified: true,
        registeredSince: '2021-06-20'
      },
      {
        platform: 'amazon',
        hasPresence: false
      },
      {
        platform: 'alibaba',
        hasPresence: false
      },
      {
        platform: 'b2w',
        hasPresence: false
      },
      {
        platform: 'magalu',
        hasPresence: true,
        storeUrl: 'https://magazineluiza.com.br/empresa-demo',
        storeName: 'Empresa Demo',
        productCount: 98,
        rating: 4.3,
        reviewCount: 340,
        salesVolume: 'low',
        categories: ['Tecnologia'],
        verified: false,
        registeredSince: '2022-01-10'
      }
    ];

    const activePlatforms = mockPresence.filter((p) => p.hasPresence);
    const overallPresence = activePlatforms.length > 0;

    // Calcular maturidade de e-commerce
    let ecommerceMaturity: 'none' | 'beginner' | 'intermediate' | 'advanced' = 'none';
    if (activePlatforms.length === 0) {
      ecommerceMaturity = 'none';
    } else if (activePlatforms.length === 1) {
      ecommerceMaturity = 'beginner';
    } else if (activePlatforms.length <= 3) {
      ecommerceMaturity = 'intermediate';
    } else {
      ecommerceMaturity = 'advanced';
    }

    // Calcular score (0-100)
    let score = 0;
    score += activePlatforms.length * 15; // 15 pontos por plataforma
    activePlatforms.forEach((p) => {
      if (p.verified) score += 5;
      if (p.rating && p.rating >= 4.5) score += 5;
      if (p.salesVolume === 'very_high') score += 10;
      else if (p.salesVolume === 'high') score += 7;
      else if (p.salesVolume === 'medium') score += 4;
    });
    score = Math.min(100, score);

    // Identificar oportunidades
    const opportunities: string[] = [];
    if (!mockPresence.find((p) => p.platform === 'amazon' && p.hasPresence)) {
      opportunities.push('Expandir para Amazon - maior marketplace do Brasil');
    }
    if (!mockPresence.find((p) => p.platform === 'alibaba' && p.hasPresence)) {
      opportunities.push('Considerar Alibaba para expansão internacional');
    }
    if (activePlatforms.some((p) => !p.verified)) {
      opportunities.push('Verificar lojas não certificadas para aumentar confiança');
    }
    if (activePlatforms.some((p) => (p.rating || 0) < 4.5)) {
      opportunities.push('Melhorar avaliações nas plataformas com rating abaixo de 4.5');
    }

    const result: MarketplaceAnalysis = {
      companyName,
      overallPresence,
      platforms: mockPresence,
      ecommerceMaturity,
      score,
      opportunities
    };

    // Cachear por 24 horas
    cache.set(cacheKey, result, 24 * 60 * 60 * 1000);

    logger.info('MARKETPLACE_DETECTOR', 'Detection complete', {
      companyName,
      activePlatforms: activePlatforms.length,
      score
    });

    return result;
  } catch (error) {
    logger.error('MARKETPLACE_DETECTOR', 'Failed to detect presence', { error, companyName });
    throw error;
  }
}
