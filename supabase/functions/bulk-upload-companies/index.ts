import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyRow {
  // 87 campos completos mapeados
  [key: string]: string | undefined;
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

    const { companies } = await req.json() as { companies: CompanyRow[] };

    if (!companies || !Array.isArray(companies)) {
      throw new Error('Invalid companies data');
    }

    console.log(`📊 Processing ${companies.length} companies with 87-column format...`);

    const results = {
      success: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < companies.length; i++) {
      const row = companies[i];
      
      try {
        // Validação básica - pelo menos um identificador
        const cnpj = row.CNPJ?.replace(/\D/g, '') || null;
        const name = row['Nome da Empresa'] || row['Razão Social'] || row['Nome Fantasia'];
        const website = row.Website;
        const linkedin = row.LinkedIn;
        const instagram = row.Instagram;
        
        if (!cnpj && !name && !website && !linkedin && !instagram) {
          results.errors.push(`Linha ${i + 2}: Nenhum identificador fornecido`);
          continue;
        }
        
        // Valida CNPJ se fornecido
        if (cnpj && cnpj.length !== 14) {
          results.errors.push(`Linha ${i + 2}: CNPJ inválido (${row.CNPJ})`);
          continue;
        }

        // Prepara dados completos da empresa
        const companyData: any = {
          name: name || 'Empresa Importada',
          cnpj: cnpj,
          industry: row.Setor || null,
          employees: row['Funcionários'] ? parseInt(row['Funcionários']) : null,
          revenue: row['Faturamento Estimado'] || null,
          digital_maturity_score: row['Score Maturidade Digital'] ? parseFloat(row['Score Maturidade Digital']) : null,
          raw_data: {
            imported_at: new Date().toISOString(),
            csv_row: i + 2,
            
            // Dados da Receita Federal
            receita: {
              fantasia: row['Nome Fantasia'] || null,
              razao_social: row['Razão Social'] || null,
              porte: row.Porte || null,
              natureza_juridica: row['Natureza Jurídica'] || null,
              capital_social: row['Capital Social'] || null,
              abertura: row['Data de Abertura'] || null,
              situacao: row['Situação Cadastral'] || null,
              data_situacao: row['Data Situação'] || null,
              motivo_situacao: row['Motivo Situação'] || null,
              situacao_especial: row['Situação Especial'] || null,
              data_situacao_especial: row['Data Situação Especial'] || null,
              cep: row.CEP || null,
              logradouro: row.Logradouro || null,
              numero: row['Número'] || null,
              complemento: row.Complemento || null,
              bairro: row.Bairro || null,
              municipio: row['Município'] || null,
              uf: row.UF || null,
              pais: row['País'] || 'Brasil',
              telefone: row.Telefone || null,
              email: row.Email || null,
              email_status: row['Email Verificado'] === 'Sim' ? 'verified' : null,
              
              // CNAEs
              atividade_principal: row['CNAE Principal Código'] ? [{
                code: row['CNAE Principal Código'],
                text: row['CNAE Principal Descrição'] || ''
              }] : null,
              
              // Sócios (parseado se houver)
              qsa: row['Sócios'] ? row['Sócios'].split(';').map(s => {
                const match = s.trim().match(/^(.+?)\s*\((.+?)\)$/);
                return match ? { nome: match[1].trim(), qual: match[2].trim() } : null;
              }).filter(Boolean) : null
            },
            
            // Produtos e marketplace
            produto_categoria: row['Produto Principal'] || row['Categoria'] || null,
            marca: row.Marca || null,
            link_produto: row['Link Produto/Marketplace'] || null,
            
            // Tech Stack
            tech_stack: row['Tech Stack'] ? row['Tech Stack'].split(',').map(t => t.trim()) : null,
            current_erp: row['ERP Atual'] || null,
            current_crm: row['CRM Atual'] || null,
            
            // Scores
            fit_score: row['Score Fit TOTVS'] ? parseFloat(row['Score Fit TOTVS']) : null,
            analysis_score: row['Score Análise'] ? parseFloat(row['Score Análise']) : null,
            
            // Enriquecimentos
            enriched_receita: row['Enriquecido Receita'] === 'Sim',
            enriched_360: row['Enriquecido 360'] === 'Sim',
            enriched_apollo: row['Enriquecido Apollo'] === 'Sim',
            enriched_phantom: row['Enriquecido Phantom'] === 'Sim',
            
            // Metadados CRM
            notes: row['Observações'] || null,
            tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : null,
            priority: row.Prioridade || null,
            pipeline_status: row['Status Pipeline'] || null,
            opportunity_value: row['Valor Oportunidade'] || null,
            close_probability: row['Probabilidade Fechamento'] ? parseFloat(row['Probabilidade Fechamento']) : null
          }
        };

        // Copia campos ricos (87 colunas Econodata) para raw_data
        const econoKeys = [
          'assertividade','melhor_telefone','segundo_melhor_telefone','telefones_alta_assertividade','telefones_media_assertividade','telefones_baixa_assertividade','telefones_matriz','telefones_filiais','celulares','melhor_celular','fixos','pat_telefone','whatsapp',
          'setor_amigavel','atividade_economica','cod_atividade_economica','atividades_secundarias','cod_atividades_secundarias','cod_ncms_primarios','ncms_primarios',
          'recebimentos_governo_federal','enquadramento_porte','funcionarios_presumido_matriz_cnpj','funcionarios_presumido_este_cnpj','faturamento_presumido_matriz_cnpj','faturamento_presumido_este_cnpj','crescimento_empresa','qtd_filiais','socios_administradores','decisores_cargos','decisores_linkedin','colaboradores_cargos','colaboradores_linkedin',
          'emails_validados_departamentos','emails_validados_socios','emails_validados_decisores','emails_validados_colaboradores','email_pat','email_receita_federal','emails_publicos',
          'porte_estimado','importacao','exportacao','pat_funcionarios','regime_tributario','situacao_cadastral',
          'sites','melhor_site','segundo_melhor_site','instagram','facebook','linkedin','twitter','youtube','outras','tecnologias','ferramentas','tags','notas','nivel_atividade',
          'perc_dividas_cnpj_sobre_faturamento','perc_dividas_cnpj_socios_sobre_faturamento','total_dividas_cnpj_uniao','total_dividas_cnpj_socios_uniao','dividas_gerais_cnpj_uniao','dividas_gerais_cnpj_socios_uniao','dividas_cnpj_fgts','dividas_cnpj_socios_fgts','dividas_cnpj_previdencia','dividas_cnpj_socios_previdencia',
          'microrregiao','mesorregiao','tipo_unidade'
        ];
        const econoData: Record<string, any> = {};
        for (const k of econoKeys) {
          const v = (row as any)[k];
          if (v !== undefined && v !== '') econoData[k] = v;
        }
        companyData.raw_data = { ...companyData.raw_data, ...econoData };

        // Website e domínio
        if (website) {
          companyData.website = website.startsWith('http') ? website : `https://${website}`;
          try {
            const url = new URL(companyData.website);
            companyData.domain = url.hostname.replace('www.', '');
          } catch (e) {
            console.warn(`Invalid website URL for row ${i + 2}:`, website);
          }
        }

        // LinkedIn URL
        if (linkedin) {
          companyData.linkedin_url = linkedin.startsWith('http') ? linkedin : `https://linkedin.com/company/${linkedin}`;
        }

        // Localização completa
        if (row.CEP || row.Logradouro || row['Município'] || row.UF) {
          const lat = row.Latitude ? parseFloat(row.Latitude) : null;
          const lng = row.Longitude ? parseFloat(row.Longitude) : null;
          
          companyData.location = {
            cep: row.CEP,
            logradouro: row.Logradouro,
            numero: row['Número'],
            complemento: row.Complemento,
            bairro: row.Bairro,
            city: row['Município'],
            state: row.UF,
            country: row['País'] || 'Brasil',
            coordinates: (lat && lng) ? { lat, lng } : null
          };

          // Geocodificar se não tiver coordenadas
          if (!lat || !lng) {
            try {
              const hasNumero = row['Número'] && row['Número'].trim().length > 0;
              const hasCep = row.CEP && row.CEP.replace(/\D/g, '').length === 8;
              
              let searchText = '';
              if (hasNumero && row.Logradouro) {
                searchText = `${row.Logradouro}, ${row['Número']}, ${row['Município']}, ${row.UF}, Brasil`;
              } else if (hasCep) {
                searchText = `${row.CEP}, Brasil`;
              } else if (row.Logradouro && row['Município']) {
                searchText = `${row.Logradouro}, ${row['Município']}, ${row.UF}, Brasil`;
              } else if (row['Município'] && row.UF) {
                searchText = `${row['Município']}, ${row.UF}, Brasil`;
              }

              if (searchText) {
                const geocodeResponse = await supabaseClient.functions.invoke('mapbox-geocode', {
                  body: { searchText, zoom: 16 }
                });

                if (geocodeResponse.data?.success && geocodeResponse.data.location) {
                  companyData.location.coordinates = {
                    lat: geocodeResponse.data.location.lat,
                    lng: geocodeResponse.data.location.lng
                  };
                  console.log(`✅ Geocodificado: ${companyData.name} -> ${geocodeResponse.data.location.lat}, ${geocodeResponse.data.location.lng}`);
                }
              }
            } catch (geocodeError) {
              console.warn(`⚠️ Erro ao geocodificar empresa ${i + 2}:`, geocodeError);
            }
          }
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

        console.log(`✅ Successfully saved company: ${company.name} (${company.id})`);
        
        // Processa decisores se houver
        const decisores = [];
        for (let j = 1; j <= 3; j++) {
          const decisorName = row[`Decisor ${j} Nome`];
          if (decisorName) {
            decisores.push({
              company_id: company.id,
              name: decisorName,
              title: row[`Decisor ${j} Cargo`] || null,
              email: row[`Decisor ${j} Email`] || null,
              phone: row[`Decisor ${j} Telefone`] || null,
              linkedin_url: row[`Decisor ${j} LinkedIn`] || null,
              source: 'csv_import'
            });
          }
        }

        if (decisores.length > 0) {
          const { error: decisorError } = await supabaseClient
            .from('decision_makers')
            .upsert(decisores);
          
          if (decisorError) {
            console.warn(`⚠️ Erro ao salvar decisores da empresa ${company.name}:`, decisorError);
          } else {
            console.log(`✅ ${decisores.length} decisor(es) salvos para ${company.name}`);
          }
        }

        // Cria digital_presence se houver redes sociais
        if (instagram || linkedin || row.Facebook || row.Twitter || row.YouTube) {
          const digitalPresence = {
            company_id: company.id,
            linkedin: linkedin ? (linkedin.startsWith('http') ? linkedin : `https://linkedin.com/company/${linkedin}`) : null,
            instagram: instagram ? (instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`) : null,
            facebook: row.Facebook || null,
            twitter: row.Twitter || null,
            youtube: row.YouTube || null
          };

          await supabaseClient
            .from('digital_presence')
            .upsert(digitalPresence, { onConflict: 'company_id' });
        }

        results.success++;

        // Enriquecimento automático em background (se não veio já enriquecido)
        if (!companyData.raw_data.enriched_receita || !companyData.raw_data.enriched_360) {
          supabaseClient.functions.invoke('auto-enrich-company', {
            body: {
              companyId: company.id,
              cnpj: company.cnpj,
              name: company.name,
              website: company.website,
              linkedin_url: company.linkedin_url
            }
          }).then(() => {
            console.log(`🚀 Auto-enrichment started for ${company.name}`);
          }).catch(err => {
            console.error(`Failed to start auto-enrichment for ${company.name}:`, err);
          });
        }

      } catch (error) {
        console.error(`❌ Error processing row ${i + 2}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.errors.push(`Linha ${i + 2}: ${errorMessage}`);
      }
    }

    console.log(`📊 Upload complete: ${results.success} success, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error in bulk-upload-companies:', error);
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