// Nominatim (OpenStreetMap) - Geocoding 100% GRATUITO
// Documentação: https://nominatim.org/release-docs/latest/api/Overview/
// Melhor que Mapbox: sem limites de requisições, apenas uso justo (1 req/s)

const BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'StrateVO-Intelligence/2.0';

// Cache simples para evitar requisições duplicadas
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

// Rate limiting: 1 requisição por segundo (regra do Nominatim)
let lastRequest = 0;
const MIN_INTERVAL = 1000; // 1 segundo

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequest;
  
  if (elapsed < MIN_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - elapsed));
  }
  
  lastRequest = Date.now();
}

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// TIPOS
// ============================================================================

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: string[];
  class?: string;
  type?: string;
  importance?: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
  address?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    pais?: string;
  };
  boundingbox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  raw: NominatimResult;
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Geocoding: Converte endereço em coordenadas
 * 100% gratuito, sem API key
 */
export async function geocode(query: string): Promise<GeocodeResult | null> {
  const cacheKey = `geocode:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  await rateLimit();
  
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '1',
    countrycodes: 'br', // Apenas Brasil
  });
  
  try {
    const response = await fetch(`${BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'pt-BR,pt,en',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data: NominatimResult[] = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const result = data[0];
    const geocoded: GeocodeResult = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address ? {
        logradouro: result.address.road,
        numero: result.address.house_number,
        bairro: result.address.suburb,
        cidade: result.address.city || result.address.municipality,
        estado: result.address.state,
        cep: result.address.postcode,
        pais: result.address.country,
      } : undefined,
      boundingbox: result.boundingbox ? {
        south: parseFloat(result.boundingbox[0]),
        north: parseFloat(result.boundingbox[1]),
        west: parseFloat(result.boundingbox[2]),
        east: parseFloat(result.boundingbox[3]),
      } : undefined,
      raw: result,
    };
    
    setCache(cacheKey, geocoded);
    return geocoded;
  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return null;
  }
}

/**
 * Reverse Geocoding: Converte coordenadas em endereço
 * 100% gratuito, sem API key
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> {
  const cacheKey = `reverse:${latitude},${longitude}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  await rateLimit();
  
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    format: 'json',
    addressdetails: '1',
    zoom: '18', // Mais detalhado
  });
  
  try {
    const response = await fetch(`${BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'pt-BR,pt,en',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const result: NominatimResult = await response.json();
    
    if (!result || result.error) {
      return null;
    }
    
    const geocoded: GeocodeResult = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address ? {
        logradouro: result.address.road,
        numero: result.address.house_number,
        bairro: result.address.suburb,
        cidade: result.address.city || result.address.municipality,
        estado: result.address.state,
        cep: result.address.postcode,
        pais: result.address.country,
      } : undefined,
      raw: result,
    };
    
    setCache(cacheKey, geocoded);
    return geocoded;
  } catch (error) {
    console.error('Nominatim reverse geocoding error:', error);
    return null;
  }
}

/**
 * Busca estruturada (mais precisa que busca simples)
 */
export async function geocodeStructured(params: {
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  postalcode?: string;
}): Promise<GeocodeResult | null> {
  const cacheKey = `structured:${JSON.stringify(params)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  await rateLimit();
  
  const searchParams = new URLSearchParams({
    ...(params.street && { street: params.street }),
    ...(params.city && { city: params.city }),
    ...(params.county && { county: params.county }),
    ...(params.state && { state: params.state }),
    ...(params.country && { country: params.country || 'Brasil' }),
    ...(params.postalcode && { postalcode: params.postalcode }),
    format: 'json',
    addressdetails: '1',
    limit: '1',
    countrycodes: 'br',
  });
  
  try {
    const response = await fetch(`${BASE_URL}/search?${searchParams}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'pt-BR,pt,en',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data: NominatimResult[] = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const result = data[0];
    const geocoded: GeocodeResult = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address ? {
        logradouro: result.address.road,
        numero: result.address.house_number,
        bairro: result.address.suburb,
        cidade: result.address.city || result.address.municipality,
        estado: result.address.state,
        cep: result.address.postcode,
        pais: result.address.country,
      } : undefined,
      boundingbox: result.boundingbox ? {
        south: parseFloat(result.boundingbox[0]),
        north: parseFloat(result.boundingbox[1]),
        west: parseFloat(result.boundingbox[2]),
        east: parseFloat(result.boundingbox[3]),
      } : undefined,
      raw: result,
    };
    
    setCache(cacheKey, geocoded);
    return geocoded;
  } catch (error) {
    console.error('Nominatim structured search error:', error);
    return null;
  }
}

/**
 * Geocode empresa a partir de dados completos
 */
export async function geocodeCompany(company: {
  logradouro: string;
  numero?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
}): Promise<{ lat: number; lng: number; endereco_completo: string } | null> {
  // Tenta busca estruturada primeiro (mais precisa)
  const structured = await geocodeStructured({
    street: company.numero 
      ? `${company.logradouro}, ${company.numero}`
      : company.logradouro,
    city: company.cidade,
    state: company.estado,
    country: 'Brasil',
    postalcode: company.cep,
  });
  
  if (structured) {
    return {
      lat: structured.latitude,
      lng: structured.longitude,
      endereco_completo: structured.display_name,
    };
  }
  
  // Fallback para busca simples
  const query = [
    company.logradouro,
    company.numero,
    company.bairro,
    company.cidade,
    company.estado,
    'Brasil',
  ].filter(Boolean).join(', ');
  
  const simple = await geocode(query);
  
  if (simple) {
    return {
      lat: simple.latitude,
      lng: simple.longitude,
      endereco_completo: simple.display_name,
    };
  }
  
  return null;
}

/**
 * Busca por múltiplos endereços (com rate limiting automático)
 */
export async function geocodeBatch(
  queries: string[]
): Promise<Array<GeocodeResult | null>> {
  const results: Array<GeocodeResult | null> = [];
  
  for (const query of queries) {
    const result = await geocode(query);
    results.push(result);
  }
  
  return results;
}

/**
 * Calcula distância entre dois pontos (Haversine)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { km: number; meters: number } {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  
  return {
    km: parseFloat(km.toFixed(2)),
    meters: Math.round(km * 1000),
  };
}

// ============================================================================
// SERVIÇO UNIFICADO
// ============================================================================

export class NominatimService {
  async geocode(query: string): Promise<GeocodeResult | null> {
    return await geocode(query);
  }
  
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodeResult | null> {
    return await reverseGeocode(latitude, longitude);
  }
  
  async geocodeStructured(params: {
    street?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postalcode?: string;
  }): Promise<GeocodeResult | null> {
    return await geocodeStructured(params);
  }
  
  async geocodeCompany(company: {
    logradouro: string;
    numero?: string;
    bairro?: string;
    cidade: string;
    estado: string;
    cep?: string;
  }): Promise<{ lat: number; lng: number; endereco_completo: string } | null> {
    return await geocodeCompany(company);
  }
  
  async geocodeBatch(queries: string[]): Promise<Array<GeocodeResult | null>> {
    return await geocodeBatch(queries);
  }
  
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): { km: number; meters: number } {
    return calculateDistance(lat1, lon1, lat2, lon2);
  }
  
  // Limpa o cache (útil para testes)
  clearCache() {
    cache.clear();
  }
  
  // Estatísticas do cache
  getCacheStats() {
    return {
      size: cache.size,
      entries: Array.from(cache.keys()),
    };
  }
}

// Instância singleton
let nominatimInstance: NominatimService | null = null;

export function initNominatim(): NominatimService {
  nominatimInstance = new NominatimService();
  return nominatimInstance;
}

export function getNominatim(): NominatimService {
  if (!nominatimInstance) {
    nominatimInstance = new NominatimService();
  }
  return nominatimInstance;
}

// Exportações convenientes
export default {
  geocode,
  reverseGeocode,
  geocodeStructured,
  geocodeCompany,
  geocodeBatch,
  calculateDistance,
  getNominatim,
  initNominatim,
};

