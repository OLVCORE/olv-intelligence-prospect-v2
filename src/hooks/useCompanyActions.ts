import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SuggestItem = {
  source: 'apollo' | 'linkedin' | 'google';
  name: string;
  domain?: string | null;
  location?: string | null;
  industry?: string | null;
  employees?: number | null;
  apollo_org_id?: string | null;
  linkedin_company_id?: string | null;
  linkedin_url?: string | null;
  website?: string | null;
  score?: number;
  why?: string[];
};

export function useCompanyActions() {
  const ensureCompanyRecord = async (item: SuggestItem): Promise<string> => {
    const { data: existing, error: searchError } = await supabase
      .from('companies')
      .select('id')
      .or(`apollo_organization_id.eq.${item.apollo_org_id},domain.eq.${item.domain},linkedin_url.eq.${item.linkedin_url}`)
      .maybeSingle();

    if (searchError) throw searchError;
    if (existing) return existing.id;

    const companyData: any = {
      name: item.name,
      domain: item.domain,
      website: item.website,
      linkedin_url: item.linkedin_url,
      apollo_organization_id: item.apollo_org_id,
      industry: item.industry,
      employees: item.employees,
      city: item.location
    };

    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert([companyData])
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newCompany.id;
  };

  const enrichAll = async (companyId: string, apolloOrgId: string) => {
    const { data, error } = await supabase.functions.invoke('enrich-apollo', {
      body: {
        company_id: companyId,
        organization_id: apolloOrgId,
        modes: ['company', 'people', 'similar'],
        force: false
      }
    });

    if (error) throw error;
    return data;
  };

  const lockLinkedIn = async (companyId: string, linkedinUrl: string) => {
    const linkedinId = extractLinkedInCompanyId(linkedinUrl);
    
    const { error } = await supabase
      .from('companies')
      .update({
        linkedin_url: linkedinUrl,
        linkedin_company_id: linkedinId,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId);

    if (error) throw error;
  };

  const extractLinkedInCompanyId = (url: string): string | null => {
    try {
      const match = url.match(/linkedin\.com\/company\/([^/?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  return {
    ensureCompanyRecord,
    enrichAll,
    lockLinkedIn
  };
}
