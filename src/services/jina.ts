/**
 * Jina AI - Serviço de Web Scraping
 * https://jina.ai/
 */

const JINA_API_KEY = import.meta.env.VITE_JINA_API_KEY;

export interface JinaScrapedContent {
  url: string;
  content: string;
  title?: string;
  success: boolean;
  error?: string;
}

/**
 * Scrape de uma URL usando Jina AI Reader
 */
export async function scrapeWebpage(url: string): Promise<JinaScrapedContent> {
  try {
    console.log('[JINA] Scraping:', url);

    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Accept': 'application/json',
        'X-Return-Format': 'text'
      }
    });

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`);
    }

    const content = await response.text();

    console.log('[JINA] Sucesso:', url, content.length, 'chars');

    return {
      url,
      content,
      success: true
    };

  } catch (error) {
    console.error('[JINA] Erro:', url, error);
    return {
      url,
      content: '',
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Scrape múltiplas URLs em paralelo
 */
export async function scrapeMultiplePages(urls: string[]): Promise<JinaScrapedContent[]> {
  console.log('[JINA] Scraping', urls.length, 'páginas em paralelo');

  const results = await Promise.all(
    urls.map(url => scrapeWebpage(url))
  );

  const successful = results.filter(r => r.success).length;
  console.log('[JINA] Completado:', successful, '/', urls.length, 'páginas');

  return results;
}

/**
 * Extrair nomes de empresas de um texto
 */
export function extractCompanyNames(content: string): string[] {
  const companies: Set<string> = new Set();

  // Regex para encontrar nomes de empresas (simplificado)
  // Padrão: Palavras capitalizadas seguidas de LTDA, SA, S/A, etc
  const patterns = [
    /([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})\s+(?:LTDA|S\.A\.|S\/A|SA|EPP|ME|EIRELI)/gi,
    /([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})\s+-\s+Cliente/gi,
    /Cliente:\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})/gi,
    /Case\s+(?:Study|de\s+Sucesso):\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,5})/gi
  ];

  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        companies.add(match[1].trim());
      }
    }
  });

  return Array.from(companies);
}

/**
 * Validar se uma string parece ser um nome de empresa
 */
export function isValidCompanyName(name: string): boolean {
  // Mínimo 3 caracteres
  if (name.length < 3) return false;

  // Não pode ser apenas números
  if (/^\d+$/.test(name)) return false;

  // Deve ter pelo menos uma letra
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) return false;

  // Remover palavras comuns que não são empresas
  const invalidWords = [
    'página', 'site', 'web', 'internet', 'online', 'digital',
    'contato', 'telefone', 'email', 'endereço', 'localização'
  ];

  const nameLower = name.toLowerCase();
  if (invalidWords.some(word => nameLower.includes(word))) {
    return false;
  }

  return true;
}

