// ✅ Engine de Explicabilidade - Documenta metodologia de cada métrica
import { logger } from '@/lib/utils/logger';

export interface DataSource {
  name: string;
  type: 'api' | 'scraping' | 'database' | 'calculation';
  url?: string;
  apiKey?: string;
  timestamp: string;
  confidence: number; // 0-1
}

export interface ScoringCriteria {
  name: string;
  description: string;
  weight: number; // peso na composição final
  maxPoints: number;
  earnedPoints: number;
  calculation: string; // fórmula usada
  rationale: string; // por que esse critério importa
}

export interface MethodologyExplanation {
  metricName: string;
  finalScore: number;
  maxPossibleScore: number;
  unit: string; // %, pontos, etc.
  dataSources: DataSource[];
  criteria: ScoringCriteria[];
  calculation: {
    formula: string;
    steps: string[];
    variables: Record<string, any>;
  };
  interpretation: {
    level: 'critical' | 'low' | 'medium' | 'high' | 'excellent';
    meaning: string;
    implications: string[];
  };
  updatedAt: string;
}

/**
 * Gera explicação detalhada de uma métrica
 */
export function generateMethodologyExplanation(
  metricName: string,
  finalScore: number,
  config: {
    maxScore: number;
    unit: string;
    dataSources: DataSource[];
    criteria: ScoringCriteria[];
    formula: string;
    steps: string[];
    variables: Record<string, any>;
  }
): MethodologyExplanation {
  // Determinar nível baseado em score normalizado
  const normalizedScore = (finalScore / config.maxScore) * 100;
  let level: 'critical' | 'low' | 'medium' | 'high' | 'excellent';
  
  if (normalizedScore >= 85) level = 'excellent';
  else if (normalizedScore >= 70) level = 'high';
  else if (normalizedScore >= 50) level = 'medium';
  else if (normalizedScore >= 30) level = 'low';
  else level = 'critical';

  // Gerar interpretação contextual
  const interpretation = interpretScore(metricName, level, finalScore, config.maxScore);

  return {
    metricName,
    finalScore,
    maxPossibleScore: config.maxScore,
    unit: config.unit,
    dataSources: config.dataSources,
    criteria: config.criteria,
    calculation: {
      formula: config.formula,
      steps: config.steps,
      variables: config.variables
    },
    interpretation,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Interpreta score e gera insights contextuais
 */
function interpretScore(
  metricName: string,
  level: string,
  score: number,
  maxScore: number
): MethodologyExplanation['interpretation'] {
  const interpretations: Record<string, Record<string, any>> = {
    'Digital Health Score': {
      excellent: {
        meaning: 'Presença digital excepcional. Empresa altamente visível e engajada.',
        implications: [
          'Forte presença em múltiplos canais digitais',
          'Alta credibilidade e reputação online',
          'Baixo risco de problemas jurídicos ou financeiros',
          'Excelente oportunidade para parcerias'
        ]
      },
      high: {
        meaning: 'Boa presença digital com alguns pontos de melhoria.',
        implications: [
          'Presença estabelecida mas pode expandir',
          'Reputação sólida com poucas falhas',
          'Risco financeiro/jurídico controlado',
          'Boa oportunidade comercial'
        ]
      },
      medium: {
        meaning: 'Presença digital mediana. Necessita melhorias significativas.',
        implications: [
          'Presença limitada em canais digitais',
          'Reputação neutra ou mista',
          'Possíveis riscos financeiros ou jurídicos',
          'Requer due diligence mais profunda'
        ]
      },
      low: {
        meaning: 'Presença digital fraca. Empresa pouco visível online.',
        implications: [
          'Presença digital muito limitada',
          'Falta de transparência ou informações',
          'Riscos financeiros/jurídicos identificados',
          'Necessário cautela em negociações'
        ]
      },
      critical: {
        meaning: 'Presença digital crítica. Múltiplos sinais de alerta.',
        implications: [
          'Ausência ou presença digital negativa',
          'Problemas graves identificados',
          'Alto risco financeiro ou jurídico',
          'Recomenda-se evitar até melhorias'
        ]
      }
    },
    'LinkedIn Presence Score': {
      excellent: {
        meaning: 'Presença LinkedIn excepcional com alto engajamento.',
        implications: [
          'Perfil completo e atualizado',
          'Grande número de seguidores',
          'Alto engajamento em posts',
          'Empresa ativa e profissional'
        ]
      },
      high: {
        meaning: 'Boa presença no LinkedIn.',
        implications: [
          'Perfil bem estruturado',
          'Base sólida de seguidores',
          'Engajamento regular',
          'Oportunidades de conexão'
        ]
      },
      medium: {
        meaning: 'Presença LinkedIn básica.',
        implications: [
          'Perfil incompleto',
          'Poucos seguidores',
          'Baixo engajamento',
          'Precisa investir em conteúdo'
        ]
      },
      low: {
        meaning: 'Presença LinkedIn fraca.',
        implications: [
          'Perfil desatualizado',
          'Muito poucos seguidores',
          'Sem engajamento',
          'Necessário revisar estratégia'
        ]
      },
      critical: {
        meaning: 'Ausência ou presença LinkedIn crítica.',
        implications: [
          'Perfil inexistente ou abandonado',
          'Sem presença profissional',
          'Oportunidade perdida de networking',
          'Recomenda-se criar/reativar'
        ]
      }
    },
    'Credit Score': {
      excellent: {
        meaning: 'Excelente saúde financeira. Baixíssimo risco de crédito.',
        implications: [
          'Histórico de pagamentos impecável',
          'Solidez financeira comprovada',
          'Aprovação facilitada para crédito',
          'Condições comerciais favoráveis'
        ]
      },
      high: {
        meaning: 'Boa saúde financeira com pequenos alertas.',
        implications: [
          'Bom histórico de pagamentos',
          'Situação financeira estável',
          'Baixo risco de inadimplência',
          'Crédito disponível'
        ]
      },
      medium: {
        meaning: 'Saúde financeira mediana com riscos moderados.',
        implications: [
          'Histórico de pagamentos irregular',
          'Possíveis restrições creditícias',
          'Risco moderado de inadimplência',
          'Requer garantias adicionais'
        ]
      },
      low: {
        meaning: 'Saúde financeira fraca. Alto risco.',
        implications: [
          'Histórico de atrasos frequentes',
          'Restrições creditícias ativas',
          'Alto risco de inadimplência',
          'Necessário pagamento antecipado'
        ]
      },
      critical: {
        meaning: 'Situação financeira crítica. Inadimplência confirmada.',
        implications: [
          'Inadimplências graves registradas',
          'Sem acesso a crédito',
          'Risco muito alto de calote',
          'Recomenda-se evitar transações'
        ]
      }
    }
  };

  const metric = interpretations[metricName] || interpretations['Digital Health Score'];
  return metric[level] || {
    meaning: `Score de ${score}/${maxScore}`,
    implications: ['Análise detalhada necessária']
  };
}

/**
 * Gera análise contextual com IA
 */
export async function generateAIContextualAnalysis(
  companyName: string,
  metrics: MethodologyExplanation[]
): Promise<string> {
  try {
    logger.info('EXPLAINABILITY', 'Generating AI contextual analysis', { companyName });

    // Usar Lovable AI para análise contextual
    const { supabase } = await import('@/integrations/supabase/client');
    
    const prompt = `Analise os seguintes dados da empresa "${companyName}" e forneça insights estratégicos:

${metrics.map(m => `
**${m.metricName}**: ${m.finalScore}/${m.maxPossibleScore} ${m.unit}
- Nível: ${m.interpretation.level}
- Significado: ${m.interpretation.meaning}
- Critérios avaliados: ${m.criteria.map(c => `${c.name} (${c.earnedPoints}/${c.maxPoints})`).join(', ')}
`).join('\n')}

Forneça:
1. Diagnóstico geral da empresa
2. Principais pontos fortes
3. Maiores riscos identificados
4. Oportunidades de melhoria
5. Recomendação para abordagem comercial TOTVS

Seja objetivo e direto (máximo 300 palavras).`;

    const { data, error } = await supabase.functions.invoke('ai-contextual-analysis', {
      body: { prompt }
    });

    if (error) {
      logger.error('EXPLAINABILITY', 'AI analysis failed', { error });
      return 'Análise contextual indisponível no momento.';
    }

    return data.analysis || 'Análise contextual indisponível no momento.';
  } catch (error) {
    logger.error('EXPLAINABILITY', 'Failed to generate AI analysis', { error });
    return 'Análise contextual indisponível no momento.';
  }
}

/**
 * Formata explicação para exibição
 */
export function formatMethodologyForDisplay(explanation: MethodologyExplanation): string {
  return `
### ${explanation.metricName}

**Score Final**: ${explanation.finalScore}/${explanation.maxPossibleScore} ${explanation.unit}
**Classificação**: ${explanation.interpretation.level.toUpperCase()}

#### Significado
${explanation.interpretation.meaning}

#### Implicações
${explanation.interpretation.implications.map(i => `- ${i}`).join('\n')}

#### Metodologia de Cálculo

**Fórmula**: ${explanation.calculation.formula}

**Critérios Avaliados**:
${explanation.criteria.map(c => `
- **${c.name}** (peso ${c.weight * 100}%)
  - Pontos obtidos: ${c.earnedPoints}/${c.maxPoints}
  - Descrição: ${c.description}
  - Justificativa: ${c.rationale}
  - Cálculo: ${c.calculation}
`).join('\n')}

#### Fontes de Dados
${explanation.dataSources.map(ds => `
- **${ds.name}** (${ds.type})
  - Confiabilidade: ${(ds.confidence * 100).toFixed(0)}%
  - Coletado em: ${new Date(ds.timestamp).toLocaleString('pt-BR')}
  ${ds.url ? `- URL: ${ds.url}` : ''}
`).join('\n')}

---
*Última atualização: ${new Date(explanation.updatedAt).toLocaleString('pt-BR')}*
  `.trim();
}
