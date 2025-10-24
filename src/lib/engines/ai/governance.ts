// ✅ Engine de análise de GAPS DE GOVERNANÇA via IA
export interface GovernanceGap {
  category: 'PROCESSOS' | 'TECNOLOGIA' | 'PESSOAS' | 'GOVERNANCA' | 'COMPLIANCE' | 'SEGURANCA';
  title: string;
  problem: string;
  impact: string;
  solution: string;
}

export interface TOTVSRecommendation {
  product: string;
  category: 'BÁSICO' | 'INTERMEDIÁRIO' | 'AVANÇADO' | 'ESPECIALIZADO';
  priority: 'ALTA' | 'MÉDIA' | 'BAIXA';
  reason: string;
  implementation: string;
}

export interface GovernanceAnalysis {
  governanceGapScore: number; // 0-100 (quanto maior, mais gaps críticos)
  transformationPriority: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
  organizationalMaturityLevel: 'INICIAL' | 'ESTRUTURANDO' | 'GERENCIADO' | 'OTIMIZADO' | 'INOVADOR';
  requiresConsulting: boolean;
  gaps: GovernanceGap[];
  totvsRecommendations: TOTVSRecommendation[];
  transformationStrategy: {
    immediate: string[];
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
  consultingPitch: string;
  summary: string;
}

export interface GovernanceInput {
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

export interface GovernanceEngine {
  analyzeGaps(input: GovernanceInput): Promise<GovernanceAnalysis>;
}

export class GovernanceEngineImpl implements GovernanceEngine {
  constructor(private lovableAI: { analyze: (prompt: string) => Promise<string> }) {}

  async analyzeGaps(input: GovernanceInput): Promise<GovernanceAnalysis> {
    console.log('[GovernanceEngine] Iniciando análise de gaps para:', input.companyName);

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    try {
      const aiResponse = await this.lovableAI.analyze(
        `${systemPrompt}\n\n${userPrompt}`
      );

      const analysis = this.parseAnalysis(aiResponse);
      console.log('[GovernanceEngine] ✅ Análise concluída. Gap Score:', analysis.governanceGapScore);
      
      return analysis;
    } catch (error) {
      console.error('[GovernanceEngine] Erro na análise:', error);
      
      // Fallback para análise básica
      return this.generateBasicAnalysis(input);
    }
  }

  private buildSystemPrompt(): string {
    return `Você é um consultor especialista em transformação organizacional e governança para PMEs brasileiras.

**SUA MISSÃO:** Identificar GAPS CRÍTICOS de governança, processos e estrutura organizacional.

**CATEGORIAS DE GAPS:**
1. PROCESSOS - Falta de padronização
2. TECNOLOGIA - Infraestrutura deficiente
3. GOVERNANÇA - Falta de controle
4. COMPLIANCE - Riscos regulatórios
5. SEGURANÇA - Exposição a riscos
6. PESSOAS - Capital humano desorganizado

**IMPORTANTE:** 
- PMEs de capital fechado SÃO SUAS! Elas PRECISAM de transformação.
- Quanto MENORES os scores, MAIOR o potencial de consultoria.
- O objetivo NÃO é vender produtos, mas TRANSFORMAR a empresa.`;
  }

  private buildUserPrompt(input: GovernanceInput): string {
    return `Analise esta PME e identifique os GAPS CRÍTICOS de governança:

**EMPRESA:** ${input.companyName}
**INDÚSTRIA:** ${input.industry}
**FUNCIONÁRIOS:** ${input.employees}
**TECNOLOGIAS DETECTADAS:** ${input.technologies.length > 0 ? input.technologies.join(', ') : 'NENHUMA (❗ GAP CRÍTICO)'}

**SCORES DE MATURIDADE DIGITAL:**
- Score Geral: ${input.maturityScores.overall}/10
- Infraestrutura: ${input.maturityScores.infrastructure}/10
- Sistemas: ${input.maturityScores.systems}/10
- Processos: ${input.maturityScores.processes}/10
- Segurança: ${input.maturityScores.security}/10
- Inovação: ${input.maturityScores.innovation}/10

Retorne APENAS um JSON válido com estrutura completa de análise de gaps.`;
  }

  private parseAnalysis(aiResponse: string): GovernanceAnalysis {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      
      return JSON.parse(jsonMatch[0]) as GovernanceAnalysis;
    } catch (error) {
      console.error('[GovernanceEngine] Erro ao parsear JSON:', error);
      throw error;
    }
  }

  private generateBasicAnalysis(input: GovernanceInput): GovernanceAnalysis {
    const maturity = input.maturityScores.overall;
    const gapScore = Math.round((10 - maturity) * 10); // Inverte a lógica
    
    const gaps: GovernanceGap[] = [];
    
    if (maturity < 5) {
      gaps.push({
        category: 'PROCESSOS',
        title: 'Processos Manuais Críticos',
        problem: 'Gestão feita em planilhas desconectadas',
        impact: 'Retrabalho alto e decisões lentas',
        solution: 'Implementar ERP para integrar processos'
      });
      gaps.push({
        category: 'TECNOLOGIA',
        title: 'Infraestrutura Deficiente',
        problem: 'Sistemas legados sem integração',
        impact: 'Dados dispersos e sem visibilidade',
        solution: 'Modernizar stack tecnológica'
      });
    }

    return {
      governanceGapScore: gapScore,
      transformationPriority: gapScore > 70 ? 'CRITICO' : gapScore > 50 ? 'ALTO' : 'MEDIO',
      organizationalMaturityLevel: maturity < 3 ? 'INICIAL' : maturity < 5 ? 'ESTRUTURANDO' : maturity < 7 ? 'GERENCIADO' : 'OTIMIZADO',
      requiresConsulting: gapScore > 50,
      gaps,
      totvsRecommendations: [{
        product: 'TOTVS Protheus',
        category: 'BÁSICO',
        priority: 'ALTA',
        reason: 'Estruturar processos básicos de gestão',
        implementation: 'Curto prazo (3-6 meses)'
      }],
      transformationStrategy: {
        immediate: ['Diagnóstico de processos'],
        shortTerm: ['Implementar ERP básico'],
        mediumTerm: ['Adicionar BI'],
        longTerm: ['Transformação digital']
      },
      consultingPitch: `Empresa com ${gaps.length} gaps críticos identificados. Potencial de transformação organizacional significativo.`,
      summary: `PME com score de gap ${gapScore}/100. ${gaps.length} áreas críticas identificadas.`
    };
  }
}

export function createGovernanceEngine(
  lovableAI: { analyze: (prompt: string) => Promise<string> }
): GovernanceEngine {
  return new GovernanceEngineImpl(lovableAI);
}
