// ✅ Adapter Serper - Google Search API para análise de maturidade digital
export interface SerperSearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

export interface SerperNewsResult {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  imageUrl?: string;
}

export interface SerperSearchResponse {
  searchParameters: {
    q: string;
    type: string;
    num: number;
  };
  organic: SerperSearchResult[];
  news?: SerperNewsResult[];
  knowledgeGraph?: {
    title: string;
    type: string;
    description: string;
    website?: string;
  };
}

export interface SerperAdapter {
  search(query: string, numResults?: number): Promise<SerperSearchResponse | null>;
  searchNews(query: string, numResults?: number): Promise<SerperNewsResult[]>;
}

class SerperAdapterImpl implements SerperAdapter {
  private apiKey: string;
  private baseUrl = 'https://google.serper.dev';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, numResults: number = 10): Promise<SerperSearchResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          num: numResults
        })
      });

      if (!response.ok) {
        console.error('[Serper] Search error:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[Serper] ✅ Busca concluída:', data.organic?.length || 0, 'resultados');
      return data as SerperSearchResponse;
    } catch (error) {
      console.error('[Serper] Erro na busca:', error);
      return null;
    }
  }

  async searchNews(query: string, numResults: number = 10): Promise<SerperNewsResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/news`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          num: numResults
        })
      });

      if (!response.ok) {
        console.error('[Serper] News search error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('[Serper] ✅ Notícias encontradas:', data.news?.length || 0);
      return data.news || [];
    } catch (error) {
      console.error('[Serper] Erro na busca de notícias:', error);
      return [];
    }
  }
}

export function createSerperAdapter(apiKey: string): SerperAdapter {
  return new SerperAdapterImpl(apiKey);
}
