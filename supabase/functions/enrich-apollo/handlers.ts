// Handlers separados para cada tipo de operação do enrich-apollo

export interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  primary_domain?: string;
  city?: string;
  state?: string;
  country?: string;
  estimated_num_employees?: number;
  employee_range?: string;
  annual_revenue?: string;
  revenue_range?: string;
  industry?: string;
  sub_industries?: string[];
  technologies?: string[];
  keywords?: string[];
  sic_codes?: string[];
  naics_codes?: string[];
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  founded_year?: number;
  phone?: string;
}

/**
 * Gerar combinações incrementais de nome para busca
 */
export function generateNameCombinations(companyName: string): string[] {
  const cleaned = companyName
    .replace(/\b(ltda|sa|me|epp|eireli|limitada|sociedade anonima)\b/gi, '')
    .trim();
  
  const words = cleaned.split(/\s+/);
  const combinations: string[] = [];
  
  for (let i = 1; i <= words.length; i++) {
    combinations.push(words.slice(0, i).join(' '));
  }
  
  return combinations;
}

/**
 * Calcular match score entre org Apollo e busca
 */
export function calculateMatchScore(
  org: any,
  searchName: string,
  domain?: string
): number {
  let score = 0;

  // Nome (40 pontos)
  const orgName = org.name?.toLowerCase() || '';
  const searchLower = searchName.toLowerCase();
  
  if (orgName === searchLower) {
    score += 40;
  } else if (orgName.includes(searchLower)) {
    score += 30;
  } else {
    const searchWords = searchLower.split(/\s+/);
    const matches = searchWords.filter(word => orgName.includes(word)).length;
    score += (matches / searchWords.length) * 20;
  }

  // Domínio (30 pontos)
  if (domain && org.primary_domain) {
    const orgDomain = org.primary_domain.toLowerCase();
    const searchDomain = domain.toLowerCase();
    if (orgDomain === searchDomain) {
      score += 30;
    } else if (orgDomain.includes(searchDomain) || searchDomain.includes(orgDomain)) {
      score += 15;
    }
  }

  // País Brasil (20 pontos)
  if (org.country?.toLowerCase() === 'brazil' || org.country?.toLowerCase() === 'brasil') {
    score += 20;
  }

  // Tem LinkedIn (10 pontos)
  if (org.linkedin_url) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Buscar organizações no Apollo com busca incremental
 */
export async function searchOrganizations(
  apolloKey: string,
  searchName: string,
  domain?: string
): Promise<ApolloOrganization[]> {
  const combinations = generateNameCombinations(searchName);
  console.log('[Apollo] Combinações de busca:', combinations);

  const allOrganizations = new Map<string, ApolloOrganization>();

  for (const query of combinations) {
    try {
      const response = await fetch('https://api.apollo.io/v1/organizations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify({
          q_organization_name: query,
          page: 1,
          per_page: 10
        })
      });

      if (!response.ok) {
        console.error(`[Apollo] Erro na busca "${query}":`, response.status);
        continue;
      }

      const data = await response.json();
      console.log(`[Apollo] Busca "${query}": ${data.organizations?.length || 0} resultados`);

      if (data.organizations) {
        data.organizations.forEach((org: any) => {
          if (!allOrganizations.has(org.id)) {
            allOrganizations.set(org.id, {
              ...org,
              match_score: calculateMatchScore(org, searchName, domain)
            } as ApolloOrganization);
          }
        });
      }
    } catch (error) {
      console.error(`[Apollo] Erro ao buscar "${query}":`, error);
    }
  }

  const organizations = Array.from(allOrganizations.values())
    .sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0))
    .slice(0, 5);

  console.log(`[Apollo] Total de organizações: ${organizations.length}`);
  return organizations;
}

/**
 * Buscar organização por ID
 */
export async function getOrganizationById(
  apolloKey: string,
  organizationId: string
): Promise<ApolloOrganization | null> {
  try {
    const response = await fetch(`https://api.apollo.io/v1/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar organização: ${response.status}`);
    }

    const data = await response.json();
    return data.organization;
  } catch (error) {
    console.error('[Apollo] Erro ao buscar por ID:', error);
    return null;
  }
}

/**
 * Mapear campos da organização Apollo para o formato do banco
 */
export function mapOrganizationFields(org: any): any {
  return {
    apollo_organization_id: org.id,
    name: org.name || undefined,
    website_url: org.website_url || undefined,
    domain: org.primary_domain || undefined,
    city: org.city || undefined,
    state: org.state || undefined,
    country: org.country || undefined,
    employees: org.estimated_num_employees || undefined,
    employee_range: org.employee_range || undefined,
    annual_revenue: org.annual_revenue || undefined,
    revenue_range: org.revenue_range || undefined,
    industry: org.industry || undefined,
    sub_industries: org.sub_industries || undefined,
    technologies: org.technologies || undefined,
    linkedin_url: org.linkedin_url || undefined,
    facebook_url: org.facebook_url || undefined,
    twitter_url: org.twitter_url || undefined,
    founded_year: org.founded_year || undefined,
    phone: org.phone || undefined,
    apollo_org_metadata: org,
    apollo_last_enriched_at: new Date().toISOString()
  };
}

/**
 * Mapear campos de decisor Apollo (42 campos)
 */
export function mapDecisionMakerFields(person: any, companyId: string, orgId: string): any {
  return {
    company_id: companyId,
    apollo_person_id: person.id,
    name: person.name,
    first_name: person.first_name,
    last_name: person.last_name,
    title: person.title,
    headline: person.headline,
    seniority: person.seniority,
    departments: person.departments,
    functions: person.functions,
    email: person.email_status === 'unavailable' ? null : person.email,
    email_status: person.email_status,
    verified_email: person.email_status === 'verified',
    phone: person.phone_numbers?.[0]?.raw_number,
    phone_type: person.phone_numbers?.[0]?.type,
    linkedin_url: person.linkedin_url,
    twitter_url: person.twitter_url,
    facebook_url: person.facebook_url,
    github_url: person.github_url,
    city: person.city,
    state: person.state,
    country: person.country,
    employment_history: person.employment_history,
    education: person.education,
    contact_accuracy_score: person.contact_accuracy_score,
    intent_strength: person.intent_strength,
    last_activity_date: person.last_activity_date,
    apollo_organization_id: orgId,
    organization_name: person.organization?.name,
    enrichment_source: 'apollo',
    apollo_person_metadata: person,
    apollo_last_enriched_at: new Date().toISOString()
  };
}

/**
 * Filtrar decisores com critérios RIGOROSOS
 */
export function filterValidDecisors(people: any[], apolloOrgId: string, domain?: string): any[] {
  const normalizedDomain = domain?.toLowerCase().replace(/^www\./, '');
  
  return people.filter((person: any) => {
    const pOrgId = person.organization_id || person.organization?.id;
    const pDomain = person.organization?.primary_domain?.toLowerCase().replace(/^www\./, '');
    
    // REGRA 1: Organization ID DEVE ser exatamente igual
    if (pOrgId !== apolloOrgId) {
      console.log('❌ Rejeitado:', person.name, '- org_id diferente');
      return false;
    }
    
    // REGRA 2: Domínio DEVE ser exatamente igual (se disponível)
    if (normalizedDomain && pDomain && pDomain !== normalizedDomain) {
      console.log('❌ Rejeitado:', person.name, '- domínio diferente');
      return false;
    }
    
    // REGRA 3: Email válido OU LinkedIn OU Phone
    const hasContact = (
      (person.email && person.email_status !== 'unavailable') ||
      person.linkedin_url ||
      person.phone_numbers?.length > 0
    );
    
    if (!hasContact) {
      console.log('❌ Rejeitado:', person.name, '- sem contato válido');
      return false;
    }
    
    return true;
  });
}
