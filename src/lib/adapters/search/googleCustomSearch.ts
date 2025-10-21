// ✅ Adapter Google Custom Search Engine - Busca avançada na web
export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  htmlSnippet?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
    cse_image?: Array<{ src: string }>;
  };
}

export interface GoogleSearchResponse {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
    }>;
    nextPage?: Array<{
      title: string;
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
    }>;
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: GoogleSearchResult[];
}

export interface GoogleSearchAdapter {
  search(query: string, options?: GoogleSearchOptions): Promise<GoogleSearchResponse | null>;
  searchNews(query: string): Promise<GoogleSearchResult[]>;
  searchSocial(companyName: string, platform?: string): Promise<GoogleSearchResult[]>;
}

export interface GoogleSearchOptions {
  numResults?: number;
  language?: string;
  dateRestrict?: string; // e.g., 'd7' for last 7 days, 'm1' for last month
  siteSearch?: string; // restrict to specific domain
  exactTerms?: string; // exact phrase to match
}

class GoogleSearchAdapterImpl implements GoogleSearchAdapter {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async search(query: string, options: GoogleSearchOptions = {}): Promise<GoogleSearchResponse | null> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query,
        num: (options.numResults || 10).toString(),
        ...(options.language && { lr: `lang_${options.language}` }),
        ...(options.dateRestrict && { dateRestrict: options.dateRestrict }),
        ...(options.siteSearch && { siteSearch: options.siteSearch }),
        ...(options.exactTerms && { exactTerms: options.exactTerms }),
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        console.error('[Google CSE] Search error:', response.status);
        return null;
      }

      const result = await response.json() as GoogleSearchResponse;
      console.log('[Google CSE] ✅ Search completed:', result.searchInformation);
      return result;
    } catch (error) {
      console.error('[Google CSE] Erro na busca:', error);
      return null;
    }
  }

  async searchNews(query: string): Promise<GoogleSearchResult[]> {
    try {
      // Buscar em sites de notícias brasileiros e internacionais
      const newsSites = [
        'g1.globo.com',
        'folha.uol.com.br',
        'estadao.com.br',
        'valor.com.br',
        'exame.com',
        'infomoney.com.br'
      ];

      const siteQuery = newsSites.map(site => `site:${site}`).join(' OR ');
      const fullQuery = `${query} (${siteQuery})`;

      const response = await this.search(fullQuery, {
        numResults: 10,
        language: 'pt',
        dateRestrict: 'm6' // últimos 6 meses
      });

      return response?.items || [];
    } catch (error) {
      console.error('[Google CSE] Erro na busca de notícias:', error);
      return [];
    }
  }

  async searchSocial(companyName: string, platform?: string): Promise<GoogleSearchResult[]> {
    try {
      let siteQuery = '';
      
      if (platform) {
        const platformDomains: Record<string, string> = {
          linkedin: 'linkedin.com',
          facebook: 'facebook.com',
          instagram: 'instagram.com',
          twitter: 'twitter.com',
          youtube: 'youtube.com'
        };
        siteQuery = `site:${platformDomains[platform.toLowerCase()]}`;
      } else {
        // Buscar em todas as redes sociais
        siteQuery = 'site:linkedin.com OR site:facebook.com OR site:instagram.com OR site:twitter.com OR site:youtube.com';
      }

      const query = `"${companyName}" ${siteQuery}`;
      const response = await this.search(query, {
        numResults: 5,
        language: 'pt'
      });

      return response?.items || [];
    } catch (error) {
      console.error('[Google CSE] Erro na busca social:', error);
      return [];
    }
  }
}

export function createGoogleSearchAdapter(apiKey: string, searchEngineId: string): GoogleSearchAdapter {
  return new GoogleSearchAdapterImpl(apiKey, searchEngineId);
}
