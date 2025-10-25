/**
 * Reclame Aqui Adapter
 * Busca reclamações e reputação de empresas
 * API gratuita via web scraping
 */

export interface ReclameAquiData {
  companyName: string;
  rating?: number;
  totalComplaints?: number;
  answeredComplaints?: number;
  resolvedComplaints?: number;
  responseRate?: number;
  backToShopIndex?: number;
  reputationBadge?: 'excelente' | 'boa' | 'regular' | 'ruim' | 'nao-recomendada';
  url?: string;
}

export interface ReclameAquiAdapter {
  searchCompany(companyName: string, cnpj?: string): Promise<ReclameAquiData | null>;
}

class ReclameAquiAdapterImpl implements ReclameAquiAdapter {
  private baseUrl = 'https://www.reclameaqui.com.br';

  async searchCompany(companyName: string, cnpj?: string): Promise<ReclameAquiData | null> {
    try {
      // Busca via Serper (Google Search) para encontrar página da empresa
      const searchQuery = cnpj 
        ? `site:reclameaqui.com.br ${companyName} CNPJ ${cnpj}`
        : `site:reclameaqui.com.br ${companyName}`;

      // Retorna estrutura base - a busca real será feita via edge function
      return {
        companyName,
        url: `${this.baseUrl}/busca/?q=${encodeURIComponent(companyName)}`
      };
    } catch (error) {
      console.error('Error searching ReclameAqui:', error);
      return null;
    }
  }
}

export function createReclameAquiAdapter(): ReclameAquiAdapter {
  return new ReclameAquiAdapterImpl();
}
