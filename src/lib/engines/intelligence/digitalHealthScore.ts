// ✅ Engine para calcular o Digital Health Score consolidado
import { logger } from '@/lib/utils/logger';
import type { LinkedInCompanyData } from '@/lib/adapters/social/linkedinCompany';
import type { JusBrasilData } from '@/lib/adapters/legal/jusbrasil';
import type { FinancialHealthData } from '@/lib/adapters/financial/creditScore';

export interface DigitalHealthScore {
  overall: number; // 0-100
  components: {
    digitalPresence: {
      score: number;
      weight: number;
      details: {
        linkedin: number;
        social: number;
        web: number;
        engagement: number;
      };
    };
    legalHealth: {
      score: number;
      weight: number;
      details: {
        totalProcesses: number;
        activeProcesses: number;
        riskLevel: string;
      };
    };
    financialHealth: {
      score: number;
      weight: number;
      details: {
        creditScore: number;
        riskClassification: string;
        predictiveRisk: number;
      };
    };
    reputation: {
      score: number;
      weight: number;
      details: {
        sentiment: number;
        reviews: number;
      };
    };
  };
  classification: 'Excelente' | 'Bom' | 'Regular' | 'Ruim' | 'Crítico';
  recommendations: string[];
  risks: Array<{
    type: string;
    severity: 'baixa' | 'media' | 'alta' | 'critica';
    description: string;
    source?: string;
  }>;
  opportunities: string[];
}

export interface DigitalHealthInput {
  linkedin?: LinkedInCompanyData;
  legal?: JusBrasilData;
  financial?: FinancialHealthData;
  reputation?: {
    overallRating: number;
    totalReviews: number;
    sentimentScore: number;
  };
}

/**
 * Calcula o Digital Health Score consolidado
 */
export function calculateDigitalHealthScore(input: DigitalHealthInput): DigitalHealthScore {
  logger.info('DIGITAL_HEALTH', 'Calculating overall score');

  // 1. Score de Presença Digital (peso 25%)
  const digitalPresenceScore = calculateDigitalPresenceScore(input.linkedin);

  // 2. Score de Saúde Jurídica (peso 30%)
  const legalHealthScore = calculateLegalScore(input.legal);

  // 3. Score de Saúde Financeira (peso 35%)
  const financialHealthScore = calculateFinancialScore(input.financial);

  // 4. Score de Reputação (peso 10%)
  const reputationScore = calculateReputationScore(input.reputation);

  // Calcular score geral ponderado
  const overall =
    digitalPresenceScore.score * 0.25 +
    legalHealthScore.score * 0.30 +
    financialHealthScore.score * 0.35 +
    reputationScore.score * 0.10;

  // Classificação
  const classification = classifyOverallScore(overall);

  // Gerar recomendações
  const recommendations = generateRecommendations(input, overall);

  // Identificar riscos
  const risks = identifyRisks(input);

  // Identificar oportunidades
  const opportunities = identifyOpportunities(input, overall);

  const result: DigitalHealthScore = {
    overall: Math.round(overall * 10) / 10,
    components: {
      digitalPresence: digitalPresenceScore,
      legalHealth: legalHealthScore,
      financialHealth: financialHealthScore,
      reputation: reputationScore
    },
    classification,
    recommendations,
    risks,
    opportunities
  };

  logger.info('DIGITAL_HEALTH', 'Score calculated', {
    overall: result.overall,
    classification: result.classification
  });

  return result;
}

function calculateDigitalPresenceScore(linkedin?: LinkedInCompanyData) {
  let score = 0;

  if (linkedin) {
    score = linkedin.presenceScore || 0;
  }

  return {
    score,
    weight: 0.25,
    details: {
      linkedin: linkedin?.presenceScore || 0,
      social: 0,
      web: 0,
      engagement: linkedin?.engagement?.engagementRate || 0
    }
  };
}

function calculateLegalScore(legal?: JusBrasilData) {
  const score = legal?.legalHealthScore || 75; // Default neutro

  return {
    score,
    weight: 0.30,
    details: {
      totalProcesses: legal?.totalProcesses || 0,
      activeProcesses: legal?.activeProcesses || 0,
      riskLevel: legal?.riskLevel || 'baixo'
    }
  };
}

function calculateFinancialScore(financial?: FinancialHealthData) {
  const score = financial?.predictiveRiskScore || 70; // Default neutro

  return {
    score,
    weight: 0.35,
    details: {
      creditScore: financial?.creditScore || 0,
      riskClassification: financial?.riskClassification || 'C',
      predictiveRisk: financial?.predictiveRiskScore || 0
    }
  };
}

function calculateReputationScore(reputation?: { overallRating: number; totalReviews: number; sentimentScore: number }) {
  if (!reputation) return { score: 75, weight: 0.10, details: { sentiment: 0, reviews: 0 } };

  // Score baseado em rating e volume de reviews
  let score = (reputation.overallRating / 5) * 50;
  
  if (reputation.totalReviews > 100) score += 25;
  else if (reputation.totalReviews > 50) score += 15;
  else if (reputation.totalReviews > 10) score += 10;

  score += (reputation.sentimentScore / 100) * 25;

  return {
    score: Math.min(100, score),
    weight: 0.10,
    details: {
      sentiment: reputation.sentimentScore,
      reviews: reputation.totalReviews
    }
  };
}

function classifyOverallScore(score: number): 'Excelente' | 'Bom' | 'Regular' | 'Ruim' | 'Crítico' {
  if (score >= 85) return 'Excelente';
  if (score >= 70) return 'Bom';
  if (score >= 50) return 'Regular';
  if (score >= 30) return 'Ruim';
  return 'Crítico';
}

function generateRecommendations(input: DigitalHealthInput, overall: number): string[] {
  const recs: string[] = [];

  // Presença digital
  if (!input.linkedin || (input.linkedin.presenceScore || 0) < 60) {
    recs.push('Fortalecer presença digital no LinkedIn com posts regulares e engajamento');
  }

  // Saúde jurídica
  if (input.legal && input.legal.activeProcesses > 5) {
    recs.push('Priorizar resolução de processos ativos para reduzir risco jurídico');
  }

  // Saúde financeira
  if (input.financial && input.financial.creditScore < 700) {
    recs.push('Melhorar score de crédito através de pagamentos pontuais e redução de dívidas');
  }

  if (input.financial && input.financial.debtIndicators.overdueDebt > 0) {
    recs.push('Regularizar pendências financeiras para melhorar classificação de risco');
  }

  // Score geral baixo
  if (overall < 50) {
    recs.push('Implementar plano de ação urgente para melhorar saúde digital e financeira');
  }

  return recs;
}

function identifyRisks(input: DigitalHealthInput): Array<{ type: string; severity: 'baixa' | 'media' | 'alta' | 'critica'; description: string; source?: string }> {
  const risks: Array<{ type: string; severity: 'baixa' | 'media' | 'alta' | 'critica'; description: string; source?: string }> = [];

  // Riscos jurídicos
  if (input.legal) {
    if (input.legal.riskLevel === 'critico') {
      risks.push({
        type: 'Jurídico',
        severity: 'critica',
        description: `${input.legal.activeProcesses} processos ativos com risco crítico`
      });
    } else if (input.legal.riskLevel === 'alto') {
      risks.push({
        type: 'Jurídico',
        severity: 'alta',
        description: `${input.legal.activeProcesses} processos ativos requerem atenção`
      });
    }
  }

  // Riscos financeiros
  if (input.financial) {
    if (input.financial.riskClassification === 'D' || input.financial.riskClassification === 'E') {
      risks.push({
        type: 'Financeiro',
        severity: 'critica',
        description: 'Score de crédito muito baixo indica alto risco de inadimplência'
      });
    }

    if (input.financial.debtIndicators.overdueDebt > 50000) {
      risks.push({
        type: 'Financeiro',
        severity: 'alta',
        description: `R$ ${input.financial.debtIndicators.overdueDebt.toLocaleString()} em dívidas vencidas`
      });
    }

    if (input.financial.trends.deteriorating) {
      risks.push({
        type: 'Tendência',
        severity: 'media',
        description: 'Saúde financeira em deterioração nos últimos meses'
      });
    }
  }

  return risks;
}

function identifyOpportunities(input: DigitalHealthInput, overall: number): string[] {
  const opportunities: string[] = [];

  // Boa saúde financeira
  if (input.financial && input.financial.creditScore >= 750) {
    opportunities.push('Empresa possui ótimo score de crédito - momento ideal para ofertas de crédito ou investimento');
  }

  // Boa presença digital
  if (input.linkedin && (input.linkedin.presenceScore || 0) >= 80) {
    opportunities.push('Forte presença no LinkedIn indica empresa digital e aberta a inovação');
  }

  // Crescimento
  if (input.financial && input.financial.trends.improving) {
    opportunities.push('Tendência de melhoria financeira indica momento de crescimento');
  }

  // Score geral bom
  if (overall >= 75) {
    opportunities.push('Score geral elevado - empresa é um prospect de alta qualidade');
  }

  return opportunities;
}
