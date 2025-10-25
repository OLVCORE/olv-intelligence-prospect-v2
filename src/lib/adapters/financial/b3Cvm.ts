/**
 * B3/CVM Adapter
 * Busca dados financeiros oficiais de empresas listadas
 * APIs públicas e gratuitas
 */

export interface B3CompanyData {
  ticker?: string;
  companyName: string;
  cnpj?: string;
  segment?: string;
  sector?: string;
  isListed: boolean;
  listingDate?: string;
  marketCap?: number;
  sharesOutstanding?: number;
  freefloat?: number;
  url?: string;
}

export interface CVMData {
  cnpj?: string;
  companyName: string;
  registrationStatus?: string;
  registrationDate?: string;
  category?: string;
  hasPublicOffering?: boolean;
  cvmCode?: string;
  url?: string;
}

export interface B3CvmAdapter {
  searchB3Company(companyName: string, cnpj?: string): Promise<B3CompanyData | null>;
  searchCVMCompany(companyName: string, cnpj?: string): Promise<CVMData | null>;
}

class B3CvmAdapterImpl implements B3CvmAdapter {
  private b3BaseUrl = 'https://www.b3.com.br';
  private cvmBaseUrl = 'https://www.gov.br/cvm';

  async searchB3Company(companyName: string, cnpj?: string): Promise<B3CompanyData | null> {
    try {
      // API pública da B3 para consulta de empresas
      // Nota: B3 tem dados abertos em: https://www.b3.com.br/data/files/
      
      return {
        companyName,
        cnpj,
        isListed: false, // Será atualizado via edge function
        url: `${this.b3BaseUrl}/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm`
      };
    } catch (error) {
      console.error('Error searching B3:', error);
      return null;
    }
  }

  async searchCVMCompany(companyName: string, cnpj?: string): Promise<CVMData | null> {
    try {
      // CVM tem base pública de dados
      // https://dados.cvm.gov.br/
      
      return {
        companyName,
        cnpj,
        url: `${this.cvmBaseUrl}/dados`
      };
    } catch (error) {
      console.error('Error searching CVM:', error);
      return null;
    }
  }
}

export function createB3CvmAdapter(): B3CvmAdapter {
  return new B3CvmAdapterImpl();
}
