// ✅ Adapter Apollo.io - Decisores e dados B2B
export interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  primary_domain?: string;
  industry?: string;
  estimated_num_employees?: number;
  annual_revenue?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  technologies?: string[];
  raw_address?: string;
}

export interface ApolloPerson {
  id: string;
  name: string;
  title?: string;
  email?: string;
  email_status?: 'verified' | 'guessed' | 'unavailable';
  linkedin_url?: string;
  functions?: string[];
  seniority?: string;
  organization_id?: string;
  phone_numbers?: Array<{ raw_number: string; type: string }>;
}

export interface ApolloAdapter {
  searchOrganization(name: string, domain?: string): Promise<ApolloOrganization | null>;
  searchPeople(organizationName: string, titles?: string[]): Promise<ApolloPerson[]>;
}

class ApolloAdapterImpl implements ApolloAdapter {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchOrganization(name: string, domain?: string): Promise<ApolloOrganization | null> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        q_organization_name: name,
        ...(domain && { q_organization_domains: domain })
      });

      const response = await fetch(`${this.baseUrl}/organizations/search?${params}`);
      
      if (!response.ok) {
        console.error('[Apollo] Organization search error:', response.status);
        return null;
      }

      const data = await response.json();
      const org = data.organizations?.[0];

      if (!org) {
        console.log('[Apollo] Nenhuma organização encontrada');
        return null;
      }

      console.log('[Apollo] ✅ Organização encontrada:', org.name);
      return org as ApolloOrganization;
    } catch (error) {
      console.error('[Apollo] Erro na busca de organização:', error);
      return null;
    }
  }

  async searchPeople(organizationName: string, titles: string[] = []): Promise<ApolloPerson[]> {
    try {
      const defaultTitles = titles.length > 0 
        ? titles.join(',')
        : 'CEO,CTO,CFO,Director,VP,Head,Manager';

      const params = new URLSearchParams({
        api_key: this.apiKey,
        q_organization_name: organizationName,
        per_page: '10',
        person_titles: defaultTitles
      });

      const response = await fetch(`${this.baseUrl}/people/search?${params}`);
      
      if (!response.ok) {
        console.error('[Apollo] People search error:', response.status);
        return [];
      }

      const data = await response.json();
      const people = data.people || [];

      console.log('[Apollo] ✅ Decisores encontrados:', people.length);
      return people as ApolloPerson[];
    } catch (error) {
      console.error('[Apollo] Erro na busca de decisores:', error);
      return [];
    }
  }
}

export function createApolloAdapter(apiKey: string): ApolloAdapter {
  return new ApolloAdapterImpl(apiKey);
}
