import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyCSVRow {
  CNPJ?: string;
  'Razao Social'?: string;
  'Nome Fantasia'?: string;
  'Prioridade (1-5)'?: string;
  Instagram?: string;
  LinkedIn?: string;
  Facebook?: string;
  YouTube?: string;
  'X/Twitter'?: string;
  Website?: string;
  Observacoes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { companies } = await req.json() as { companies: CompanyCSVRow[] };

    if (!companies || !Array.isArray(companies)) {
      throw new Error('Invalid companies data');
    }

    console.log(`Processing ${companies.length} companies...`);

    const results = {
      success: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < companies.length; i++) {
      const row = companies[i];
      
      try {
        // Validação básica
        if (!row.CNPJ && !row['Razao Social'] && !row['Nome Fantasia']) {
          results.errors.push(`Linha ${i + 2}: Nenhum identificador fornecido`);
          continue;
        }

        // Limpa CNPJ
        const cnpj = row.CNPJ?.replace(/\D/g, '') || null;
        
        // Valida CNPJ se fornecido
        if (cnpj && cnpj.length !== 14) {
          results.errors.push(`Linha ${i + 2}: CNPJ inválido (${row.CNPJ})`);
          continue;
        }

        // Prepara dados da empresa
        const companyData: any = {
          name: row['Razao Social'] || row['Nome Fantasia'] || 'Empresa Importada',
          cnpj: cnpj,
          raw_data: {
            imported_at: new Date().toISOString(),
            csv_row: i + 2,
            razao_social: row['Razao Social'],
            nome_fantasia: row['Nome Fantasia'],
            prioridade: row['Prioridade (1-5)'] || '3',
            observacoes: row.Observacoes,
            social_media: {
              instagram: row.Instagram ? `https://instagram.com/${row.Instagram.replace('@', '')}` : null,
              linkedin: row.LinkedIn ? (row.LinkedIn.startsWith('http') ? row.LinkedIn : `https://linkedin.com/company/${row.LinkedIn}`) : null,
              facebook: row.Facebook ? (row.Facebook.startsWith('http') ? row.Facebook : `https://facebook.com/${row.Facebook}`) : null,
              youtube: row.YouTube ? (row.YouTube.startsWith('http') ? row.YouTube : `https://youtube.com/@${row.YouTube}`) : null,
              twitter: row['X/Twitter'] ? (row['X/Twitter'].startsWith('http') ? row['X/Twitter'] : `https://x.com/${row['X/Twitter'].replace('@', '')}`) : null,
            }
          }
        };

        // Adiciona website se fornecido
        if (row.Website) {
          companyData.website = row.Website.startsWith('http') ? row.Website : `https://${row.Website}`;
          
          // Extrai domínio para o campo domain
          try {
            const url = new URL(companyData.website);
            companyData.domain = url.hostname.replace('www.', '');
          } catch (e) {
            console.warn(`Invalid website URL for row ${i + 2}:`, row.Website);
          }
        }

        // Adiciona LinkedIn URL se fornecido
        if (companyData.raw_data.social_media.linkedin) {
          companyData.linkedin_url = companyData.raw_data.social_media.linkedin;
        }

        // Insere ou atualiza empresa
        const { data: company, error: companyError } = await supabaseClient
          .from('companies')
          .upsert(companyData, {
            onConflict: cnpj ? 'cnpj' : undefined,
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (companyError) {
          console.error(`Error saving company at row ${i + 2}:`, companyError);
          results.errors.push(`Linha ${i + 2}: ${companyError.message}`);
          continue;
        }

        console.log(`Successfully saved company: ${company.name} (${company.id})`);
        results.success++;

      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Linha ${i + 2}: ${errorMessage}`);
      }
    }

    console.log(`Upload complete: ${results.success} success, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error in bulk-upload-companies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
