import { useState, useEffect, useCallback } from 'react';

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Carregar Google Maps API
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Erro ao carregar Google Maps API'));
    document.head.appendChild(script);
  });
}

export function useGooglePlacesAutocomplete(
  input: string,
  options: {
    types?: string[];
    componentRestrictions?: { country: string };
  } = {}
) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<google.maps.places.AutocompleteService | null>(null);

  // Inicializar Google Places API
  useEffect(() => {
    const initGooglePlaces = async () => {
      // Tentar pegar do localStorage ou .env
      const apiKey = localStorage.getItem('google_api_key') || import.meta.env.VITE_GOOGLE_API_KEY;
      
      if (!apiKey) {
        console.warn('Google API Key não configurado - autocomplete desabilitado');
        return;
      }

      try {
        await loadGoogleMapsScript(apiKey);
        
        if (window.google && window.google.maps && window.google.maps.places) {
          const autocompleteService = new window.google.maps.places.AutocompleteService();
          setService(autocompleteService);
        }
      } catch (error) {
        console.error('Erro ao carregar Google Places API:', error);
      }
    };

    initGooglePlaces();
  }, []);

  // Buscar previsões
  const fetchPredictions = useCallback(
    async (searchInput: string) => {
      if (!service || !searchInput || searchInput.length < 3) {
        setPredictions([]);
        return;
      }

      setLoading(true);

      try {
        const request: google.maps.places.AutocompletionRequest = {
          input: searchInput,
          ...options
        };

        service.getPlacePredictions(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Erro ao buscar previsões:', error);
        setPredictions([]);
        setLoading(false);
      }
    },
    [service, JSON.stringify(options)]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPredictions(input);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [input, fetchPredictions]);

  return { predictions, loading };
}

// Hook específico para endereços brasileiros
export function useBrazilianAddressAutocomplete(input: string, type?: 'locality' | 'route' | 'sublocality') {
  const types = type ? [type] : ['geocode'];
  
  return useGooglePlacesAutocomplete(input, {
    types,
    componentRestrictions: { country: 'br' }
  });
}
