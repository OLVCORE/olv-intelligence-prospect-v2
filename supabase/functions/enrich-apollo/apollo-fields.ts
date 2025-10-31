// ============================================
// CICLO 3: Mapeamento Completo de 100% dos Campos Apollo
// ============================================

/**
 * Classificar departamento
 */
function classifyDepartment(title?: string, functions?: string[]): string | null {
  if (!title && (!functions || functions.length === 0)) return null;
  
  const combined = `${title || ''} ${functions?.join(' ') || ''}`.toLowerCase();
  
  if (combined.match(/compras|procurement|sourcing|suprimentos/)) return 'Compras/Procurement';
  if (combined.match(/supply|logística|operações|industrial|operations/)) return 'Supply Chain/Operações';
  if (combined.match(/finance|financeiro|contabilidade|tesouraria|accounting/)) return 'Finance';
  if (combined.match(/sales|comercial|revenue|vendas/)) return 'Sales/Comercial';
  if (combined.match(/technology|tecnologia|engenharia|produto|engineering/)) return 'Technology/Produto';
  if (combined.match(/marketing|brand|growth/)) return 'Marketing';
  if (combined.match(/hr|people|recursos humanos|talentos/)) return 'HR/People';
  if (combined.match(/legal|jurídico|compliance/)) return 'Legal/Compliance';
  
  return null;
}

/**
 * Verificar se é decisor (senioridade mínima: Manager)
 */
function isDecisionMaker(person: any): boolean {
  const seniority = person.seniority?.toLowerCase() || '';
  
  const decisionMakerLevels = [
    'founder', 'owner', 'partner',
    'c_suite', 'c-suite', 'ceo', 'cfo', 'cto', 'coo', 'cmo',
    'vp', 'vice president',
    'director',
    'head',
    'manager'
  ];
  
  return decisionMakerLevels.some(level => seniority.includes(level));
}

/**
 * Calcular tenure em meses
 */
function calculateTenureMonths(startDate?: string): number | null {
  if (!startDate) return null;
  
  try {
    const start = new Date(startDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return months >= 0 ? months : null;
  } catch {
    return null;
  }
}

/**
 * Mapear TODOS os campos da organização Apollo (100% dos campos visíveis)
 */
export function mapOrganizationFields(org: any): any {
  return {
    // IDs e identificadores
    apollo_id: org.id,
    apollo_organization_id: org.id,
    
    // Dados básicos da empresa
    name: org.name,
    website: org.website_url,
    domain: org.primary_domain,
    
    // Overview & Profile
    industry: org.industry,
    sub_industries: org.sub_industries || [],
    keywords: org.keywords || [],
    founded_year: org.founded_year,
    
    // Company details
    employees: org.estimated_num_employees,
    employee_count_from_apollo: org.estimated_num_employees,
    employee_range: org.employee_range,
    annual_revenue: org.annual_revenue,
    revenue: org.annual_revenue,
    revenue_range_from_apollo: org.revenue_range,
    
    // Localização completa
    location: {
      street: org.street_address,
      city: org.city,
      state: org.state,
      country: org.country,
      postal_code: org.postal_code,
      raw_address: org.raw_address
    },
    
    // Links (website, redes sociais)
    linkedin_url: org.linkedin_url,
    social_urls: {
      linkedin: org.linkedin_url,
      facebook: org.facebook_url,
      twitter: org.twitter_url,
      blog: org.blog_url,
      angellist: org.angellist_url,
      crunchbase: org.crunchbase_url
    },
    
    // Score e auto-score
    account_score: org.account_score,
    
    // Technologies (LISTA COMPLETA)
    technologies: org.technologies || [],
    
    // News
    recent_news: org.news || [],
    
    // Funding
    funding_total: org.total_funding ? parseFloat(String(org.total_funding)) : null,
    funding_rounds: org.funding_rounds || [],
    last_funding_round_date: org.latest_funding_round_date,
    last_funding_round_amount: org.latest_funding_amount ? parseFloat(String(org.latest_funding_amount)) : null,
    investors: org.investors || [],
    
    // Job postings
    job_postings_count: org.job_postings_count || 0,
    job_postings: org.job_postings || [],
    
    // Employee trends
    employee_growth_rate: org.employee_growth_rate,
    
    // Website visitors
    website_visitors_count: org.monthly_website_visitors,
    website_visitors_data: org.website_visitors_data || {},
    
    // Company insights
    sic_codes: org.sic_codes || [],
    naics_codes: org.naics_codes || [],
    market_cap: org.market_cap,
    
    // Locations (todas as filiais)
    locations: org.locations || [],
    
    // Empresas similares (PRIORIDADE MÁXIMA)
    similar_companies: org.similar_companies || [],
    
    // Apollo signals
    apollo_signals: org.signals || [],
    
    // Metadados adicionais
    apollo_metadata: {
      ownership_type: org.ownership_type,
      parent_account_id: org.parent_account_id,
      ultimate_parent_account_id: org.ultimate_parent_account_id,
      account_stage_id: org.account_stage_id,
      latest_funding_stage: org.latest_funding_stage,
      number_of_funding_rounds: org.number_of_funding_rounds,
      phone: org.phone,
      account_playbook_statuses: org.account_playbook_statuses,
      label_names: org.label_names
    },
    
    // Contato
    phone_numbers: org.phone ? [org.phone] : [],
    
    // Timestamp de enriquecimento
    apollo_last_enriched_at: new Date().toISOString(),
    
    // Raw data completo
    raw_data: org
  };
}

/**
 * Mapear TODOS os campos de pessoa/decisor Apollo (42+ campos)
 */
export function mapPersonFields(person: any, companyId: string, apolloOrgId: string): any {
  return {
    // IDs
    company_id: companyId,
    apollo_person_id: person.id,
    apollo_organization_id: apolloOrgId,
    
    // Nome completo
    name: person.name,
    first_name: person.first_name,
    last_name: person.last_name,
    
    // Cargo e posição
    title: person.title,
    headline: person.headline,
    seniority: person.seniority,
    
    // Departamento e funções
    departments: person.departments || [],
    functions: person.functions || [],
    
    // Contato - Email
    email: person.email_status === 'unavailable' ? null : person.email,
    email_status: person.email_status,
    verified_email: person.email_status === 'verified',
    personal_email: person.personal_emails?.[0],
    
    // Contato - Telefone
    phone: person.phone_numbers?.[0]?.raw_number,
    phone_type: person.phone_numbers?.[0]?.type,
    phone_numbers: person.phone_numbers || [],
    mobile_phone: person.mobile_phone,
    
    // Links sociais (canônicos)
    linkedin_url: person.linkedin_url,
    twitter_url: person.twitter_url,
    facebook_url: person.facebook_url,
    github_url: person.github_url,
    
    // Localização
    city: person.city,
    state: person.state,
    country: person.country,
    
    // Histórico profissional
    employment_history: person.employment_history || [],
    current_position_start_date: person.employment_history?.[0]?.start_date,
    tenure_months: person.employment_history?.[0]?.current ? 
      calculateTenureMonths(person.employment_history[0].start_date) : null,
    
    // Educação
    education: person.education || [],
    
    // Scores e sinais
    contact_accuracy_score: person.contact_accuracy_score,
    intent_strength: person.intent_strength,
    recommendations_score: person.recommendations_score,
    
    // Apollo Auto-Score (People)
    people_auto_score: person.auto_score,
    
    // Atividade
    last_activity_date: person.last_activity_date,
    
    // Contexto da organização
    organization_name: person.organization?.name,
    organization_employees: person.organization?.estimated_num_employees,
    organization_industry: person.organization?.industry,
    organization_keywords: person.organization?.keywords || [],
    
    // Classificação interna
    is_decision_maker: isDecisionMaker(person),
    is_current_at_company: person.employment_history?.[0]?.current === true,
    department_classification: classifyDepartment(person.title, person.functions),
    
    // Fonte de enriquecimento
    enrichment_source: 'apollo',
    
    // Metadados completos
    apollo_person_metadata: person,
    
    // Timestamp
    apollo_last_enriched_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString()
  };
}

// (função duplicada removida – usar calculateTenureMonths definido acima)



/**
 * Extrair empresas similares com hyperlinks
 */
export function extractSimilarCompanies(apolloOrg: any): Array<{
  name: string;
  apollo_url: string;
  location?: string;
  employees?: number;
  apollo_id?: string;
}> {
  if (!apolloOrg.similar_companies || apolloOrg.similar_companies.length === 0) {
    return [];
  }
  
  return apolloOrg.similar_companies.map((similar: any) => ({
    name: similar.name,
    apollo_url: `https://app.apollo.io/#/organizations/${similar.id}`,
    apollo_id: similar.id,
    location: similar.city && similar.country ? `${similar.city}, ${similar.country}` : similar.country,
    employees: similar.estimated_num_employees
  }));
}
