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

  // Inicializar mapa com token público do Mapbox
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    // Usar token público do Mapbox (configurado como secret)
    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    
    if (!mapboxToken) {
      console.error('❌ Token do Mapbox não configurado');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    console.log('🗺️ Inicializando mapa Mapbox...');

    try {
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
        console.log('✅ Mapa Mapbox carregado com sucesso');
        setMapReady(true);
      });

      map.current.on('error', (e) => {
        console.error('❌ Erro ao carregar mapa Mapbox:', e);
      });

      return () => {
        map.current?.remove();
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
    }
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

  // Atualizar localização usando edge function
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const geocodeAddress = async () => {
      // Determinar se temos endereço completo (com número) ou apenas região
      const hasNumero = numero && numero.trim().length > 0;
      
      // Construir texto de busca
      let searchText = '';
      let zoomLevel = 6;
      let showAreaCircle = false;

      if (hasNumero && address) {
        // Endereço completo com número - pin preciso
        searchText = `${address}, ${numero}, ${municipio}, ${estado}, Brasil`;
        zoomLevel = 18;
        showAreaCircle = false;
      } else if (cep && cep.length >= 8) {
        // CEP sem número - mostrar área
        searchText = `${cep}, Brasil`;
        zoomLevel = 16;
        showAreaCircle = true;
      } else if (address && municipio) {
        // Logradouro sem número - mostrar área da rua
        searchText = `${address}, ${municipio}, ${estado}, Brasil`;
        zoomLevel = 16;
        showAreaCircle = true;
      } else if (municipio) {
        // Apenas município - área maior
        searchText = `${municipio}, ${estado}, Brasil`;
        zoomLevel = 12;
        showAreaCircle = true;
      } else {
        // Apenas estado ou país
        const parts = [estado, pais].filter(Boolean);
        if (parts.length === 0) return;
        searchText = parts.join(', ');
        zoomLevel = estado ? 8 : 6;
        showAreaCircle = true;
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
          } else {
            // Mostrar pin preciso (sem círculo)
            removeCircle();
            if (marker.current && map.current) {
              marker.current.setLngLat([lng, lat]).addTo(map.current);
            }
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
