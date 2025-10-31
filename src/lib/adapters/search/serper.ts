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
  constructor(_apiKey?: string) {}

  async search(query: string, numResults: number = 10): Promise<SerperSearchResponse | null> {
    try {
      const { data, error } = await (await import('@/integrations/supabase/client')).supabase.functions.invoke('serper-search', {
        body: { type: 'search', query, numResults }
      });
      if (error) {
        console.error('[Serper] Search error via function:', error);
        return null;
      }
      return data as SerperSearchResponse;
    } catch (error) {
      console.error('[Serper] Erro na busca:', error);
      return null;
    }
  }

  async searchNews(query: string, numResults: number = 10): Promise<SerperNewsResult[]> {
    try {
      const { data, error } = await (await import('@/integrations/supabase/client')).supabase.functions.invoke('serper-search', {
        body: { type: 'news', query, numResults }
      });
      if (error) {
        console.error('[Serper] News search error via function:', error);
        return [];
      }
      const res = data as { news?: SerperNewsResult[] };
      return res.news || [];
    } catch (error) {
      console.error('[Serper] Erro na busca de notícias:', error);
      return [];
    }
  }
}

export function createSerperAdapter(apiKey: string): SerperAdapter {
  return new SerperAdapterImpl(apiKey);
}
