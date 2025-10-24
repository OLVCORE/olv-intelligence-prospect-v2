import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, decision_makers, digital_maturity } = await req.json();
    
    console.log('[Save Company] Iniciando salvamento:', company.name);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Salvar empresa no banco (merge seguro para não perder dados existentes)
    // Buscar empresa existente por ID ou CNPJ
    let existingCompany: any = null;
    if (company.id) {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company.id)
        .maybeSingle();
      existingCompany = data;
    } else if (company.cnpj) {
      const cnpjDigits = String(company.cnpj).replace(/\D/g, '');
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('cnpj', cnpjDigits)
        .maybeSingle();
      existingCompany = data;
    }

    // Preparar merges
    const mergedRaw = {
      ...(existingCompany?.raw_data ?? {}),
      ...(company.raw_data ?? {}),
    };

    const mergedLocation = {
      ...(existingCompany?.location ?? {}),
      ...(company.location ?? {}),
    } as Record<string, unknown>;

    const mergedTechnologies = Array.from(
      new Set([...(existingCompany?.technologies ?? []), ...(company.technologies ?? [])])
    );

    // Sanitizar campos existentes que não devem ser enviados (id, timestamps)
    const { id: _id, created_at: _ca, updated_at: _ua, ...restExisting } = existingCompany || {} as any;

    const upsertPayload = {
      ...(restExisting || {}),
      ...company,
      ...(Object.keys(mergedLocation).length ? { location: mergedLocation } : {}),
      ...(mergedTechnologies.length ? { technologies: mergedTechnologies } : {}),
      ...(Object.keys(mergedRaw).length ? { raw_data: mergedRaw } : {}),
    };

    // Upsert seguro: normaliza CNPJ e evita conflito com PK quando formatos diferem
    const cnpjDigits = company?.cnpj ? String(company.cnpj).replace(/\D/g, '') : null;
    const willConflictOnCnpj = !company?.id && !!cnpjDigits;

    const safePayload: any = {
      ...upsertPayload,
      ...(cnpjDigits ? { cnpj: cnpjDigits } : {}),
    };

    // Evita gravar websites placeholder
    if (typeof safePayload.website === 'string' && /(exemplo\.com\.br|kelludyfestas\.com\.br)/i.test(safePayload.website)) {
      delete safePayload.website;
    }

    // Se vamos conflitar por CNPJ, removemos o id para não estourar a PK
    if (willConflictOnCnpj) {
      delete safePayload.id;
    }

    const { data: savedCompany, error: companyError } = await supabase
      .from('companies')
      .upsert(safePayload, willConflictOnCnpj ? { onConflict: 'cnpj' } : undefined as any)
      .select()
      .single();

    if (companyError) throw companyError;
    console.log('[Save Company] Empresa salva:', savedCompany.id);

    // 2. Salvar presença digital (Instagram/LinkedIn em jsonb)
    try {
      const instagramUrl = company?.raw_data?.social_media?.instagram || null;
      const linkedinUrl = savedCompany.linkedin_url || null;

      if (instagramUrl || linkedinUrl) {
        const payload: any = {
          company_id: savedCompany.id,
          last_updated: new Date().toISOString(),
        };
        if (instagramUrl) payload.instagram_data = { url: instagramUrl };
        if (linkedinUrl) payload.linkedin_data = { url: linkedinUrl };

        const { data: existingPresence } = await supabase
          .from('digital_presence')
          .select('id')
          .eq('company_id', savedCompany.id)
          .maybeSingle();

        if (!existingPresence) {
          const { error: presenceInsertError } = await supabase
            .from('digital_presence')
            .insert(payload);
          if (presenceInsertError) {
            console.error('[Save Company] Error inserting digital presence:', presenceInsertError);
          } else {
            console.log('[Save Company] Presença digital criada');
          }
        } else {
          const { error: presenceUpdateError } = await supabase
            .from('digital_presence')
            .update(payload)
            .eq('company_id', savedCompany.id);
          if (presenceUpdateError) {
            console.error('[Save Company] Error updating digital presence:', presenceUpdateError);
          } else {
            console.log('[Save Company] Presença digital atualizada');
          }
        }
      }
    } catch (dpErr) {
      console.warn('[Save Company] Falha não crítica ao salvar presença digital:', dpErr);
    }

    // 3. Salvar decisores
    if (decision_makers && decision_makers.length > 0) {
      const decisorsPayload = decision_makers.map((person: any) => ({
        company_id: savedCompany.id,
        name: person.name,
        title: person.title,
        email: person.email,
        linkedin_url: person.linkedin_url,
        department: person.department || person.headline,
        seniority: person.seniority,
        verified_email: person.verified_email || false,
        raw_data: {
          ...person,
          phone: person.phone,
          whatsapp: person.whatsapp
        }
      }));

      const { error: decisorsError } = await supabase
        .from('decision_makers')
        .upsert(decisorsPayload, {
          onConflict: 'company_id,email',
          ignoreDuplicates: true
        });

      if (decisorsError) {
        console.error('[Save Company] Error saving decision makers:', decisorsError);
      } else {
        console.log('[Save Company] Decisores salvos:', decision_makers.length);
      }
    }

    // 4. Salvar maturidade digital
    if (digital_maturity) {
      await supabase.from('digital_maturity').insert({
        company_id: savedCompany.id,
        infrastructure_score: digital_maturity.infrastructure,
        systems_score: digital_maturity.systems,
        processes_score: digital_maturity.processes,
        security_score: digital_maturity.security,
        innovation_score: digital_maturity.innovation,
        overall_score: digital_maturity.overall,
        analysis_data: digital_maturity.analysis_data
      });

      // Atualizar score na empresa
      await supabase
        .from('companies')
        .update({ digital_maturity_score: digital_maturity.overall })
        .eq('id', savedCompany.id);
        
      console.log('[Save Company] Maturidade digital salva');
    }

    // 5. Registrar no histórico
    await supabase.from('search_history').insert({
      query: company.name || company.cnpj,
      filters: company.raw_data?.refinamentos || {},
      results_count: 1
    });

    // 6. Buscar dados completos para retornar
    const { data: fullCompany, error: fetchError } = await supabase
      .from('companies')
      .select(`
        *,
        decision_makers (*),
        digital_maturity (*),
        governance_signals (*)
      `)
      .eq('id', savedCompany.id)
      .single();

    if (fetchError || !fullCompany) {
      console.error('[Save Company] Erro ao buscar dados completos:', fetchError);
      throw new Error('Não foi possível recuperar os dados da empresa após salvar');
    }

    // Buscar presença digital separadamente (sem depender de relacionamento FK)
    const { data: presence } = await supabase
      .from('digital_presence')
      .select('*')
      .eq('company_id', savedCompany.id)
      .maybeSingle();

    const enrichedCompany = {
      ...fullCompany,
      digital_presence: presence ? [presence] : [],
    };
    

    console.log('[Save Company] ✅ Salvamento concluído');

    // 🚀 Dispara análise automática em background (sem esperar)
    supabase.functions.invoke('auto-enrich-company', {
      body: {
        companyId: fullCompany.id,
        cnpj: fullCompany.cnpj,
        name: fullCompany.name,
        website: fullCompany.website,
        linkedin_url: fullCompany.linkedin_url
      }
    }).then(() => {
      console.log(`✅ Auto-enrichment started for ${fullCompany.name}`);
    }).catch(err => {
      console.error(`❌ Failed to start auto-enrichment for ${fullCompany.name}:`, err);
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        company: enrichedCompany
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[Save Company] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
