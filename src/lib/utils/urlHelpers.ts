/**
 * Valida se uma string é uma URL válida
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Remove espaços e caracteres inválidos
  const cleanUrl = url.trim();
  
  // Verifica se não é apenas texto (sem ponto de domínio)
  if (!cleanUrl.includes('.')) return false;
  
  // Verifica se não contém espaços (URLs codificadas como %20 são inválidas)
  if (cleanUrl.includes(' ') || cleanUrl.includes('%20')) return false;
  
  // Tenta criar um objeto URL para validação
  try {
    const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    return urlObj.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Formata uma URL para exibição e uso
 */
export function formatWebsiteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const cleanUrl = url.trim();
  
  // Verifica se é válida
  if (!isValidUrl(cleanUrl)) return null;
  
  // Adiciona https:// se não tiver protocolo
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return `https://${cleanUrl}`;
  }
  
  return cleanUrl;
}

/**
 * Extrai apenas o domínio de uma URL para exibição
 */
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const formattedUrl = formatWebsiteUrl(url);
    if (!formattedUrl) return null;
    
    const urlObj = new URL(formattedUrl);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}
