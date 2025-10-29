import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Person {
  id: string;
  full_name: string;
  job_title: string;
  seniority: string;
  department: string;
  email_primary: string;
  linkedin_url: string;
  city: string;
  state: string;
  country: string;
  phones: any;
}

export interface CompanyPerson extends Person {
  location_city: string;
  location_state: string;
  location_country: string;
  title_at_company: string;
  is_current: boolean;
}

export function useCompanyPeople(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-people', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_people')
        .select(`
          *,
          people:person_id (
            id,
            full_name,
            job_title,
            seniority,
            department,
            email_primary,
            linkedin_url,
            city,
            state,
            country,
            phones
          )
        `)
        .eq('company_id', companyId)
        .eq('is_current', true)
        .order('seniority', { ascending: false });

      if (error) {
        console.error('Error fetching company people:', error);
        throw error;
      }

      return (data || []).map(cp => {
        const person = cp.people as any;
        return {
          ...cp,
          people: person || {}
        };
      });
    },
    enabled: !!companyId,
    staleTime: 30000
  });
}
