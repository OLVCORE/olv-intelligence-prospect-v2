// Serviço Unificado de Geocoding
// Estratégia: Nominatim (gratuito) → Mapbox (fallback)

import { getNominatim, GeocodeResult as NominatimResult } from './nominatim';
import { getMapbox } from './mapbox';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  endereco_completo: string;
  endereco_estruturado?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    pais?: string;
  };
  fonte: 'nominatim' | 'mapbox';
  confianca?: number;
  raw?: any;
}

export interface ReverseGeocodingResult {
  endereco_completo: string;
  endereco_estruturado?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  fonte: 'nominatim' | 'mapbox';
}

// ============================================================================
// GEOCODING (Endereço → Coordenadas)
// ============================================================================

/**
 * Geocoding com fallback automático
 * 1ª tentativa: Nominatim (gratuito, sem limites)
 * 2ª tentativa: Mapbox (50k requisições/mês)
 */
export async function geocodeWithFallback(
  endereco: string
): Promise<GeocodingResult | null> {
  // Tenta Nominatim primeiro (100% gratuito)
  console.log('🔍 Tentando Nominatim...');
  
  try {
    const nominatim = getNominatim();
    const result = await nominatim.geocode(endereco);
    
    if (result) {
      console.log('✅ Nominatim: sucesso!');
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        endereco_completo: result.display_name,
        endereco_estruturado: result.address,
        fonte: 'nominatim',
        raw: result.raw,
      };
    }
  } catch (error) {
    console.warn('⚠️  Nominatim falhou:', error);
  }
  
  // Fallback para Mapbox
  console.log('🔄 Fallback para Mapbox...');
  
  try {
    const mapbox = getMapbox();
    const result = await mapbox.geocode(endereco);
    
    if (result) {
      console.log('✅ Mapbox: sucesso!');
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        endereco_completo: result.place_name,
        fonte: 'mapbox',
        raw: result,
      };
    }
  } catch (error) {
    console.warn('⚠️  Mapbox falhou:', error);
  }
  
  console.log('❌ Ambos falharam');
  return null;
}

/**
 * Geocoding estruturado (mais preciso)
 * 1ª tentativa: Nominatim
 * 2ª tentativa: Mapbox (construindo query)
 */
export async function geocodeStructuredWithFallback(params: {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}): Promise<GeocodingResult | null> {
  // Tenta Nominatim estruturado primeiro
  console.log('🔍 Tentando Nominatim (estruturado)...');
  
  try {
    const nominatim = getNominatim();
    const result = await nominatim.geocodeStructured({
      street: params.numero 
        ? `${params.logradouro}, ${params.numero}`
        : params.logradouro,
      city: params.cidade,
      state: params.estado,
      country: 'Brasil',
      postalcode: params.cep,
    });
    
    if (result) {
      console.log('✅ Nominatim: sucesso!');
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        endereco_completo: result.display_name,
        endereco_estruturado: result.address,
        fonte: 'nominatim',
        raw: result.raw,
      };
    }
  } catch (error) {
    console.warn('⚠️  Nominatim falhou:', error);
  }
  
  // Fallback para Mapbox (constrói query)
  console.log('🔄 Fallback para Mapbox...');
  
  const query = [
    params.logradouro,
    params.numero,
    params.bairro,
    params.cidade,
    params.estado,
    'Brasil',
  ].filter(Boolean).join(', ');
  
  return await geocodeWithFallback(query);
}

/**
 * Geocode empresa completo
 */
export async function geocodeEmpresa(empresa: {
  logradouro: string;
  numero?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
}): Promise<GeocodingResult | null> {
  // Tenta Nominatim estruturado
  try {
    const nominatim = getNominatim();
    const result = await nominatim.geocodeCompany(empresa);
    
    if (result) {
      console.log('✅ Empresa geocodificada (Nominatim)');
      return {
        latitude: result.lat,
        longitude: result.lng,
        endereco_completo: result.endereco_completo,
        fonte: 'nominatim',
      };
    }
  } catch (error) {
    console.warn('⚠️  Nominatim falhou:', error);
  }
  
  // Fallback para Mapbox
  try {
    const mapbox = getMapbox();
    const result = await mapbox.geocodeCompany(empresa);
    
    if (result) {
      console.log('✅ Empresa geocodificada (Mapbox)');
      return {
        latitude: result.lat,
        longitude: result.lng,
        endereco_completo: `${empresa.logradouro}, ${empresa.numero} - ${empresa.cidade}/${empresa.estado}`,
        fonte: 'mapbox',
      };
    }
  } catch (error) {
    console.warn('⚠️  Mapbox falhou:', error);
  }
  
  return null;
}

// ============================================================================
// REVERSE GEOCODING (Coordenadas → Endereço)
// ============================================================================

/**
 * Reverse geocoding com fallback
 */
export async function reverseGeocodeWithFallback(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodingResult | null> {
  // Tenta Nominatim primeiro
  console.log('🔍 Tentando Nominatim (reverse)...');
  
  try {
    const nominatim = getNominatim();
    const result = await nominatim.reverseGeocode(latitude, longitude);
    
    if (result) {
      console.log('✅ Nominatim: sucesso!');
      return {
        endereco_completo: result.display_name,
        endereco_estruturado: result.address,
        fonte: 'nominatim',
      };
    }
  } catch (error) {
    console.warn('⚠️  Nominatim falhou:', error);
  }
  
  // Fallback para Mapbox
  console.log('🔄 Fallback para Mapbox...');
  
  try {
    const mapbox = getMapbox();
    const result = await mapbox.reverseGeocode(longitude, latitude);
    
    if (result) {
      console.log('✅ Mapbox: sucesso!');
      return {
        endereco_completo: result.place_name,
        fonte: 'mapbox',
      };
    }
  } catch (error) {
    console.warn('⚠️  Mapbox falhou:', error);
  }
  
  return null;
}

// ============================================================================
// BATCH GEOCODING (Múltiplos endereços)
// ============================================================================

/**
 * Geocode múltiplos endereços com fallback
 */
export async function geocodeBatch(
  enderecos: string[]
): Promise<Array<GeocodingResult | null>> {
  const results: Array<GeocodingResult | null> = [];
  
  for (const endereco of enderecos) {
    const result = await geocodeWithFallback(endereco);
    results.push(result);
  }
  
  return results;
}

/**
 * Geocode múltiplas empresas
 */
export async function geocodeEmpresas(
  empresas: Array<{
    logradouro: string;
    numero?: string;
    bairro?: string;
    cidade: string;
    estado: string;
    cep?: string;
  }>
): Promise<Array<GeocodingResult | null>> {
  const results: Array<GeocodingResult | null> = [];
  
  for (const empresa of empresas) {
    const result = await geocodeEmpresa(empresa);
    results.push(result);
  }
  
  return results;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Calcula distância entre dois pontos
 */
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { km: number; metros: number; tempo_carro_min: number } {
  const nominatim = getNominatim();
  const dist = nominatim.calculateDistance(lat1, lon1, lat2, lon2);
  
  // Estima tempo de carro (50 km/h média urbana)
  const tempo_carro_min = Math.round((dist.km / 50) * 60);
  
  return {
    km: dist.km,
    metros: dist.meters,
    tempo_carro_min,
  };
}

/**
 * Valida se um endereço pode ser geocodificado
 */
export async function validarEndereco(
  endereco: string
): Promise<{
  valido: boolean;
  coordenadas?: { lat: number; lng: number };
  fonte?: string;
  mensagem: string;
}> {
  const result = await geocodeWithFallback(endereco);
  
  if (result) {
    return {
      valido: true,
      coordenadas: {
        lat: result.latitude,
        lng: result.longitude,
      },
      fonte: result.fonte,
      mensagem: `Endereço validado via ${result.fonte}`,
    };
  }
  
  return {
    valido: false,
    mensagem: 'Endereço não encontrado',
  };
}

// ============================================================================
// SERVIÇO UNIFICADO
// ============================================================================

export class GeocodingService {
  async geocode(endereco: string): Promise<GeocodingResult | null> {
    return await geocodeWithFallback(endereco);
  }
  
  async geocodeStructured(params: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  }): Promise<GeocodingResult | null> {
    return await geocodeStructuredWithFallback(params);
  }
  
  async geocodeEmpresa(empresa: {
    logradouro: string;
    numero?: string;
    bairro?: string;
    cidade: string;
    estado: string;
    cep?: string;
  }): Promise<GeocodingResult | null> {
    return await geocodeEmpresa(empresa);
  }
  
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodingResult | null> {
    return await reverseGeocodeWithFallback(latitude, longitude);
  }
  
  async geocodeBatch(enderecos: string[]): Promise<Array<GeocodingResult | null>> {
    return await geocodeBatch(enderecos);
  }
  
  async geocodeEmpresas(
    empresas: Array<{
      logradouro: string;
      numero?: string;
      bairro?: string;
      cidade: string;
      estado: string;
      cep?: string;
    }>
  ): Promise<Array<GeocodingResult | null>> {
    return await geocodeEmpresas(empresas);
  }
  
  calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): { km: number; metros: number; tempo_carro_min: number } {
    return calcularDistancia(lat1, lon1, lat2, lon2);
  }
  
  async validarEndereco(endereco: string): Promise<{
    valido: boolean;
    coordenadas?: { lat: number; lng: number };
    fonte?: string;
    mensagem: string;
  }> {
    return await validarEndereco(endereco);
  }
}

// Instância singleton
let geocodingInstance: GeocodingService | null = null;

export function initGeocoding(): GeocodingService {
  geocodingInstance = new GeocodingService();
  return geocodingInstance;
}

export function getGeocoding(): GeocodingService {
  if (!geocodingInstance) {
    geocodingInstance = new GeocodingService();
  }
  return geocodingInstance;
}

// Exportações convenientes
export default {
  geocodeWithFallback,
  geocodeStructuredWithFallback,
  geocodeEmpresa,
  reverseGeocodeWithFallback,
  geocodeBatch,
  geocodeEmpresas,
  calcularDistancia,
  validarEndereco,
  getGeocoding,
  initGeocoding,
};

