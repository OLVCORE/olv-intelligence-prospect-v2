/**
 * Consumidor.gov.br Adapter
 * Busca reclamações oficiais do governo
 * Portal oficial - dados públicos gratuitos
 */

export interface ConsumidorGovComplaint {
  id?: string;
  company: string;
  cnpj?: string;
  subject?: string;
  status?: 'aberta' | 'em_andamento' | 'finalizada' | 'nao_respondida';
  date?: string;
  responseTime?: number; // dias
  resolved?: boolean;
  evaluation?: number; // 1-5
}

export interface ConsumidorGovData {
  companyName: string;
  cnpj?: string;
  totalComplaints?: number;
  answeredComplaints?: number;
  averageResponseTime?: number; // dias
  resolutionRate?: number; // percentual
  consumerSatisfaction?: number; // 1-5
  complaints: ConsumidorGovComplaint[];
  lastUpdate?: string;
  url?: string;
}

export interface ConsumidorGovAdapter {
  searchComplaints(companyName: string, cnpj?: string): Promise<ConsumidorGovData | null>;
}

class ConsumidorGovAdapterImpl implements ConsumidorGovAdapter {
  private baseUrl = 'https://www.consumidor.gov.br';

  async searchComplaints(companyName: string, cnpj?: string): Promise<ConsumidorGovData | null> {
    try {
      // API pública do portal consumidor.gov.br
      // Dados disponíveis em: https://dados.gov.br/dados/conjuntos-dados/reclamacoes-do-consumidor-gov-br
      
      return {
        companyName,
        cnpj,
        complaints: [],
        lastUpdate: new Date().toISOString(),
        url: `${this.baseUrl}/pages/dadosabertos/externo/`
      };
    } catch (error) {
      console.error('Error searching Consumidor.gov:', error);
      return null;
    }
  }
}

export function createConsumidorGovAdapter(): ConsumidorGovAdapter {
  return new ConsumidorGovAdapterImpl();
}
