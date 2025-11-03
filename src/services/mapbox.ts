// Mapbox GL JS - Mapas interativos para Stratevo Intelligence
// Documentação: https://docs.mapbox.com/mapbox-gl-js/

export interface MapboxConfig {
  accessToken: string;
  style?: string;
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
}

export interface CompanyLocation {
  cnpj: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
}

export class MapboxService {
  private accessToken: string;
  private defaultStyle = 'mapbox://styles/mapbox/streets-v12';
  
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
  
  /**
   * Obtém a URL de mapa estático para uma localização
   * Ideal para preview/thumbnails
   */
  getStaticMapURL(
    longitude: number,
    latitude: number,
    zoom: number = 14,
    width: number = 600,
    height: number = 400
  ): string {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${longitude},${latitude},${zoom},0/${width}x${height}?access_token=${this.accessToken}`;
  }
  
  /**
   * Obtém a URL de mapa estático com múltiplos marcadores
   */
  getStaticMapWithMarkers(
    locations: Array<{ lng: number; lat: number; label?: string }>,
    width: number = 800,
    height: number = 600
  ): string {
    const markers = locations
      .map((loc, i) => {
        const label = loc.label ? `-${loc.label}` : '';
        return `pin-s${label}+3b82f6(${loc.lng},${loc.lat})`;
      })
      .join(',');
    
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/auto/${width}x${height}?access_token=${this.accessToken}`;
  }
  
  /**
   * Geocoding: Converte endereço em coordenadas
   */
  async geocode(address: string): Promise<{
    longitude: number;
    latitude: number;
    place_name: string;
  } | null> {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.accessToken}&country=BR&language=pt`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        return {
          longitude,
          latitude,
          place_name: data.features[0].place_name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
  
  /**
   * Geocoding reverso: Converte coordenadas em endereço
   */
  async reverseGeocode(longitude: number, latitude: number): Promise<{
    address: string;
    place_name: string;
  } | null> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.accessToken}&language=pt`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return {
          address: data.features[0].text,
          place_name: data.features[0].place_name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
  
  /**
   * Calcula rota entre dois pontos
   */
  async getDirections(
    origin: [number, number],
    destination: [number, number],
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<{
    distance: number; // em metros
    duration: number; // em segundos
    geometry: any;
  } | null> {
    const [originLng, originLat] = origin;
    const [destLng, destLat] = destination;
    
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&access_token=${this.accessToken}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry
        };
      }
      
      return null;
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  }
  
  /**
   * Configura mapa interativo (retorna config para uso com mapbox-gl)
   */
  getMapConfig(options?: Partial<MapboxConfig>): MapboxConfig {
    return {
      accessToken: this.accessToken,
      style: options?.style || this.defaultStyle,
      center: options?.center || [-46.6333, -23.5505], // São Paulo como padrão
      zoom: options?.zoom || 12
    };
  }
  
  /**
   * Gera bounds (limites) para visualizar múltiplas localizações
   */
  calculateBounds(locations: Array<{ lng: number; lat: number }>): {
    southwest: [number, number];
    northeast: [number, number];
  } {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    locations.forEach(loc => {
      minLng = Math.min(minLng, loc.lng);
      maxLng = Math.max(maxLng, loc.lng);
      minLat = Math.min(minLat, loc.lat);
      maxLat = Math.max(maxLat, loc.lat);
    });
    
    return {
      southwest: [minLng, minLat],
      northeast: [maxLng, maxLat]
    };
  }
  
  /**
   * Geocode empresa a partir de dados completos
   */
  async geocodeCompany(company: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep?: string;
  }): Promise<{ lng: number; lat: number } | null> {
    const address = `${company.logradouro}, ${company.numero}, ${company.bairro}, ${company.cidade}, ${company.estado}, Brasil`;
    
    const result = await this.geocode(address);
    
    if (result) {
      return {
        lng: result.longitude,
        lat: result.latitude
      };
    }
    
    return null;
  }
}

// Instância singleton (será configurada no app)
let mapboxInstance: MapboxService | null = null;

export function initMapbox(accessToken: string): MapboxService {
  mapboxInstance = new MapboxService(accessToken);
  return mapboxInstance;
}

export function getMapbox(): MapboxService {
  if (!mapboxInstance) {
    throw new Error('Mapbox não foi inicializado. Chame initMapbox() primeiro.');
  }
  return mapboxInstance;
}

// Constantes úteis
export const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12'
};

export const BRAZIL_CENTER: [number, number] = [-47.9292, -15.7801]; // Centro do Brasil
export const SAO_PAULO_CENTER: [number, number] = [-46.6333, -23.5505];
export const RIO_CENTER: [number, number] = [-43.1729, -22.9068];

