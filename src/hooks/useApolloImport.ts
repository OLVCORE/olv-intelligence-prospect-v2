import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApolloSearchParams {
  location?: string;
  industry?: string;
  employees_range?: string;
  keywords?: string;
}

export function useApolloImport() {
  const [importing, setImporting] = useState(false);

  const importLeads = async (searchParams: ApolloSearchParams) => {
    setImporting(true);
    
    try {
      console.log('[Apollo Import] 🚀 Iniciando importação:', searchParams);
      
      // Montar parâmetros Apollo
      const apolloParams: any = {};
      
      if (searchParams.location) {
        apolloParams.q_organization_locations = searchParams.location;
      }
      
      if (searchParams.industry) {
        apolloParams.q_organization_industry_tag_ids = searchParams.industry;
      }
      
      if (searchParams.employees_range) {
        apolloParams.q_organization_num_employees_ranges = searchParams.employees_range;
      }
      
      if (searchParams.keywords) {
        apolloParams.q_organization_keyword_tags = searchParams.keywords;
      }
      
      // Chamar edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'import_leads',
          searchParams: apolloParams
        },
        headers
      });
      
      if (error) throw error;
      
      console.log('[Apollo Import] ✅ Resultado:', data);
      
      toast.success(
        `🎉 ${data.imported} de ${data.total} empresas importadas!`,
        {
          description: 'Leads do Apollo adicionados à plataforma',
          duration: 5000
        }
      );
      
      return {
        success: true,
        imported: data.imported,
        total: data.total,
        companies: data.companies
      };
      
    } catch (error: any) {
      console.error('[Apollo Import] ❌ Erro:', error);
      
      toast.error('Erro ao importar do Apollo', {
        description: error.message || 'Verifique sua chave API do Apollo'
      });
      
      return {
        success: false,
        error: error.message
      };
      
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    importLeads
  };
}
