import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, name, domain, organizationName, titles, companyId, company_ids, searchParams } = body;
    
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
    if (!APOLLO_API_KEY) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Apollo] 🚀 Requisição:', { 
      type, 
      name, 
      domain, 
      organizationName, 
      companyId,
      hasCompanyId: !!companyId 
    });

    // ============================================
    // BUSCAR ORGANIZAÇÃO COM TODOS OS CAMPOS
    // ============================================
    if (type === 'organization') {
      const payload: Record<string, unknown> = {
        page: 1,
        per_page: 1,
      };
      if (name) payload.q_organization_name = name;
      if (domain) payload.q_organization_domains = domain;

      const response = await fetch(`https://api.apollo.io/v1/organizations/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY,
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error('[Apollo] ❌ Erro na API:', response.status, errText);
        return new Response(
          JSON.stringify({ error: `Apollo API retornou status ${response.status}`, details: errText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const org = data.organizations?.[0];

      if (!org) {
        console.log('[Apollo] ⚠️ Organização não encontrada');
        return new Response(
          JSON.stringify({ organization: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Apollo] ✅ Organização encontrada:', org.name);
      return new Response(
        JSON.stringify({ organization: org }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // BUSCAR PESSOAS (DECISORES) COM TODOS OS CAMPOS
    // ============================================
    if (type === 'people') {
      const defaultTitles = titles && titles.length > 0 
        ? titles.join(',')
        : 'CEO,CTO,CFO,CMO,COO,Diretor,VP,Gerente,Head,Manager,President,Owner';

      const payload: Record<string, unknown> = {
        per_page: 50,
        person_titles: defaultTitles,
      };
      if (organizationName) payload.q_organization_name = organizationName;
      if (domain) payload.q_organization_domains = domain;

      const response = await fetch(`https://api.apollo.io/v1/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY,
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error('[Apollo] ❌ Erro na busca de pessoas:', response.status, errText);
        return new Response(
          JSON.stringify({ error: `Apollo API retornou status ${response.status}`, details: errText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const people = data.people || [];

      console.log('[Apollo] ✅ Decisores encontrados:', people.length);
      
      return new Response(
        JSON.stringify({ 
          people,
          total: people.length,
          source: 'apollo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // IMPORTAR LEADS DO APOLLO COM DADOS COMPLETOS
    // ============================================
    if (type === 'import_leads') {
      // Montar payload com os parâmetros fornecidos na UI, com limpeza e fallback
      const sanitizeIndustryIds = (val: unknown) => {
        if (!val) return undefined;
        const cleaned = String(val).split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s));
        return cleaned.length ? cleaned.join(',') : undefined;
      };

      const allowedKeys = new Set([
        'q_organization_name',
        'q_organization_domains',
        'q_organization_locations',
        'q_organization_industry_tag_ids',
        'q_organization_num_employees_ranges',
        'q_organization_keyword_tags'
      ]);

      const basePayload: Record<string, unknown> = { page: 1, per_page: Number(searchParams?.per_page) || 100 };
      if (searchParams && typeof searchParams === 'object') {
        for (const [k, v] of Object.entries(searchParams)) {
          if (!allowedKeys.has(k)) continue;
          const sv = typeof v === 'string' ? v.trim() : v;
          if (sv === undefined || sv === null || String(sv).trim() === '') continue;
          if (k === 'q_organization_industry_tag_ids') {
            const cleaned = sanitizeIndustryIds(sv);
            if (cleaned) basePayload[k] = cleaned; // somente IDs numéricos
          } else if (k !== 'per_page' && k !== 'api_key') {
            basePayload[k] = sv;
          }
        }
      }

      const endpoint = 'https://api.apollo.io/v1/organizations/search';
      const headers = { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY };

      const tryRequest = async (payload: Record<string, unknown>) => {
        const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
        return resp;
      };

      let response = await tryRequest(basePayload);

      if (!response.ok) {
        const firstErr = await response.text();
        console.error('[Apollo] ❌ Erro import_leads 1ª tentativa:', response.status, firstErr, '\nPayload:', basePayload);

        // Fallback progressivo: remover campos mais problemáticos
        const dropOrder = [
          'q_organization_industry_tag_ids',
          'q_organization_keyword_tags',
          'q_organization_locations',
          'q_organization_num_employees_ranges'
        ];

        const fallbackPayload = { ...basePayload } as Record<string, unknown>;
        let fallbackResp = response;
        for (const key of dropOrder) {
          if (fallbackPayload[key] !== undefined) {
            delete fallbackPayload[key];
            const trial = await tryRequest(fallbackPayload);
            if (trial.ok) {
              response = trial;
              break;
            } else {
              const errTxt = await trial.text();
              console.error(`[Apollo] ❌ Fallback removendo ${key} falhou:`, trial.status, errTxt);
              fallbackResp = trial;
            }
          }
        }

        if (!response.ok) {
          // Último fallback: nome ou domínio apenas, se existirem
          const minimal: Record<string, unknown> = { page: 1, per_page: basePayload.per_page };
          if (basePayload.q_organization_name) minimal.q_organization_name = basePayload.q_organization_name;
          if (basePayload.q_organization_domains) minimal.q_organization_domains = basePayload.q_organization_domains;
          if (!minimal.q_organization_name && !minimal.q_organization_domains) {
            return new Response(
              JSON.stringify({ error: 'Parâmetros insuficientes para busca no Apollo', details: firstErr }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          const minimalResp = await tryRequest(minimal);
          if (minimalResp.ok) {
            response = minimalResp;
          } else {
            const errText = await minimalResp.text();
            console.error('[Apollo] ❌ Fallback mínimo falhou:', minimalResp.status, errText, '\nPayload:', minimal);
            return new Response(
              JSON.stringify({ error: `Apollo API error: ${minimalResp.status}`, details: errText, sent: minimal }),
              { status: minimalResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      const data = await response.json();
      const organizations = data.organizations || [];

      console.log('[Apollo] 📥 Importando', organizations.length, 'empresas');

      const imported: any[] = [];
      
      for (const org of organizations) {
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .or(`name.eq.${org.name},domain.eq.${org.primary_domain}`)
          .maybeSingle();

        if (existing) {
          console.log('[Apollo] ⏭️ Empresa já existe:', org.name);
          continue;
        }

        const companyData = {
          name: org.name,
          domain: org.primary_domain,
          website: org.website_url,
          industry: org.industry,
          employees: org.estimated_num_employees,
          employee_count_from_apollo: org.estimated_num_employees,
          revenue_range_from_apollo: org.revenue_range,
          apollo_id: org.id,
          location: {
            city: org.city,
            state: org.state,
            country: org.country,
            street: org.street_address,
            postal_code: org.postal_code
          },
          linkedin_url: org.linkedin_url,
          technologies: org.technologies || [],
          market_segments: org.market_cap ? [String(org.market_cap)] : [],
          sic_codes: org.sic_codes || [],
          naics_codes: org.naics_codes || [],
          phone_numbers: org.phone ? [org.phone] : [],
          social_urls: {
            facebook: org.facebook_url,
            twitter: org.twitter_url,
            blog: org.blog_url
          },
          account_score: org.account_score || 0,
          apollo_signals: org.signals || [],
          apollo_metadata: {
            founded_year: org.founded_year,
            ownership_type: org.ownership_type,
            keywords: org.keywords || [],
            parent_account_id: org.parent_account_id,
            ultimate_parent_account_id: org.ultimate_parent_account_id,
            account_stage_id: org.account_stage_id,
            total_funding: org.total_funding,
            latest_funding_stage: org.latest_funding_stage,
            number_of_funding_rounds: org.number_of_funding_rounds
          },
          funding_total: org.total_funding ? parseFloat(org.total_funding) : null,
          funding_rounds: org.funding_rounds || [],
          last_funding_round_date: org.latest_funding_round_date,
          last_funding_round_amount: org.latest_funding_amount ? parseFloat(org.latest_funding_amount) : null,
          investors: org.investors || [],
          job_postings_count: org.job_postings_count || 0,
          apollo_last_enriched_at: new Date().toISOString(),
          raw_data: org
        };

        const { data: company, error } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();

        if (error) {
          console.error('[Apollo] ❌ Erro ao criar empresa:', error);
          continue;
        }

        console.log('[Apollo] ✅ Empresa importada:', org.name);

        // 🔍 AGUARDAR descoberta de CNPJ (com timeout de 15s)
        try {
          const loc = (company as any)?.location || {};
          console.log('[Apollo] 🔍 Iniciando busca de CNPJ para:', company.name);
          
          const { data: cnpjData, error: cnpjError } = await supabase.functions.invoke('discover-cnpj', {
            body: {
              companyId: company.id,
              companyName: company.name,
              domain: (company as any)?.domain || (company as any)?.website || org.primary_domain || org.website_url || null,
              location: { city: loc.city, state: loc.state }
            }
          });

          if (!cnpjError && cnpjData) {
            if (cnpjData.success && cnpjData.cnpj) {
              console.log('[Apollo] ✅ CNPJ descoberto automaticamente:', cnpjData.cnpj);
              // Persistir no banco
              const { data: updated, error: updErr } = await supabase
                .from('companies')
                .update({ cnpj: cnpjData.cnpj, cnpj_status: 'ativo' })
                .eq('id', company.id)
                .select()
                .single();
              if (updErr) {
                console.warn('[Apollo] ⚠️ Falha ao salvar CNPJ descoberto:', updErr.message);
              }
              (company as any).cnpj = cnpjData.cnpj;
              (company as any).cnpj_status = 'ativo';
            } else if (cnpjData.status === 'review' && cnpjData.candidates?.length > 0) {
              const top = cnpjData.candidates[0];
              console.log('[Apollo] ⚠️ CNPJ requer revisão manual - usando melhor candidato provisório:', top?.cnpj);
              // Salvar candidato principal para habilitar botões
              const { error: updErr2 } = await supabase
                .from('companies')
                .update({ cnpj: top?.cnpj || null, cnpj_status: 'pendente' })
                .eq('id', company.id);
              if (updErr2) {
                console.warn('[Apollo] ⚠️ Falha ao salvar CNPJ candidato:', updErr2.message);
              }
              (company as any).cnpj = top?.cnpj || null;
              (company as any).cnpj_status = 'pendente';
            } else {
              console.log('[Apollo] ℹ️ CNPJ não encontrado automaticamente');
              (company as any).cnpj_status = 'nao_encontrado';
            }
          } else {
            console.warn('[Apollo] ⚠️ Erro ao buscar CNPJ:', cnpjError?.message || 'unknown');
          }
        } catch (e) {
          console.warn('[Apollo] ⚠️ Erro ao descobrir CNPJ:', (e as any)?.message || e);
        }

        imported.push(company);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          imported: imported.length,
          total: organizations.length,
          companies: imported
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ENRIQUECER EMPRESA INDIVIDUAL COM APOLLO
    // ============================================
    if (type === 'enrich_company') {
      if (!companyId) {
        throw new Error('companyId é obrigatório para enrich_company');
      }

      // Buscar dados da empresa
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!company) {
        throw new Error('Empresa não encontrada');
      }

      // Buscar organização no Apollo usando POST com header X-Api-Key
      const searchDomain = domain || company.website || company.domain;
      
      const baseHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      } as const;
      
      const buildPayload = (opts: { byName?: boolean; byDomain?: boolean }) => {
        const p: Record<string, unknown> = { page: 1, per_page: 1 };
        if (opts.byName && company.name) p.q_organization_name = company.name;
        if (opts.byDomain && searchDomain) p.q_organization_domains = searchDomain;
        return p;
      };

      let orgResponse = await fetch(`https://api.apollo.io/v1/organizations/search`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(buildPayload({ byName: true, byDomain: true }))
      });
      
      if (!orgResponse.ok) {
        const firstErr = await orgResponse.text();
        console.error('[Apollo] ❌ Erro organizations search:', orgResponse.status, firstErr);

        // Fallback 1: tentar por domínio apenas
        if (searchDomain) {
          const resp2 = await fetch('https://api.apollo.io/v1/organizations/search', {
            method: 'POST',
            headers: baseHeaders,
            body: JSON.stringify(buildPayload({ byDomain: true }))
          });

          if (resp2.ok) {
            orgResponse = resp2;
          } else {
            const secondErr = await resp2.text();
            console.error('[Apollo] ❌ Fallback domínio falhou:', resp2.status, secondErr);

            // Fallback 2: tentar por nome apenas
            if (company.name) {
              const resp3 = await fetch('https://api.apollo.io/v1/organizations/search', {
                method: 'POST',
                headers: baseHeaders,
                body: JSON.stringify(buildPayload({ byName: true }))
              });

              if (resp3.ok) {
                orgResponse = resp3;
              } else {
                const thirdErr = await resp3.text();
                console.error('[Apollo] ❌ Fallback nome falhou:', resp3.status, thirdErr);
                return new Response(
                  JSON.stringify({ error: 'Apollo organizations search failed', details: { first: firstErr, byDomain: secondErr, byName: thirdErr } }),
                  { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            } else {
              return new Response(
                JSON.stringify({ error: 'Apollo organizations search failed', details: firstErr }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        } else if (company.name) {
          const resp3 = await fetch('https://api.apollo.io/v1/organizations/search', {
            method: 'POST',
            headers: baseHeaders,
            body: JSON.stringify(buildPayload({ byName: true }))
          });
          if (resp3.ok) {
            orgResponse = resp3;
          } else {
            const thirdErr = await resp3.text();
            console.error('[Apollo] ❌ Fallback nome (sem domínio) falhou:', resp3.status, thirdErr);
            return new Response(
              JSON.stringify({ error: 'Apollo organizations search failed', details: { first: firstErr, byName: thirdErr } }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: 'Apollo organizations search failed - missing name/domain' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const orgData = await orgResponse.json();
      const org = orgData.organizations?.[0];

      if (!org) {
        console.log('[Apollo] ⚠️ Organização não encontrada no Apollo');
        return new Response(
          JSON.stringify({ success: false, message: 'Organização não encontrada no Apollo' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Atualizar empresa com TODOS os dados do Apollo
      const updateData = {
        apollo_id: org.id,
        employee_count_from_apollo: org.estimated_num_employees,
        revenue_range_from_apollo: org.revenue_range,
        market_segments: org.market_cap ? [org.market_cap] : [],
        sic_codes: org.sic_codes || [],
        naics_codes: org.naics_codes || [],
        phone_numbers: org.phone ? [org.phone] : [],
        social_urls: {
          facebook: org.facebook_url,
          twitter: org.twitter_url,
          blog: org.blog_url,
          linkedin: org.linkedin_url
        },
        account_score: org.account_score || 0,
        apollo_signals: org.signals || [],
        funding_total: org.total_funding ? parseFloat(org.total_funding) : null,
        funding_rounds: org.funding_rounds || [],
        last_funding_round_date: org.latest_funding_round_date,
        last_funding_round_amount: org.latest_funding_amount ? parseFloat(org.latest_funding_amount) : null,
        investors: org.investors || [],
        job_postings_count: org.job_postings_count || 0,
        apollo_metadata: {
          founded_year: org.founded_year,
          ownership_type: org.ownership_type,
          keywords: org.keywords || [],
          parent_account_id: org.parent_account_id,
          account_stage_id: org.account_stage_id,
          total_funding_formatted: org.total_funding_formatted,
          latest_funding_stage: org.latest_funding_stage
        },
        apollo_last_enriched_at: new Date().toISOString(),
        technologies: org.technologies || company.technologies || [],
        linkedin_url: org.linkedin_url || company.linkedin_url,
      };

      const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (updateError) {
        throw updateError;
      }

      // Buscar pessoas/decisores da organização
      const peoplePayload: Record<string, unknown> = {
        per_page: 50,
      };
      if (searchDomain) peoplePayload.q_organization_domains = searchDomain;
      if (company.name) peoplePayload.q_organization_name = company.name;

      const peopleResponse = await fetch(`https://api.apollo.io/v1/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY,
        },
        body: JSON.stringify(peoplePayload)
      });
      
      let peopleCount = 0;
      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        const people = peopleData.people || [];
        peopleCount = people.length;

        console.log('[Apollo] 👥 Encontrados', people.length, 'decisores');

        // Salvar decisores com TODOS os campos
        for (const person of people) {
          // Verificar se decisor já existe
          const { data: existingDecisor } = await supabase
            .from('decision_makers')
            .select('id')
            .eq('email', person.email)
            .eq('company_id', companyId)
            .maybeSingle();

          const decisorData = {
            company_id: companyId,
            name: person.name,
            title: person.title,
            email: person.email,
            phone: person.phone || person.sanitized_phone,
            direct_phone: person.direct_phone,
            mobile_phone: person.mobile_phone,
            work_direct_phone: person.work_direct_phone,
            linkedin_url: person.linkedin_url,
            apollo_person_id: person.id,
            email_status: person.email_status,
            email_verification_date: person.email_last_verified_date,
            contact_accuracy_score: person.contact_accuracy_score || 0,
            seniority_level: person.seniority,
            departments: person.departments || [],
            persona_tags: person.functions || [],
            photo_url: person.photo_url,
            intent_strength: person.intent_strength,
            show_intent: person.show_intent || false,
            extrapolated_email_confidence: person.extrapolated_email_confidence,
            apollo_person_metadata: {
              state: person.state,
              city: person.city,
              country: person.country,
              employment_history: person.employment_history || [],
              headline: person.headline,
              facebook_url: person.facebook_url,
              twitter_url: person.twitter_url,
              github_url: person.github_url,
              organization_name: person.organization_name,
              organization_id: person.organization_id
            }
          };

          if (existingDecisor) {
            // Atualizar decisor existente
            await supabase
              .from('decision_makers')
              .update(decisorData)
              .eq('id', existingDecisor.id);
          } else {
            // Criar novo decisor
            await supabase
              .from('decision_makers')
              .insert(decisorData);
          }
        }

        console.log('[Apollo] ✅ Decisores salvos:', people.length);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          organization: org,
          people_count: peopleCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bloco 'import_leads' removido - estava duplicado

    // ============================================
    // BATCH ENRICHMENT - Atualizar várias empresas
    // ============================================
    if (type === 'batch_enrich') {
      const companiesToEnrich = company_ids && company_ids.length > 0
        ? company_ids
        : null;

      // Buscar empresas a enriquecer
      let query = supabase
        .from('companies')
        .select('id, name, domain, website, apollo_id, technologies, linkedin_url');

      if (companiesToEnrich) {
        query = query.in('id', companiesToEnrich);
      } else {
        // Sem IDs específicos, buscar empresas sem enrichment Apollo ou antigas
        query = query.or('apollo_last_enriched_at.is.null,apollo_last_enriched_at.lt.' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }

      const { data: companies, error: fetchError } = await query.limit(50);

      if (fetchError) {
        throw fetchError;
      }

      console.log('[Apollo] 📦 Batch enrichment:', companies?.length || 0, 'empresas');

      let processed = 0;
      let failed = 0;

      for (const company of companies || []) {
        try {
          const searchDomain = company.website || company.domain;
          
          if (!searchDomain) {
            console.log('[Apollo] ⏭️ Sem domínio:', company.name);
            failed++;
            continue;
          }

          // Buscar no Apollo via POST com header X-Api-Key
          const orgResponse = await fetch(`https://api.apollo.io/v1/organizations/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': APOLLO_API_KEY,
            },
            body: JSON.stringify({ q_organization_domains: searchDomain, page: 1, per_page: 1 })
          });
          
          if (!orgResponse.ok) {
            failed++;
            continue;
          }

          const orgData = await orgResponse.json();
          const org = orgData.organizations?.[0];

          if (!org) {
            console.log('[Apollo] ⚠️ Não encontrado:', company.name);
            failed++;
            continue;
          }

          // Atualizar com todos os dados
          const updateData = {
            apollo_id: org.id,
            employee_count_from_apollo: org.estimated_num_employees,
            revenue_range_from_apollo: org.revenue_range,
            market_segments: org.market_cap ? [org.market_cap] : [],
            sic_codes: org.sic_codes || [],
            naics_codes: org.naics_codes || [],
            phone_numbers: org.phone ? [org.phone] : [],
            social_urls: {
              facebook: org.facebook_url,
              twitter: org.twitter_url,
              blog: org.blog_url,
              linkedin: org.linkedin_url
            },
            account_score: org.account_score || 0,
            apollo_signals: org.signals || [],
            funding_total: org.total_funding ? parseFloat(org.total_funding) : null,
            funding_rounds: org.funding_rounds || [],
            last_funding_round_date: org.latest_funding_round_date,
            last_funding_round_amount: org.latest_funding_amount ? parseFloat(org.latest_funding_amount) : null,
            investors: org.investors || [],
            job_postings_count: org.job_postings_count || 0,
            apollo_metadata: {
              founded_year: org.founded_year,
              ownership_type: org.ownership_type,
              keywords: org.keywords || [],
              parent_account_id: org.parent_account_id
            },
            apollo_last_enriched_at: new Date().toISOString(),
            technologies: org.technologies || company.technologies || [],
            linkedin_url: org.linkedin_url || company.linkedin_url
          };

          await supabase
            .from('companies')
            .update(updateData)
            .eq('id', company.id);

          // Buscar e salvar decisores
          const peopleParams = new URLSearchParams({
            api_key: APOLLO_API_KEY,
            q_organization_domains: searchDomain,
            per_page: '50'
          });

          const peopleResponse = await fetch(`https://api.apollo.io/v1/people/search?${peopleParams}`);
          
          if (peopleResponse.ok) {
            const peopleData = await peopleResponse.json();
            const people = peopleData.people || [];

            for (const person of people.slice(0, 20)) { // Limitar a 20 decisores por empresa
              const { data: existingDecisor } = await supabase
                .from('decision_makers')
                .select('id')
                .eq('email', person.email)
                .eq('company_id', company.id)
                .maybeSingle();

              const decisorData = {
                company_id: company.id,
                name: person.name,
                title: person.title,
                email: person.email,
                phone: person.phone || person.sanitized_phone,
                direct_phone: person.direct_phone,
                mobile_phone: person.mobile_phone,
                work_direct_phone: person.work_direct_phone,
                linkedin_url: person.linkedin_url,
                apollo_person_id: person.id,
                email_status: person.email_status,
                contact_accuracy_score: person.contact_accuracy_score || 0,
                seniority_level: person.seniority,
                departments: person.departments || [],
                persona_tags: person.functions || [],
                photo_url: person.photo_url,
                intent_strength: person.intent_strength,
                show_intent: person.show_intent || false,
                apollo_person_metadata: {
                  headline: person.headline,
                  city: person.city,
                  state: person.state,
                  country: person.country
                }
              };

              if (existingDecisor) {
                await supabase
                  .from('decision_makers')
                  .update(decisorData)
                  .eq('id', existingDecisor.id);
              } else {
                await supabase
                  .from('decision_makers')
                  .insert(decisorData);
              }
            }
          }

          processed++;
          console.log('[Apollo] ✅ Empresa enriquecida:', company.name);

        } catch (error) {
          console.error('[Apollo] ❌ Erro ao enriquecer:', company.name, error);
          failed++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          processed,
          failed,
          total: companies?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Apollo] ⚠️ Tipo de requisição não reconhecido:', type);
    return new Response(
      JSON.stringify({ error: 'Tipo de requisição inválido', receivedType: type }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Apollo] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
