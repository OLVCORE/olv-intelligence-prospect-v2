// ✅ Adapter ReceitaWS - Dados cadastrais BR (COMPLETO)
export interface ReceitaWSCompanyData {
  status: string;
  ultima_atualizacao?: string;
  cnpj: string;
  tipo?: string; // MATRIZ, FILIAL
  porte?: string;
  nome: string;
  fantasia?: string;
  abertura?: string;
  atividade_principal?: Array<{ code: string; text: string }>;
  atividades_secundarias?: Array<{ code: string; text: string }>;
  natureza_juridica?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  email?: string;
  telefone?: string;
  efr?: string;
  situacao: string;
  data_situacao: string;
  motivo_situacao?: string;
  situacao_especial?: string;
  data_situacao_especial?: string;
  capital_social?: string;
  qsa?: Array<{ 
    nome: string; 
    qual: string;
    pais_origem?: string;
    nome_rep_legal?: string;
    qual_rep_legal?: string;
  }>;
  simples?: {
    optante: boolean;
    data_opcao?: string;
    data_exclusao?: string;
    ultima_atualizacao?: string;
  };
  simei?: {
    optante: boolean;
    data_opcao?: string;
    data_exclusao?: string;
    ultima_atualizacao?: string;
  };
  billing?: {
    free: boolean;
    database: boolean;
  };
}

export interface ReceitaWSAdapter {
  fetchCompanyData(cnpj: string): Promise<ReceitaWSCompanyData | null>;
}

class ReceitaWSAdapterImpl implements ReceitaWSAdapter {
  private apiToken: string;
  private baseUrl = 'https://www.receitaws.com.br/v1/cnpj';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async fetchCompanyData(cnpj: string): Promise<ReceitaWSCompanyData | null> {
    try {
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      
      if (cleanCNPJ.length !== 14) {
        console.error('[ReceitaWS] CNPJ inválido:', cnpj);
        return null;
      }

      const response = await fetch(`${this.baseUrl}/${cleanCNPJ}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        console.error('[ReceitaWS] HTTP Error:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'ERROR') {
        console.error('[ReceitaWS] API Error:', data.message);
        return null;
      }

      console.log('[ReceitaWS] ✅ Dados obtidos:', data.nome);
      return data as ReceitaWSCompanyData;
    } catch (error) {
      console.error('[ReceitaWS] Erro na requisição:', error);
      return null;
    }
  }
}

export function createReceitaWSAdapter(apiToken: string): ReceitaWSAdapter {
  return new ReceitaWSAdapterImpl(apiToken);
}
