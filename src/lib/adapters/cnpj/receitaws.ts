// ✅ Adapter ReceitaWS - Dados cadastrais BR
export interface ReceitaWSCompanyData {
  cnpj: string;
  nome: string;
  fantasia?: string;
  email?: string;
  telefone?: string;
  atividade_principal?: Array<{ code: string; text: string }>;
  situacao: string;
  data_situacao: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  capital_social?: string;
  qsa?: Array<{ nome: string; qual: string }>;
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
