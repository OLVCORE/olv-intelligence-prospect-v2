import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportedCompany {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Iniciando sincronização automática Google Sheets');

    // Buscar todas as configurações ativas
    const { data: configs, error: configError } = await supabase
      .from('google_sheets_sync_config')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      console.error('❌ Erro ao buscar configurações:', configError);
      throw configError;
    }

    if (!configs || configs.length === 0) {
      console.log('ℹ️ Nenhuma configuração ativa encontrada');
      return new Response(
        JSON.stringify({ message: 'Nenhuma configuração ativa' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📋 Encontradas ${configs.length} configurações ativas`);

    const results = [];

    for (const config of configs) {
      try {
        // Converter URL do Google Sheets para CSV export
        let csvUrl = config.sheet_url;
        if (csvUrl.includes('/edit')) {
          csvUrl = csvUrl.replace('/edit', '/export?format=csv');
        } else if (!csvUrl.includes('/export')) {
          csvUrl = csvUrl + '/export?format=csv';
        }

        console.log(`📥 Baixando dados de: ${csvUrl}`);

        // Baixar dados do Google Sheets
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error(`Não foi possível acessar a planilha: ${response.statusText}`);
        }

        const csvText = await response.text();
        const companies = parseCSV(csvText);

        console.log(`✅ ${companies.length} empresas encontradas na planilha`);

        // Importar empresas
        const { data: importResult, error: importError } = await supabase.functions.invoke(
          'bulk-upload-companies',
          {
            body: { companies, user_id: config.user_id }
          }
        );

        if (importError) {
          console.error('❌ Erro ao importar empresas:', importError);
          throw importError;
        }

        // Atualizar última sincronização
        await supabase
          .from('google_sheets_sync_config')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', config.id);

        results.push({
          config_id: config.id,
          user_id: config.user_id,
          success: importResult?.success || 0,
          errors: importResult?.errors?.length || 0,
        });

        console.log(`✅ Sincronização concluída para config ${config.id}`);
      } catch (error) {
        console.error(`❌ Erro na sincronização config ${config.id}:`, error);
        results.push({
          config_id: config.id,
          user_id: config.user_id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Sincronização concluída',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  const invalidValues = ['não encontrado', 'nao encontrado', '---', '###', 'n/a', 'na', '', 'null', 'undefined'];
  return invalidValues.includes(str.toLowerCase()) ? '' : str;
}

function parseCSVLine(line: string, separator: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/)[0];
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  
  if (tabs > 0) return '\t';
  return semicolons > commas ? ';' : ',';
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function mapHeaders(headers: string[]): Map<string, string> {
  const mapping = new Map<string, string>();
  const normalized = headers.map(h => normalizeHeader(h));
  
  const headerMap: { [key: string]: string[] } = {
    'CNPJ': ['cnpj', 'cnpj da empresa', 'cnpj empresa'],
    'Nome da Empresa': ['nome', 'nome da empresa', 'razao social', 'empresa'],
    'Website': ['website', 'site', 'url', 'website da empresa'],
    'Instagram': ['instagram', 'insta', '@instagram'],
    'LinkedIn': ['linkedin', 'link linkedin', 'linkedin url'],
    'Produto/Categoria': ['produto', 'categoria', 'produto/categoria', 'tipo'],
    'Marca': ['marca', 'brand'],
    'Link Produto/Marketplace': ['link produto', 'marketplace', 'link'],
    'CEP': ['cep', 'codigo postal'],
    'Estado': ['estado', 'uf', 'state'],
    'Pais': ['pais', 'país', 'country'],
    'Municipio': ['municipio', 'município', 'cidade', 'city'],
    'Bairro': ['bairro', 'neighborhood'],
    'Logradouro': ['logradouro', 'endereco', 'endereço', 'rua', 'address'],
    'Numero': ['numero', 'número', 'num', 'number']
  };

  normalized.forEach((norm, idx) => {
    for (const [standard, variations] of Object.entries(headerMap)) {
      if (variations.includes(norm)) {
        mapping.set(standard, headers[idx]);
        break;
      }
    }
  });

  return mapping;
}

function parseCSV(text: string): ImportedCompany[] {
  text = text.replace(/^\uFEFF/, '');
  
  const separator = detectSeparator(text);
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('Arquivo vazio ou sem dados');
  }
  
  const headerLine = lines[0];
  const rawHeaders = parseCSVLine(headerLine, separator);
  const headerMapping = mapHeaders(rawHeaders);
  
  const rows: ImportedCompany[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    try {
      const values = parseCSVLine(line, separator);
      const row: any = {};
      
      rawHeaders.forEach((rawHeader, index) => {
        const value = normalizeValue(values[index]);
        
        for (const [standard, mapped] of headerMapping.entries()) {
          if (mapped === rawHeader) {
            row[standard] = value;
            break;
          }
        }
      });
      
      const hasIdentifier = row.CNPJ || row['Nome da Empresa'] || row.Website || 
                            row.Instagram || row.LinkedIn;
      
      if (hasIdentifier) {
        rows.push(row);
      }
    } catch (error) {
      console.warn(`Erro ao processar linha ${i + 1}:`, error);
    }
  }
  
  return rows;
}
