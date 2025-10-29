import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import * as ciclo3Module from './ciclo3-handlers.ts'; // Temporariamente desabilitado devido a erro de tipos

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
    const { 
      type, 
      name, 
      domain, 
      organizationName, 
      titles, 
      companyId, 
      company_ids, 
      searchParams, 
      apolloOrgId,
      searchName,
      apolloOrganizationId,
      organizationId,
      cnpj
    } = body;
    
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
    if (!APOLLO_API_KEY) {
      throw new Error('APOLLO_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[Apollo] 🚀 Requisição:', { type, companyId });

    // CICLO 3: RESOLUÇÃO E BUSCA DE ORGANIZAÇÕES (TEMPORARIAMENTE DESABILITADO)
    if (type === 'ciclo3_resolve_organization') {
      return new Response(
        JSON.stringify({ error: 'Handler temporariamente desabilitado', details: 'Use assign_apollo_org' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CICLO 3: BUSCAR ORGANIZAÇÃO POR ID (TEMPORARIAMENTE DESABILITADO)
    if (type === 'ciclo3_get_organization_by_id') {
      return new Response(
        JSON.stringify({ error: 'Handler temporariamente desabilitado', details: 'Use assign_apollo_org' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CICLO 3: ENRIQUECIMENTO COMPLETO (TEMPORARIAMENTE DESABILITADO)
    if (type === 'ciclo3_enrich_complete') {
      return new Response(
        JSON.stringify({ error: 'Handler temporariamente desabilitado', details: 'Use assign_apollo_org' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atribuir Apollo Org à empresa e salvar campos principais (sem OpenAI)
    if (type === 'assign_apollo_org') {
      try {
        const orgId = organizationId || apolloOrganizationId || apolloOrgId;
        if (!companyId || !orgId) {
          return new Response(
            JSON.stringify({ error: 'Parâmetros ausentes', details: 'companyId e apolloOrganizationId são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar organização por ID no Apollo - usar GET /v1/organizations/{id} e fallback para payload do cliente
        let org: any = null;
        const resp = await fetch(`https://api.apollo.io/v1/organizations/${orgId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY },
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.error('[Apollo] ❌ Erro ao obter organização por ID:', resp.status, errText);
          // Fallback: usar dados enviados pelo cliente quando disponíveis e compatíveis
          const hint: any = (body as any)?.selectedOrganization || (body as any)?.organization || null;
          if (hint && (hint.id === orgId)) {
            console.log('[Apollo] ⚠️ Usando dados do cliente como fallback para organização:', orgId);
            org = hint;
          } else {
            return new Response(
              JSON.stringify({ error: `Apollo API error: ${resp.status}`, details: 'Falha ao obter organização por ID e sem fallback válido' }),
              { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          const orgData = await resp.json();
          org = orgData.organization || orgData; // compatibilidade
        }

        const { data: existing } = await supabase
          .from('companies')
          .select('raw_data')
          .eq('id', companyId)
          .maybeSingle();

        const updateData: Record<string, unknown> = {
          apollo_organization_id: org.id || orgId,
          apollo_id: org.id || orgId,
          domain: org.primary_domain ?? null,
          website: org.website_url ?? null,
          industry: org.industry ?? (org.industries?.[0] ?? null),
          employees: org.estimated_num_employees ?? null,
          employee_count_from_apollo: org.estimated_num_employees ?? null,
          sic_codes: org.sic_codes ?? [],
          naics_codes: org.naics_codes ?? [],
          phone_numbers: org.phone ? [org.phone] : (org.primary_phone?.sanitized_number ? [org.primary_phone.sanitized_number] : []),
          social_urls: {
            blog: org.blog_url ?? null,
            twitter: org.twitter_url ?? null,
            facebook: org.facebook_url ?? null,
            linkedin: org.linkedin_url ?? null,
          },
          apollo_metadata: {
            keywords: org.keywords ?? [],
            founded_year: org.founded_year ?? null,
          },
          location: {
            city: org.city ?? null,
            state: org.state ?? null,
            country: org.country ?? null,
            street: org.street_address ?? null,
            postal_code: org.postal_code ?? null,
          },
          apollo_last_enriched_at: new Date().toISOString(),
          raw_data: { ...(existing?.raw_data || {}), apollo: org },
        };

        const { error: upErr } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', companyId);

        if (upErr) {
          console.error('[Apollo] ❌ Erro atualizando empresa:', upErr);
          return new Response(
            JSON.stringify({ error: 'Falha ao salvar empresa', details: upErr.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, fields_enriched: Object.keys(updateData).length, decisors_saved: 0, similar_companies: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e: any) {
        console.error('[Apollo] ❌ Erro assign_apollo_org:', e);
        return new Response(
          JSON.stringify({ error: 'Erro interno', details: e?.message || String(e) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ============================================
    // BUSCAR ORGANIZAÇÃO COM TODOS OS CAMPOS (OLD)
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
    // BUSCAR ORGANIZAÇÕES SEM SALVAR (para revisão)
    // ============================================
    if (type === 'search_organizations') {
      const cleanDomainStr = (d?: string) => {
        if (!d) return undefined;
        try {
          const first = String(d).split(/\n|,|\s/)[0] || '';
          return first
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .replace(/http$/i, '')
            .replace(/\/.*/, '')
            .trim();
        } catch { return undefined; }
      };

      const sanitizeIndustryIds = (val: unknown) => {
        if (!val) return undefined;
        const cleaned = String(val).split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s));
        return cleaned.length ? cleaned.join(',') : undefined;
      };

      const normalizeEmployeesRange = (val: unknown) => {
        if (!val) return undefined;
        const v = String(val).trim();
        // UI envia "1,10" ou "10001,max" — Apollo espera "1-10" ou "10001-max"
        return v.replace(/,(?=\d|max)/g, '-');
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
            if (cleaned) basePayload[k] = cleaned;
          } else if (k === 'q_organization_num_employees_ranges') {
            const rng = normalizeEmployeesRange(sv);
            if (rng) basePayload[k] = rng;
          } else if (k === 'q_organization_domains') {
            const dom = cleanDomainStr(String(sv));
            if (dom) basePayload[k] = dom;
          } else if (k === 'q_organization_keyword_tags') {
            // Apollo usa q_keywords — fazer o mapeamento e NÃO enviar a chave antiga
            basePayload['q_keywords'] = sv;
          } else if (k !== 'per_page' && k !== 'api_key') {
            basePayload[k] = sv;
          }
        }
      }

      // ✅ Validação e fallbacks quando nenhum critério foi passado
      const hasCriteria = (
        (basePayload as any)['q_organization_name'] ||
        (basePayload as any)['q_organization_domains'] ||
        (basePayload as any)['q_organization_locations'] ||
        (basePayload as any)['q_organization_industry_tag_ids'] ||
        (basePayload as any)['q_keywords'] ||
        (basePayload as any)['q_organization_num_employees_ranges']
      );

      if (!hasCriteria) {
        const fallbackName = (organizationName || name)?.toString().trim();
        const fallbackDomain = cleanDomainStr(domain as string | undefined);
        if (fallbackName) (basePayload as any)['q_organization_name'] = fallbackName;
        if (fallbackDomain) (basePayload as any)['q_organization_domains'] = fallbackDomain;
      }

      const hasFinalCriteria = (
        (basePayload as any)['q_organization_name'] ||
        (basePayload as any)['q_organization_domains'] ||
        (basePayload as any)['q_keywords'] ||
        (basePayload as any)['q_organization_locations'] ||
        (basePayload as any)['q_organization_industry_tag_ids'] ||
        (basePayload as any)['q_organization_num_employees_ranges']
      );

      if (!hasFinalCriteria) {
        console.warn('[Apollo] ⚠️ search_organizations sem critérios. Body recebido:', { type, name, domain, organizationName, searchParams });
        return new Response(
          JSON.stringify({ 
            error: 'Parâmetros insuficientes para busca no Apollo', 
            details: 'Informe pelo menos q_organization_name ou q_organization_domains.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Apollo] ▶️ Payload search_organizations:', basePayload);

      const response = await fetch('https://api.apollo.io/v1/organizations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY },
        body: JSON.stringify(basePayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Apollo] ❌ Erro search_organizations:', response.status, errText, '\nPayload:', basePayload);
        return new Response(
          JSON.stringify({ error: `Apollo API error: ${response.status}`, details: errText, sent: basePayload }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const organizations = data.organizations || [];

      console.log('[Apollo] 🔍 Organizações encontradas (sem salvar):', organizations.length);

      return new Response(
        JSON.stringify({ 
          success: true,
          organizations,
          total: organizations.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // IMPORTAR LEADS DO APOLLO COM DADOS COMPLETOS (OLD - mantido para compatibilidade)
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
    // Aceita apolloOrgId opcional para busca direta
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

      let org: any = null;
      let peopleCount = 0;

      // Se apolloOrgId foi fornecido, buscar diretamente
      if (apolloOrgId) {
        console.log('[Apollo] 🎯 Buscando organização por ID:', apolloOrgId);
        
        const orgByIdResponse = await fetch(`https://api.apollo.io/v1/organizations/${apolloOrgId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': APOLLO_API_KEY,
          }
        });

        if (orgByIdResponse.ok) {
          const orgByIdData = await orgByIdResponse.json();
          org = orgByIdData.organization;
          console.log('[Apollo] ✅ Organização encontrada por ID:', org?.name);
        } else {
          console.error('[Apollo] ❌ Erro ao buscar por ID:', orgByIdResponse.status);
        }
      }

      // Se não encontrou por ID, tentar busca normal com múltiplas estratégias
      if (!org) {
        // Domínio prioritário: limpar entrada (site pode ter múltiplas linhas)
        const cleanDomainStr = (d?: string) => {
          if (!d) return undefined;
          try {
            const first = String(d).split(/\n|,|\s/)[0] || '';
            return first
              .replace(/^https?:\/\//i, '')
              .replace(/^www\./i, '')
              .replace(/http$/i, '')
              .replace(/\/.*$/, '')
              .trim();
          } catch { return undefined; }
        };
        const searchDomain = cleanDomainStr(domain || company.website || company.domain);
        
        const baseHeaders = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': APOLLO_API_KEY,
        } as const;
        
        // Função para normalizar nome da empresa (remover sufixos jurídicos)
        const normalizeName = (name: string): string => {
          return name
            .replace(/\s+(LTDA|ME|EPP|EIRELI|S\.A\.|SA|CIA|COMERCIO|IMPORTADORA|EXPORTADORA|DISTRIBUIDORA)\b\.?/gi, '')
            .replace(/\s+E\s+/gi, ' ')
            .trim();
        };
        
        // Extrair primeira palavra significativa (geralmente marca/nome principal)
        const getMainKeyword = (name: string): string => {
          const normalized = normalizeName(name);
          const words = normalized.split(/\s+/).filter(w => w.length > 3);
          return words[0] || normalized;
        };
        
        const buildPayload = (opts: { 
          byName?: boolean; 
          byDomain?: boolean; 
          byKeyword?: boolean;
          searchName?: string;
        }) => {
          const p: Record<string, unknown> = { page: 1, per_page: 5 };
          
          if (opts.byName && opts.searchName) {
            p.q_organization_name = opts.searchName;
          }
          if (opts.byDomain && searchDomain) {
            p.q_organization_domains = searchDomain;
          }
          if (opts.byKeyword && opts.searchName) {
            p.q_keywords = opts.searchName;
          }
          
          return p;
        };

        // ESTRATÉGIA 1: Nome completo + Domínio
        console.log('[Apollo] 🔍 Estratégia 1: Nome completo + Domínio');
        let orgResponse = await fetch(`https://api.apollo.io/v1/organizations/search`, {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify(buildPayload({ byName: true, byDomain: true, searchName: company.name }))
        });
        
        if (!orgResponse.ok || !(await orgResponse.clone().json()).organizations?.length) {
          console.log('[Apollo] ⚠️ Estratégia 1 falhou, tentando alternativas...');
          
          // ESTRATÉGIA 2: Domínio apenas (mais confiável)
          if (searchDomain) {
            console.log('[Apollo] 🔍 Estratégia 2: Domínio apenas');
            const resp2 = await fetch('https://api.apollo.io/v1/organizations/search', {
              method: 'POST',
              headers: baseHeaders,
              body: JSON.stringify(buildPayload({ byDomain: true }))
            });

            if (resp2.ok && (await resp2.clone().json()).organizations?.length) {
              orgResponse = resp2;
            } else {
              // ESTRATÉGIA 3: Nome normalizado (sem LTDA, ME, etc)
              const normalizedName = normalizeName(company.name);
              console.log('[Apollo] 🔍 Estratégia 3: Nome normalizado:', normalizedName);
              
              const resp3 = await fetch('https://api.apollo.io/v1/organizations/search', {
                method: 'POST',
                headers: baseHeaders,
                body: JSON.stringify(buildPayload({ byName: true, searchName: normalizedName }))
              });

              if (resp3.ok && (await resp3.clone().json()).organizations?.length) {
                orgResponse = resp3;
              } else {
                // ESTRATÉGIA 4: Palavra-chave principal (nome da marca)
                const mainKeyword = getMainKeyword(company.name);
                console.log('[Apollo] 🔍 Estratégia 4: Palavra-chave principal:', mainKeyword);
                
                const resp4 = await fetch('https://api.apollo.io/v1/organizations/search', {
                  method: 'POST',
                  headers: baseHeaders,
                  body: JSON.stringify(buildPayload({ byKeyword: true, searchName: mainKeyword }))
                });

                if (resp4.ok && (await resp4.clone().json()).organizations?.length) {
                  orgResponse = resp4;
                } else {
                  // ESTRATÉGIA 5: Busca ampla por keywords sem filtro de domínio
                  console.log('[Apollo] 🔍 Estratégia 5: Busca ampla por keywords');
                  const resp5 = await fetch('https://api.apollo.io/v1/organizations/search', {
                    method: 'POST',
                    headers: baseHeaders,
                    body: JSON.stringify({ 
                      page: 1, 
                      per_page: 10,
                      q_keywords: normalizedName
                    })
                  });

                  if (resp5.ok) {
                    orgResponse = resp5;
                  }
                }
              }
            }
          }
        }

        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          org = orgData.organizations?.[0];
        }
      }

      if (!org) {
        console.log('[Apollo] ⚠️ Organização não encontrada no Apollo - prosseguindo com busca de pessoas mesmo assim');
      } else {
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
      }

      // Buscar pessoas/decisores da organização
      // 🎯 BUSCA ABRANGENTE - TODOS os decisores, filtramos depois na plataforma
      const peoplePayload: Record<string, unknown> = {
        per_page: 100,
        
        // 🇧🇷 FILTRO GEOGRÁFICO - Apenas Brasil (mantém foco regional)
        person_locations: ['Brazil'],
        
        // 👔 FILTRO DE SENIORIDADE - Apenas decisores (mantém qualidade)
        person_seniorities: ['c_suite', 'vp', 'director', 'manager', 'senior'],
      };
      
      if (org?.id) {
        // Se temos o org ID, usar para busca mais precisa
        peoplePayload.q_organization_id = org.id;
        console.log('[Apollo] 🎯 Usando Organization ID para busca precisa:', org.id);
      } else {
        // Fallback para domínio/nome
        const cleanDomainStr = (d?: string) => {
          if (!d) return undefined;
          try {
            const first = String(d).split(/\n|,|\s/)[0] || '';
            return first
              .replace(/^https?:\/\//i, '')
              .replace(/^www\./i, '')
              .replace(/http$/i, '')
              .replace(/\/.*$/, '')
              .trim();
          } catch { return undefined; }
        };
        const searchDomain = cleanDomainStr(domain || company.website || company.domain);
        if (searchDomain) {
          peoplePayload.q_organization_domains = searchDomain;
          console.log('[Apollo] 🔍 Usando domínio para busca:', searchDomain);
        }
        if (company.name) {
          peoplePayload.q_organization_name = company.name;
          console.log('[Apollo] 🔍 Usando nome para busca:', company.name);
        }
      }
      
      console.log('[Apollo] 📋 Payload completo para people/search:', JSON.stringify(peoplePayload, null, 2));

      const peopleResponse = await fetch(`https://api.apollo.io/v1/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY,
        },
        body: JSON.stringify(peoplePayload)
      });
      
      console.log('[Apollo] 📡 Response status:', peopleResponse.status);
      
      if (!peopleResponse.ok) {
        const errorText = await peopleResponse.text();
        console.error('[Apollo] ❌ API Error:', peopleResponse.status, errorText);
      }
      
      if (!peopleResponse.ok) {
        const errorText = await peopleResponse.text();
        console.error('[Apollo] ❌ API Error:', peopleResponse.status, errorText);
      }
      
      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        let people = peopleData.people || [];

        console.log('[Apollo] 👥 Encontrados', people.length, 'decisores');
        console.log('[Apollo] 📊 Amostra de 3 primeiros:', people.slice(0, 3).map((p: any) => ({
          name: p.name,
          title: p.title,
          email: p.email,
          email_status: p.email_status,
          departments: p.departments,
          seniority: p.seniority
        })));
        console.log('[Apollo] 📋 Detalhes completos do primeiro:', people[0]);
        
        // 🔁 Fallback progressivo se não houver pessoas
        if (people.length === 0) {
          console.log('[Apollo] 🔁 Fallback: removendo filtros de senioridade e localização');
          const fallback1 = { ...peoplePayload } as any;
          delete fallback1.person_seniorities;
          delete fallback1.person_locations;
          const resp1 = await fetch('https://api.apollo.io/v1/people/search', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY }, body: JSON.stringify(fallback1)
          });
          if (resp1.ok) {
            const d1 = await resp1.json();
            people = d1.people || [];
            console.log('[Apollo] 🔁 Fallback1 resultados:', people.length);
          }
        }
        if (people.length === 0) {
          console.log('[Apollo] 🔁 Fallback: busca ampla somente por nome/domínio');
          const fallback2: any = { per_page: 100 };
          if (org?.id) fallback2.q_organization_id = org.id;
          if (!org?.id) {
            const sd = (peoplePayload as any).q_organization_domains;
            const sn = (peoplePayload as any).q_organization_name;
            if (sd) fallback2.q_organization_domains = sd;
            if (sn) fallback2.q_organization_name = sn;
          }
          const resp2 = await fetch('https://api.apollo.io/v1/people/search', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY }, body: JSON.stringify(fallback2)
          });
          if (resp2.ok) {
            const d2 = await resp2.json();
            people = d2.people || [];
            console.log('[Apollo] 🔁 Fallback2 resultados:', people.length);
          }
        }

        console.log('[Apollo] 📊 Amostra de 3 primeiros:', people.slice(0, 3).map((p: any) => ({
          name: p.name,
          title: p.title,
          email_status: p.email_status,
          departments: p.departments,
          seniority: p.seniority
        })));

        // 🧹 Filtrar por organização/domínio correto (ESTRITO)
        const origPeople = people;
        const norm = (s?: string) => (s || '')
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0]
          .trim();
        const normName = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const companyDomain = norm(domain || company.website || company.domain);
        const orgNameNorm = normName(org?.name);

        const afterFilter = people.filter((p: any) => {
          const pOrgId = p.organization_id || p.organization?.id;
          const pDom = norm(p.organization?.primary_domain || (p.organization as any)?.domain);
          const pOrgName = normName(p.organization?.name);
          const matchesOrgId = !!org?.id && pOrgId === org.id;
          const matchesDomain = !!companyDomain && pDom === companyDomain;
          const matchesOrgName = !!org?.name && pOrgName && pOrgName === orgNameNorm;
          return matchesOrgId || matchesDomain || matchesOrgName;
        });
        console.log('[Apollo] 🧹 Filtro por organização/domínio/nome:', { antes: people.length, depois: afterFilter.length, companyDomain, orgId: org?.id, orgName: org?.name });

        if (afterFilter.length === 0) {
          console.warn('[Apollo] ⚠️ Nenhum contato corresponde estritamente à organização/domínio. Não iremos manter lista ampla.');
          people = [];
        } else {
          people = afterFilter;
        }

        // Atualizar contador APÓS o filtro estrito
        peopleCount = people.length;

        // 🔄 FALLBACK: Se Apollo não trouxe decisores, tentar PhantomBuster
        let dataSource = 'apollo';
        if (people.length === 0) {
          console.log('[Apollo] ⚠️ Nenhum decisor no Apollo. Acionando fallback PhantomBuster...');
          try {
            const phantomKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
            const phantomAgent = Deno.env.get('PHANTOMBUSTER_AGENT_ID');
            const phantomSession = Deno.env.get('PHANTOMBUSTER_SESSION_COOKIE');
            
            if (phantomKey && phantomAgent && phantomSession) {
              const linkedinUrls: string[] = [];
              const linkedinCompanyUrl = (company as any).linkedin_url || (company as any).social_urls?.linkedin || (company as any).linkedin || (org && (org as any).linkedin_url);
              if (linkedinCompanyUrl) linkedinUrls.push(linkedinCompanyUrl);
              
              if (linkedinUrls.length > 0) {
                console.log('[Phantom] 🚀 Lançando scraping LinkedIn:', linkedinUrls);
                
                const phantomLaunch = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
                  method: 'POST',
                  headers: {
                    'X-Phantombuster-Key': phantomKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    id: phantomAgent,
                    argument: {
                      sessionCookie: phantomSession,
                      spreadsheetUrl: linkedinUrls.join('\n')
                    }
                  })
                });
                
                if (phantomLaunch.ok) {
                  const phantomResult = await phantomLaunch.json();
                  console.log('[Phantom] ✅ Scraping iniciado:', phantomResult.containerId);
                  
                  await new Promise(resolve => setTimeout(resolve, 10000));
                  
                  const phantomFetch = await fetch(`https://api.phantombuster.com/api/v2/containers/fetch-result-object?id=${phantomResult.containerId}`, {
                    headers: { 'X-Phantombuster-Key': phantomKey }
                  });
                  
                  if (phantomFetch.ok) {
                    const phantomData = await phantomFetch.json();
                    console.log('[Phantom] 📦 Dados recebidos:', phantomData.resultObject?.length || 0);
                    
                    if (phantomData.resultObject && Array.isArray(phantomData.resultObject)) {
                      people = phantomData.resultObject.map((p: any) => ({
                        id: null,
                        name: p.fullName || p.name,
                        title: p.headline || p.title,
                        linkedin_url: p.profileUrl || p.linkedInUrl,
                        email: p.email || null,
                        phone: p.phone || null,
                        photo_url: p.photo || p.imgUrl,
                        city: p.location?.city,
                        state: p.location?.state,
                        country: p.location?.country,
                        organization: company,
                        seniority: p.seniority || null
                      }));
                      dataSource = 'phantom';
                      console.log('[Phantom] ✅ Preparados:', people.length, 'decisores do PhantomBuster');
                    }
                  }
                } else {
                  console.warn('[Phantom] ⚠️ Erro ao lançar:', await phantomLaunch.text());
                }
              } else {
                console.log('[Phantom] ⚠️ Sem URL LinkedIn para scraping');
              }
            } else {
              console.log('[Phantom] ⚠️ Credenciais não configuradas');
            }
          } catch (phantomError) {
            console.error('[Phantom] ❌ Erro fallback:', phantomError);
          }
        }

        // Salvar decisores com TODOS os campos
        // 🧹 Cleanup: remover mocks com email placeholder desta empresa
        try {
          const { error: cleanupError } = await supabase
            .from('decision_makers')
            .delete()
            .eq('company_id', companyId)
            .eq('email', 'email_not_unlocked@domain.com')
            .eq('source', 'manual');
          if (cleanupError) console.warn('[Apollo] ⚠️ Cleanup falhou:', JSON.stringify(cleanupError, null, 2));
        } catch (e) {
          console.warn('[Apollo] ⚠️ Cleanup exception:', e);
        }
        
        for (const person of people) {
          let existingDecisor: any = null;
          // Preferir chave estável do Apollo e ignorar e-mails mascarados
          const maskedEmail = !person.email || /email_not_unlocked@domain\.com/i.test(person.email);
          const emailForMatch = maskedEmail ? null : person.email;

          // 1) apollo_person_id
          let { data: existingByApolloId } = await supabase
            .from('decision_makers')
            .select('id')
            .eq('apollo_person_id', person.id)
            .eq('company_id', companyId)
            .maybeSingle();
          existingDecisor = existingByApolloId;

          // 2) LinkedIn URL
          if (!existingDecisor && person.linkedin_url) {
            const { data } = await supabase
              .from('decision_makers')
              .select('id')
              .eq('linkedin_url', person.linkedin_url)
              .eq('company_id', companyId)
              .maybeSingle();
            existingDecisor = data;
          }

          // 3) E-mail real
          if (!existingDecisor && emailForMatch) {
            const { data } = await supabase
              .from('decision_makers')
              .select('id')
              .eq('email', emailForMatch)
              .eq('company_id', companyId)
              .maybeSingle();
            existingDecisor = data;
          }

          // 4) Nome + empresa (fallback)
          if (!existingDecisor) {
            const { data } = await supabase
              .from('decision_makers')
              .select('id')
              .eq('name', person.name)
              .eq('company_id', companyId)
              .maybeSingle();
            existingDecisor = data;
          }

          const decisorData = {
            company_id: companyId,
            source: dataSource,
            name: person.name,
            title: person.title,
            email: maskedEmail ? null : person.email, // ✅ Ignorar e-mail mascarado
            phone: person.phone || person.sanitized_phone,
            direct_phone: person.direct_phone,
            mobile_phone: person.mobile_phone,
            work_direct_phone: person.work_direct_phone,
            linkedin_url: person.linkedin_url,
            apollo_person_id: person.id,
            
            // ✅ Campos de email (já estavam)
            email_status: person.email_status,
            email_verification_date: person.email_last_verified_date,
            contact_accuracy_score: person.contact_accuracy_score || 0,
            extrapolated_email_confidence: person.extrapolated_email_confidence,
            
            // ✅ Campos de senioridade (já estavam)
            seniority_level: person.seniority,
            departments: person.departments || [],
            
            // 🆕 NOVO: Separar functions de persona_tags
            functions: person.functions || [],
            subdepartments: person.subdepartments || [],
            persona_tags: person.functions || [], // Manter por compatibilidade
            
            // ✅ Campos visuais (já estavam)
            photo_url: person.photo_url,
            
            // ✅ Sinais de intenção (já estavam)
            intent_strength: person.intent_strength,
            show_intent: person.show_intent || false,
            revealed_for_current_team: person.revealed_for_current_team || false,
            
            // 🆕 NOVO: Localização em colunas dedicadas
            headline: person.headline,
            city: person.city,
            state: person.state,
            country: person.country,
            
            // 🆕 NOVO: Redes sociais em colunas dedicadas
            twitter_url: person.twitter_url,
            facebook_url: person.facebook_url,
            github_url: person.github_url,
            
            // 🆕 NOVO: Histórico educacional
            education: person.education || null,
            
            // 🆕 NOVO: Dados da organização estruturados
            organization_data: {
              name: person.organization_name,
              id: person.organization_id,
              linkedin_url: person.organization?.linkedin_url,
              website_url: person.organization?.website_url,
              industry: person.organization?.industry,
              employees: person.organization?.estimated_num_employees
            },
            
            // 🆕 NOVO: Timestamp de enriquecimento
            apollo_last_enriched_at: new Date().toISOString(),
            
            // ✅ Manter metadata com dados legados/extras (reduzido)
            apollo_person_metadata: {
              employment_history: person.employment_history || [],
              raw_response: {
                email_confidence: person.email_confidence,
                account_email_status: person.account_email_status,
                typed_custom_fields: person.typed_custom_fields
              }
            }
          };

          if (existingDecisor) {
            // Atualizar decisor existente
            const { error } = await supabase
              .from('decision_makers')
              .update(decisorData)
              .eq('id', existingDecisor.id);
            
            if (error) {
              console.error('[Apollo] ❌ ERRO ao atualizar decisor:', person.name);
              console.error('[Apollo] 📋 Dados que tentou salvar:', JSON.stringify(decisorData, null, 2));
              console.error('[Apollo] 🔴 Erro completo:', JSON.stringify(error, null, 2));
            } else {
              console.log('[Apollo] ✅ Decisor atualizado:', person.name);
            }
          } else {
            // Criar novo decisor
            const { data: newDecisor, error } = await supabase
              .from('decision_makers')
              .insert(decisorData)
              .select()
              .single();
            
            if (error) {
              console.error('[Apollo] ❌ ERRO ao criar decisor:', person.name);
              console.error('[Apollo] 📋 Dados que tentou salvar:', JSON.stringify(decisorData, null, 2));
              console.error('[Apollo] 🔴 Erro completo:', JSON.stringify(error, null, 2));
            } else {
              console.log('[Apollo] ✅ Decisor criado:', person.name, '| ID:', newDecisor?.id);
            }
          }
        }

        console.log('[Apollo] ✅ Decisores processados:', people.length);
        
        // 🔍 Verificar quantos foram realmente salvos (ignorando placeholders)
        const { count: savedCount } = await supabase
          .from('decision_makers')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);
        
        const { count: placeholders } = await supabase
          .from('decision_makers')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('email', 'email_not_unlocked@domain.com');
        
        console.log('[Apollo] 📊 RESUMO FINAL:', { 
          fonte: dataSource.toUpperCase(),
          recebidos: people.length, 
          salvos: savedCount, 
          placeholders: placeholders || 0 
        });

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
