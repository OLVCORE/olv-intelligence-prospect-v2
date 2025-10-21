// ✅ Engine de busca de empresas - Orquestra múltiplos adapters
import type { ReceitaWSAdapter, ReceitaWSCompanyData } from '@/lib/adapters/cnpj/receitaws';
import type { ApolloAdapter, ApolloOrganization, ApolloPerson } from '@/lib/adapters/people/apollo';
import type { SerperAdapter } from '@/lib/adapters/search/serper';
import type { TechDetectionAdapter, TechStackAnalysis } from '@/lib/adapters/tech/hybridDetect';

export interface CompanySearchInput {
  query?: string;
  cnpj?: string;
}

export interface CompanySearchResult {
  company: {
    name: string;
    cnpj?: string;
    domain?: string;
    website?: string;
    industry?: string;
    employees?: number;
    revenue?: string;
    location: {
      city?: string;
      state?: string;
      country: string;
    };
    linkedin_url?: string;
    technologies?: string[];
    raw_data: {
      receita?: ReceitaWSCompanyData;
      apollo?: ApolloOrganization;
      techStack?: TechStackAnalysis;
    };
  };
  decisors: Array<{
    name: string;
    title?: string;
    email?: string;
    linkedin_url?: string;
    department?: string;
    seniority?: string;
    verified_email?: boolean;
  }>;
  maturity?: {
    infrastructure_score: number;
    systems_score: number;
    processes_score: number;
    security_score: number;
    innovation_score: number;
    overall_score: number;
  };
}

export interface CompanySearchEngine {
  search(input: CompanySearchInput): Promise<CompanySearchResult>;
}

export class CompanySearchEngineImpl implements CompanySearchEngine {
  constructor(
    private receitaWS: ReceitaWSAdapter,
    private apollo: ApolloAdapter,
    private serper: SerperAdapter,
    private techDetect: TechDetectionAdapter
  ) {}

  async search(input: CompanySearchInput): Promise<CompanySearchResult> {
    console.log('[CompanySearchEngine] Iniciando busca:', input);

    // 1. Buscar dados da ReceitaWS (se CNPJ fornecido)
    let receitaData: ReceitaWSCompanyData | null = null;
    if (input.cnpj) {
      receitaData = await this.receitaWS.fetchCompanyData(input.cnpj);
      console.log('[CompanySearchEngine] ReceitaWS:', receitaData ? '✅' : '❌');
    }

    // 2. Determinar nome e domínio da empresa
    const companyName = input.query || receitaData?.nome || '';
    const domain = receitaData?.email?.split('@')[1];

    // 3. Buscar dados do Apollo.io
    const apolloData = await this.apollo.searchOrganization(companyName, domain);
    console.log('[CompanySearchEngine] Apollo:', apolloData ? '✅' : '❌');

    // 4. Buscar decisores no Apollo
    const apolloPeople = await this.apollo.searchPeople(companyName);
    console.log('[CompanySearchEngine] Decisores:', apolloPeople.length);

    // 5. Detectar tech stack (se tiver website)
    let techStack: TechStackAnalysis | null = null;
    const website = apolloData?.website_url || receitaData?.fantasia;
    if (website && website.startsWith('http')) {
      techStack = await this.techDetect.analyzeWebsite(website);
      console.log('[CompanySearchEngine] Tech Stack:', techStack ? '✅' : '❌');
    }

    // 6. Analisar maturidade digital via Serper
    let maturity = null;
    if (domain && companyName) {
      const searchResults = await this.serper.search(
        `${companyName} ${domain} tecnologia cloud digital transformation`
      );
      
      if (searchResults) {
        maturity = this.calculateMaturityFromSearch(searchResults);
        console.log('[CompanySearchEngine] Maturidade:', maturity.overall_score);
      }
    }

    // 7. Montar resultado consolidado
    const result: CompanySearchResult = {
      company: {
        name: companyName,
        cnpj: input.cnpj || receitaData?.cnpj,
        domain: domain || apolloData?.primary_domain,
        website: website,
        industry: apolloData?.industry || receitaData?.atividade_principal?.[0]?.text,
        employees: apolloData?.estimated_num_employees || 0,
        revenue: apolloData?.annual_revenue,
        location: {
          city: apolloData?.city || receitaData?.municipio,
          state: apolloData?.state || receitaData?.uf,
          country: apolloData?.country || 'Brasil'
        },
        linkedin_url: apolloData?.linkedin_url,
        technologies: techStack?.technologies.map(t => t.name) || apolloData?.technologies || [],
        raw_data: {
          receita: receitaData || undefined,
          apollo: apolloData || undefined,
          techStack: techStack || undefined
        }
      },
      decisors: apolloPeople.map(person => ({
        name: person.name,
        title: person.title,
        email: person.email,
        linkedin_url: person.linkedin_url,
        department: person.functions?.[0] || 'Não especificado',
        seniority: person.seniority || 'Não especificado',
        verified_email: person.email_status === 'verified'
      })),
      maturity
    };

    console.log('[CompanySearchEngine] ✅ Busca concluída');
    return result;
  }

  private calculateMaturityFromSearch(searchResults: any): any {
    const text = JSON.stringify(searchResults).toLowerCase();
    
    const scores = {
      infrastructure: this.scoreKeywords(text, ['cloud', 'aws', 'azure', 'gcp', 'infraestrutura']),
      systems: this.scoreKeywords(text, ['erp', 'crm', 'software', 'sistema', 'integração']),
      processes: this.scoreKeywords(text, ['automation', 'automação', 'digital', 'processo', 'workflow']),
      security: this.scoreKeywords(text, ['security', 'segurança', 'compliance', 'lgpd', 'iso']),
      innovation: this.scoreKeywords(text, ['ai', 'ia', 'innovation', 'inovação', 'machine learning'])
    };

    const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

    return { ...scores, overall_score: overall };
  }

  private scoreKeywords(text: string, keywords: string[]): number {
    let score = 3; // Base score
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1.5;
      }
    }

    return Math.min(score, 10); // Cap at 10
  }
}

export function createCompanySearchEngine(
  receitaWS: ReceitaWSAdapter,
  apollo: ApolloAdapter,
  serper: SerperAdapter,
  techDetect: TechDetectionAdapter
): CompanySearchEngine {
  return new CompanySearchEngineImpl(receitaWS, apollo, serper, techDetect);
}
