// ✅ Sistema de cache para APIs externas

import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, entry);
    logger.debug('CACHE', `Set: ${key}`, { ttl: entry.ttl });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug('CACHE', `Miss: ${key}`);
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      logger.debug('CACHE', `Expired: ${key}`);
      return null;
    }

    logger.debug('CACHE', `Hit: ${key}`);
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    logger.debug('CACHE', `Deleted: ${key}`);
  }

  clear(): void {
    this.cache.clear();
    logger.info('CACHE', 'Cache cleared');
  }

  // Helper para cache de APIs externas
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Verificar cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Buscar dados
    const startTime = Date.now();
    try {
      const data = await fetcher();
      const duration = Date.now() - startTime;
      
      this.set(key, data, ttl);
      logger.info('CACHE', `Fetched and cached: ${key}`, { duration });
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('CACHE', `Failed to fetch: ${key}`, { error, duration });
      throw error;
    }
  }

  // Estatísticas de cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cache = new CacheManager();

// Keys específicas para diferentes APIs
export const CacheKeys = {
  receitaws: (cnpj: string) => `receitaws:${cnpj}`,
  apollo: (query: string) => `apollo:${query}`,
  serper: (query: string) => `serper:${query}`,
  hunter: (domain: string, name: string) => `hunter:${domain}:${name}`,
  phantom: (url: string) => `phantom:${url}`,
  companySearch: (query: string) => `company:search:${query}`,
  totvsAnalysis: (companyId: string) => `totvs:analysis:${companyId}`
};
