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

    console.log('[Apollo] 🚀 Requisição:', { type, name, domain, organizationName, companyId });

    // ============================================
    // BUSCAR ORGANIZAÇÃO COM TODOS OS CAMPOS
    // ============================================
    if (type === 'organization') {
      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        q_organization_name: name,
        ...(domain && { q_organization_domains: domain })
      });

      const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
      
      if (!response.ok) {
        console.error('[Apollo] ❌ Erro na API:', response.status);
        return new Response(
          JSON.stringify({ error: `Apollo API retornou status ${response.status}` }),
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

      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        q_organization_name: organizationName,
        per_page: '50',
        person_titles: defaultTitles
      });

      if (domain) {
        params.append('q_organization_domains', domain);
      }

      const response = await fetch(`https://api.apollo.io/v1/people/search?${params}`);
      
      if (!response.ok) {
        console.error('[Apollo] ❌ Erro na busca de pessoas:', response.status);
        return new Response(
          JSON.stringify({ error: `Apollo API retornou status ${response.status}` }),
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
      // Buscar organizações com os parâmetros fornecidos
      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        per_page: '100',
        ...searchParams
      });

      const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status}`);
      }

      const data = await response.json();
      const organizations = data.organizations || [];

      console.log('[Apollo] 📥 Importando', organizations.length, 'empresas');

      const imported = [];
      
      for (const org of organizations) {
        // Verificar se empresa já existe
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .or(`name.eq.${org.name},domain.eq.${org.primary_domain}`)
          .single();

        if (existing) {
          console.log('[Apollo] ⏭️ Empresa já existe:', org.name);
          continue;
        }

        // Extrair todos os campos do Apollo
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
          market_segments: org.market_cap ? [org.market_cap] : [],
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
          enrichment_source: 'apollo',
          enriched_at: new Date().toISOString(),
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

        imported.push(company);
        console.log('[Apollo] ✅ Empresa importada:', org.name);
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

      // Buscar organização no Apollo
      const searchDomain = domain || company.website || company.domain;
      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        q_organization_name: company.name,
        ...(searchDomain && { q_organization_domains: searchDomain })
      });

      const orgResponse = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
      
      if (!orgResponse.ok) {
        throw new Error(`Apollo API error: ${orgResponse.status}`);
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
      const peopleParams = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        q_organization_domains: searchDomain,
        per_page: '50'
      });

      const peopleResponse = await fetch(`https://api.apollo.io/v1/people/search?${peopleParams}`);
      
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

    // ============================================
    // IMPORTAR LEADS DO APOLLO COM DADOS COMPLETOS
    // ============================================
    if (type === 'import_leads') {
      // Buscar organizações com os parâmetros fornecidos
      const params = new URLSearchParams({
        api_key: APOLLO_API_KEY,
        per_page: '100',
        ...searchParams
      });

      const response = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status}`);
      }

      const data = await response.json();
      const organizations = data.organizations || [];

      console.log('[Apollo] 📥 Importando', organizations.length, 'empresas');

      const imported = [];
      
      for (const org of organizations) {
        // Verificar se empresa já existe
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .or(`name.eq.${org.name},domain.eq.${org.primary_domain}`)
          .maybeSingle();

        if (existing) {
          console.log('[Apollo] ⏭️ Empresa já existe:', org.name);
          continue;
        }

        // Criar nova empresa com TODOS os campos do Apollo
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
          market_segments: org.market_cap ? [org.market_cap] : [],
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
            ultimate_parent_account_id: org.ultimate_parent_account_id,
            account_stage_id: org.account_stage_id
          },
          apollo_last_enriched_at: new Date().toISOString(),
          enrichment_source: 'apollo',
          enriched_at: new Date().toISOString(),
          raw_data: org
        };

        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();

        if (error) {
          console.error('[Apollo] ❌ Erro ao criar empresa:', error);
          continue;
        }

        imported.push(newCompany);
        console.log('[Apollo] ✅ Empresa importada:', org.name);
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

          // Buscar no Apollo
          const params = new URLSearchParams({
            api_key: APOLLO_API_KEY,
            q_organization_domains: searchDomain
          });

          const orgResponse = await fetch(`https://api.apollo.io/v1/organizations/search?${params}`);
          
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

    return new Response(
      JSON.stringify({ error: 'Tipo de requisição inválido' }),
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
