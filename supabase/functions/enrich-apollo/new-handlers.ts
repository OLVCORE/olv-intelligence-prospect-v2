import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as handlers from './handlers.ts';

export async function handleSearchOrganizations(
  apolloKey: string,
  searchName: string,
  domain?: string
) {
  const organizations = await handlers.searchOrganizations(apolloKey, searchName, domain);
  
  return {
    success: true,
    organizations,
    total: organizations.length
  };
}

export async function handleGetOrganizationById(
  apolloKey: string,
  organizationId: string
) {
  const organization = await handlers.getOrganizationById(apolloKey, organizationId);
  
  if (!organization) {
    throw new Error('Organização não encontrada');
  }
  
  return { organization };
}

export async function handleEnrichCompany(
  supabaseUrl: string,
  supabaseServiceKey: string,
  apolloKey: string,
  companyId: string,
  apolloOrganizationId: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('[Apollo] Enriquecendo empresa:', companyId);

  // 1. Buscar dados completos da organização
  const org = await handlers.getOrganizationById(apolloKey, apolloOrganizationId);
  
  if (!org) {
    throw new Error('Organização não encontrada no Apollo');
  }

  // 2. Salvar 42 campos da organização
  const orgFields = handlers.mapOrganizationFields(org);
  
  const { error: updateError } = await supabase
    .from('companies')
    .update(orgFields)
    .eq('id', companyId);

  if (updateError) {
    console.error('[Apollo] Erro ao salvar org:', updateError);
    throw updateError;
  }

  // 3. Buscar decisores RIGOROSOS
  const peopleResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apolloKey
    },
    body: JSON.stringify({
      organization_ids: [apolloOrganizationId],
      person_seniorities: ['director', 'vp', 'c_suite', 'owner', 'partner'],
      page: 1,
      per_page: 100
    })
  });

  let decisorsCount = 0;

  if (peopleResponse.ok) {
    const peopleData = await peopleResponse.json();
    const people = peopleData.people || [];

    console.log(`[Apollo] ${people.length} pessoas encontradas`);

    // Filtrar RIGOROSAMENTE
    const validPeople = handlers.filterValidDecisors(people, apolloOrganizationId, org.primary_domain);

    console.log(`[Apollo] ${validPeople.length} decisores válidos após filtro`);

    // Salvar decisores
    if (validPeople.length > 0) {
      const decisors = validPeople.map((p: any) => 
        handlers.mapDecisionMakerFields(p, companyId, apolloOrganizationId)
      );

      const { error: decisorsError } = await supabase
        .from('decision_makers')
        .upsert(decisors, { 
          onConflict: 'apollo_person_id',
          ignoreDuplicates: false 
        });

      if (decisorsError) {
        console.error('[Apollo] Erro ao salvar decisores:', decisorsError);
      } else {
        decisorsCount = decisors.length;
      }
    }

    // Fallback PhantomBuster se 0 decisores
    if (validPeople.length === 0 && org.linkedin_url) {
      console.log('[Apollo] 0 decisores → Ativando fallback PhantomBuster');
      
      try {
        await supabase.functions.invoke('linkedin-scrape', {
          body: {
            companyId,
            linkedinUrl: org.linkedin_url,
            type: 'company_employees'
          }
        });
      } catch (phantomError) {
        console.error('[Apollo] Erro no fallback Phantom:', phantomError);
      }
    }
  }

  return {
    success: true,
    decisors_found: decisorsCount,
    fields_enriched: 42
  };
}
