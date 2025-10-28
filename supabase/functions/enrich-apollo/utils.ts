// ============================================
// CICLO 3: Utilitários de Normalização, Canonicalização e Validação
// ============================================

/**
 * Normalizar nome de empresa (remover sufixos jurídicos e acentos)
 * Score mínimo: 0.85
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+(LTDA|ME|EPP|EIRELI|S\.A\.|SA|CIA|LTDA\.|COMERCIO|IMPORTADORA|EXPORTADORA|DISTRIBUIDORA|INC\.|INC|LLC|CORP|CORPORATION)\b\.?/gi, '')
    .replace(/\s+E\s+/gi, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Canonicalizar URL LinkedIn (pessoa)
 * Formato: https://www.linkedin.com/in/{handle}/
 */
export function canonicalizeLinkedIn(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'www.linkedin.com' && u.hostname !== 'linkedin.com') return null;
    
    const parts = u.pathname.split('/').filter(Boolean);
    
    // Verificar se é perfil pessoal (/in/)
    if (parts.length >= 2 && parts[0] === 'in') {
      return `https://www.linkedin.com/in/${parts[1].toLowerCase()}/`;
    }
    
    // Rejeitar links genéricos
    if (parts[0] === 'company' || parts[0] === 'school' || parts[0] === 'feed' || 
        parts[0] === 'search' || parts[0] === 'posts') {
      return null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Canonicalizar URL Apollo (pessoa)
 * Formato: https://app.apollo.io/#/people/{id}
 */
export function canonicalizeApolloPersonUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('apollo.io')) return null;
    
    // Extrair ID da pessoa
    const match = url.match(/people\/([a-f0-9]+)/i);
    if (match && match[1]) {
      return `https://app.apollo.io/#/people/${match[1]}`;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Verificar se email é corporativo (pertence ao domínio da empresa)
 */
export function isValidCorporateEmail(email: string, companyDomain: string, allowedDomains: string[] = []): boolean {
  if (!email || !companyDomain) return false;
  
  const emailDomain = email.split('@')[1]?.toLowerCase();
  const normalizedCompanyDomain = companyDomain.toLowerCase().replace(/^www\./, '');
  
  // Rejeitar e-mails genéricos
  const genericEmails = ['info@', 'contato@', 'contact@', 'careers@', 'support@', 'sales@', 'admin@', 'noreply@'];
  if (genericEmails.some(prefix => email.toLowerCase().startsWith(prefix))) {
    return false;
  }
  
  // Verificar se é do domínio principal ou lista permitida
  return emailDomain === normalizedCompanyDomain || allowedDomains.includes(emailDomain);
}

/**
 * Calcular score de match entre empresa buscada e Apollo
 */
export function calculateMatchScore(
  apolloOrg: any,
  searchName: string,
  searchDomain?: string,
  searchLocation?: { city?: string; state?: string; country?: string }
): number {
  let score = 0;
  
  // Nome normalizado (peso: 40 pontos)
  const normalizedSearch = normalizeName(searchName);
  const normalizedApollo = normalizeName(apolloOrg.name || '');
  
  if (normalizedApollo === normalizedSearch) {
    score += 40;
  } else if (normalizedApollo.includes(normalizedSearch) || normalizedSearch.includes(normalizedApollo)) {
    score += 30;
  } else {
    const searchWords = normalizedSearch.split(/\s+/);
    const matches = searchWords.filter(word => normalizedApollo.includes(word)).length;
    score += (matches / searchWords.length) * 20;
  }
  
  // Domínio (peso: 35 pontos)
  if (searchDomain && apolloOrg.primary_domain) {
    const normalizedSearchDomain = searchDomain.toLowerCase().replace(/^www\./, '');
    const normalizedApolloDomain = apolloOrg.primary_domain.toLowerCase().replace(/^www\./, '');
    
    if (normalizedSearchDomain === normalizedApolloDomain) {
      score += 35;
    } else if (normalizedApolloDomain.includes(normalizedSearchDomain) || normalizedSearchDomain.includes(normalizedApolloDomain)) {
      score += 20;
    }
  }
  
  // Localização (peso: 15 pontos)
  if (searchLocation) {
    let locationMatch = 0;
    
    if (searchLocation.city && apolloOrg.city) {
      if (normalizeName(searchLocation.city) === normalizeName(apolloOrg.city)) {
        locationMatch += 5;
      }
    }
    
    if (searchLocation.state && apolloOrg.state) {
      if (normalizeName(searchLocation.state) === normalizeName(apolloOrg.state)) {
        locationMatch += 5;
      }
    }
    
    if (searchLocation.country && apolloOrg.country) {
      if (normalizeName(searchLocation.country) === normalizeName(apolloOrg.country)) {
        locationMatch += 5;
      }
    }
    
    score += locationMatch;
  }
  
  // LinkedIn válido (peso: 10 pontos)
  if (apolloOrg.linkedin_url) {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Classificar decisor por senioridade (ranking)
 */
export function getSeniorityRank(seniority?: string): number {
  if (!seniority) return 0;
  
  const s = seniority.toLowerCase();
  
  if (s.includes('founder') || s.includes('owner') || s.includes('partner')) return 100;
  if (s.includes('c_suite') || s.includes('c-suite') || s.includes('ceo') || s.includes('cfo') || s.includes('cto')) return 90;
  if (s.includes('vp') || s.includes('vice president')) return 70;
  if (s.includes('director')) return 60;
  if (s.includes('head')) return 50;
  if (s.includes('manager')) return 40;
  if (s.includes('senior')) return 30;
  
  return 10;
}

/**
 * Classificar relevância do cargo para departamentos alvo
 */
export function getJobTitleRelevance(title?: string): number {
  if (!title) return 0;
  
  const t = title.toLowerCase();
  
  // Palavras-chave por departamento (peso alto)
  const highPriorityKeywords = [
    'compras', 'procurement', 'sourcing', 'suprimentos',
    'supply chain', 'logística', 'operações', 'industrial',
    'finance', 'financeiro', 'contabilidade', 'tesouraria',
    'sales', 'comercial', 'revenue', 'vendas',
    'technology', 'tecnologia', 'ti', 'engenharia', 'produto',
    'cfo', 'cto', 'cpo', 'coo'
  ];
  
  const matches = highPriorityKeywords.filter(keyword => t.includes(keyword)).length;
  return Math.min(100, matches * 25);
}

/**
 * Verificar se pessoa está atualmente na empresa (LinkedIn experiences)
 */
export function isCurrentAtCompany(
  linkedinExperiences: any[],
  targetCompany: { name: string; companyId?: string; domain?: string }
): boolean {
  if (!linkedinExperiences || linkedinExperiences.length === 0) return false;
  
  const normalizedTargetName = normalizeName(targetCompany.name);
  const normalizedTargetDomain = targetCompany.domain?.toLowerCase().replace(/^www\./, '');
  
  return linkedinExperiences.some((exp) => {
    // Verificar se é atual
    const isCurrent = exp.isCurrent === true || 
                     exp.end_date === null || 
                     exp.end_date === undefined ||
                     String(exp.end_date).toLowerCase().includes('present') ||
                     String(exp.end_date).toLowerCase().includes('atual');
    
    if (!isCurrent) return false;
    
    // Verificar se é a mesma empresa
    if (targetCompany.companyId && exp.companyId === targetCompany.companyId) {
      return true;
    }
    
    const expCompanyName = normalizeName(exp.company_name || exp.companyName || '');
    if (expCompanyName === normalizedTargetName) {
      return true;
    }
    
    if (normalizedTargetDomain && exp.company_domain) {
      const expDomain = exp.company_domain.toLowerCase().replace(/^www\./, '');
      if (expDomain === normalizedTargetDomain) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Classificar departamento por cargo
 */
export function classifyDepartment(title?: string, functions?: string[]): string | null {
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
 * Gerar hash de deduplicação (nome+cargo+empresa)
 */
export function generatePersonHash(firstName: string, lastName: string, title: string, companyName: string): string {
  const combined = normalizeName(`${firstName} ${lastName} ${title} ${companyName}`);
  return combined.replace(/\s+/g, '_');
}
