// ✅ Adapter avançado para detectar stack tecnológico completo
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
 * Analisa stack tecnológico completo da empresa
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
    logger.info('ADVANCED_TECH_STACK', 'Analyzing tech stack', { companyName, domain });

    // Mock de detecções realísticas
    // Em produção, usaria Wappalyzer, BuiltWith, ou análise de DNS/HTTP headers
    const mockTechnologies: TechnologyDetection[] = [
      {
        name: 'SAP ERP',
        category: 'erp',
        vendor: 'SAP',
        confidence: 0.85,
        version: 'S/4HANA 2021',
        licenseType: 'enterprise',
        cost: 'very_high',
        migrationDifficulty: 'very_hard'
      },
      {
        name: 'Salesforce',
        category: 'crm',
        vendor: 'Salesforce',
        confidence: 0.90,
        licenseType: 'professional',
        cost: 'high',
        migrationDifficulty: 'medium'
      },
      {
        name: 'Oracle Database',
        category: 'database',
        vendor: 'Oracle',
        confidence: 0.95,
        version: '19c',
        licenseType: 'enterprise',
        cost: 'very_high',
        migrationDifficulty: 'hard'
      },
      {
        name: 'AWS',
        category: 'cloud',
        vendor: 'Amazon',
        confidence: 0.80,
        cost: 'medium',
        migrationDifficulty: 'easy'
      },
      {
        name: 'Power BI',
        category: 'analytics',
        vendor: 'Microsoft',
        confidence: 0.75,
        licenseType: 'professional',
        cost: 'medium',
        migrationDifficulty: 'easy'
      },
      {
        name: 'Magento',
        category: 'ecommerce',
        vendor: 'Adobe',
        confidence: 0.70,
        licenseType: 'enterprise',
        cost: 'high',
        migrationDifficulty: 'medium'
      }
    ];

    // Separar por categorias
    const erpSystems = mockTechnologies.filter((t) => t.category === 'erp');
    const crmSystems = mockTechnologies.filter((t) => t.category === 'crm');
    const databases = mockTechnologies.filter((t) => t.category === 'database');
    const cloudProviders = mockTechnologies.filter((t) => t.category === 'cloud');

    // Determinar nível de maturidade
    const hasModernCloud = cloudProviders.some((c) => c.name.includes('AWS') || c.name.includes('Azure'));
    const hasLegacyERP = erpSystems.some((e) => e.migrationDifficulty === 'very_hard');
    
    let maturityLevel: 'legacy' | 'transitioning' | 'modern' | 'cutting_edge' = 'modern';
    if (hasLegacyERP && !hasModernCloud) {
      maturityLevel = 'legacy';
    } else if (hasLegacyERP && hasModernCloud) {
      maturityLevel = 'transitioning';
    } else if (hasModernCloud) {
      maturityLevel = 'cutting_edge';
    }

    // Oportunidades de migração para TOTVS
    const migrationOpportunities = [
      {
        technology: 'SAP ERP',
        totvsAlternative: 'TOTVS Protheus',
        reasoning: 'Custos de licenciamento SAP são 3x maiores. TOTVS oferece mesma funcionalidade com suporte local.',
        priority: 'high' as const
      },
      {
        technology: 'Salesforce',
        totvsAlternative: 'TOTVS CRM',
        reasoning: 'Integração nativa com ERP TOTVS reduz custos e melhora eficiência.',
        priority: 'medium' as const
      },
      {
        technology: 'Oracle Database',
        totvsAlternative: 'PostgreSQL + TOTVS DBAccess',
        reasoning: 'Eliminar custos de licenciamento Oracle (economia de até 70%).',
        priority: 'high' as const
      }
    ];

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
    const totvsProductRecommendations = [
      {
        product: 'TOTVS Protheus',
        reason: 'Substituir SAP ERP com economia de 60% e melhor suporte local',
        confidence: 0.90
      },
      {
        product: 'TOTVS Datasul',
        reason: 'Alternativa moderna para gestão industrial',
        confidence: 0.75
      },
      {
        product: 'TOTVS BI',
        reason: 'Integração nativa com ERP TOTVS, melhor que Power BI standalone',
        confidence: 0.85
      },
      {
        product: 'Fluig (BPM)',
        reason: 'Automatizar processos e reduzir dependência de customizações SAP',
        confidence: 0.80
      }
    ];

    // Calcular débito técnico total
    const highCostCount = mockTechnologies.filter((t) => t.cost === 'very_high' || t.cost === 'high').length;
    const hardMigrationCount = mockTechnologies.filter(
      (t) => t.migrationDifficulty === 'very_hard' || t.migrationDifficulty === 'hard'
    ).length;

    let totalTechDebt: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (highCostCount >= 3 || hardMigrationCount >= 2) {
      totalTechDebt = 'critical';
    } else if (highCostCount >= 2 || hardMigrationCount >= 1) {
      totalTechDebt = 'high';
    } else if (highCostCount >= 1) {
      totalTechDebt = 'medium';
    }

    const result: TechStackAnalysis = {
      companyName,
      domain,
      detectedTechnologies: mockTechnologies,
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
      technologiesFound: mockTechnologies.length,
      maturityLevel
    });

    return result;
  } catch (error) {
    logger.error('ADVANCED_TECH_STACK', 'Failed to analyze', { error, companyName });
    throw error;
  }
}
