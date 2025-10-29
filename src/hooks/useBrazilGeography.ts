import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BrazilState {
  id: string;
  state_code: string;
  state_name: string;
  region: string;
}

export interface BrazilMesoregion {
  id: string;
  state_code: string;
  mesoregion_code: string;
  mesoregion_name: string;
}

export interface BrazilMicroregion {
  id: string;
  mesoregion_code: string;
  microregion_code: string;
  microregion_name: string;
}

export interface BrazilMunicipality {
  id: string;
  municipality_code: string;
  municipality_name: string;
  state_code: string;
  microregion_code: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
}

// Hook para buscar todos os estados (27 UFs)
export function useBrazilStates() {
  return useQuery({
    queryKey: ['brazil-states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('br_states')
        .select('*')
        .order('state_name');
      
      if (error) throw error;
      return data as BrazilState[];
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache por 24 horas (dados geográficos não mudam)
  });
}

// Hook para buscar estados por região
export function useStatesByRegion(region?: string) {
  return useQuery({
    queryKey: ['states-by-region', region],
    queryFn: async () => {
      let query = supabase
        .from('br_states')
        .select('*')
        .order('state_name');
      
      if (region) {
        query = query.eq('region', region);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BrazilState[];
    },
    enabled: !!region,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar mesorregiões por estado
export function useMesoregionsByState(stateCode?: string) {
  return useQuery({
    queryKey: ['mesoregions-by-state', stateCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('br_mesoregions')
        .select('*')
        .eq('state_code', stateCode!)
        .order('mesoregion_name');
      
      if (error) throw error;
      return data as BrazilMesoregion[];
    },
    enabled: !!stateCode,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar microrregiões por mesorregião
export function useMicroregionsByMesoregion(mesoregionCode?: string) {
  return useQuery({
    queryKey: ['microregions-by-mesoregion', mesoregionCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('br_microregions')
        .select('*')
        .eq('mesoregion_code', mesoregionCode!)
        .order('microregion_name');
      
      if (error) throw error;
      return data as BrazilMicroregion[];
    },
    enabled: !!mesoregionCode,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar municípios por estado
export function useMunicipalitiesByState(stateCode?: string) {
  return useQuery({
    queryKey: ['municipalities-by-state', stateCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('br_municipalities')
        .select('*')
        .eq('state_code', stateCode!)
        .order('municipality_name');
      
      if (error) throw error;
      return data as BrazilMunicipality[];
    },
    enabled: !!stateCode,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar municípios por microrregião
export function useMunicipalitiesByMicroregion(microregionCode?: string) {
  return useQuery({
    queryKey: ['municipalities-by-microregion', microregionCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('br_municipalities')
        .select('*')
        .eq('microregion_code', microregionCode!)
        .order('municipality_name');
      
      if (error) throw error;
      return data as BrazilMunicipality[];
    },
    enabled: !!microregionCode,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar municípios com coordenadas (para mapas)
export function useMunicipalitiesWithCoordinates(stateCode?: string) {
  return useQuery({
    queryKey: ['municipalities-with-coordinates', stateCode],
    queryFn: async () => {
      let query = supabase
        .from('br_municipalities')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('municipality_name');
      
      if (stateCode) {
        query = query.eq('state_code', stateCode);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BrazilMunicipality[];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar regiões do Brasil
export function useBrazilRegions() {
  return useQuery({
    queryKey: ['brazil-regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('br_states')
        .select('region')
        .order('region');
      
      if (error) throw error;
      
      // Retornar regiões únicas
      const regions = [...new Set(data.map(d => d.region))];
      return regions;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });
}
