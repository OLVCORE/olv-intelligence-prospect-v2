// ============================================
// CICLO 3: Coleta Completa de Decisores com Paginação
// ============================================

import * as utils from './utils.ts';
import * as apolloFields from './apollo-fields.ts';

/**
 * Coletar TODAS as pessoas de uma organização com paginação completa
 */
export async function collectAllPeople(
  apolloKey: string,
  organizationId: string,
  organizationDomain?: string
): Promise<any[]> {
  const allPeople: any[] = [];
  let currentPage = 1;
  const perPage = 100; // Máximo permitido pela API Apollo
  let hasMore = true;
  
  console.log(`[Apollo] Iniciando coleta de decisores - Organization ID: ${organizationId}`);
  
  while (hasMore) {
    console.log(`[Apollo] Coletando página ${currentPage}...`);
    
    try {
      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify({
          organization_ids: [organizationId],
          person_seniorities: ['c_suite', 'vp', 'director', 'head', 'manager', 'senior', 'owner', 'partner', 'founder'],
          page: currentPage,
          per_page: perPage
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Apollo] Erro na página ${currentPage}:`, response.status, errorText);
        break;
      }
      
      const data = await response.json();
      const people = data.people || [];
      
      console.log(`[Apollo] Página ${currentPage}: ${people.length} pessoas encontradas`);
      
      if (people.length === 0) {
        hasMore = false;
        break;
      }
      
      // Adicionar pessoas da página atual
      allPeople.push(...people);
      
      // Verificar se há mais páginas
      const totalResults = data.pagination?.total_entries || 0;
      const collectedSoFar = currentPage * perPage;
      
      if (collectedSoFar >= totalResults || people.length < perPage) {
        hasMore = false;
      } else {
        currentPage++;
        // Respeitar rate limits (pequeno delay entre páginas)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`[Apollo] Erro ao coletar página ${currentPage}:`, error);
      break;
    }
  }
  
  console.log(`[Apollo] ✅ Coleta finalizada: ${allPeople.length} pessoas no total`);
  return allPeople;
}

/**
 * Filtrar e validar decisores com critérios RIGOROSOS do CICLO 3
 */
export function filterAndValidateDecisors(
  people: any[],
  apolloOrgId: string,
  companyDomain?: string,
  companyName?: string
): Array<{
  person: any;
  validationStatus: 'valid' | 'rejected';
  rejectionReason?: string;
}> {
  const results: Array<{ person: any; validationStatus: 'valid' | 'rejected'; rejectionReason?: string }> = [];
  const normalizedDomain = companyDomain?.toLowerCase().replace(/^www\./, '');
  
  for (const person of people) {
    // REGRA 1: Organization ID DEVE ser exatamente igual
    const personOrgId = person.organization_id || person.organization?.id;
    if (personOrgId !== apolloOrgId) {
      results.push({
        person,
        validationStatus: 'rejected',
        rejectionReason: 'org_id diferente'
      });
      continue;
    }
    
    // REGRA 2: Domínio DEVE corresponder (se disponível)
    if (normalizedDomain && person.organization?.primary_domain) {
      const personDomain = person.organization.primary_domain.toLowerCase().replace(/^www\./, '');
      if (personDomain !== normalizedDomain) {
        results.push({
          person,
          validationStatus: 'rejected',
          rejectionReason: 'domínio diferente'
        });
        continue;
      }
    }
    
    // REGRA 3: Links canônicos válidos
    const linkedinUrl = person.linkedin_url ? utils.canonicalizeLinkedIn(person.linkedin_url) : null;
    
    // Rejeitar links genéricos
    if (person.linkedin_url && !linkedinUrl) {
      results.push({
        person,
        validationStatus: 'rejected',
        rejectionReason: 'link LinkedIn genérico ou inválido'
      });
      continue;
    }
    
    // REGRA 4: Email corporativo ou pessoal PERMITIDO
    // E-mails pessoais são permitidos mas com rótulo claro
    const hasValidContact = (
      person.linkedin_url || // LinkedIn sempre válido
      person.phone_numbers?.length > 0 || // Telefone válido
      (person.email && person.email_status !== 'unavailable') // Email disponível
    );
    
    if (!hasValidContact) {
      results.push({
        person,
        validationStatus: 'rejected',
        rejectionReason: 'sem contato válido'
      });
      continue;
    }
    
    // REGRA 5: Senioridade mínima (Manager ou superior)
    const seniorityRank = utils.getSeniorityRank(person.seniority);
    if (seniorityRank < 40) { // Manager = 40
      results.push({
        person,
        validationStatus: 'rejected',
        rejectionReason: 'senioridade insuficiente'
      });
      continue;
    }
    
    // ✅ Pessoa válida
    results.push({
      person,
      validationStatus: 'valid'
    });
  }
  
  const validCount = results.filter(r => r.validationStatus === 'valid').length;
  const rejectedCount = results.length - validCount;
  
  console.log(`[Apollo] Validação completa: ${validCount} válidos, ${rejectedCount} rejeitados`);
  
  // Log de rejeições (sample)
  const rejectionsSample = results
    .filter(r => r.validationStatus === 'rejected')
    .slice(0, 5);
  
  if (rejectionsSample.length > 0) {
    console.log('[Apollo] Amostra de rejeições:', rejectionsSample.map(r => ({
      name: r.person.name,
      reason: r.rejectionReason
    })));
  }
  
  return results;
}

/**
 * Deduplic

ar pessoas por LinkedIn canônico (chave primária)
 */
export function deduplicatePeople(
  validatedResults: Array<{ person: any; validationStatus: 'valid' }>
): any[] {
  const deduplicationMap = new Map<string, any>();
  const conflicts: Array<{ key: string; people: any[] }> = [];
  
  for (const { person } of validatedResults) {
    // Chave primária: LinkedIn canônico
    const linkedinUrl = person.linkedin_url ? utils.canonicalizeLinkedIn(person.linkedin_url) : null;
    
    if (linkedinUrl) {
      if (deduplicationMap.has(linkedinUrl)) {
        // Conflito: já existe alguém com este LinkedIn
        const existing = deduplicationMap.get(linkedinUrl);
        conflicts.push({
          key: linkedinUrl,
          people: [existing, person]
        });
        
        // Manter o mais recente ou com mais dados
        const newer = compareAndSelectBetter(existing, person);
        deduplicationMap.set(linkedinUrl, newer);
      } else {
        deduplicationMap.set(linkedinUrl, person);
      }
    } else {
      // Chave secundária: hash (nome+cargo+empresa)
      const hash = utils.generatePersonHash(
        person.first_name || '',
        person.last_name || '',
        person.title || '',
        person.organization?.name || ''
      );
      
      if (deduplicationMap.has(hash)) {
        const existing = deduplicationMap.get(hash);
        const newer = compareAndSelectBetter(existing, person);
        deduplicationMap.set(hash, newer);
      } else {
        deduplicationMap.set(hash, person);
      }
    }
  }
  
  console.log(`[Apollo] Deduplicação: ${deduplicationMap.size} pessoas únicas`);
  
  if (conflicts.length > 0) {
    console.log(`[Apollo] ${conflicts.length} conflitos resolvidos (mesclagem automática)`);
  }
  
  return Array.from(deduplicationMap.values());
}

/**
 * Comparar duas pessoas e retornar a "melhor" (mais recente/completa)
 */
function compareAndSelectBetter(person1: any, person2: any): any {
  // Priorizar quem tem mais campos preenchidos
  const score1 = calculateCompletenessScore(person1);
  const score2 = calculateCompletenessScore(person2);
  
  if (score2 > score1) return person2;
  if (score1 > score2) return person1;
  
  // Se empate, priorizar mais recente
  const date1 = new Date(person1.last_activity_date || person1.created_at || 0);
  const date2 = new Date(person2.last_activity_date || person2.created_at || 0);
  
  return date2 > date1 ? person2 : person1;
}

/**
 * Calcular score de completude dos dados
 */
function calculateCompletenessScore(person: any): number {
  let score = 0;
  
  if (person.email && person.email_status !== 'unavailable') score += 10;
  if (person.email_status === 'verified') score += 5;
  if (person.phone_numbers?.length > 0) score += 10;
  if (person.linkedin_url) score += 10;
  if (person.twitter_url) score += 5;
  if (person.title) score += 5;
  if (person.headline) score += 5;
  if (person.departments?.length > 0) score += 5;
  if (person.functions?.length > 0) score += 5;
  if (person.employment_history?.length > 0) score += 10;
  if (person.education?.length > 0) score += 5;
  if (person.recommendations_score) score += 5;
  
  return score;
}

/**
 * Ordenar decisores conforme seção 9 do CICLO 3
 * Ordem: recommendations_score > seniority_rank > job_title_relevance > tenure_start_date > last_updated_at
 */
export function sortDecisors(people: any[]): any[] {
  return people.sort((a, b) => {
    // 1. recommendations_score desc
    const scoreA = a.recommendations_score || 0;
    const scoreB = b.recommendations_score || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    
    // 2. seniority_rank desc
    const seniorityA = utils.getSeniorityRank(a.seniority);
    const seniorityB = utils.getSeniorityRank(b.seniority);
    if (seniorityB !== seniorityA) return seniorityB - seniorityA;
    
    // 3. job_title_relevance desc
    const relevanceA = utils.getJobTitleRelevance(a.title);
    const relevanceB = utils.getJobTitleRelevance(b.title);
    if (relevanceB !== relevanceA) return relevanceB - relevanceA;
    
    // 4. tenure_start_date desc (mais recente primeiro)
    const tenureA = new Date(a.employment_history?.[0]?.start_date || 0);
    const tenureB = new Date(b.employment_history?.[0]?.start_date || 0);
    if (tenureB.getTime() !== tenureA.getTime()) return tenureB.getTime() - tenureA.getTime();
    
    // 5. last_updated_at desc
    const updateA = new Date(a.last_activity_date || a.updated_at || 0);
    const updateB = new Date(b.last_activity_date || b.updated_at || 0);
    return updateB.getTime() - updateA.getTime();
  });
}
