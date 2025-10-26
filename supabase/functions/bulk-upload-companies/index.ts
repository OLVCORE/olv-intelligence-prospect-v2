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
        // Validação básica - pelo menos um identificador (AGORA USANDO CAMPOS NORMALIZADOS)
        const cnpj = (row.cnpj || row.CNPJ)?.replace(/\D/g, '') || null;
        const name = row.nome_empresa || row['nome_empresa'] || row['Nome da Empresa'] || row['Razão Social'] || row.nome_fantasia || row['nome_fantasia'];
        const website = row.sites || row.melhor_site || row.Website;
        const linkedin = row.linkedin || row.LinkedIn;
        const instagram = row.instagram || row.Instagram;
        
        if (!cnpj && !name && !website && !linkedin && !instagram) {
          results.errors.push(`Linha ${i + 2}: Nenhum identificador fornecido`);
          continue;
        }
        
        // Valida CNPJ se fornecido
        if (cnpj && cnpj.length !== 14) {
          results.errors.push(`Linha ${i + 2}: CNPJ inválido (${row.CNPJ})`);
          continue;
        }

        // Prepara dados completos da empresa (TODOS OS 87 CAMPOS)
        const companyData: any = {
          name: name || 'Empresa Importada',
          cnpj: cnpj,
          industry: row.setor_amigavel || row.Setor || null,
          employees: (row.funcionarios_presumido_matriz_cnpj || row['Funcion ários']) ? parseInt(String(row.funcionarios_presumido_matriz_cnpj || row['Funcionários'] || '0')) : null,
          revenue: row.faturamento_presumido_matriz_cnpj || row['Faturamento Estimado'] || null,
          digital_maturity_score: row['Score Maturidade Digital'] ? parseFloat(String(row['Score Maturidade Digital'])) : null,
          raw_data: {
            imported_at: new Date().toISOString(),
            csv_row: i + 2,
            source: 'econodata_87_campos',
            
            // === IDENTIFICAÇÃO ===
            cnpj: cnpj,
            nome_empresa: name,
            nome_fantasia: row.nome_fantasia || row['Nome Fantasia'] || null,
            marca: row.marca || row.Marca || null,
            tipo_unidade: row.tipo_unidade || row['Tipo Unidade'] || 'Matriz',
            
            // === NATUREZA JURÍDICA ===
            natureza_juridica: row.natureza_juridica || row['Natureza Jurídica'] || null,
            situacao_cadastral: row.situacao_cadastral || row['Situação Cadastral'] || 'ATIVA',
            data_abertura: row.data_abertura || row['Data de Abertura'] || null,
            regime_tributario: row.regime_tributario || row['Regime Tributário'] || null,
            
            // === LOCALIZAÇÃO ===
            endereco: row.endereco || row.Logradouro || null,
            numero: row.numero || row['Número'] || null,
            complemento: row.complemento || row.Complemento || null,
            bairro: row.bairro || row.Bairro || null,
            cep: row.cep || row.CEP || null,
            municipio: row.municipio || row['Município'] || null,
            uf: row.uf || row.UF || null,
            pais: row.pais || row['País'] || 'Brasil',
            microrregiao: row.microrregiao || null,
            mesorregiao: row.mesorregiao || null,
            
            // === CONTATOS - ASSERTIVIDADE ===
            assertividade: row.assertividade || null,
            melhor_telefone: row.melhor_telefone || row.Telefone || null,
            segundo_melhor_telefone: row.segundo_melhor_telefone || null,
            telefones_alta_assertividade: row.telefones_alta_assertividade || null,
            telefones_media_assertividade: row.telefones_media_assertividade || null,
            telefones_baixa_assertividade: row.telefones_baixa_assertividade || null,
            telefones_matriz: row.telefones_matriz || null,
            telefones_filiais: row.telefones_filiais || null,
            celulares: row.celulares || null,
            melhor_celular: row.melhor_celular || null,
            fixos: row.fixos || null,
            pat_telefone: row.pat_telefone || null,
            whatsapp: row.whatsapp || null,
            
            // === ATIVIDADE ECONÔMICA ===
            setor_amigavel: row.setor_amigavel || row.Setor || null,
            atividade_economica: row.atividade_economica || null,
            cod_atividade_economica: row.cod_atividade_economica || row['CNAE Principal Código'] || null,
            atividades_secundarias: row.atividades_secundarias || null,
            cod_atividades_secundarias: row.cod_atividades_secundarias || null,
            
            // === NCMs ===
            cod_ncms_primarios: row.cod_ncms_primarios || null,
            ncms_primarios: row.ncms_primarios || null,
            
            // === FINANCEIRO ===
            capital_social: row.capital_social || row['Capital Social'] || null,
            recebimentos_governo_federal: row.recebimentos_governo_federal || null,
            enquadramento_porte: row.enquadramento_porte || null,
            funcionarios_presumido_matriz_cnpj: row.funcionarios_presumido_matriz_cnpj || null,
            funcionarios_presumido_este_cnpj: row.funcionarios_presumido_este_cnpj || null,
            faturamento_presumido_matriz_cnpj: row.faturamento_presumido_matriz_cnpj || null,
            faturamento_presumido_este_cnpj: row.faturamento_presumido_este_cnpj || null,
            crescimento_empresa: row.crescimento_empresa || null,
            qtd_filiais: row.qtd_filiais || null,
            
            // === ESTRUTURA ===
            socios_administradores: row.socios_administradores || row['Sócios'] || null,
            decisores_cargos: row.decisores_cargos || null,
            decisores_linkedin: row.decisores_linkedin || null,
            colaboradores_cargos: row.colaboradores_cargos || null,
            colaboradores_linkedin: row.colaboradores_linkedin || null,
            
            // === EMAILS ===
            emails_validados_departamentos: row.emails_validados_departamentos || null,
            emails_validados_socios: row.emails_validados_socios || null,
            emails_validados_decisores: row.emails_validados_decisores || null,
            emails_validados_colaboradores: row.emails_validados_colaboradores || null,
            email_pat: row.email_pat || null,
            email_receita_federal: row.email_receita_federal || row.Email || null,
            emails_publicos: row.emails_publicos || null,
            
            // === PORTE E COMÉRCIO EXTERIOR ===
            porte_estimado: row.porte_estimado || row.Porte || null,
            importacao: row.importacao || null,
            exportacao: row.exportacao || null,
            pat_funcionarios: row.pat_funcionarios || null,
            
            // === DIGITAL PRESENCE ===
            sites: row.sites || row.Website || null,
            melhor_site: row.melhor_site || null,
            segundo_melhor_site: row.segundo_melhor_site || null,
            instagram: row.instagram || row.Instagram || null,
            facebook: row.facebook || row.Facebook || null,
            linkedin: row.linkedin || row.LinkedIn || null,
            twitter: row.twitter || row.Twitter || null,
            youtube: row.youtube || row.YouTube || null,
            outras: row.outras || null,
            
            // === TECNOLOGIA ===
            tecnologias: row.tecnologias || row['Tech Stack'] || null,
            ferramentas: row.ferramentas || null,
            
            // === METADATA ===
            tags: row.tags || row.Tags || null,
            notas: row.notas || row['Observações'] || null,
            nivel_atividade: row.nivel_atividade || null,
            
            // === DÍVIDAS ===
            perc_dividas_cnpj_sobre_faturamento: row.perc_dividas_cnpj_sobre_faturamento || null,
            perc_dividas_cnpj_socios_sobre_faturamento: row.perc_dividas_cnpj_socios_sobre_faturamento || null,
            total_dividas_cnpj_uniao: row.total_dividas_cnpj_uniao || null,
            total_dividas_cnpj_socios_uniao: row.total_dividas_cnpj_socios_uniao || null,
            dividas_gerais_cnpj_uniao: row.dividas_gerais_cnpj_uniao || null,
            dividas_gerais_cnpj_socios_uniao: row.dividas_gerais_cnpj_socios_uniao || null,
            dividas_cnpj_fgts: row.dividas_cnpj_fgts || null,
            dividas_cnpj_socios_fgts: row.dividas_cnpj_socios_fgts || null,
            dividas_cnpj_previdencia: row.dividas_cnpj_previdencia || null,
            dividas_cnpj_socios_previdencia: row.dividas_cnpj_socios_previdencia || null
          }
        };
        
        console.log(`✅ Empresa ${i + 2}: ${companyData.raw_data.nome_empresa} - ${Object.keys(companyData.raw_data).length} campos capturados`);

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