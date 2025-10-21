// ✅ Adapter avançado para detectar stack tecnológico via Serper API
import { logger } from '@/lib/utils/logger';
import { cache } from '@/lib/utils/cache';

export interface TechnologyDetection {
  name: string;
  category: 'erp' | 'crm' | 'database' | 'cloud' | 'analytics' | 'ecommerce' | 'marketing' | 'other';
  vendor: string;
  confidence: number; // 0-1
  version?: string;
  licenseType?: 'enterprise' | 'professional' | 'free' | 'unknown';
  cost?: 'low' | 'medium' | 'high' | 'very_high';
  migrationDifficulty?: 'easy' | 'medium' | 'hard' | 'very_hard';
}

export interface CompetitorAnalysis {
  competitor: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  totvsAdvantages: string[];
}

export interface TechStackAnalysis {
  companyName: string;
  domain?: string;
  detectedTechnologies: TechnologyDetection[];
  erpSystems: TechnologyDetection[];
  crmSystems: TechnologyDetection[];
  databases: TechnologyDetection[];
  cloudProviders: TechnologyDetection[];
  maturityLevel: 'legacy' | 'transitioning' | 'modern' | 'cutting_edge';
  migrationOpportunities: {
    technology: string;
    totvsAlternative: string;
    reasoning: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  competitorAnalysis: CompetitorAnalysis[];
  totvsProductRecommendations: {
    product: string;
    reason: string;
    confidence: number;
  }[];
  totalTechDebt: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Analisa stack tecnológico via Serper API
 */
export async function analyzeAdvancedTechStack(
  companyName: string,
  domain?: string
): Promise<TechStackAnalysis> {
  const cacheKey = `tech-stack-advanced:${domain || companyName}`;
  
  const cached = cache.get<TechStackAnalysis>(cacheKey);
  if (cached) {
    logger.info('ADVANCED_TECH_STACK', 'Cache hit', { companyName });
    return cached;
  }

  try {
    logger.info('ADVANCED_TECH_STACK', 'Analyzing tech stack via Serper', { companyName, domain });

    const serperApiKey = import.meta.env.VITE_SERPER_API_KEY;
    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY not configured');
    }

    // Buscar menções a tecnologias específicas
    const techQueries = domain ? [
      `site:${domain} "SAP"`,
      `site:${domain} "Oracle"`,
      `site:${domain} "JD Edwards"`,
      `site:${domain} "Microsoft Dynamics"`,
      `site:${domain} "Salesforce"`,
      `"${companyName}" ERP sistema`,
      `"${companyName}" software gestão`
    ] : [
      `"${companyName}" SAP ERP`,
      `"${companyName}" Oracle`,
      `"${companyName}" "JD Edwards"`,
      `"${companyName}" "Microsoft Dynamics"`,
      `"${companyName}" Salesforce`,
      `"${companyName}" ERP sistema`
    ];

    const searchResults = await Promise.allSettled(
      techQueries.map(async (query) => {
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: query,
            num: 5,
            gl: 'br'
          })
        });
        const data = await response.json();
        return data.organic || [];
      })
    );

    // Detectar tecnologias mencionadas
    const detectedTech: TechnologyDetection[] = [];
    const allSnippets = searchResults
      .filter(r => r.status === 'fulfilled')
      .flatMap((r: any) => r.value)
      .map((item: any) => (item.snippet || '').toLowerCase())
      .join(' ');

    // Detectar ERPs
    if (allSnippets.includes('sap')) {
      detectedTech.push({
        name: 'SAP ERP',
        category: 'erp',
        vendor: 'SAP',
        confidence: 0.85,
        version: 'Desconhecida',
        licenseType: 'enterprise',
        cost: 'very_high',
        migrationDifficulty: 'very_hard'
      });
    }

    if (allSnippets.match(/oracle|jd\s*edwards|peoplesoft/)) {
      detectedTech.push({
        name: 'Oracle / JD Edwards',
        category: 'erp',
        vendor: 'Oracle',
        confidence: 0.80,
        version: 'Desconhecida',
        licenseType: 'enterprise',
        cost: 'very_high',
        migrationDifficulty: 'very_hard'
      });
    }

    if (allSnippets.match(/microsoft\s*dynamics|dynamics\s*365/)) {
      detectedTech.push({
        name: 'Microsoft Dynamics',
        category: 'erp',
        vendor: 'Microsoft',
        confidence: 0.75,
        version: 'Desconhecida',
        licenseType: 'professional',
        cost: 'high',
        migrationDifficulty: 'hard'
      });
    }

    if (allSnippets.includes('salesforce')) {
      detectedTech.push({
        name: 'Salesforce',
        category: 'crm',
        vendor: 'Salesforce',
        confidence: 0.80,
        licenseType: 'professional',
        cost: 'high',
        migrationDifficulty: 'medium'
      });
    }

    // Separar por categorias
    const erpSystems = detectedTech.filter((t) => t.category === 'erp');
    const crmSystems = detectedTech.filter((t) => t.category === 'crm');
    const databases = detectedTech.filter((t) => t.category === 'database');
    const cloudProviders = detectedTech.filter((t) => t.category === 'cloud');

    // Determinar nível de maturidade
    let maturityLevel: 'legacy' | 'transitioning' | 'modern' | 'cutting_edge' = 'modern';
    let totalTechDebt: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const hasLegacyERP = detectedTech.some(t => 
      t.name.includes('SAP') || t.name.includes('Oracle') || t.name.includes('JD Edwards')
    );

    if (hasLegacyERP) {
      maturityLevel = 'transitioning';
      totalTechDebt = 'high';
    }

    // Oportunidades de migração para TOTVS
    const migrationOpportunities = [];
    
    if (hasLegacyERP) {
      migrationOpportunities.push({
        technology: 'SAP / Oracle',
        totvsAlternative: 'TOTVS Protheus',
        reasoning: 'Redução de custos de licenciamento em até 60%. TOTVS oferece mesma funcionalidade com suporte local.',
        priority: 'high' as const
      });
    }

    if (crmSystems.length > 0) {
      migrationOpportunities.push({
        technology: crmSystems[0].name,
        totvsAlternative: 'TOTVS CRM',
        reasoning: 'Integração nativa com ERP TOTVS reduz custos e melhora eficiência.',
        priority: 'medium' as const
      });
    }

    // Análise competitiva
    const competitorAnalysis: CompetitorAnalysis[] = [
      {
        competitor: 'SAP',
        marketShare: 35,
        strengths: ['Nome forte no mercado', 'Funcionalidades extensivas', 'Integração global'],
        weaknesses: ['Custo muito alto', 'Implementação complexa', 'Suporte internacional'],
        totvsAdvantages: [
          'Custo 60% menor',
          'Suporte local em português',
          'Implementação 50% mais rápida',
          'Conhecimento profundo do mercado brasileiro'
        ]
      },
      {
        competitor: 'Oracle',
        marketShare: 25,
        strengths: ['Database robusto', 'Ecossistema completo'],
        weaknesses: ['Licenciamento caro', 'Lock-in vendor', 'Complexidade'],
        totvsAdvantages: [
          'Sem custos de licenciamento database',
          'Flexibilidade tecnológica',
          'Stack moderna e cloud-native'
        ]
      }
    ];

    // Recomendações de produtos TOTVS
    const totvsProductRecommendations = [];
    
    if (hasLegacyERP) {
      totvsProductRecommendations.push({
        product: 'TOTVS Protheus',
        reason: 'Substituir SAP/Oracle ERP com economia de 60% e melhor suporte local',
        confidence: 0.90
      });
      totvsProductRecommendations.push({
        product: 'Consultoria Premium ULV Internacional',
        reason: 'Migração complexa requer expertise especializada para garantir sucesso',
        confidence: 0.95
      });
    }

    totvsProductRecommendations.push({
      product: 'TOTVS BI',
      reason: 'Integração nativa com ERP TOTVS para analytics avançado',
      confidence: 0.85
    });

    totvsProductRecommendations.push({
      product: 'Fluig (BPM)',
      reason: 'Automatizar processos e reduzir dependência de customizações',
      confidence: 0.80
    });

    const result: TechStackAnalysis = {
      companyName,
      domain,
      detectedTechnologies: detectedTech,
      erpSystems,
      crmSystems,
      databases,
      cloudProviders,
      maturityLevel,
      migrationOpportunities,
      competitorAnalysis,
      totvsProductRecommendations,
      totalTechDebt
    };

    // Cachear por 7 dias
    cache.set(cacheKey, result, 7 * 24 * 60 * 60 * 1000);

    logger.info('ADVANCED_TECH_STACK', 'Analysis complete', {
      companyName,
      technologiesFound: detectedTech.length,
      maturityLevel
    });

    return result;
  } catch (error) {
    logger.error('ADVANCED_TECH_STACK', 'Failed to analyze', { error, companyName });
    
    // Retornar análise vazia em caso de erro
    return {
      companyName,
      domain,
      detectedTechnologies: [],
      erpSystems: [],
      crmSystems: [],
      databases: [],
      cloudProviders: [],
      maturityLevel: 'modern',
      migrationOpportunities: [],
      competitorAnalysis: [],
      totvsProductRecommendations: [],
      totalTechDebt: 'low'
    };
  }
}
