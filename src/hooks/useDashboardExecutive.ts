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
      // Fetch all data in parallel
      const [
        companiesRes,
        decisorsRes,
        conversationsRes,
        signalsRes,
        maturityRes,
        presenceRes,
        financialRes,
        legalRes,
        reputationRes,
        messagesRes
      ] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('decision_makers').select('*'),
        supabase.from('conversations').select('*, companies(name, industry)'),
        supabase.from('buying_signals').select('*'),
        supabase.from('digital_maturity').select('*, companies(name, industry, employees)'),
        supabase.from('digital_presence').select('*'),
        supabase.from('financial_data').select('*'),
        supabase.from('legal_data').select('*'),
        supabase.from('reputation_data').select('*'),
        supabase.from('messages').select('*')
      ]);

      const companies = companiesRes.data || [];
      const decisors = decisorsRes.data || [];
      const conversations = conversationsRes.data || [];
      const signals = signalsRes.data || [];
      const maturity = maturityRes.data || [];
      const presence = presenceRes.data || [];
      const financial = financialRes.data || [];
      const legal = legalRes.data || [];
      const reputation = reputationRes.data || [];
      const messages = messagesRes.data || [];

      // Core metrics
      const totalCompanies = companies.length;
      const totalDecisors = decisors.length;
      const totalConversations = conversations.length;

      // Pipeline value calculation
      const ticketByPriority = { high: 120000, medium: 75000, low: 30000 };
      const pipelineValue = conversations.reduce((total, conv) => {
        const priority = conv.priority as keyof typeof ticketByPriority || 'medium';
        return total + ticketByPriority[priority];
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
        const maturityScore = maturity.find(m => m.company_id === comp.id)?.overall_score || 0;
        
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
        const maturityScore = maturity.find(m => m.company_id === comp.id)?.overall_score || 0;
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

      // Fit TOTVS analysis from buying signals
      const fitSignals = signals.filter(s => s.signal_type === 'totvs_fit' || s.raw_data);
      
      const fitByProduct = [
        { product: 'Protheus', companies: 0, avgScore: 0 },
        { product: 'Fluig', companies: 0, avgScore: 0 },
        { product: 'RM', companies: 0, avgScore: 0 },
        { product: 'Datasul', companies: 0, avgScore: 0 },
        { product: 'Logix', companies: 0, avgScore: 0 }
      ];

      // Analyze maturity and tech to predict fit
      companies.forEach(comp => {
        const maturityScore = maturity.find(m => m.company_id === comp.id)?.overall_score || 0;
        const employees = comp.employees || 0;
        const tech = comp.technologies || [];

        // Protheus fit: médio porte, manufatura
        if (employees > 50 && employees < 500 && ['Manufatura', 'Indústria', 'Distribuição'].includes(comp.industry || '')) {
          fitByProduct[0].companies++;
          fitByProduct[0].avgScore += maturityScore as number;
        }

        // Fluig fit: processos, maturidade média-alta
        if ((maturityScore as number) > 6 && employees > 100) {
          fitByProduct[1].companies++;
          fitByProduct[1].avgScore += maturityScore as number;
        }

        // RM fit: educação, saúde, RH intensivo
        if (['Educação', 'Saúde', 'Serviços'].includes(comp.industry || '')) {
          fitByProduct[2].companies++;
          fitByProduct[2].avgScore += maturityScore as number;
        }

        // Datasul fit: manufatura grande porte
        if (employees > 500 && ['Manufatura', 'Indústria'].includes(comp.industry || '')) {
          fitByProduct[3].companies++;
          fitByProduct[3].avgScore += maturityScore as number;
        }

        // Logix fit: grande porte, multinacional
        if (employees > 1000) {
          fitByProduct[4].companies++;
          fitByProduct[4].avgScore += maturityScore as number;
        }
      });

      fitByProduct.forEach(p => {
        if (p.companies > 0) {
          p.avgScore = Math.round((p.avgScore / p.companies) * 10) / 10;
        }
      });

      const topFitCompanies = companies
        .map(comp => {
          const maturityScore = maturity.find(m => m.company_id === comp.id)?.overall_score || 0;
          const employees = comp.employees || 0;
          const recommendedProducts: string[] = [];

          if (employees > 50 && employees < 500) recommendedProducts.push('Protheus');
          if ((maturityScore as number) > 6 && employees > 100) recommendedProducts.push('Fluig');
          if (['Educação', 'Saúde'].includes(comp.industry || '')) recommendedProducts.push('RM');

          return {
            id: comp.id,
            name: comp.name,
            fitScore: maturityScore as number,
            recommendedProducts
          };
        })
        .filter(c => c.recommendedProducts.length > 0)
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

      // Maturity distribution
      const maturityLevels = [
        { level: 'Inicial (0-3)', min: 0, max: 3 },
        { level: 'Básico (4-5)', min: 4, max: 5 },
        { level: 'Intermediário (6-7)', min: 6, max: 7 },
        { level: 'Avançado (8-9)', min: 8, max: 9 },
        { level: 'Líder (10)', min: 10, max: 10 }
      ];

      const maturityDistribution = maturityLevels.map(level => {
        const count = maturity.filter(m => 
          (m.overall_score || 0) >= level.min && (m.overall_score || 0) <= level.max
        ).length;
        const percentage = maturity.length > 0 ? Math.round((count / maturity.length) * 100) : 0;
        return { level: level.level, count, percentage };
      });

      // Health insights
      const healthScores = {
        digital: presence.reduce((sum, p) => sum + (p.overall_score || 0), 0) / (presence.length || 1),
        legal: legal.reduce((sum, l) => sum + (l.legal_health_score || 0), 0) / (legal.length || 1),
        financial: financial.reduce((sum, f) => sum + (f.predictive_risk_score || 0), 0) / (financial.length || 1),
        reputation: reputation.reduce((sum, r) => sum + (r.reputation_score || 0), 0) / (reputation.length || 1)
      };

      const avgDigitalHealth = Object.values(healthScores).reduce((sum, score) => sum + score, 0) / 4;

      const healthDistribution = [
        { category: 'Presença Digital', score: Math.round(healthScores.digital * 10) / 10, count: presence.length },
        { category: 'Saúde Jurídica', score: Math.round(healthScores.legal * 10) / 10, count: legal.length },
        { category: 'Saúde Financeira', score: Math.round(healthScores.financial * 10) / 10, count: financial.length },
        { category: 'Reputação', score: Math.round(healthScores.reputation * 10) / 10, count: reputation.length }
      ];

      const companiesAtRisk = financial.filter(f => 
        (f.predictive_risk_score || 0) < 50 || (f.risk_classification || '') === 'D'
      ).length;

      // Predictive insights
      const emergingOpportunities = [
        {
          type: 'Transformação Digital',
          companies: maturity.filter(m => (m.overall_score || 0) >= 4 && (m.overall_score || 0) < 7).length,
          potential: 'Alto',
          description: 'Empresas prontas para dar o próximo passo na jornada digital'
        },
        {
          type: 'Modernização de Stack',
          companies: companies.filter(c => {
            const techs = c.technologies || [];
            return techs.some((t: string) => ['PHP', 'jQuery', 'MySQL'].includes(t)) && (c.employees || 0) > 50;
          }).length,
          potential: 'Médio',
          description: 'Empresas com tech stack legado e porte para investir'
        },
        {
          type: 'Expansão Cloud',
          companies: companies.filter(c => {
            const techs = c.technologies || [];
            return !techs.some((t: string) => ['AWS', 'Azure', 'GCP'].includes(t)) && (c.employees || 0) > 100;
          }).length,
          potential: 'Alto',
          description: 'Empresas de médio/grande porte sem presença cloud'
        }
      ];

      const marketTrends = [
        {
          trend: 'Adoção de IA/ML',
          impact: 'Disruptivo',
          companies: companies.filter(c => {
            const techs = c.technologies || [];
            return techs.some((t: string) => ['TensorFlow', 'PyTorch', 'OpenAI'].includes(t));
          }).length
        },
        {
          trend: 'Cloud-First',
          impact: 'Alto',
          companies: companies.filter(c => {
            const techs = c.technologies || [];
            return techs.some((t: string) => ['AWS', 'Azure', 'GCP'].includes(t));
          }).length
        },
        {
          trend: 'Automação de Processos',
          impact: 'Médio-Alto',
          companies: signals.filter(s => 
            s.signal_type?.includes('automation') || s.signal_type?.includes('process')
          ).length
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
    refetchInterval: 60000, // 1 minuto
    staleTime: 30000
  });
}
