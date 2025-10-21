import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocationMapProps {
  address?: string;
  numero?: string; // Número do estabelecimento
  municipio?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export default function LocationMap({
  address,
  numero,
  municipio,
  estado,
  pais = 'Brasil',
  cep,
  onLocationSelect
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const circle = useRef<string | null>(null); // ID da camada de círculo
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Inicializar mapa com token público do Mapbox (busca do env e fallback no backend)
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    const initMap = async () => {
      let mapboxToken: string | undefined = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string | undefined;

      if (!mapboxToken) {
        console.warn('⚠️ VITE_MAPBOX_PUBLIC_TOKEN não encontrado. Buscando no backend...');
        try {
          const { data, error } = await supabase.functions.invoke('mapbox-token');
          if (error) throw error;
          mapboxToken = data?.token;
        } catch (err) {
          console.error('❌ Não foi possível obter o token do Mapbox:', err);
          return;
        }
      }

      if (!mapboxToken) {
        console.error('❌ Token do Mapbox não configurado');
        return;
      }

      mapboxgl.accessToken = mapboxToken;
      console.log('🗺️ Inicializando mapa Mapbox...');

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
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
          console.log('✅ Mapa Mapbox carregado com sucesso');
          setMapReady(true);
        });

        map.current.on('error', (e) => {
          console.error('❌ Erro ao carregar mapa Mapbox:', e);
        });
      } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  // Remover círculo existente
  const removeCircle = () => {
    if (map.current && circle.current) {
      if (map.current.getLayer(circle.current)) {
        map.current.removeLayer(circle.current);
      }
      if (map.current.getSource(circle.current)) {
        map.current.removeSource(circle.current);
      }
      circle.current = null;
    }
  };

  // Adicionar círculo de área (quando não tem número exato)
  const addCircle = (lng: number, lat: number, radius: number) => {
    if (!map.current) return;

    removeCircle();

    const circleId = `area-circle-${Date.now()}`;
    circle.current = circleId;

    map.current.addSource(circleId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {}
      }
    });

    map.current.addLayer({
      id: circleId,
      type: 'circle',
      source: circleId,
      paint: {
        'circle-radius': radius,
        'circle-color': '#3b82f6',
        'circle-opacity': 0.2,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#3b82f6',
        'circle-stroke-opacity': 0.5
      }
    });
  };

  // Atualizar localização usando edge function - SEMPRE que tiver CEP ou dados
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const geocodeAddress = async () => {
      // Determinar se temos endereço completo (com número) ou apenas região
      const hasNumero = numero && numero.trim().length > 0;
      const hasCep = cep && cep.replace(/\D/g, '').length === 8;
      
      // Construir texto de busca
      let searchText = '';
      let zoomLevel = 6;
      let showAreaCircle = false;

      if (hasNumero && address) {
        // Endereço completo com número - pin preciso
        searchText = `${address}, ${numero}, ${municipio}, ${estado}, Brasil`;
        zoomLevel = 18;
        showAreaCircle = false;
      } else if (hasCep) {
        // CEP (com ou sem número) - SEMPRE mostrar no mapa
        searchText = `${cep}, Brasil`;
        zoomLevel = 16;
        showAreaCircle = true;
        console.log('🗺️ Carregando mapa com CEP:', cep);
      } else if (address && municipio) {
        // Logradouro sem número - mostrar área da rua
        searchText = `${address}, ${municipio}, ${estado}, Brasil`;
        zoomLevel = 16;
        showAreaCircle = true;
      } else if (municipio && estado) {
        // Município - área maior
        searchText = `${municipio}, ${estado}, Brasil`;
        zoomLevel = 12;
        showAreaCircle = true;
      } else if (estado) {
        // Apenas estado
        searchText = `${estado}, Brasil`;
        zoomLevel = 8;
        showAreaCircle = true;
      } else {
        // Sem dados suficientes, não fazer nada
        console.log('⚠️ Sem dados suficientes para geocodificar');
        return;
      }

      setLoading(true);
      console.log('📍 Geocodificando:', searchText);

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
          
          console.log('✅ Localização encontrada:', { lat, lng, zoom: data.zoom });

          map.current?.flyTo({
            center: [lng, lat],
            zoom: data.zoom,
            duration: 1500
          });

          if (showAreaCircle) {
            // Mostrar círculo de área (sem pin)
            removeCircle();
            if (marker.current) {
              marker.current.remove();
            }
            
            // Calcular raio baseado no zoom (quanto menor o zoom, maior o raio)
            const radiusMap: Record<number, number> = {
              6: 150,   // País/Estado
              8: 100,   // Estado
              12: 60,   // Município
              16: 30,   // Rua/CEP
            };
            const radius = radiusMap[data.zoom] || 50;
            
            addCircle(lng, lat, radius);
            console.log('🔵 Círculo adicionado com raio:', radius);
          } else {
            // Mostrar pin preciso (sem círculo)
            removeCircle();
            if (marker.current && map.current) {
              marker.current.setLngLat([lng, lat]).addTo(map.current);
              console.log('📍 Pin adicionado');
            }
          }

          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
        }
      } catch (error) {
        console.error('❌ Erro ao geocodificar:', error);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [address, numero, municipio, estado, pais, cep, onLocationSelect, mapReady]);

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
