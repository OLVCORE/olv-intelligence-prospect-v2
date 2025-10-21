import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Inicializar apenas uma vez

    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      console.error('MAPBOX_PUBLIC_TOKEN não configurado');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-47.8825, -15.7942], // Brasília como centro padrão
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adicionar marcador inicial
    marker.current = new mapboxgl.Marker({
      draggable: false,
      color: '#3b82f6'
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Atualizar localização quando os campos mudam
  useEffect(() => {
    if (!map.current) return;

    const geocodeAddress = async () => {
      const parts = [address, municipio, estado, pais].filter(Boolean);
      if (parts.length === 0) return;

      const searchText = parts.join(', ');
      setLoading(true);

      try {
        const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${token}&country=br&language=pt`
        );

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          // Mover o mapa
          map.current?.flyTo({
            center: [lng, lat],
            zoom: municipio ? 12 : estado ? 8 : 6,
            duration: 1500
          });

          // Atualizar marcador
          if (marker.current && map.current) {
            marker.current.setLngLat([lng, lat]).addTo(map.current);
          }

          // Callback com a localização
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
        }
      } catch (error) {
        console.error('Erro ao geocodificar endereço:', error);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [address, municipio, estado, pais, cep, onLocationSelect]);

  return (
    <Card className="relative w-full h-full overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {!import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Configure MAPBOX_PUBLIC_TOKEN para visualizar o mapa
          </p>
        </div>
      )}
    </Card>
  );
}
