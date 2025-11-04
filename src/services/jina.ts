/**
 * Jina AI - Reader API
 * Scraping de páginas web com clean markdown
 * Docs: https://jina.ai/reader/
 */

const JINA_API_KEY = import.meta.env.VITE_JINA_API_KEY;
const JINA_READER_URL = 'https://r.jina.ai';

export interface JinaScrapedData {
  content: string;
  title: string;
  url: string;
  companies?: string[];
  success: boolean;
}

/**
 * Scraping de URL com Jina AI
 */
export async function scrapeWithJina(url: string): Promise<JinaScrapedData> {
  try {
    console.log('[JINA] Scraping:', url);

    const response = await fetch(`${JINA_READER_URL}/${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Accept': 'application/json',
        'X-Return-Format': 'markdown'
      }
    });

    if (!response.ok) {
      throw new Error(`Jina API falhou: ${response.status}`);
    }

    const data = await response.json();
    const content = data.data?.content || '';
    const title = data.data?.title || '';

    console.log('[JINA] Sucesso:', url, '- Content length:', content.length);

    // Extrair nomes de empresas do conteúdo
    const companies = extractCompanyNames(content);

    return {
      content,
      title,
      url,
      companies,
      success: true
    };
  } catch (error) {
    console.error('[JINA] Erro:', error);
    return {
      content: '',
      title: '',
      url,
      companies: [],
      success: false
    };
  }
}

/**
 * Extrair nomes de empresas do texto
 * Busca por padrões como:
 * - "Cliente: Empresa XYZ"
 * - "Empresa XYZ Ltda"
 * - "XYZ S.A."
 */
function extractCompanyNames(text: string): string[] {
  const companies: Set<string> = new Set();

  // Padrões de empresas brasileiras
  const patterns = [
    // Ltda, S.A., EIRELI, etc
    /([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ][a-zàáâãäåèéêëìíîïòóôõöùúûüç\s]+(?:Ltda|S\.A\.|EIRELI|ME|EPP|Comércio|Indústria|Serviços)\.?)/g,
    // Nomes próprios seguidos de empresa/companhia/group
    /([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ][a-zàáâãäåèéêëìíîïòóôõöùúûüç\s]+(?:Empresa|Companhia|Group|Grupo|Corporation))/g,
    // Cliente: ou Case:
    /(?:Cliente|Case|Parceiro):\s*([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ][a-zàáâãäåèéêëìíîïòóôõöùúûüç\s]+)/g
  ];

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const company = match[1]?.trim();
      if (company && company.length > 3 && company.length < 100) {
        companies.add(company);
      }
    }
  });

  return Array.from(companies);
}

/**
 * Scraping de múltiplas URLs em paralelo
 */
export async function scrapeMultipleWithJina(urls: string[]): Promise<JinaScrapedData[]> {
  console.log('[JINA] Scraping múltiplas URLs:', urls.length);

  const promises = urls.map(url => scrapeWithJina(url));
  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error('[JINA] Erro na URL:', urls[index], result.reason);
      return {
        content: '',
        title: '',
        url: urls[index],
        companies: [],
        success: false
      };
    }
  });
}

/**
 * Scraping de páginas de clientes comuns
 */
export async function scrapeClientPages(domain: string): Promise<string[]> {
  const clientPages = [
    '/clientes',
    '/clientes-e-cases',
    '/cases',
    '/portfolio',
    '/parceiros',
    '/cases-de-sucesso',
    '/nossos-clientes'
  ];

  const urls = clientPages.map(page => `https://${domain}${page}`);
  const results = await scrapeMultipleWithJina(urls);

  // Consolidar empresas encontradas
  const allCompanies = new Set<string>();
  
  results.forEach(result => {
    if (result.success && result.companies) {
      result.companies.forEach(company => allCompanies.add(company));
    }
  });

  return Array.from(allCompanies);
}
