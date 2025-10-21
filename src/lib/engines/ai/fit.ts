// ✅ Engine de análise de FIT TOTVS via IA
export interface TOTVSProduct {
  name: string;
  category: 'BÁSICO' | 'INTERMEDIÁRIO' | 'AVANÇADO' | 'ESPECIALIZADO';
  description: string;
}

export const TOTVS_PRODUCTS: TOTVSProduct[] = [
  // BÁSICO
  { name: 'TOTVS Protheus', category: 'BÁSICO', description: 'ERP completo para estruturar processos básicos' },
  { name: 'Fluig', category: 'BÁSICO', description: 'Plataforma de gestão de processos e documentos' },
  { name: 'TOTVS Backoffice', category: 'BÁSICO', description: 'Gestão administrativa simplificada' },
  
  // INTERMEDIÁRIO
  { name: 'TOTVS BI', category: 'INTERMEDIÁRIO', description: 'Business Intelligence e Analytics' },
  { name: 'TOTVS RH', category: 'INTERMEDIÁRIO', description: 'Gestão completa de recursos humanos' },
  { name: 'TOTVS Procurement', category: 'INTERMEDIÁRIO', description: 'Gestão de compras e suprimentos' },
  { name: 'TOTVS Manufatura', category: 'INTERMEDIÁRIO', description: 'Gestão industrial e produção' },
  
  // AVANÇADO
  { name: 'Carol AI', category: 'AVANÇADO', description: 'Plataforma de Inteligência Artificial' },
  { name: 'TOTVS Advanced Analytics', category: 'AVANÇADO', description: 'Analytics preditiva e prescritiva' },
  { name: 'TOTVS Data Platform', category: 'AVANÇADO', description: 'Plataforma de dados unificada' },
  
  // ESPECIALIZADOS
  { name: 'TOTVS Techfin', category: 'ESPECIALIZADO', description: 'Soluções financeiras' },
  { name: 'TOTVS Varejo', category: 'ESPECIALIZADO', description: 'Gestão para varejo' },
  { name: 'TOTVS Agro', category: 'ESPECIALIZADO', description: 'Gestão para agronegócio' },
];

export interface FitRecommendation {
  product: string;
  category: string;
  priority: 'ALTA' | 'MÉDIA' | 'BAIXA';
  reason: string;
  impact: string;
  implementation: string;
}

export interface FitAnalysis {
  fitScore: number;
  recommendations: FitRecommendation[];
  gaps: string[];
  strategy: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
  tcoBenefit: string;
  summary: string;
}

export interface FitInput {
  companyName: string;
  industry: string;
  employees: number;
  technologies: string[];
  maturityScores: {
    overall: number;
    infrastructure: number;
    systems: number;
    processes: number;
    security: number;
    innovation: number;
  };
}

export interface FitEngine {
  analyzeFit(input: FitInput): Promise<FitAnalysis>;
}

export class FitEngineImpl implements FitEngine {
  constructor(private lovableAI: { analyze: (prompt: string) => Promise<string> }) {}

  async analyzeFit(input: FitInput): Promise<FitAnalysis> {
    console.log('[FitEngine] Iniciando análise de fit para:', input.companyName);

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    try {
      const aiResponse = await this.lovableAI.analyze(
        `${systemPrompt}\n\n${userPrompt}`
      );

      const analysis = this.parseAnalysis(aiResponse);
      console.log('[FitEngine] ✅ Análise concluída. Fit Score:', analysis.fitScore);
      
      return analysis;
    } catch (error) {
      console.error('[FitEngine] Erro na análise:', error);
      
      // Fallback para análise básica
      return this.generateBasicAnalysis(input);
    }
  }

  private buildSystemPrompt(): string {
    return `Você é um especialista em análise de fit de produtos TOTVS para empresas brasileiras.

**Produtos TOTVS disponíveis:**

${TOTVS_PRODUCTS.map(p => `- ${p.name} (${p.category}): ${p.description}`).join('\n')}

Sua tarefa é analisar as tecnologias atuais, maturidade digital e necessidades da empresa para recomendar os produtos TOTVS mais adequados.`;
  }

  private buildUserPrompt(input: FitInput): string {
    return `Analise esta empresa e gere recomendações de produtos TOTVS:

**EMPRESA:** ${input.companyName}
**INDÚSTRIA:** ${input.industry}
**FUNCIONÁRIOS:** ${input.employees}
**TECNOLOGIAS ATUAIS:** ${input.technologies.join(', ') || 'Não detectadas'}

**SCORES DE MATURIDADE DIGITAL:**
- Score Geral: ${input.maturityScores.overall}/10
- Infraestrutura: ${input.maturityScores.infrastructure}/10
- Sistemas: ${input.maturityScores.systems}/10
- Processos: ${input.maturityScores.processes}/10
- Segurança: ${input.maturityScores.security}/10
- Inovação: ${input.maturityScores.innovation}/10

**INSTRUÇÕES:**
1. Analise as tecnologias atuais e identifique gaps
2. Considere o nível de maturidade digital
3. Recomende 3-5 produtos TOTVS específicos
4. Para cada produto, explique:
   - Por que é indicado
   - Que problema resolve
   - Impacto esperado
5. Sugira uma estratégia de implementação (curto/médio/longo prazo)
6. Calcule um score de FIT (0-100) baseado na aderência total

Retorne APENAS um JSON válido com esta estrutura:
{
  "fitScore": 85,
  "recommendations": [
    {
      "product": "TOTVS Protheus",
      "category": "BÁSICO",
      "priority": "ALTA",
      "reason": "Empresa precisa estruturar processos básicos de ERP",
      "impact": "Redução de 40% em retrabalho operacional",
      "implementation": "Curto prazo (3-6 meses)"
    }
  ],
  "gaps": ["Falta de ERP integrado", "Processos manuais"],
  "strategy": {
    "shortTerm": ["Implementar Protheus Core"],
    "mediumTerm": ["Adicionar módulos de BI"],
    "longTerm": ["Evoluir para Carol AI"]
  },
  "tcoBenefit": "Redução estimada de 30% no TCO ao consolidar sistemas",
  "summary": "Empresa com potencial para transformação digital completa"
}`;
  }

  private parseAnalysis(aiResponse: string): FitAnalysis {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      
      return JSON.parse(jsonMatch[0]) as FitAnalysis;
    } catch (error) {
      console.error('[FitEngine] Erro ao parsear JSON:', error);
      throw error;
    }
  }

  private generateBasicAnalysis(input: FitInput): FitAnalysis {
    // Análise básica baseada em maturidade
    const maturity = input.maturityScores.overall;
    const recommendations: FitRecommendation[] = [];

    if (maturity < 5) {
      recommendations.push({
        product: 'TOTVS Protheus',
        category: 'BÁSICO',
        priority: 'ALTA',
        reason: 'Score de maturidade baixo indica necessidade de estruturação básica',
        impact: 'Estruturação completa de processos operacionais',
        implementation: 'Curto prazo (3-6 meses)'
      });
    } else if (maturity < 7) {
      recommendations.push({
        product: 'TOTVS BI',
        category: 'INTERMEDIÁRIO',
        priority: 'ALTA',
        reason: 'Empresa tem base estruturada, precisa de inteligência de dados',
        impact: 'Tomada de decisão baseada em dados',
        implementation: 'Médio prazo (6-12 meses)'
      });
    } else {
      recommendations.push({
        product: 'Carol AI',
        category: 'AVANÇADO',
        priority: 'ALTA',
        reason: 'Alta maturidade digital permite adoção de IA',
        impact: 'Automação inteligente e insights preditivos',
        implementation: 'Longo prazo (12-18 meses)'
      });
    }

    return {
      fitScore: Math.round(maturity * 10),
      recommendations,
      gaps: ['Análise detalhada não disponível'],
      strategy: {
        shortTerm: ['Implementar solução básica'],
        mediumTerm: ['Expandir módulos'],
        longTerm: ['Inovação com IA']
      },
      tcoBenefit: 'A ser calculado com análise completa',
      summary: `Empresa com score de maturidade ${maturity}/10`
    };
  }
}

export function createFitEngine(
  lovableAI: { analyze: (prompt: string) => Promise<string> }
): FitEngine {
  return new FitEngineImpl(lovableAI);
}
