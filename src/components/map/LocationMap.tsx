import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';

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
  const [mapboxToken, setMapboxToken] = useState(() => {
    // Tentar pegar do localStorage primeiro
    return localStorage.getItem('mapbox_token') || '';
  });
  const [showTokenInput, setShowTokenInput] = useState(!mapboxToken);

  const saveToken = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken.trim());
      setShowTokenInput(false);
      window.location.reload(); // Recarregar para aplicar o token
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Inicializar apenas uma vez

    const token = mapboxToken || import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      console.error('MAPBOX_PUBLIC_TOKEN não configurado');
      setShowTokenInput(true);
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
  }, [mapboxToken]);

  // Atualizar localização quando os campos mudam
  useEffect(() => {
    if (!map.current) return;

    const geocodeAddress = async () => {
      const parts = [address, municipio, estado, pais].filter(Boolean);
      if (parts.length === 0) return;

      const searchText = parts.join(', ');
      setLoading(true);

      try {
        const token = mapboxToken || import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
        if (!token) {
          setShowTokenInput(true);
          return;
        }
        
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
      
      {showTokenInput && (
        <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center p-6 z-20">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Configure o Mapbox Token</h3>
              <p className="text-sm text-muted-foreground">
                Para visualizar o mapa, você precisa adicionar sua chave pública do Mapbox.
              </p>
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-block"
              >
                Obter token gratuito no Mapbox →
              </a>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="Cole seu Mapbox Public Token aqui"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveToken()}
                className="font-mono text-xs"
              />
              <Button onClick={saveToken} className="w-full" disabled={!mapboxToken.trim()}>
                Salvar e Carregar Mapa
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              O token será salvo localmente no seu navegador
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
