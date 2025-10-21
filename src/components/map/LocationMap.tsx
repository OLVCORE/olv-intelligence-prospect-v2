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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
   const [loading, setLoading] = useState(false);
   const [mapReady, setMapReady] = useState(false);
   const [mapError, setMapError] = useState<string | null>(null);

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
           setMapError('Não foi possível obter o token do Mapbox. Verifique o token público no backend.');
           return;
         }
      }

       if (!mapboxToken) {
         console.error('❌ Token do Mapbox não configurado');
         setMapError('Token do Mapbox não configurado. Cadastre um token público (pk...) e libere este domínio.');
         return;
       }

      mapboxgl.accessToken = mapboxToken;
      console.log('🗺️ Inicializando mapa Mapbox...');

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-47.8825, -15.7942], // Centro do Brasil (fallback inicial)
          zoom: 3.8,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        marker.current = new mapboxgl.Marker({
          draggable: false,
          color: '#3b82f6'
        });

        map.current.on('load', () => {
          console.log('✅ Mapa Mapbox carregado com sucesso');
           setMapReady(true);
           setMapError(null);

          // Centralizar na localização do usuário no primeiro carregamento (com fallback por IP)
          if (!address && !cep && !municipio && !estado) {
            const jumpTo = (lng: number, lat: number, zoom = 12) => {
              try { map.current?.jumpTo({ center: [lng, lat], zoom }); } catch {}
            };

            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => jumpTo(pos.coords.longitude, pos.coords.latitude, 13),
                async () => {
                  try {
                    const res = await fetch('https://ipapi.co/json/');
                    const j = await res.json();
                    if (j?.longitude && j?.latitude) jumpTo(j.longitude, j.latitude, 11);
                  } catch {}
                },
                { enableHighAccuracy: true, timeout: 3000, maximumAge: 30000 }
              );
            }
          }

          // Garantir renderização correta após layout
          try {
            map.current?.resize();
          } catch (e) {
            console.warn('Map resize após load falhou:', e);
          }

          // Reajustar também quando o estilo terminar de carregar
          map.current?.on('style.load', () => {
            try { map.current?.resize(); } catch {}
          });

          // Observar mudanças de tamanho do container e forçar resize
          if (mapContainer.current && 'ResizeObserver' in window) {
            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = new ResizeObserver(() => {
              try { map.current?.resize(); } catch {}
            });
            resizeObserverRef.current.observe(mapContainer.current);
          }
        });

         map.current.on('error', (e) => {
           console.error('❌ Erro ao carregar mapa Mapbox:', e);
           const msg = (e as any)?.error?.message || (e as any)?.message || 'Erro desconhecido ao carregar tiles';
           if (/401|403|Unauthorized|Forbidden/i.test(msg)) {
             setMapError('Falha ao carregar o mapa (token inválido ou restrição de domínio). Verifique se o token público (pk...) permite o domínio atual.');
           } else {
             setMapError(msg);
           }
         });
      } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
      }
    };

    initMap();

    return () => {
      try { resizeObserverRef.current?.disconnect(); } catch {}
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

    if (!map.current.isStyleLoaded()) {
      map.current.once('style.load', () => addCircle(lng, lat, radius));
      return;
    }

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
        // Sem dados suficientes -> centralizar na localização do usuário (geolocalização com fallback por IP)
        console.log('⚠️ Sem dados suficientes para geocodificar');
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              try { map.current?.jumpTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 }); } catch {}
            },
            async () => {
              try {
                const res = await fetch('https://ipapi.co/json/');
                const j = await res.json();
                if (j?.longitude && j?.latitude) {
                  try { map.current?.jumpTo({ center: [j.longitude, j.latitude], zoom: 11 }); } catch {}
                }
              } catch {}
            },
            { enableHighAccuracy: true, timeout: 3000, maximumAge: 30000 }
          );
        }
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

          // Garantir que o mapa conheça o tamanho atual do container
          try { map.current?.resize(); } catch {}
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
    <Card className="relative w-full min-h-[360px] overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
       {loading && (
         <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       )}

       {mapError && (
         <div className="absolute left-4 right-4 bottom-4 z-10 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
           {mapError}
           <div className="text-xs text-muted-foreground mt-1">
             Domínio atual: {typeof window !== 'undefined' ? window.location.host : ''}
           </div>
         </div>
       )}
    </Card>
  );
}
