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

import { supabase } from '@/integrations/supabase/client';

class GoogleSearchAdapterImpl implements GoogleSearchAdapter {
  constructor(private apiKey: string, private searchEngineId: string) {}

  async search(query: string, options: GoogleSearchOptions = {}): Promise<GoogleSearchResponse | null> {
    try {
      const { data, error } = await supabase.functions.invoke('google-search', {
        body: {
          query,
          type: 'web',
          options: {
            numResults: options.numResults || 10,
            language: options.language,
            dateRestrict: options.dateRestrict,
            siteSearch: options.siteSearch,
            exactTerms: options.exactTerms,
          }
        }
      });

      if (error) {
        console.error('[Google CSE] Search error via function:', error);
        return null;
      }

      return (data as GoogleSearchResponse) || null;
    } catch (error) {
      console.error('[Google CSE] Erro na busca:', error);
      return null;
    }
  }

  async searchNews(query: string): Promise<GoogleSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('google-search', {
        body: { query, type: 'news' }
      });
      if (error) {
        console.error('[Google CSE] News search error via function:', error);
        return [];
      }
      return (data?.items || []) as GoogleSearchResult[];
    } catch (error) {
      console.error('[Google CSE] Erro na busca de notícias:', error);
      return [];
    }
  }

  async searchSocial(companyName: string, platform?: string): Promise<GoogleSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('google-search', {
        body: { query: companyName, type: 'social', options: { platform } }
      });
      if (error) {
        console.error('[Google CSE] Social search error via function:', error);
        return [];
      }
      return (data?.items || []) as GoogleSearchResult[];
    } catch (error) {
      console.error('[Google CSE] Erro na busca social:', error);
      return [];
    }
  }
}

export function createGoogleSearchAdapter(apiKey: string, searchEngineId: string): GoogleSearchAdapter {
  return new GoogleSearchAdapterImpl(apiKey, searchEngineId);
}
