// ✅ Adapter EmpresaQui.com.br - Fonte primária ilimitada
export interface EmpresaQuiCompany {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  natureza_juridica?: string;
  data_abertura?: string;
  situacao_cadastral?: string;
  porte?: string;
  capital_social?: string;
  
  // Endereço
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  
  // CNAEs
  cnae_principal?: {
    codigo: string;
    descricao: string;
  };
  cnaes_secundarios?: Array<{
    codigo: string;
    descricao: string;
  }>;
  
  // Contatos
  telefones?: string[];
  emails?: string[];
  website?: string;
  
  // Dados financeiros
  faturamento_presumido?: number;
  funcionarios_presumido?: number;
  
  // Sócios
  socios?: Array<{
    nome: string;
    cpf_cnpj?: string;
    qualificacao?: string;
    data_entrada?: string;
  }>;
}

export interface EmpresaQuiSearchParams {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cidade?: string;
  uf?: string;
  cnae?: string;
  porte?: 'ME' | 'EPP' | 'MEDIA' | 'GRANDE';
  situacao?: 'ATIVA' | 'INATIVA' | 'SUSPENSA';
  limit?: number;
}

export interface EmpresaQuiAdapter {
  searchCompany(params: EmpresaQuiSearchParams): Promise<EmpresaQuiCompany[]>;
  getCompanyByCNPJ(cnpj: string): Promise<EmpresaQuiCompany | null>;
  enrichCompany(cnpj: string): Promise<EmpresaQuiCompany | null>;
}

class EmpresaQuiAdapterImpl implements EmpresaQuiAdapter {
  private apiKey: string;
  private baseUrl = 'https://api.empresaqui.com.br/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchCompany(params: EmpresaQuiSearchParams): Promise<EmpresaQuiCompany[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.cnpj) queryParams.append('cnpj', params.cnpj);
      if (params.razao_social) queryParams.append('razao_social', params.razao_social);
      if (params.nome_fantasia) queryParams.append('nome_fantasia', params.nome_fantasia);
      if (params.cidade) queryParams.append('cidade', params.cidade);
      if (params.uf) queryParams.append('uf', params.uf);
      if (params.cnae) queryParams.append('cnae', params.cnae);
      if (params.porte) queryParams.append('porte', params.porte);
      if (params.situacao) queryParams.append('situacao', params.situacao);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}/empresas/busca?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[EmpresaQui] Search error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('[EmpresaQui] ✅ Empresas encontradas:', data.empresas?.length || 0);
      return data.empresas || [];
    } catch (error) {
      console.error('[EmpresaQui] Erro na busca:', error);
      return [];
    }
  }

  async getCompanyByCNPJ(cnpj: string): Promise<EmpresaQuiCompany | null> {
    try {
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      
      const response = await fetch(`${this.baseUrl}/empresas/${cleanCNPJ}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[EmpresaQui] Company fetch error:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[EmpresaQui] ✅ Empresa encontrada:', data.razao_social);
      return data;
    } catch (error) {
      console.error('[EmpresaQui] Erro ao buscar empresa:', error);
      return null;
    }
  }

  async enrichCompany(cnpj: string): Promise<EmpresaQuiCompany | null> {
    try {
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      
      const response = await fetch(`${this.baseUrl}/empresas/${cleanCNPJ}/completo`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[EmpresaQui] Enrichment error:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[EmpresaQui] ✅ Enriquecimento completo:', data.razao_social);
      return data;
    } catch (error) {
      console.error('[EmpresaQui] Erro no enriquecimento:', error);
      return null;
    }
  }
}

export function createEmpresaQuiAdapter(apiKey: string): EmpresaQuiAdapter {
  return new EmpresaQuiAdapterImpl(apiKey);
}
