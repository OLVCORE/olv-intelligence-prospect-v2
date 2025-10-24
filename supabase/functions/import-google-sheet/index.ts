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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL inválida' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // Service role para permitir inserções/updates via função bulk
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Converter para URL de export CSV
    let csvUrl = url;
    if (csvUrl.includes('/edit')) {
      csvUrl = csvUrl.replace('/edit', '/export?format=csv');
    } else if (!csvUrl.includes('/export')) {
      csvUrl = csvUrl + '/export?format=csv';
    }

    console.log('📥 Baixando CSV do Google Sheets (server-side)');
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Não foi possível acessar a planilha: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const companies = parseCSV(csvText);

    if (companies.length === 0) {
      return new Response(JSON.stringify({ success: 0, errors: ['Planilha sem empresas válidas'] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (companies.length > 1000) {
      return new Response(JSON.stringify({ error: 'Limite de 1000 empresas por importação' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Repassa para o importador em lote já existente
    const { data, error } = await supabase.functions.invoke('bulk-upload-companies', {
      body: { companies }
    });

    if (error) {
      console.error('❌ Erro ao invocar bulk-upload-companies:', error);
      throw error;
    }

    return new Response(JSON.stringify(data ?? { success: 0, errors: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Erro geral import-google-sheet:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// ===== Helpers (copiados da função de auto-sync para manter compatibilidade) =====
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
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const rawHeaders = parseCSVLine(headerLine, separator);
  const headerMapping = mapHeaders(rawHeaders);

  const rows: ImportedCompany[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], separator);
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

    const hasIdentifier = row.CNPJ || row['Nome da Empresa'] || row.Website || row.Instagram || row.LinkedIn;
    if (hasIdentifier) rows.push(row);
  }
  return rows;
}
