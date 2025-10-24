import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardExecutiveData {
  // Core metrics
  totalCompanies: number;
  totalDecisors: number;
  totalConversations: number;
  pipelineValue: number;
  
  // Geographic insights
  companiesByRegion: Array<{ region: string; count: number; avgMaturity: number }>;
  companiesByState: Array<{ state: string; count: number }>;
  
  // Industry insights
  companiesByIndustry: Array<{ industry: string; count: number; avgMaturity: number; avgEmployees: number }>;
  
  // Fit TOTVS insights
  fitByProduct: Array<{ product: string; companies: number; avgScore: number }>;
  topFitCompanies: Array<{ 
    id: string; 
    name: string; 
    fitScore: number; 
    recommendedProducts: string[];
  }>;
  
  // Tech Stack insights
  topTechnologies: Array<{ tech: string; count: number; category: string }>;
  techStackByIndustry: Record<string, string[]>;
  
  // Maturity insights
  maturityDistribution: Array<{ level: string; count: number; percentage: number }>;
  maturityByIndustry: Record<string, number>;
  
  // Health insights
  avgDigitalHealth: number;
  healthDistribution: Array<{ category: string; score: number; count: number }>;
  companiesAtRisk: number;
  
  // Predictive insights
  emergingOpportunities: Array<{ 
    type: string; 
    companies: number; 
    potential: string;
    description: string;
  }>;
  marketTrends: Array<{ trend: string; impact: string; companies: number }>;
  
  // Sales insights
  conversionRate: number;
  avgDealSize: number;
  topPerformingChannels: Array<{ channel: string; count: number; conversionRate: number }>;
}

export function useDashboardExecutive() {
  return useQuery({
    queryKey: ['dashboard-executive'],
    queryFn: async (): Promise<DashboardExecutiveData> => {
      // Fetch only NEW architecture data
      const [
        companiesRes,
        decisorsRes,
        strategiesRes,
        conversationsRes,
        messagesRes
      ] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('decision_makers').select('*'),
        supabase.from('account_strategies').select('*, companies(name, industry, employees, location)'),
        supabase.from('conversations').select('*, companies(name, industry)'),
        supabase.from('messages').select('*')
      ]);

      const companies = companiesRes.data || [];
      const decisors = decisorsRes.data || [];
      const strategies = strategiesRes.data || [];
      const conversations = conversationsRes.data || [];
      const messages = messagesRes.data || [];

      // Core metrics - REAL DATA ONLY
      const totalCompanies = companies.length;
      const totalDecisors = decisors.length;
      const totalConversations = conversations.length;

      // Pipeline value calculation - FROM ACCOUNT STRATEGIES ONLY
      const pipelineValue = strategies.reduce((total, strategy) => {
        return total + (Number(strategy.annual_value) || 0);
      }, 0);

      // Geographic insights
      const companiesByState = companies.reduce((acc, comp) => {
        const state = (comp.location as any)?.state || 'Não especificado';
        const existing = acc.find(r => r.state === state);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ state, count: 1 });
        }
        return acc;
      }, [] as Array<{ state: string; count: number }>);

      // Map states to regions
      const stateToRegion: Record<string, string> = {
        'SP': 'Sudeste', 'RJ': 'Sudeste', 'MG': 'Sudeste', 'ES': 'Sudeste',
        'RS': 'Sul', 'SC': 'Sul', 'PR': 'Sul',
        'BA': 'Nordeste', 'PE': 'Nordeste', 'CE': 'Nordeste', 'RN': 'Nordeste', 'AL': 'Nordeste', 'SE': 'Nordeste', 'PB': 'Nordeste', 'MA': 'Nordeste', 'PI': 'Nordeste',
        'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'DF': 'Centro-Oeste',
        'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'AC': 'Norte', 'RR': 'Norte', 'AP': 'Norte', 'TO': 'Norte'
      };

      const companiesByRegion = companies.reduce((acc, comp) => {
        const state = (comp.location as any)?.state || 'Não especificado';
        const region = stateToRegion[state] || 'Não especificado';
        const maturityScore = comp.digital_maturity_score || 0;
        
        const existing = acc.find(r => r.region === region);
        if (existing) {
          existing.count++;
          existing.avgMaturity = (existing.avgMaturity * (existing.count - 1) + (maturityScore as number)) / existing.count;
        } else {
          acc.push({ region, count: 1, avgMaturity: maturityScore as number });
        }
        return acc;
      }, [] as Array<{ region: string; count: number; avgMaturity: number }>)
      .sort((a, b) => b.count - a.count);

      // Industry insights
      const companiesByIndustry = companies.reduce((acc, comp) => {
        const industry = comp.industry || 'Não especificado';
        const maturityScore = comp.digital_maturity_score || 0;
        const employees = comp.employees || 0;
        
        const existing = acc.find(i => i.industry === industry);
        if (existing) {
          existing.count++;
          existing.avgMaturity = (existing.avgMaturity * (existing.count - 1) + (maturityScore as number)) / existing.count;
          existing.avgEmployees = (existing.avgEmployees * (existing.count - 1) + employees) / existing.count;
        } else {
          acc.push({ industry, count: 1, avgMaturity: maturityScore as number, avgEmployees: employees });
        }
        return acc;
      }, [] as Array<{ industry: string; count: number; avgMaturity: number; avgEmployees: number }>)
      .sort((a, b) => b.count - a.count);

      // Fit Analysis - FROM ACCOUNT STRATEGIES
      const fitByProduct = [
        { product: 'Protheus', companies: 0, avgScore: 0 },
        { product: 'Fluig', companies: 0, avgScore: 0 },
        { product: 'RM', companies: 0, avgScore: 0 },
        { product: 'Datasul', companies: 0, avgScore: 0 },
        { product: 'Logix', companies: 0, avgScore: 0 }
      ];

      // Count products from strategies
      strategies.forEach(strategy => {
        const products = (strategy.recommended_products as any) || [];
        products.forEach((product: string) => {
          const fitProduct = fitByProduct.find(p => p.product === product);
          if (fitProduct) {
            fitProduct.companies++;
            const fitScore = (strategy as any).fit_score || 0;
            fitProduct.avgScore += fitScore;
          }
        });
      });

      fitByProduct.forEach(p => {
        if (p.companies > 0) {
          p.avgScore = Math.round((p.avgScore / p.companies) * 10) / 10;
        }
      });

      const topFitCompanies = strategies
        .filter(s => s.companies)
        .map(strategy => {
          const company = strategy.companies as any;
          return {
            id: company.id,
            name: company.name,
            fitScore: (strategy as any).fit_score || 0,
            recommendedProducts: (strategy.recommended_products as string[]) || []
          };
        })
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 10);

      // Tech Stack insights
      const techCount: Record<string, { count: number; category: string }> = {};
      companies.forEach(comp => {
        const techs = comp.technologies || [];
        techs.forEach((tech: string) => {
          if (!techCount[tech]) {
            // Categorize tech
            let category = 'Outros';
            if (['React', 'Angular', 'Vue', 'Next.js'].includes(tech)) category = 'Frontend';
            if (['Node.js', 'Python', 'Java', 'PHP'].includes(tech)) category = 'Backend';
            if (['AWS', 'Azure', 'GCP', 'Heroku'].includes(tech)) category = 'Cloud';
            if (['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'].includes(tech)) category = 'Database';

            techCount[tech] = { count: 0, category };
          }
          techCount[tech].count++;
        });
      });

      const topTechnologies = Object.entries(techCount)
        .map(([tech, data]) => ({ tech, count: data.count, category: data.category }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Maturity distribution - FROM COMPANIES
      const maturityLevels = [
        { level: 'Inicial (0-3)', min: 0, max: 3 },
        { level: 'Básico (4-5)', min: 4, max: 5 },
        { level: 'Intermediário (6-7)', min: 6, max: 7 },
        { level: 'Avançado (8-9)', min: 8, max: 9 },
        { level: 'Líder (10)', min: 10, max: 10 }
      ];

      const maturityDistribution = maturityLevels.map(level => {
        const count = companies.filter(c => {
          const score = c.digital_maturity_score || 0;
          return score >= level.min && score <= level.max;
        }).length;
        const percentage = companies.length > 0 ? Math.round((count / companies.length) * 100) : 0;
        return { level: level.level, count, percentage };
      });

      // Health insights - FROM ACCOUNT STRATEGIES
      const avgDigitalHealth = companies.reduce((sum, c) => sum + (c.digital_maturity_score || 0), 0) / (companies.length || 1);

      const healthDistribution = [
        { category: 'Presença Digital', score: avgDigitalHealth, count: companies.length },
        { category: 'Saúde Jurídica', score: 0, count: 0 },
        { category: 'Saúde Financeira', score: 0, count: 0 },
        { category: 'Reputação', score: 0, count: 0 }
      ];

      const companiesAtRisk = 0;

      // Predictive insights - FROM STRATEGIES
      const emergingOpportunities = [
        {
          type: 'Transformação Digital',
          companies: strategies.filter(s => 
            s.identified_gaps && (s.identified_gaps as any[]).some(g => 
              g.category === 'digital_transformation'
            )
          ).length,
          potential: 'Alto',
          description: 'Empresas prontas para dar o próximo passo na jornada digital'
        },
        {
          type: 'Modernização de Stack',
          companies: strategies.filter(s => 
            s.identified_gaps && (s.identified_gaps as any[]).some(g => 
              g.category === 'technology_modernization'
            )
          ).length,
          potential: 'Médio',
          description: 'Empresas com tech stack legado e porte para investir'
        },
        {
          type: 'Gaps de Governança',
          companies: strategies.filter(s => 
            s.identified_gaps && (s.identified_gaps as any[]).length > 0
          ).length,
          potential: 'Alto',
          description: 'Empresas com oportunidades de melhoria identificadas'
        }
      ];

      const marketTrends = [
        {
          trend: 'Estratégias Ativas',
          impact: 'Alto',
          companies: strategies.filter(s => s.status === 'active').length
        },
        {
          trend: 'Em Negociação',
          impact: 'Médio',
          companies: strategies.filter(s => s.current_stage === 'negotiation').length
        },
        {
          trend: 'Conversas Abertas',
          impact: 'Alto',
          companies: conversations.filter(c => c.status === 'open').length
        }
      ];

      // Sales insights
      const wonDeals = conversations.filter(c => c.status === 'closed').length;
      const conversionRate = totalConversations > 0 
        ? Math.round((wonDeals / totalConversations) * 100) 
        : 0;

      const avgDealSize = pipelineValue / (totalConversations || 1);

      const channelPerformance = messages.reduce((acc, msg) => {
        const channel = msg.channel;
        if (!acc[channel]) {
          acc[channel] = { total: 0, conversions: 0 };
        }
        acc[channel].total++;
        return acc;
      }, {} as Record<string, { total: number; conversions: number }>);

      const topPerformingChannels = Object.entries(channelPerformance)
        .map(([channel, stats]) => ({
          channel,
          count: stats.total,
          conversionRate: Math.round((stats.conversions / stats.total) * 100) || 0
        }))
        .sort((a, b) => b.count - a.count);

      return {
        totalCompanies,
        totalDecisors,
        totalConversations,
        pipelineValue,
        companiesByRegion,
        companiesByState,
        companiesByIndustry,
        fitByProduct,
        topFitCompanies,
        topTechnologies,
        techStackByIndustry: {},
        maturityDistribution,
        maturityByIndustry: {},
        avgDigitalHealth: Math.round(avgDigitalHealth * 10) / 10,
        healthDistribution,
        companiesAtRisk,
        emergingOpportunities,
        marketTrends,
        conversionRate,
        avgDealSize: Math.round(avgDealSize),
        topPerformingChannels
      };
    },
    refetchInterval: false, // Desabilitado - use manual refetch quando necessário
    staleTime: 300000 // Dados válidos por 5 minutos
  });
}
