import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  location?: {
    lat?: number;
    lng?: number;
    city?: string;
    state?: string;
  };
  industry?: string;
  employees?: number;
}

interface CompaniesMapProps {
  companies?: Company[];
  height?: string;
  showStats?: boolean;
}

export default function CompaniesMap({ 
  companies: propCompanies,
  height = '500px',
  showStats = true 
}: CompaniesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ total: 0, withLocation: 0, byState: {} as Record<string, number> });

  // Buscar empresas do banco se não fornecidas
  useEffect(() => {
    const fetchCompanies = async () => {
      if (propCompanies) {
        setCompanies(propCompanies);
        calculateStats(propCompanies);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, location, industry, employees')
          .not('location', 'is', null);

        if (error) throw error;

        const companiesWithCoords = (data || [])
          .map(c => ({
            ...c,
            location: c.location as any
          }))
          .filter(c => 
            c.location?.lat && c.location?.lng
          ) as Company[];

        setCompanies(companiesWithCoords);
        calculateStats(companiesWithCoords);
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        toast.error('Erro ao carregar empresas do mapa');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [propCompanies]);

  // Calcular estatísticas
  const calculateStats = (comps: Company[]) => {
    const byState: Record<string, number> = {};
    let withLocation = 0;

    comps.forEach(c => {
      if (c.location?.lat && c.location?.lng) {
        withLocation++;
        const state = c.location.state || 'Não informado';
        byState[state] = (byState[state] || 0) + 1;
      }
    });

    setStats({
      total: comps.length,
      withLocation,
      byState
    });
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        // Buscar token do Mapbox
        const { data: tokenData } = await supabase.functions.invoke('mapbox-token');
        if (!tokenData?.token) {
          throw new Error('Token Mapbox não configurado');
        }

        mapboxgl.accessToken = tokenData.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-47.8825, -15.7942], // Centro do Brasil
          zoom: 3.5,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        map.current.on('load', () => {
          console.log('✅ Mapa carregado');
          setMapReady(true);
        });

      } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        toast.error('Erro ao carregar mapa');
      }
    };

    initMap();

    return () => {
      markers.current.forEach(m => m.remove());
      map.current?.remove();
    };
  }, []);

  // Adicionar pins das empresas
  useEffect(() => {
    if (!map.current || !mapReady || companies.length === 0) return;

    // Limpar marcadores anteriores
    markers.current.forEach(m => m.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let validPins = 0;

    companies.forEach(company => {
      const { lat, lng } = company.location || {};
      if (!lat || !lng) return;

      // Criar popup com informações da empresa
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold text-sm mb-1">${company.name}</h3>
          ${company.location?.city ? `<p class="text-xs text-muted-foreground">${company.location.city}, ${company.location.state}</p>` : ''}
          ${company.industry ? `<p class="text-xs mt-1">${company.industry}</p>` : ''}
          ${company.employees ? `<p class="text-xs text-muted-foreground">${company.employees} funcionários</p>` : ''}
        </div>
      `);

      // Criar marcador
      const el = document.createElement('div');
      el.className = 'company-marker';
      el.innerHTML = `
        <div class="flex items-center justify-center w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
      bounds.extend([lng, lat]);
      validPins++;
    });

    // Ajustar zoom para mostrar todos os pins
    if (validPins > 0) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12
      });
    }

    console.log(`📍 ${validPins} empresas adicionadas ao mapa`);
  }, [companies, mapReady]);

  return (
    <Card className="w-full">
      {showStats && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Distribuição Geográfica
          </CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {stats.withLocation} empresas no mapa
            </div>
            {stats.total > stats.withLocation && (
              <span className="text-xs">
                ({stats.total - stats.withLocation} sem localização)
              </span>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="relative" style={{ height }}>
          <div ref={mapContainer} className="absolute inset-0 rounded-b-lg" />
          
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
