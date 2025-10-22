import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyCSVRow {
  CNPJ?: string;
  'Nome da Empresa'?: string;
  Website?: string;
  Instagram?: string;
  LinkedIn?: string;
  'Produto/Categoria'?: string;
  Marca?: string;
  'Link Produto/Marketplace'?: string;
  CEP?: string;
  Estado?: string;
  Pais?: string;
  Municipio?: string;
  Bairro?: string;
  Logradouro?: string;
  Numero?: string;
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
        // Validação básica - pelo menos um campo deve estar preenchido
        if (!row.CNPJ && !row['Nome da Empresa'] && !row.Website && !row.Instagram && !row.LinkedIn) {
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
          name: row['Nome da Empresa'] || 'Empresa Importada',
          cnpj: cnpj,
          raw_data: {
            imported_at: new Date().toISOString(),
            csv_row: i + 2,
            produto_categoria: row['Produto/Categoria'],
            marca: row['Marca'],
            link_produto: row['Link Produto/Marketplace'],
            social_media: {
              instagram: row.Instagram ? (row.Instagram.startsWith('http') ? row.Instagram : `https://instagram.com/${row.Instagram.replace('@', '')}`) : null,
              linkedin: row.LinkedIn ? (row.LinkedIn.startsWith('http') ? row.LinkedIn : `https://linkedin.com/company/${row.LinkedIn}`) : null,
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

        // Adiciona localização se fornecida
        if (row.CEP || row.Logradouro || row.Municipio || row.Estado) {
          companyData.location = {
            cep: row.CEP,
            logradouro: row.Logradouro,
            numero: row.Numero,
            bairro: row.Bairro,
            municipio: row.Municipio,
            estado: row.Estado,
            pais: row.Pais || 'Brasil'
          };
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

        // 🚀 Dispara análise automática em background (sem esperar)
        supabaseClient.functions.invoke('auto-enrich-company', {
          body: {
            companyId: company.id,
            cnpj: company.cnpj,
            name: company.name,
            website: company.website,
            linkedin_url: company.linkedin_url
          }
        }).then(() => {
          console.log(`Auto-enrichment started for ${company.name}`);
        }).catch(err => {
          console.error(`Failed to start auto-enrichment for ${company.name}:`, err);
        });

      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
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
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
