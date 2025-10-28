// ============================================
// CICLO 3: Handlers Completos de Resolução e Enriquecimento
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as utils from './utils.ts';
import * as apolloFields from './apollo-fields.ts';
import * as peopleCollector from './people-collector.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CICLO 3 - Handler de Resolução de Empresa (Score ≥ 0.85)
 */
export async function resolveAndEnrichOrganization(
  apolloKey: string,
  searchParams: {
    name: string;
    domain?: string;
    location?: { city?: string; state?: string; country?: string };
  }
): Promise<{ organization: any; matchScore: number } | null> {
  console.log('[CICLO 3] Iniciando resolução de empresa:', searchParams.name);
  
  // Normalizar nome da busca
  const normalizedSearchName = utils.normalizeName(searchParams.name);
  
  // Buscar no Apollo com múltiplas estratégias
  const strategies = [
    // Estratégia 1: Nome + Domínio
    { q_organization_name: searchParams.name, q_organization_domains: searchParams.domain },
    // Estratégia 2: Domínio apenas (mais confiável)
    { q_organization_domains: searchParams.domain },
    // Estratégia 3: Nome normalizado
    { q_organization_name: normalizedSearchName },
    // Estratégia 4: Palavras-chave principais
    { q_keywords: normalizedSearchName.split(/\s+/)[0] }
  ];
  
  let bestMatch: any = null;
  let bestScore = 0;
  
  for (const [index, strategy] of strategies.entries()) {
    // Pular estratégias sem parâmetros válidos
    if (Object.values(strategy).every(v => !v)) continue;
    
    console.log(`[CICLO 3] Estratégia ${index + 1}:`, strategy);
    
    try {
      const response = await fetch('https://api.apollo.io/v1/organizations/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apolloKey
        },
        body: JSON.stringify({
          ...strategy,
          page: 1,
          per_page: 5
        })
      });
      
      if (!response.ok) {
        console.error(`[CICLO 3] Estratégia ${index + 1} falhou:`, response.status);
        continue;
      }
      
      const data = await response.json();
      const organizations = data.organizations || [];
      
      console.log(`[CICLO 3] Estratégia ${index + 1}: ${organizations.length} resultados`);
      
      // Calcular match score para cada resultado
      for (const org of organizations) {
        const score = utils.calculateMatchScore(
          org,
          searchParams.name,
          searchParams.domain,
          searchParams.location
        );
        
        console.log(`[CICLO 3] ${org.name}: score = ${score}`);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = org;
        }
      }
      
      // Se encontramos match ≥ 85, podemos parar
      if (bestScore >= 85) {
        console.log(`[CICLO 3] ✅ Match encontrado (score: ${bestScore})`);
        break;
      }
      
    } catch (error) {
      console.error(`[CICLO 3] Erro na estratégia ${index + 1}:`, error);
    }
  }
  
  if (!bestMatch || bestScore < 85) {
    console.log(`[CICLO 3] ❌ Nenhum match com score ≥ 85 (melhor: ${bestScore})`);
    return null;
  }
  
  console.log(`[CICLO 3] ✅ Organização resolvida: ${bestMatch.name} (${bestScore})`);
  
  return {
    organization: bestMatch,
    matchScore: bestScore
  };
}

/**
 * CICLO 3 - Handler de Busca por Organization ID (URL Apollo manual)
 */
export async function getOrganizationById(
  apolloKey: string,
  organizationId: string
): Promise<any | null> {
  console.log('[CICLO 3] Buscando por Organization ID:', organizationId);
  
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
      throw new Error(`Apollo API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[CICLO 3] ✅ Organização encontrada:', data.organization?.name);
    
    return data.organization;
  } catch (error) {
    console.error('[CICLO 3] Erro ao buscar por ID:', error);
    return null;
  }
}

/**
 * CICLO 3 - Handler Completo de Enriquecimento (100% campos + Decisores com paginação)
 */
export async function enrichCompanyComplete(
  supabaseUrl: string,
  supabaseServiceKey: string,
  apolloKey: string,
  companyId: string,
  apolloOrganizationId?: string
): Promise<{
  success: boolean;
  fields_enriched: number;
  decisors_collected: number;
  decisors_valid: number;
  decisors_saved: number;
  similar_companies: number;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('[CICLO 3] ========================================');
  console.log('[CICLO 3] Enriquecimento Completo - Company ID:', companyId);
  console.log('[CICLO 3] ========================================');
  
  // 1. Buscar dados da empresa no banco
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  
  if (!company) {
    throw new Error('Empresa não encontrada no banco');
  }
  
  // 2. Resolver organização Apollo
  let apolloOrg: any = null;
  
  if (apolloOrganizationId) {
    // Busca direta por ID (URL manual)
    apolloOrg = await getOrganizationById(apolloKey, apolloOrganizationId);
  } else {
    // Resolução automática
    const resolved = await resolveAndEnrichOrganization(apolloKey, {
      name: company.name,
      domain: company.domain || company.website,
      location: company.location
    });
    
    if (resolved && resolved.matchScore >= 85) {
      apolloOrg = resolved.organization;
    }
  }
  
  if (!apolloOrg) {
    throw new Error('Organização não encontrada no Apollo ou match score < 85');
  }
  
  console.log('[CICLO 3] ✅ Organização Apollo:', apolloOrg.name);
  console.log('[CICLO 3] Apollo Organization ID:', apolloOrg.id);
  
  // 3. Mapear 100% dos campos da organização
  const orgFields = apolloFields.mapOrganizationFields(apolloOrg);
  
  // 4. Extrair empresas similares com hyperlinks
  const similarCompanies = apolloFields.extractSimilarCompanies(apolloOrg);
  orgFields.similar_companies = similarCompanies;
  
  // 5. Salvar campos da organização
  const { error: updateError } = await supabase
    .from('companies')
    .update(orgFields)
    .eq('id', companyId);
  
  if (updateError) {
    console.error('[CICLO 3] Erro ao salvar campos da organização:', updateError);
    throw updateError;
  }
  
  console.log('[CICLO 3] ✅ Campos da organização salvos');
  console.log('[CICLO 3] Empresas similares:', similarCompanies.length);
  
  // 6. Coletar TODAS as pessoas com paginação completa
  const allPeople = await peopleCollector.collectAllPeople(
    apolloKey,
    apolloOrg.id,
    apolloOrg.primary_domain
  );
  
  console.log('[CICLO 3] Total de pessoas coletadas:', allPeople.length);
  
  // 7. Filtrar e validar decisores (critérios rigorosos)
  const validationResults = peopleCollector.filterAndValidateDecisors(
    allPeople,
    apolloOrg.id,
    apolloOrg.primary_domain,
    apolloOrg.name
  );
  
  const validPeople = validationResults
    .filter(r => r.validationStatus === 'valid')
    .map(r => r.person);
  
  console.log('[CICLO 3] Pessoas válidas após validação:', validPeople.length);
  
  // 8. Deduplicar por LinkedIn canônico
  const uniquePeople = peopleCollector.deduplicatePeople(
    validPeople.map(person => ({ person, validationStatus: 'valid' as const }))
  );
  
  console.log('[CICLO 3] Pessoas únicas após deduplicação:', uniquePeople.length);
  
  // 9. Ordenar conforme padrão do CICLO 3
  const sortedPeople = peopleCollector.sortDecisors(uniquePeople);
  
  // 10. Mapear e salvar decisores
  let decisorsSaved = 0;
  
  if (sortedPeople.length > 0) {
    const decisors = sortedPeople.map(person => 
      apolloFields.mapPersonFields(person, companyId, apolloOrg.id)
    );
    
    // Verificar se tabela decision_makers existe, senão usar contacts
    const { error: decisorsError } = await supabase
      .from('decision_makers')
      .upsert(decisors, {
        onConflict: 'apollo_person_id',
        ignoreDuplicates: false
      });
    
    if (decisorsError) {
      console.error('[CICLO 3] Erro ao salvar decisores:', decisorsError);
      
      // Fallback: tentar salvar em contacts
      console.log('[CICLO 3] Fallback: salvando em contacts...');
      const contactsData = decisors.map(d => ({
        company_id: d.company_id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        meta: {
          title: d.title,
          linkedin_url: d.linkedin_url,
          seniority: d.seniority,
          departments: d.departments,
          apollo_person_id: d.apollo_person_id
        }
      }));
      
      await supabase.from('contacts').upsert(contactsData, { onConflict: 'apollo_person_id' });
    } else {
      decisorsSaved = decisors.length;
    }
  }
  
  console.log('[CICLO 3] ========================================');
  console.log('[CICLO 3] ✅ Enriquecimento completo finalizado!');
  console.log('[CICLO 3] Campos da organização: 100%');
  console.log('[CICLO 3] Decisores coletados:', allPeople.length);
  console.log('[CICLO 3] Decisores válidos:', validPeople.length);
  console.log('[CICLO 3] Decisores salvos:', decisorsSaved);
  console.log('[CICLO 3] Empresas similares:', similarCompanies.length);
  console.log('[CICLO 3] ========================================');
  
  return {
    success: true,
    fields_enriched: Object.keys(orgFields).length,
    decisors_collected: allPeople.length,
    decisors_valid: validPeople.length,
    decisors_saved: decisorsSaved,
    similar_companies: similarCompanies.length
  };
}
