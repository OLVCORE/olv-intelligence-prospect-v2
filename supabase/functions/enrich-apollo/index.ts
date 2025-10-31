// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ORIGINS = new Set<string>([
  'http://localhost:3000',
  'http://localhost:5173',
  'https://83aa9319-3cdb-4039-89a3-d5632b977732.lovableproject.com'
]);

const schema = {
  organization_id: (v: any) => typeof v === 'string' && v.length >= 5,
  company_id: (v: any) => typeof v === 'string' && v.length > 0,
  modes: (v: any) => Array.isArray(v) && v.length > 0 && v.every(m => ['company','people','similar'].includes(m)),
  force: (v: any) => typeof v === 'boolean' || v === undefined,
  activity_id: (v: any) => typeof v === 'string' || v === undefined
};

function cors(origin: string) {
  const allow = ORIGINS.has(origin) ? origin : '*';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key'
  };
}

serve(async (req: Request) => {
  const c = cors(req.headers.get('origin') || '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });

  const correlationId = crypto.randomUUID();

  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return J({ error: 'missing_or_invalid_authorization', hint: 'Envie Authorization: Bearer <token>', correlationId }, 401, c);
    }
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return J({ error: 'invalid_content_type', hint: 'Use Content-Type: application/json', correlationId }, 400, c);
    }

    const body: any = await req.json().catch(() => null);
    if (!body) {
      return J({ error: 'invalid_payload', hint: 'Body vazio ou JSON inválido', correlationId }, 400, c);
    }
    
    console.log('[enrich-apollo] Request body:', JSON.stringify(body), 'correlationId:', correlationId);
    
    // Suporte para busca de organizações (usado quando empresa não tem apollo_organization_id)
    if (body.type === 'search_organizations') {
      const apolloKey = Deno.env.get('APOLLO_API_KEY');
      if (!apolloKey) {
        return J({ error: 'integration_not_configured', hint: 'APOLLO_API_KEY não configurada' }, 501, c);
      }

      const searchResults = await apolloSearchOrganizations(
        body.name || '',
        body.domain || '',
        apolloKey
      );

      return J({
        ok: true,
        organizations: searchResults.organizations || [],
        total: searchResults.pagination?.total_entries || 0
      }, 200, c);
    }
    
    // Validação para enriquecimento
    const validOrgId = schema.organization_id(body.organization_id);
    const validCompanyId = schema.company_id(body.company_id);
    const validModes = schema.modes(body.modes);
    
    console.log('[enrich-apollo] Validation:', { validOrgId, validCompanyId, validModes, orgId: body.organization_id, companyId: body.company_id, modes: body.modes });
    
    if (!validOrgId || !validCompanyId || !validModes) {
      return J({ 
        error: 'invalid_payload', 
        hint: 'Campos obrigatórios: organization_id (string >=5), company_id (uuid), modes (array)',
        details: { validOrgId, validCompanyId, validModes }
      }, 400, c);
    }

    const input = {
      organization_id: body.organization_id,
      company_id: body.company_id,
      modes: body.modes as Array<'company'|'people'|'similar'>,
      force: body.force || false,
      activity_id: body.activity_id
    };

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apolloKey = Deno.env.get('APOLLO_API_KEY');

    if (!apolloKey) {
      return J({ error: 'integration_not_configured', hint: 'APOLLO_API_KEY não configurada', correlationId }, 501, c);
    }

    const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

    // ESTIMATIVA DE CRÉDITOS
    const estimate = await estimateCredits(sb, input.organization_id, input.modes);

    // VERIFICAÇÃO DE CRÉDITOS DISPONÍVEIS
    const creditCheck = await checkCreditsAvailable(sb, estimate.total);

    if (!creditCheck.ok) {
      await sb.from('apollo_credit_usage').insert({
        company_id: input.company_id,
        organization_id: input.organization_id,
        modes: input.modes,
        estimated_credits: estimate.total,
        status: 'insufficient_credits',
        error_code: 'insufficient_credits',
        error_message: creditCheck.message
      });

      return J({
        error: 'insufficient_credits',
        hint: creditCheck.message,
        estimate,
        available: creditCheck.available,
        correlationId
      }, 402, c);
    }

    // DRY RUN (apenas estimativa)
    const isDryRun = body.dry_run === true;
    if (isDryRun) {
      return J({
        ok: true,
        dry_run: true,
        estimate,
        creditsAvailable: creditCheck.available,
        creditWarning: creditCheck.message,
        correlationId
      }, 200, c);
    }

    const requestId = crypto.randomUUID();
    const activityId = input.activity_id || crypto.randomUUID();
    const out: Record<string, unknown> = { 
      ok: true, 
      requestId, 
      activityId, 
      modes: input.modes,
      correlationId,
      estimate,
      creditsAvailable: creditCheck.available
    };

    if (creditCheck.message) {
      out.creditWarning = creditCheck.message;
    }

    let actualCreditsConsumed = 0;

    console.log('[enrich-apollo] Iniciando:', { companyId: input.company_id, orgId: input.organization_id, modes: input.modes, correlationId });

    // COMPANY
    if (input.modes.includes('company')) {
      console.log('[enrich-apollo] Buscando dados da empresa...');
      const companyData = await apolloFetchCompany(input.organization_id, apolloKey);
      if (!companyData) {
        console.log('[enrich-apollo] Nenhum dado de empresa retornado');
        return J({ error: 'apollo_empty_company', hint: 'Apollo não retornou dados da empresa' }, 502, c);
      }

      const patch = mapApolloCompany(companyData);
      console.log('[enrich-apollo] Campos a atualizar:', Object.keys(patch).length);
      console.log('[enrich-apollo] Campos:', Object.keys(patch).join(', '));
      
      actualCreditsConsumed += 1;
      
      const { data: updatedData, error: uerr } = await sb
        .from('companies')
        .update({ ...patch, last_apollo_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', input.company_id)
        .select('id');

      if (uerr) {
        console.error('[enrich-apollo] Erro ao atualizar empresa:', uerr);
        return J({ error: 'db_update_failed', hint: uerr.message, mode: 'company' }, 500, c);
      }
      
      const count = updatedData?.length || 0;
      if (count === 0) {
        console.error('[enrich-apollo] Zero linhas atualizadas para company_id:', input.company_id);
        return J({ error: 'db_zero_rows', hint: 'Nenhuma linha afetada. Verifique company_id.' }, 409, c);
      }
      
      out.companyUpdated = count;
      out.companyFieldsCount = Object.keys(patch).length;
      out.companyFields = Object.keys(patch);
      console.log('[enrich-apollo] Empresa atualizada:', count, 'linhas, ', Object.keys(patch).length, 'campos');

      // Atualizar technologies
      if (companyData.current_technologies && Array.isArray(companyData.current_technologies)) {
        const techs = companyData.current_technologies.map((t: any) => ({
          company_id: input.company_id,
          technology: t.name || t,
          category: t.category || null,
          source: 'apollo'
        }));

        if (techs.length > 0) {
          await sb.from('company_technologies').delete().eq('company_id', input.company_id);
          await sb.from('company_technologies').upsert(techs);
          console.log('[enrich-apollo] Technologies salvas:', techs.length);
        }
      }
    }

    // PEOPLE
    if (input.modes.includes('people')) {
      console.log('[enrich-apollo] Buscando people...');
      const peopleAll = await apolloFetchPeoplePaginated(input.organization_id, apolloKey);
      if (!Array.isArray(peopleAll)) {
        console.log('[enrich-apollo] Nenhum dado de people retornado');
        out.peopleFound = 0;
        out.peopleUpserted = 0;
        out.peopleLinked = 0;
      } else {
        console.log('[enrich-apollo] People encontrados:', peopleAll.length);
        
        actualCreditsConsumed += peopleAll.length;
        
        const mapped = peopleAll.map(mapApolloPerson);
        
        // Deduplicar por chaves únicas antes de fazer upsert
        const deduped = deduplicatePeople(mapped);
        console.log('[enrich-apollo] People após deduplicação:', deduped.length, '(removidos', mapped.length - deduped.length, 'duplicados)');
        
        const chunks = chunk(deduped, 100);

        let upserted = 0;
        let linked = 0;

        for (const ch of chunks) {
          // Separar pessoas por chave única para evitar conflitos
          const byApollo = ch.filter(p => p.apollo_person_id);
          const byLinkedin = ch.filter(p => !p.apollo_person_id && p.linkedin_profile_id);
          const byEmail = ch.filter(p => !p.apollo_person_id && !p.linkedin_profile_id && p.email_hash);

          // Upsert por apollo_person_id
          if (byApollo.length > 0) {
            const { data: pdata, error: perr } = await sb
              .from('people')
              .upsert(byApollo, { onConflict: 'apollo_person_id', ignoreDuplicates: false })
              .select('id, apollo_person_id, linkedin_profile_id, email_hash');

            if (perr) {
              console.error('[enrich-apollo] Erro ao upsert people (apollo_id):', perr);
              // Buscar pessoas existentes - pode estar duplicado por email_hash
              const apolloIds = byApollo.map(p => p.apollo_person_id).filter(Boolean);
              const emailHashes = byApollo.map(p => p.email_hash).filter(Boolean);
              
              let existing: any[] = [];
              
              // Tentar buscar por apollo_person_id primeiro
              if (apolloIds.length > 0) {
                const { data: byApolloData } = await sb
                  .from('people')
                  .select('id, apollo_person_id, email_hash')
                  .in('apollo_person_id', apolloIds);
                if (byApolloData) existing = byApolloData;
              }
              
              // Se não encontrou ou encontrou menos que esperado, tentar por email_hash
              if (existing.length < byApollo.length && emailHashes.length > 0) {
                const { data: byEmailData } = await sb
                  .from('people')
                  .select('id, apollo_person_id, email_hash')
                  .in('email_hash', emailHashes);
                
                if (byEmailData) {
                  // Adicionar pessoas encontradas por email que ainda não estão na lista
                  const existingIds = new Set(existing.map(p => p.id));
                  for (const p of byEmailData) {
                    if (!existingIds.has(p.id)) {
                      existing.push(p);
                    }
                  }
                }
              }
              
              if (existing.length > 0) {
                const links = existing.map(p => {
                  // Buscar pessoa original por apollo_person_id ou email_hash
                  const src = byApollo.find(ci => 
                    ci.apollo_person_id === p.apollo_person_id || 
                    ci.email_hash === p.email_hash
                  );
                  return {
                    company_id: input.company_id,
                    person_id: p.id,
                    apollo_organization_id: input.organization_id,
                    department: src?.department || null,
                    seniority: src?.seniority || null,
                    location_city: src?.city || null,
                    location_state: src?.state || null,
                    location_country: src?.country || null,
                    title_at_company: src?.job_title || null,
                    is_current: src?.is_current_at_company ?? false,
                    source: 'apollo'
                  };
                });
                
                const { data: lkd } = await sb
                  .from('company_people')
                  .upsert(links, { onConflict: 'company_id,person_id' })
                  .select('company_id');
                linked += lkd?.length || 0;
                console.log('[enrich-apollo] People linkadas após erro:', lkd?.length || 0);
              }
            } else {
              upserted += pdata?.length || 0;
              
              const links = (pdata || []).map(p => {
                const src = byApollo.find(ci => ci.apollo_person_id === p.apollo_person_id);
                return {
                  company_id: input.company_id,
                  person_id: p.id,
                  apollo_organization_id: input.organization_id,
                  department: src?.department || null,
                  seniority: src?.seniority || null,
                  location_city: src?.city || null,
                  location_state: src?.state || null,
                  location_country: src?.country || null,
                  title_at_company: src?.job_title || null,
                  is_current: src?.is_current_at_company ?? false,
                  source: 'apollo'
                };
              });

              if (links.length > 0) {
                const { data: lkd, error: lkerr } = await sb
                  .from('company_people')
                  .upsert(links, { onConflict: 'company_id,person_id' })
                  .select('company_id');
                if (!lkerr) linked += lkd?.length || 0;
              }
            }
          }

          // Upsert por linkedin_profile_id
          if (byLinkedin.length > 0) {
            const { data: pdata, error: perr } = await sb
              .from('people')
              .upsert(byLinkedin, { onConflict: 'linkedin_profile_id', ignoreDuplicates: false })
              .select('id, apollo_person_id, linkedin_profile_id, email_hash');

            if (perr) {
              console.error('[enrich-apollo] Erro ao upsert people (linkedin_id):', perr);
              // Buscar pessoas existentes para fazer link
              const linkedinIds = byLinkedin.map(p => p.linkedin_profile_id).filter(Boolean);
              if (linkedinIds.length > 0) {
                const { data: existing } = await sb
                  .from('people')
                  .select('id, linkedin_profile_id')
                  .in('linkedin_profile_id', linkedinIds);
                
                if (existing && existing.length > 0) {
                  const links = existing.map(p => {
                    const src = byLinkedin.find(ci => ci.linkedin_profile_id === p.linkedin_profile_id);
                    return {
                      company_id: input.company_id,
                      person_id: p.id,
                      apollo_organization_id: input.organization_id,
                      department: src?.department || null,
                      seniority: src?.seniority || null,
                      location_city: src?.city || null,
                      location_state: src?.state || null,
                      location_country: src?.country || null,
                      title_at_company: src?.job_title || null,
                      is_current: src?.is_current_at_company ?? false,
                      source: 'apollo'
                    };
                  });
                  
                  const { data: lkd } = await sb
                    .from('company_people')
                    .upsert(links, { onConflict: 'company_id,person_id' })
                    .select('company_id');
                  linked += lkd?.length || 0;
                }
              }
            } else {
              upserted += pdata?.length || 0;
              
              const links = (pdata || []).map(p => {
                const src = byLinkedin.find(ci => ci.linkedin_profile_id === p.linkedin_profile_id);
                return {
                  company_id: input.company_id,
                  person_id: p.id,
                  apollo_organization_id: input.organization_id,
                  department: src?.department || null,
                  seniority: src?.seniority || null,
                  location_city: src?.city || null,
                  location_state: src?.state || null,
                  location_country: src?.country || null,
                  title_at_company: src?.job_title || null,
                  is_current: src?.is_current_at_company ?? false,
                  source: 'apollo'
                };
              });

              if (links.length > 0) {
                const { data: lkd, error: lkerr } = await sb
                  .from('company_people')
                  .upsert(links, { onConflict: 'company_id,person_id' })
                  .select('company_id');
                if (!lkerr) linked += lkd?.length || 0;
              }
            }
          }

          // Upsert por email_hash
          if (byEmail.length > 0) {
            const { data: pdata, error: perr } = await sb
              .from('people')
              .upsert(byEmail, { onConflict: 'email_hash', ignoreDuplicates: false })
              .select('id, apollo_person_id, linkedin_profile_id, email_hash');

            if (perr) {
              console.error('[enrich-apollo] Erro ao upsert people (email_hash):', perr);
              // Buscar pessoas existentes para fazer link
              const emailHashes = byEmail.map(p => p.email_hash).filter(Boolean);
              if (emailHashes.length > 0) {
                const { data: existing } = await sb
                  .from('people')
                  .select('id, email_hash')
                  .in('email_hash', emailHashes);
                
                if (existing && existing.length > 0) {
                  const links = existing.map(p => {
                    const src = byEmail.find(ci => ci.email_hash === p.email_hash);
                    return {
                      company_id: input.company_id,
                      person_id: p.id,
                      apollo_organization_id: input.organization_id,
                      department: src?.department || null,
                      seniority: src?.seniority || null,
                      location_city: src?.city || null,
                      location_state: src?.state || null,
                      location_country: src?.country || null,
                      title_at_company: src?.job_title || null,
                      is_current: src?.is_current_at_company ?? false,
                      source: 'apollo'
                    };
                  });
                  
                  const { data: lkd } = await sb
                    .from('company_people')
                    .upsert(links, { onConflict: 'company_id,person_id' })
                    .select('company_id');
                  linked += lkd?.length || 0;
                }
              }
            } else {
              upserted += pdata?.length || 0;
              
              const links = (pdata || []).map(p => {
                const src = byEmail.find(ci => ci.email_hash === p.email_hash);
                return {
                  company_id: input.company_id,
                  person_id: p.id,
                  apollo_organization_id: input.organization_id,
                  department: src?.department || null,
                  seniority: src?.seniority || null,
                  location_city: src?.city || null,
                  location_state: src?.state || null,
                  location_country: src?.country || null,
                  title_at_company: src?.job_title || null,
                  is_current: src?.is_current_at_company ?? false,
                  source: 'apollo'
                };
              });

              if (links.length > 0) {
                const { data: lkd, error: lkerr } = await sb
                  .from('company_people')
                  .upsert(links, { onConflict: 'company_id,person_id' })
                  .select('company_id');
                if (!lkerr) linked += lkd?.length || 0;
              }
            }
          }
        }

        out.peopleFound = peopleAll.length;
        out.peopleUpserted = upserted;
        out.peopleLinked = linked;
        console.log('[enrich-apollo] People processados:', { found: peopleAll.length, upserted, linked });
      }
    }

    // SIMILARES
    if (input.modes.includes('similar')) {
      console.log('[enrich-apollo] Buscando similares...');
      const similars = await apolloFetchSimilarCompanies(input.organization_id, apolloKey);
      if (!Array.isArray(similars)) {
        console.log('[enrich-apollo] Nenhum dado de similares retornado');
        out.similarFound = 0;
        out.similarLinked = 0;
      } else {
        console.log('[enrich-apollo] Similares encontrados:', similars.length);
        
        const mappedSim = similars.map(s => ({
          company_id: input.company_id,
          similar_company_external_id: s.id || s.orgId || crypto.randomUUID(),
          similar_name: s.name || 'Unknown',
          location: s.location || null,
          employees_min: s.employeesMin || s.estimated_num_employees || null,
          employees_max: s.employeesMax || null,
          similarity_score: s.score || null,
          source: 'apollo'
        }));
        
        console.log('[enrich-apollo] Similares mapeados:', mappedSim.length);
        
        const chunksSim = chunk(mappedSim, 100);
        let simLinked = 0;

        for (const ch of chunksSim) {
          const { data: simd, error: simerr } = await sb
            .from('similar_companies')
            .upsert(ch, { onConflict: 'company_id,similar_company_external_id' })
            .select('company_id');

          if (simerr) {
            console.error('[enrich-apollo] Erro ao salvar similares:', simerr);
            return J({ error: 'db_upsert_similar_failed', hint: simerr.message, mode: 'similar' }, 500, c);
          }
          const similaresInChunk = simd?.length || 0;
          simLinked += similaresInChunk;
          console.log(`[enrich-apollo] Upserted ${similaresInChunk} similares neste chunk`);
        }

        out.similarFound = similars.length;
        out.similarLinked = simLinked;
        console.log('[enrich-apollo] Similares processados:', { found: similars.length, linked: simLinked });
      }
    }

    // Auditoria
    await sb.from('company_updates').insert({
      activity_id: activityId,
      request_id: requestId,
      company_id: input.company_id,
      organization_id: input.organization_id,
      modes: input.modes,
      updated_fields: (out.companyFields as string[]) || [],
      updated_count: Number(out.companyUpdated || 0)
    });

    // ATUALIZAR CRÉDITOS CONSUMIDOS
    out.actualCreditsConsumed = actualCreditsConsumed;

    if (actualCreditsConsumed > 0) {
      await sb.rpc('increment_apollo_credits', { credits_consumed: actualCreditsConsumed });
    }

    // REGISTRAR USO NO HISTÓRICO
    try {
      const { data: companyData } = await sb
        .from('companies')
        .select('name')
        .eq('id', input.company_id)
        .single();

      await sb.from('apollo_credit_usage').insert({
        company_id: input.company_id,
        company_name: companyData?.name || null,
        organization_id: input.organization_id,
        modes: input.modes,
        estimated_credits: estimate.total,
        actual_credits: actualCreditsConsumed,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    } catch (auditErr: any) {
      console.warn('[enrich-apollo] Erro ao registrar uso:', auditErr.message);
    }

    console.log('[enrich-apollo] Concluído com sucesso. Créditos consumidos:', actualCreditsConsumed);
    return J(out, 202, c);

  } catch (e: any) {
    console.error('[enrich-apollo] Erro interno:', e);
    return J({ error: 'internal_error', message: String(e?.message || e) }, 500, c);
  }
});

function J(data: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Integração real com Apollo API
async function apolloFetchCompany(orgId: string, apiKey: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api.apollo.io/v1/organizations/${orgId}`, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('[Apollo] Erro ao buscar empresa:', response.status);
      return null;
    }

    const data = await response.json();
    return data.organization || data;
  } catch (error) {
    console.error('[Apollo] Exceção ao buscar empresa:', error);
    return null;
  }
}

async function apolloFetchPeoplePaginated(orgId: string, apiKey: string): Promise<any[]> {
  const allPeople: any[] = [];
  let page = 1;
  const perPage = 100;

  try {
    while (page <= 10) { // Limite de 1000 pessoas (10 páginas)
      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_ids: [orgId],
          page,
          per_page: perPage
        })
      });

      if (!response.ok) {
        console.error('[Apollo] Erro ao buscar people (página', page, '):', response.status);
        break;
      }

      const data = await response.json();
      const people = data.people || [];
      
      if (people.length === 0) break;
      
      allPeople.push(...people);
      
      if (people.length < perPage) break; // Última página
      
      page++;
      
      // Rate limiting - aguardar 500ms entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return allPeople;
  } catch (error) {
    console.error('[Apollo] Exceção ao buscar people:', error);
    return [];
  }
}

async function apolloFetchSimilarCompanies(orgId: string, apiKey: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.apollo.io/v1/organizations/${orgId}/similar_companies`, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('[Apollo] Erro ao buscar similares:', response.status);
      return [];
    }

    const data = await response.json();
    return data.similar_companies || [];
  } catch (error) {
    console.error('[Apollo] Exceção ao buscar similares:', error);
    return [];
  }
}

// Mapeamentos
function mapApolloCompany(a: any): Record<string, unknown> {
  // Mapeamento completo de +80 campos do Apollo
  const mapped: Record<string, unknown> = {
    // IDs e URLs
    apollo_organization_id: a?.id || null,
    linkedin_company_id: a?.linkedin_uid || null,
    apollo_url: a?.id ? `https://app.apollo.io/#/organizations/${a.id}` : null,
    linkedin_url: a?.linkedin_url || null,
    
    // Básico
    name: a?.name || null,
    domain: a?.primary_domain || a?.domain || null,
    website: a?.website_url || null,
    
    // Indústria e segmento
    industry: a?.industry || null,
    sub_industry: a?.sub_industry || null,
    naics_codes: a?.industry_tag_ids || [],
    sic_codes: a?.sic_codes || [],
    
    // Localização
    headquarters_city: a?.city || null,
    headquarters_state: a?.state || null,
    headquarters_country: a?.country || null,
    location: {
      city: a?.city || null,
      state: a?.state || null,
      country: a?.country || null,
      street: a?.street_address || null,
      postal_code: a?.postal_code || null,
      full_address: a?.raw_address || null
    },
    
    // Tamanho
    employees: a?.estimated_num_employees || null,
    employee_count_from_apollo: a?.estimated_num_employees || null,
    employee_count_range: a?.employee_range || null,
    
    // Receita
    revenue: a?.annual_revenue || null,
    revenue_range: a?.revenue_range || null,
    revenue_range_from_apollo: a?.revenue_range || null,
    
    // Fundação
    founding_year: a?.founded_year || null,
    
    // Contato
    phone_numbers: a?.phone ? [a.phone] : (a?.phone_number ? [a.phone_number] : []),
    
    // Score e qualificação
    account_score: a?.account_score || a?.recommendations_score || null,
    buying_intent_score: a?.buying_intent_score || null,
    lead_score: a?.recommendations_score || a?.account_score || 0,
    
    // Employee trends
    employee_trends: a?.current_employee_estimate ? {
      current: a.current_employee_estimate,
      six_months_ago: a.six_month_employee_growth_rate ? 
        Math.round(a.current_employee_estimate / (1 + a.six_month_employee_growth_rate / 100)) : null,
      one_year_ago: a.one_year_employee_growth_rate ?
        Math.round(a.current_employee_estimate / (1 + a.one_year_employee_growth_rate / 100)) : null,
      two_years_ago: a.two_year_employee_growth_rate ?
        Math.round(a.current_employee_estimate / (1 + a.two_year_employee_growth_rate / 100)) : null,
      growth_rate_6m: a.six_month_employee_growth_rate || null,
      growth_rate_1y: a.one_year_employee_growth_rate || null,
      growth_rate_2y: a.two_year_employee_growth_rate || null
    } : null,
    
    // Funding
    funding_total: a?.total_funding || a?.total_funding_raised || null,
    last_funding_round_amount: a?.latest_funding_round_amount || null,
    last_funding_round_date: a?.latest_funding_round_date || null,
    funding_rounds: a?.funding_events ? JSON.parse(JSON.stringify(a.funding_events)) : [],
    investors: a?.investors || [],
    
    // Tecnologias
    technologies: a?.current_technologies || a?.technologies || [],
    technologies_full: a?.technology_names || a?.current_technologies || [],
    
    // Job postings
    job_postings_count: a?.num_current_jobs || a?.total_job_postings || 0,
    job_postings: a?.job_postings || [],
    
    // Social
    social_urls: {
      linkedin: a?.linkedin_url || null,
      facebook: a?.facebook_url || null,
      twitter: a?.twitter_url || null,
      blog: a?.blog_url || null,
      crunchbase: a?.crunchbase_url || null
    },
    
    // Apollo signals
    apollo_signals: a?.signals || [],
    buying_intent_signals: a?.buying_intent_signals || [],
    
    // Company insights
    company_insights: {
      description: a?.organization_summary || a?.short_description || null,
      keywords: a?.keywords || [],
      is_public: a?.publicly_traded_symbol ? true : false,
      stock_symbol: a?.publicly_traded_symbol || null,
      stock_exchange: a?.publicly_traded_exchange || null,
      alexa_ranking: a?.alexa_ranking || null,
      total_funding: a?.total_funding || null,
      latest_funding_stage: a?.latest_funding_stage || null
    },
    
    // Metadata Apollo
    apollo_metadata: {
      sanitized_phone: a?.sanitized_phone || null,
      organization_id: a?.id || null,
      account_id: a?.account_id || null,
      parent_account_id: a?.parent_account_id || null,
      ultimate_parent_account_id: a?.ultimate_parent_account_id || null,
      logo_url: a?.logo_url || null,
      retail_location_count: a?.retail_location_count || null,
      seo_description: a?.seo_description || null,
      short_description: a?.short_description || null,
      logo_url_src: a?.logo_url_src || null,
      modality: a?.modality || null,
      languages: a?.languages || [],
      created_at: a?.created_at || null,
      sanitized_website: a?.sanitized_website || null,
      owned_by_organization_id: a?.owned_by_organization_id || null,
      suborganizations: a?.suborganizations || [],
      num_suborganizations: a?.num_suborganizations || 0,
      organization_raw_address: a?.organization_raw_address || null,
      organization_city: a?.organization_city || null,
      organization_street_address: a?.organization_street_address || null,
      organization_state: a?.organization_state || null,
      organization_country: a?.organization_country || null,
      organization_postal_code: a?.organization_postal_code || null,
      suggest_location_enrichment: a?.suggest_location_enrichment || false,
      departments: a?.departments || [],
      organization_revenue: a?.organization_revenue || null,
      organization_revenue_range: a?.organization_revenue_range || null,
      organization_industry: a?.organization_industry || null,
      organization_industry_tag_ids: a?.organization_industry_tag_ids || [],
      organization_secondary_industry_tag_ids: a?.organization_secondary_industry_tag_ids || [],
      organization_subindustry: a?.organization_subindustry || null,
      prospected_by_current_team: a?.prospected_by_current_team || []
    },
    
    // Apollo score breakdown
    apollo_score: a?.recommendations_score || a?.account_score ? {
      total: a.recommendations_score || a.account_score || 0,
      signals_count: Array.isArray(a?.signals) ? a.signals.length : 0,
      intent_score: a?.buying_intent_score || 0
    } : null,
    
    // Similar companies (se vier no response)
    similar_companies: a?.similar_companies || [],
    
    // Suggested leads (decision makers sugeridos)
    suggested_leads: a?.suggested_leads || a?.top_recommended_people || [],
    
    // News
    news: a?.news || a?.recent_news || [],
    
    // Última sincronização
    last_apollo_sync_at: new Date().toISOString(),
    apollo_last_enriched_at: new Date().toISOString()
  };
  
  // Remover campos null/undefined para não sobrescrever dados existentes
  return Object.fromEntries(
    Object.entries(mapped).filter(([_, v]) => v !== null && v !== undefined)
  );
}

function mapApolloPerson(p: any) {
  const emailPrimary = selectPrimaryEmail(p?.email || p?.emails);
  return {
    apollo_person_id: p?.id || null,
    linkedin_profile_id: p?.linkedin_uid || null,
    linkedin_url: p?.linkedin_url || null,
    first_name: p?.first_name || null,
    last_name: p?.last_name || null,
    full_name: p?.name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || null,
    job_title: p?.title || null,
    seniority: p?.seniority || null,
    department: p?.department || p?.functions?.[0] || null,
    email_primary: emailPrimary || null,
    email_hash: emailPrimary ? simpleHash(emailPrimary) : null,
    email_status: p?.email_status || null,
    phones: p?.phone_numbers ? JSON.stringify(p.phone_numbers) : JSON.stringify([]),
    city: p?.city || null,
    state: p?.state || null,
    country: p?.country || null,
    timezone: p?.time_zone || null,
    languages: p?.languages ? JSON.stringify(p.languages) : JSON.stringify([]),
    skills: p?.skills ? JSON.stringify(p.skills) : JSON.stringify([]),
    headline: p?.headline || null,
    current_company_apollo_id: p?.organization_id || null,
    current_company_linkedin_id: null,
    started_at: p?.employment_history?.[0]?.start_date || null,
    ended_at: null,
    last_seen_at: null,
    last_updated_at: new Date().toISOString(),
    source: 'apollo',
    updated_at: new Date().toISOString()
  };
}

function selectPrimaryEmail(emails: unknown): string | null {
  if (typeof emails === 'string' && emails.includes('@')) return emails;
  if (!Array.isArray(emails)) return null;
  const e = emails.find(v => typeof v === 'string' && v.includes('@'));
  return e || null;
}

function simpleHash(plain: string): string {
  const data = new TextEncoder().encode(plain.toLowerCase().trim());
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum = ((sum << 5) - sum + data[i]) & 0xffffffff;
  }
  return sum.toString(16);
}

function deduplicatePeople(people: any[]): any[] {
  const seen = new Map<string, boolean>();
  const result: any[] = [];
  
  for (const p of people) {
    // Criar chave única baseada em apollo_person_id, linkedin_profile_id ou email_hash
    const key = p.apollo_person_id || p.linkedin_profile_id || p.email_hash || null;
    if (!key) continue; // Pular pessoas sem nenhuma chave única
    
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(p);
    }
  }
  
  return result;
}

async function apolloSearchOrganizations(name: string, domain: string, apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q_organization_name: name,
        q_organization_domains: domain ? [domain] : undefined,
        page: 1,
        per_page: 10
      })
    });

    if (!response.ok) {
      console.error('[Apollo] Erro ao buscar organizações:', response.status);
      return { organizations: [], pagination: { total_entries: 0 } };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Apollo] Exceção ao buscar organizações:', error);
    return { organizations: [], pagination: { total_entries: 0 } };
  }
}

async function estimateCredits(sb: any, orgId: string, modes: Array<'company'|'people'|'similar'>): Promise<{ company: number; people: number; similar: number; total: number }> {
  let company = 0;
  let people = 0;
  let similar = 0;

  if (modes.includes('company')) {
    company = 1;
  }

  if (modes.includes('people')) {
    const { count } = await sb
      .from('company_people')
      .select('*', { count: 'exact', head: true })
      .eq('apollo_organization_id', orgId);
    
    people = count || 20;
  }

  if (modes.includes('similar')) {
    similar = 0;
  }

  return { company, people, similar, total: company + people + similar };
}

async function checkCreditsAvailable(sb: any, estimatedCredits: number): Promise<{ ok: boolean; available: number; message?: string }> {
  const { data: config, error } = await sb
    .from('apollo_credit_config')
    .select('total_credits, used_credits, reset_date, alert_threshold, block_threshold')
    .single();

  if (error || !config) {
    return { ok: false, available: 0, message: 'Configuração de créditos não encontrada' };
  }

  const available = config.total_credits - config.used_credits;

  if (available < estimatedCredits) {
    return {
      ok: false,
      available,
      message: `❌ Créditos insuficientes. Disponível: ${available}, Necessário: ${estimatedCredits}. Renovação: ${new Date(config.reset_date).toLocaleDateString('pt-BR')}`
    };
  }

  if (available < config.alert_threshold) {
    return {
      ok: true,
      available,
      message: `⚠️ Atenção: restam apenas ${available} créditos. Renovação: ${new Date(config.reset_date).toLocaleDateString('pt-BR')}`
    };
  }

  return { ok: true, available };
}
