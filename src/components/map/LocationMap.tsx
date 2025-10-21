import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocationMapProps {
  address?: string;
  municipio?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export default function LocationMap({
  address,
  municipio,
  estado,
  pais = 'Brasil',
  cep,
  onLocationSelect
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Inicializar mapa (sem token - será usado via edge function)
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    // Token público dummy - não usado para geocoding (usamos edge function)
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtNWp0ZGg5YzBiZHoya3F3NzVxenRyOWUifQ.demo';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-47.8825, -15.7942],
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    marker.current = new mapboxgl.Marker({
      draggable: false,
      color: '#3b82f6'
    });

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Atualizar localização usando edge function
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const geocodeAddress = async () => {
      // Priorizar CEP se disponível
      let searchText = '';
      let zoomLevel = 6;

      if (cep && cep.length >= 8) {
        // Se CEP está preenchido, usar apenas ele para busca mais precisa
        searchText = `${cep}, Brasil`;
        zoomLevel = 15;
      } else {
        // Caso contrário, construir endereço a partir dos campos disponíveis
        const parts = [address, municipio, estado, pais].filter(Boolean);
        if (parts.length === 0) return;
        searchText = parts.join(', ');
        zoomLevel = municipio ? 12 : estado ? 8 : 6;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('mapbox-geocode', {
          body: { 
            searchText,
            zoom: zoomLevel
          }
        });

        if (error) throw error;

        if (data?.success && data.location) {
          const { lat, lng } = data.location;

          map.current?.flyTo({
            center: [lng, lat],
            zoom: data.zoom,
            duration: 1500
          });

          if (marker.current && map.current) {
            marker.current.setLngLat([lng, lat]).addTo(map.current);
          }

          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
        }
      } catch (error) {
        console.error('Erro ao geocodificar:', error);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [address, municipio, estado, pais, cep, onLocationSelect, mapReady]);

  return (
    <Card className="relative w-full h-full overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </Card>
  );
}
