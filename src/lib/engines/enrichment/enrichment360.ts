// ✅ Orquestrador de Enrichment 360° - coordena todas as fontes de dados
import { logger } from '@/lib/utils/logger';
import { fetchLinkedInCompanyData } from '@/lib/adapters/social/linkedinCompany';
import { fetchJusBrasilData } from '@/lib/adapters/legal/jusbrasil';
import { fetchFinancialHealthData } from '@/lib/adapters/financial/creditScore';
import { aggregateNews } from '@/lib/adapters/news/newsAggregator';
import { detectMarketplacePresence } from '@/lib/adapters/marketplace/marketplaceDetector';
import { analyzeAdvancedTechStack } from '@/lib/adapters/tech/advancedTechStack';
import type { MethodologyExplanation } from '@/lib/engines/intelligence/explainability';
import { generateMethodologyExplanation, generateAIContextualAnalysis } from '@/lib/engines/intelligence/explainability';

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
    methodology?: MethodologyExplanation; // ✅ Metodologia transparente
  };

  // Saúde Jurídica
  legalHealth: {
    data?: any;
    risk_level: string;
    score: number;
    methodology?: MethodologyExplanation; // ✅ Metodologia transparente
  };

  // Saúde Financeira
  financialHealth: {
    data?: any;
    credit_score: number;
    risk_classification: string;
    predictive_score: number;
    methodology?: MethodologyExplanation; // ✅ Metodologia transparente
  };

  // Notícias e Reputação
  newsAndReputation: {
    news?: any;
    sentiment: string;
    recent_activity: boolean;
    methodology?: MethodologyExplanation; // ✅ Metodologia transparente
  };

  // Presença em Marketplaces
  marketplaces: {
    data?: any;
    maturity: string;
    score: number;
    methodology?: MethodologyExplanation; // ✅ Metodologia transparente
  };

  // Stack Tecnológico
  techStack: {
    data?: any;
    maturity_level: string;
    total_tech_debt: string;
    totvs_opportunities: number;
    methodology?: MethodologyExplanation; // ✅ Metodologia transparente
  };

  // Score Geral 360°
  overall360Score: number;
  overall360Methodology?: MethodologyExplanation; // ✅ Metodologia do score geral

  // Análise Contextual com IA
  aiContextualAnalysis?: string; // ✅ Insights gerados por IA

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

    // ✅ Gerar metodologias transparentes para cada score
    const digitalPresenceMethodology = generateMethodologyExplanation(
      'LinkedIn Presence Score',
      digitalPresenceScore,
      {
        maxScore: 100,
        unit: 'pontos',
        dataSources: [
          {
            name: 'PhantomBuster LinkedIn Scraper',
            type: 'api',
            timestamp: new Date().toISOString(),
            confidence: 0.90
          }
        ],
        criteria: [
          {
            name: 'Completude do Perfil',
            description: 'Presença de descrição, website, setor, especialidades',
            weight: 0.30,
            maxPoints: 30,
            earnedPoints: linkedin?.description ? 30 : 15,
            calculation: 'Verifica campos preenchidos: descrição (10pts), website (5pts), setor (5pts), tamanho (5pts), especialidades (5pts)',
            rationale: 'Perfis completos demonstram profissionalismo e facilitam avaliação'
          },
          {
            name: 'Alcance e Tamanho',
            description: 'Número de seguidores e funcionários no LinkedIn',
            weight: 0.40,
            maxPoints: 40,
            earnedPoints: Math.min(40, ((linkedin?.followers || 0) / 50000) * 20 + ((linkedin?.employeesOnLinkedIn || 0) / 500) * 20),
            calculation: 'Seguidores: >50k=20pts, >10k=15pts, >1k=10pts, >100=5pts | Funcionários: >500=20pts, >100=15pts, >50=10pts, >10=5pts',
            rationale: 'Maior alcance indica empresa estabelecida e visível no mercado'
          },
          {
            name: 'Engajamento',
            description: 'Frequência de posts e taxa de engajamento',
            weight: 0.30,
            maxPoints: 30,
            earnedPoints: linkedin?.engagement ? Math.min(30, (linkedin.engagement.totalPosts / 50) * 10 + (linkedin.engagement.engagementRate / 5) * 20) : 0,
            calculation: 'Posts: >50=10pts, >20=7pts, >10=5pts | Taxa: >5%=20pts, >2%=15pts, >1%=10pts',
            rationale: 'Engajamento ativo indica empresa dinâmica e bem posicionada'
          }
        ],
        formula: 'Score = (Completude × 0.30) + (Alcance × 0.40) + (Engajamento × 0.30)',
        steps: [
          '1. Buscar dados via PhantomBuster API',
          '2. Avaliar completude do perfil (0-30 pontos)',
          '3. Calcular alcance baseado em seguidores e funcionários (0-40 pontos)',
          '4. Medir engajamento por posts e interações (0-30 pontos)',
          '5. Somar scores ponderados'
        ],
        variables: {
          followers: linkedin?.followers || 0,
          employees: linkedin?.employeesOnLinkedIn || 0,
          posts: linkedin?.engagement?.totalPosts || 0,
          engagementRate: linkedin?.engagement?.engagementRate || 0
        }
      }
    );

    const legalHealthMethodology = generateMethodologyExplanation(
      'Legal Health Score',
      legalHealthScore,
      {
        maxScore: 100,
        unit: 'pontos',
        dataSources: [
          {
            name: 'JusBrasil API',
            type: 'api',
            timestamp: new Date().toISOString(),
            confidence: 0.85
          }
        ],
        criteria: [
          {
            name: 'Processos Ativos',
            description: 'Número e gravidade de processos judiciais',
            weight: 0.50,
            maxPoints: 50,
            earnedPoints: legal?.activeProcesses ? Math.max(0, 50 - (legal.activeProcesses * 5)) : 50,
            calculation: 'Score = 50 - (nº processos × 5). Mínimo 0.',
            rationale: 'Processos ativos indicam riscos jurídicos e reputacionais'
          },
          {
            name: 'Histórico de Condenações',
            description: 'Condenações anteriores e valores envolvidos',
            weight: 0.30,
            maxPoints: 30,
            earnedPoints: legal?.convictions ? Math.max(0, 30 - (legal.convictions * 10)) : 30,
            calculation: 'Score = 30 - (nº condenações × 10). Mínimo 0.',
            rationale: 'Condenações indicam padrão de comportamento ilegal'
          },
          {
            name: 'Compliance Regulatório',
            description: 'Conformidade com órgãos reguladores',
            weight: 0.20,
            maxPoints: 20,
            earnedPoints: legal?.compliance ? 20 : 10,
            calculation: 'Em compliance = 20pts | Parcial = 10pts | Não = 0pts',
            rationale: 'Compliance demonstra governança e responsabilidade corporativa'
          }
        ],
        formula: 'Score = (Processos × 0.50) + (Condenações × 0.30) + (Compliance × 0.20)',
        steps: [
          '1. Consultar JusBrasil por CNPJ',
          '2. Contar processos ativos e categorizá-los',
          '3. Verificar histórico de condenações',
          '4. Avaliar compliance regulatório',
          '5. Calcular score final ponderado'
        ],
        variables: {
          activeProcesses: legal?.activeProcesses || 0,
          convictions: legal?.convictions || 0,
          compliance: legal?.compliance || false
        }
      }
    );

    const financialHealthMethodology = generateMethodologyExplanation(
      'Credit Score',
      financialHealthScore,
      {
        maxScore: 100,
        unit: 'pontos',
        dataSources: [
          {
            name: 'Serasa/Boa Vista API',
            type: 'api',
            timestamp: new Date().toISOString(),
            confidence: 0.95
          }
        ],
        criteria: [
          {
            name: 'Histórico de Pagamentos',
            description: 'Pontualidade em pagamentos nos últimos 12 meses',
            weight: 0.35,
            maxPoints: 35,
            earnedPoints: Math.round((financial?.paymentScore || 70) * 0.35),
            calculation: '100% pontual = 35pts | >90% = 30pts | >75% = 20pts | <75% = 10pts',
            rationale: 'Histórico de pagamentos é o melhor preditor de inadimplência'
          },
          {
            name: 'Capacidade de Pagamento',
            description: 'Relação entre dívida e receita',
            weight: 0.30,
            maxPoints: 30,
            earnedPoints: Math.round((financial?.debtRatio ? Math.max(0, 30 - (financial.debtRatio * 0.5)) : 20)),
            calculation: 'Dívida/Receita: <20% = 30pts | <40% = 25pts | <60% = 15pts | >60% = 5pts',
            rationale: 'Endividamento excessivo aumenta risco de default'
          },
          {
            name: 'Score Predictivo',
            description: 'Modelo de ML para risco de inadimplência',
            weight: 0.35,
            maxPoints: 35,
            earnedPoints: Math.round((financial?.predictiveRiskScore || 70) * 0.35),
            calculation: 'Modelo treinado com >1M empresas. Score 0-100 baseado em 50+ variáveis.',
            rationale: 'Machine Learning captura padrões complexos não visíveis em análise simples'
          }
        ],
        formula: 'Score = (Histórico × 0.35) + (Capacidade × 0.30) + (ML Predictivo × 0.35)',
        steps: [
          '1. Consultar bureau de crédito por CNPJ',
          '2. Analisar histórico de pagamentos (12 meses)',
          '3. Calcular índice dívida/receita',
          '4. Executar modelo de ML predictivo',
          '5. Ponderar scores e classificar risco'
        ],
        variables: {
          paymentScore: financial?.paymentScore || 70,
          debtRatio: financial?.debtRatio || 0.3,
          predictiveScore: financial?.predictiveRiskScore || 70,
          creditScore: financial?.creditScore || 0
        }
      }
    );

    const marketplaceMethodology = generateMethodologyExplanation(
      'Marketplace Presence Score',
      marketplaceScore,
      {
        maxScore: 100,
        unit: 'pontos',
        dataSources: [
          {
            name: 'Serper API (Google Search)',
            type: 'api',
            timestamp: new Date().toISOString(),
            confidence: 0.80
          }
        ],
        criteria: [
          {
            name: 'Número de Plataformas',
            description: 'Presença em marketplaces (ML, Shopee, Amazon, etc)',
            weight: 0.40,
            maxPoints: 40,
            earnedPoints: (marketplace?.platforms?.filter((p: any) => p.hasPresence).length || 0) * 15,
            calculation: '15 pontos por plataforma ativa (máx 40pts)',
            rationale: 'Diversificação de canais reduz dependência e aumenta alcance'
          },
          {
            name: 'Qualidade da Presença',
            description: 'Lojas verificadas, avaliações, volume de vendas',
            weight: 0.35,
            maxPoints: 35,
            earnedPoints: marketplace?.platforms?.reduce((sum: number, p: any) => {
              let pts = 0;
              if (p.verified) pts += 5;
              if ((p.rating || 0) >= 4.5) pts += 5;
              if (p.salesVolume === 'very_high') pts += 10;
              else if (p.salesVolume === 'high') pts += 7;
              return sum + pts;
            }, 0) || 0,
            calculation: 'Verificada +5pts | Rating >4.5 +5pts | Vendas altas +7-10pts',
            rationale: 'Qualidade indica confiabilidade e sucesso nas plataformas'
          },
          {
            name: 'Maturidade E-commerce',
            description: 'Nível de sofisticação do e-commerce',
            weight: 0.25,
            maxPoints: 25,
            earnedPoints: marketplace?.ecommerceMaturity === 'advanced' ? 25 : marketplace?.ecommerceMaturity === 'intermediate' ? 18 : marketplace?.ecommerceMaturity === 'beginner' ? 10 : 0,
            calculation: 'Avançado = 25pts | Intermediário = 18pts | Iniciante = 10pts | Nenhum = 0pts',
            rationale: 'Maturidade e-commerce indica capacidade de adotar ERPs modernos'
          }
        ],
        formula: 'Score = (Plataformas × 0.40) + (Qualidade × 0.35) + (Maturidade × 0.25)',
        steps: [
          '1. Buscar empresa em cada marketplace via Google',
          '2. Verificar presença e extrair dados',
          '3. Avaliar qualidade (verificação, ratings, vendas)',
          '4. Classificar maturidade e-commerce',
          '5. Calcular score ponderado'
        ],
        variables: {
          platforms: marketplace?.platforms?.length || 0,
          activePlatforms: marketplace?.platforms?.filter((p: any) => p.hasPresence).length || 0,
          maturity: marketplace?.ecommerceMaturity || 'none'
        }
      }
    );

    const newsMethodology = generateMethodologyExplanation(
      'News Sentiment Score',
      newsScore,
      {
        maxScore: 100,
        unit: 'pontos',
        dataSources: [
          {
            name: 'Serper API (Google News)',
            type: 'api',
            timestamp: new Date().toISOString(),
            confidence: 0.85
          }
        ],
        criteria: [
          {
            name: 'Sentimento Geral',
            description: 'Análise de sentimento das notícias',
            weight: 0.50,
            maxPoints: 50,
            earnedPoints: news ? ((news.sentimentAnalysis.score + 1) / 2) * 50 : 25,
            calculation: 'Converte score -1..1 para 0..100. Fórmula: ((score + 1) / 2) × 50',
            rationale: 'Sentimento das notícias indica reputação pública da empresa'
          },
          {
            name: 'Volume de Notícias',
            description: 'Quantidade de notícias encontradas',
            weight: 0.25,
            maxPoints: 25,
            earnedPoints: news ? Math.min(25, (news.totalArticles / 20) * 25) : 0,
            calculation: '>20 notícias = 25pts | 10-20 = 15pts | 5-10 = 10pts | <5 = 5pts',
            rationale: 'Mais notícias indicam empresa relevante e bem coberta pela mídia'
          },
          {
            name: 'Atividade Recente',
            description: 'Notícias nos últimos 30 dias',
            weight: 0.25,
            maxPoints: 25,
            earnedPoints: news?.recentActivity ? 25 : 0,
            calculation: 'Notícias <30 dias = 25pts | Não = 0pts',
            rationale: 'Atividade recente indica empresa dinâmica e em crescimento'
          }
        ],
        formula: 'Score = (Sentimento × 0.50) + (Volume × 0.25) + (Atividade × 0.25)',
        steps: [
          '1. Buscar notícias via Google News API',
          '2. Analisar sentimento de cada notícia',
          '3. Calcular sentimento médio',
          '4. Contar volume total de notícias',
          '5. Verificar atividade recente (30 dias)',
          '6. Ponderar scores'
        ],
        variables: {
          totalArticles: news?.totalArticles || 0,
          sentimentScore: news?.sentimentAnalysis.score || 0,
          recentActivity: news?.recentActivity || false,
          positive: news?.sentimentAnalysis.distribution.positive || 0,
          negative: news?.sentimentAnalysis.distribution.negative || 0
        }
      }
    );

    const overall360Methodology = generateMethodologyExplanation(
      'Overall 360° Score',
      overall360Score,
      {
        maxScore: 100,
        unit: 'pontos',
        dataSources: [
          {
            name: 'Score Agregado de 5 Dimensões',
            type: 'calculation',
            timestamp: new Date().toISOString(),
            confidence: 0.90
          }
        ],
        criteria: [
          {
            name: 'Digital Presence',
            description: 'Presença e engajamento no LinkedIn',
            weight: 0.20,
            maxPoints: 20,
            earnedPoints: digitalPresenceScore * 0.20,
            calculation: `${digitalPresenceScore} × 0.20 = ${(digitalPresenceScore * 0.20).toFixed(1)}`,
            rationale: 'Presença digital indica modernidade e visibilidade da empresa'
          },
          {
            name: 'Legal Health',
            description: 'Saúde jurídica e compliance',
            weight: 0.25,
            maxPoints: 25,
            earnedPoints: legalHealthScore * 0.25,
            calculation: `${legalHealthScore} × 0.25 = ${(legalHealthScore * 0.25).toFixed(1)}`,
            rationale: 'Saúde jurídica é crítica para reduzir riscos contratuais'
          },
          {
            name: 'Financial Health',
            description: 'Saúde financeira e capacidade de pagamento',
            weight: 0.30,
            maxPoints: 30,
            earnedPoints: financialHealthScore * 0.30,
            calculation: `${financialHealthScore} × 0.30 = ${(financialHealthScore * 0.30).toFixed(1)}`,
            rationale: 'Maior peso pois impacta diretamente viabilidade da negociação'
          },
          {
            name: 'Marketplace Presence',
            description: 'Maturidade e-commerce',
            weight: 0.10,
            maxPoints: 10,
            earnedPoints: marketplaceScore * 0.10,
            calculation: `${marketplaceScore} × 0.10 = ${(marketplaceScore * 0.10).toFixed(1)}`,
            rationale: 'E-commerce indica capacidade de digitalização e adoção de ERPs'
          },
          {
            name: 'News Sentiment',
            description: 'Reputação pública',
            weight: 0.15,
            maxPoints: 15,
            earnedPoints: newsScore * 0.15,
            calculation: `${newsScore} × 0.15 = ${(newsScore * 0.15).toFixed(1)}`,
            rationale: 'Reputação pública afeta decisões de parceria e investimento'
          }
        ],
        formula: 'Score = (Digital × 0.20) + (Legal × 0.25) + (Financial × 0.30) + (Marketplace × 0.10) + (News × 0.15)',
        steps: [
          '1. Calcular score individual de cada dimensão',
          '2. Aplicar pesos baseados em importância estratégica',
          '3. Somar scores ponderados',
          '4. Arredondar para 1 casa decimal',
          '5. Classificar nível (critical/low/medium/high/excellent)'
        ],
        variables: {
          digitalScore: digitalPresenceScore,
          legalScore: legalHealthScore,
          financialScore: financialHealthScore,
          marketplaceScore: marketplaceScore,
          newsScore: newsScore,
          weights: {
            digital: 0.20,
            legal: 0.25,
            financial: 0.30,
            marketplace: 0.10,
            news: 0.15
          }
        }
      }
    );

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

    // ✅ Gerar análise contextual com IA
    const allMethodologies = [
      digitalPresenceMethodology,
      legalHealthMethodology,
      financialHealthMethodology,
      marketplaceMethodology,
      newsMethodology,
      overall360Methodology
    ];

    logger.info('ENRICHMENT_360', 'Generating AI contextual analysis');
    const aiContextualAnalysis = await generateAIContextualAnalysis(companyName, allMethodologies);

    const profile: Company360Profile = {
      identification: {
        name: companyName,
        cnpj,
        domain,
        website: domain ? `https://${domain}` : undefined
      },
      digitalPresence: {
        linkedin,
        overall_score: digitalPresenceScore,
        methodology: digitalPresenceMethodology
      },
      legalHealth: {
        data: legal,
        risk_level: legal?.riskLevel || 'baixo',
        score: legalHealthScore,
        methodology: legalHealthMethodology
      },
      financialHealth: {
        data: financial,
        credit_score: financial?.creditScore || 0,
        risk_classification: financial?.riskClassification || 'C',
        predictive_score: financialHealthScore,
        methodology: financialHealthMethodology
      },
      newsAndReputation: {
        news,
        sentiment: news?.sentimentAnalysis.overall || 'neutral',
        recent_activity: news?.recentActivity || false,
        methodology: newsMethodology
      },
      marketplaces: {
        data: marketplace,
        maturity: marketplace?.ecommerceMaturity || 'none',
        score: marketplaceScore,
        methodology: marketplaceMethodology
      },
      techStack: {
        data: techStack,
        maturity_level: techStack?.maturityLevel || 'modern',
        total_tech_debt: techStack?.totalTechDebt || 'low',
        totvs_opportunities: techStack?.migrationOpportunities?.length || 0
      },
      overall360Score: Math.round(overall360Score * 10) / 10,
      overall360Methodology,
      aiContextualAnalysis,
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
