// ✅ Orquestrador de Enrichment 360° - coordena todas as fontes de dados
import { logger } from '@/lib/utils/logger';
import { fetchLinkedInCompanyData } from '@/lib/adapters/social/linkedinCompany';
import { fetchJusBrasilData } from '@/lib/adapters/legal/jusbrasil';
import { fetchFinancialHealthData } from '@/lib/adapters/financial/creditScore';
import { aggregateNews } from '@/lib/adapters/news/newsAggregator';
import { detectMarketplacePresence } from '@/lib/adapters/marketplace/marketplaceDetector';
import { analyzeAdvancedTechStack } from '@/lib/adapters/tech/advancedTechStack';

export interface Company360Profile {
  // Identificação
  identification: {
    name: string;
    cnpj?: string;
    domain?: string;
    website?: string;
  };

  // Presença Digital
  digitalPresence: {
    linkedin?: any;
    social?: any;
    website?: any;
    overall_score: number;
  };

  // Saúde Jurídica
  legalHealth: {
    data?: any;
    risk_level: string;
    score: number;
  };

  // Saúde Financeira
  financialHealth: {
    data?: any;
    credit_score: number;
    risk_classification: string;
    predictive_score: number;
  };

  // Notícias e Reputação
  newsAndReputation: {
    news?: any;
    sentiment: string;
    recent_activity: boolean;
  };

  // Presença em Marketplaces
  marketplaces: {
    data?: any;
    maturity: string;
    score: number;
  };

  // Stack Tecnológico
  techStack: {
    data?: any;
    maturity_level: string;
    total_tech_debt: string;
    totvs_opportunities: number;
  };

  // Score Geral 360°
  overall360Score: number;

  // Classificação de Persona
  persona: {
    size: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
    techMaturity: 'legacy' | 'transitioning' | 'modern' | 'cutting_edge';
    digitalMaturity: 'low' | 'medium' | 'high' | 'very_high';
    buyingPropensity: number; // 0-100
    idealCustomerScore: number; // 0-100
  };

  // Recomendações TOTVS
  totvsRecommendations: {
    products: string[];
    approach: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedValue: string;
  };

  // Campanha Multidimensional
  campaignStrategy: {
    channels: string[];
    messaging: string[];
    timeline: string;
    budget: string;
  };
}

/**
 * Executa enrichment 360° completo da empresa
 * Coordena busca em paralelo de todas as fontes
 */
export async function executeEnrichment360(
  companyName: string,
  cnpj?: string,
  domain?: string,
  linkedinUrl?: string
): Promise<Company360Profile> {
  const startTime = Date.now();
  logger.info('ENRICHMENT_360', 'Starting full enrichment', { companyName, cnpj, domain });

  try {
    // 🚀 Executa todas as buscas em PARALELO para máxima performance
    const [
      linkedinData,
      legalData,
      financialData,
      newsData,
      marketplaceData,
      techStackData
    ] = await Promise.allSettled([
      linkedinUrl ? fetchLinkedInCompanyData(linkedinUrl) : Promise.resolve(null),
      cnpj ? fetchJusBrasilData(cnpj) : Promise.resolve(null),
      cnpj ? fetchFinancialHealthData(cnpj) : Promise.resolve(null),
      aggregateNews(companyName, cnpj),
      detectMarketplacePresence(companyName, domain),
      domain ? analyzeAdvancedTechStack(companyName, domain) : Promise.resolve(null)
    ]);

    // Extrair dados (com fallback para null se falhou)
    const linkedin = linkedinData.status === 'fulfilled' ? linkedinData.value : null;
    const legal = legalData.status === 'fulfilled' ? legalData.value : null;
    const financial = financialData.status === 'fulfilled' ? financialData.value : null;
    const news = newsData.status === 'fulfilled' ? newsData.value : null;
    const marketplace = marketplaceData.status === 'fulfilled' ? marketplaceData.value : null;
    const techStack = techStackData.status === 'fulfilled' ? techStackData.value : null;

    // Calcular scores
    const digitalPresenceScore = linkedin?.presenceScore || 50;
    const legalHealthScore = legal?.legalHealthScore || 75;
    const financialHealthScore = financial?.predictiveRiskScore || 70;
    const marketplaceScore = marketplace?.score || 0;
    const newsScore = news ? (news.sentimentAnalysis.score + 1) * 50 : 50; // Converter de -1..1 para 0..100

    // Score geral 360° (média ponderada)
    const overall360Score =
      digitalPresenceScore * 0.20 +
      legalHealthScore * 0.25 +
      financialHealthScore * 0.30 +
      marketplaceScore * 0.10 +
      newsScore * 0.15;

    // Classificar persona
    const persona = classifyPersona({
      financial,
      techStack,
      linkedin,
      marketplace,
      overall360Score
    });

    // Gerar recomendações TOTVS
    const totvsRecommendations = generateTOTVSRecommendations(persona, techStack, financial);

    // Gerar estratégia de campanha
    const campaignStrategy = generateCampaignStrategy(persona, totvsRecommendations);

    const profile: Company360Profile = {
      identification: {
        name: companyName,
        cnpj,
        domain,
        website: domain ? `https://${domain}` : undefined
      },
      digitalPresence: {
        linkedin,
        overall_score: digitalPresenceScore
      },
      legalHealth: {
        data: legal,
        risk_level: legal?.riskLevel || 'baixo',
        score: legalHealthScore
      },
      financialHealth: {
        data: financial,
        credit_score: financial?.creditScore || 0,
        risk_classification: financial?.riskClassification || 'C',
        predictive_score: financialHealthScore
      },
      newsAndReputation: {
        news,
        sentiment: news?.sentimentAnalysis.overall || 'neutral',
        recent_activity: news?.recentActivity || false
      },
      marketplaces: {
        data: marketplace,
        maturity: marketplace?.ecommerceMaturity || 'none',
        score: marketplaceScore
      },
      techStack: {
        data: techStack,
        maturity_level: techStack?.maturityLevel || 'modern',
        total_tech_debt: techStack?.totalTechDebt || 'low',
        totvs_opportunities: techStack?.migrationOpportunities.length || 0
      },
      overall360Score: Math.round(overall360Score * 10) / 10,
      persona,
      totvsRecommendations,
      campaignStrategy
    };

    const duration = Date.now() - startTime;
    logger.info('ENRICHMENT_360', 'Enrichment completed', {
      companyName,
      duration,
      overall360Score: profile.overall360Score,
      persona: persona.size
    });

    return profile;
  } catch (error) {
    logger.error('ENRICHMENT_360', 'Enrichment failed', { error, companyName });
    throw error;
  }
}

/**
 * Classifica a persona da empresa
 */
function classifyPersona(data: any): Company360Profile['persona'] {
  // Tamanho da empresa
  const employees = data.linkedin?.employeesOnLinkedIn || 0;
  let size: 'micro' | 'small' | 'medium' | 'large' | 'enterprise' = 'small';
  if (employees > 1000) size = 'enterprise';
  else if (employees > 500) size = 'large';
  else if (employees > 100) size = 'medium';
  else if (employees > 10) size = 'small';
  else size = 'micro';

  // Maturidade tecnológica
  const techMaturity = data.techStack?.maturityLevel || 'modern';

  // Maturidade digital
  const digitalScore = data.linkedin?.presenceScore || 50;
  let digitalMaturity: 'low' | 'medium' | 'high' | 'very_high' = 'medium';
  if (digitalScore >= 85) digitalMaturity = 'very_high';
  else if (digitalScore >= 70) digitalMaturity = 'high';
  else if (digitalScore >= 50) digitalMaturity = 'medium';
  else digitalMaturity = 'low';

  // Propensão de compra (0-100)
  let buyingPropensity = 50;
  if (data.techStack?.totalTechDebt === 'critical') buyingPropensity += 30;
  else if (data.techStack?.totalTechDebt === 'high') buyingPropensity += 20;
  if (data.financial?.creditScore >= 750) buyingPropensity += 10;
  if (data.marketplace?.ecommerceMaturity === 'advanced') buyingPropensity += 10;
  buyingPropensity = Math.min(100, buyingPropensity);

  // Score de cliente ideal (0-100)
  let idealCustomerScore = 0;
  if (size === 'enterprise' || size === 'large') idealCustomerScore += 30;
  if (techMaturity === 'transitioning' || techMaturity === 'legacy') idealCustomerScore += 25;
  if (data.financial?.creditScore >= 700) idealCustomerScore += 25;
  if (digitalMaturity === 'high' || digitalMaturity === 'very_high') idealCustomerScore += 20;
  idealCustomerScore = Math.min(100, idealCustomerScore);

  return {
    size,
    techMaturity,
    digitalMaturity,
    buyingPropensity,
    idealCustomerScore
  };
}

/**
 * Gera recomendações de produtos TOTVS
 */
function generateTOTVSRecommendations(
  persona: Company360Profile['persona'],
  techStack: any,
  financial: any
): Company360Profile['totvsRecommendations'] {
  const products: string[] = [];
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let estimatedValue = 'R$ 500K - R$ 1M';

  // Recomendar baseado em tamanho
  if (persona.size === 'enterprise' || persona.size === 'large') {
    products.push('TOTVS Protheus Enterprise');
    products.push('Fluig BPM Suite');
    products.push('TOTVS BI Corporativo');
    estimatedValue = 'R$ 2M - R$ 5M';
    priority = 'high';
  } else if (persona.size === 'medium') {
    products.push('TOTVS Protheus');
    products.push('TOTVS CRM');
    products.push('TOTVS BI');
    estimatedValue = 'R$ 500K - R$ 1.5M';
  } else {
    products.push('TOTVS Datasul');
    products.push('TOTVS CRM Start');
    estimatedValue = 'R$ 200K - R$ 500K';
  }

  // Recomendar baseado em débito técnico
  if (techStack?.totalTechDebt === 'critical') {
    products.push('TOTVS Consultoria Premium (ULV Internacional)');
    priority = 'critical';
  }

  // Recomendar baseado em oportunidades específicas
  if (techStack?.migrationOpportunities?.length > 0) {
    products.push('TOTVS Migration Services');
  }

  const approach =
    priority === 'critical'
      ? 'Abordagem urgente: empresa tem débito técnico crítico e alta propensão de compra'
      : priority === 'high'
      ? 'Abordagem consultiva: empresa tem perfil ideal e boas oportunidades de migração'
      : 'Abordagem educativa: empresa precisa entender benefícios da modernização';

  return {
    products,
    approach,
    priority,
    estimatedValue
  };
}

/**
 * Gera estratégia de campanha multidimensional
 */
function generateCampaignStrategy(
  persona: Company360Profile['persona'],
  recommendations: Company360Profile['totvsRecommendations']
): Company360Profile['campaignStrategy'] {
  const channels: string[] = [];
  const messaging: string[] = [];
  let timeline = '30 dias';
  let budget = 'R$ 50K';

  // Definir canais baseado em maturidade digital
  if (persona.digitalMaturity === 'very_high' || persona.digitalMaturity === 'high') {
    channels.push('LinkedIn Ads (Target: C-Level)');
    channels.push('Google Ads (Keywords: ERP, SAP alternativa)');
    channels.push('Email Marketing Personalizado');
  } else {
    channels.push('Televendas consultivo');
    channels.push('Evento presencial');
    channels.push('Email Marketing institucional');
  }

  // Definir mensagens baseado em prioridade
  if (recommendations.priority === 'critical') {
    messaging.push('Reduza custos de TI em até 60% migrando de SAP para TOTVS');
    messaging.push('Débito técnico crítico detectado - avaliação gratuita disponível');
    timeline = '15 dias (urgente)';
    budget = 'R$ 100K';
  } else if (recommendations.priority === 'high') {
    messaging.push('Modernize seu parque tecnológico com TOTVS');
    messaging.push('Consultoria Premium ULV Internacional - especialistas em migração');
    timeline = '30 dias';
    budget = 'R$ 75K';
  } else {
    messaging.push('Conheça as vantagens do ecossistema TOTVS');
    messaging.push('Cases de sucesso de empresas do seu segmento');
    timeline = '60 dias';
    budget = 'R$ 30K';
  }

  // Adicionar canal de parceria se empresa grande
  if (persona.size === 'enterprise' || persona.size === 'large') {
    channels.push('Executivo TOTVS dedicado');
    channels.push('Workshop exclusivo C-Level');
  }

  return {
    channels,
    messaging,
    timeline,
    budget
  };
}
