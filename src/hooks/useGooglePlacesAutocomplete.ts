import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
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

  // Buscar previsões via edge function
  const fetchPredictions = useCallback(
    async (searchInput: string) => {
      if (!searchInput || searchInput.length < 3) {
        setPredictions([]);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
          body: {
            input: searchInput,
            types: options.types,
            componentRestrictions: options.componentRestrictions
          }
        });

        if (error) throw error;

        if (data?.success && data.predictions) {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
        }
      } catch (error) {
        console.error('Erro ao buscar previsões:', error);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    },
    [JSON.stringify(options)]
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
