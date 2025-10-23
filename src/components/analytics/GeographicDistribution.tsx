import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface GeoStats {
  byState: { state: string; count: number; percentage: number }[];
  byRegion: { region: string; count: number; states: string[] }[];
  total: number;
  withLocation: number;
}

const REGIOES_BRASIL: Record<string, string[]> = {
  'Sul': ['RS', 'SC', 'PR'],
  'Sudeste': ['SP', 'RJ', 'MG', 'ES'],
  'Centro-Oeste': ['GO', 'MT', 'MS', 'DF'],
  'Nordeste': ['BA', 'PE', 'CE', 'MA', 'RN', 'PB', 'SE', 'AL', 'PI'],
  'Norte': ['AM', 'PA', 'RO', 'AC', 'RR', 'AP', 'TO']
};

export default function GeographicDistribution() {
  const [stats, setStats] = useState<GeoStats>({
    byState: [],
    byRegion: [],
    total: 0,
    withLocation: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGeoStats = async () => {
      try {
        const { data: companies, error } = await supabase
          .from('companies')
          .select('location')
          .not('location', 'is', null);

        if (error) throw error;

        // Contar por estado
        const stateCount: Record<string, number> = {};
        let withLocation = 0;

        companies?.forEach(company => {
          const location = company.location as any;
          const state = location?.state || location?.uf;
          if (state) {
            stateCount[state] = (stateCount[state] || 0) + 1;
            withLocation++;
          }
        });

        // Top estados
        const byState = Object.entries(stateCount)
          .map(([state, count]) => ({
            state,
            count,
            percentage: withLocation > 0 ? (count / withLocation) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Agrupar por região
        const regionCount: Record<string, { count: number; states: Set<string> }> = {};
        
        Object.entries(stateCount).forEach(([state, count]) => {
          const region = Object.entries(REGIOES_BRASIL).find(([_, states]) => 
            states.includes(state)
          )?.[0] || 'Outros';

          if (!regionCount[region]) {
            regionCount[region] = { count: 0, states: new Set() };
          }
          regionCount[region].count += count;
          regionCount[region].states.add(state);
        });

        const byRegion = Object.entries(regionCount)
          .map(([region, data]) => ({
            region,
            count: data.count,
            states: Array.from(data.states)
          }))
          .sort((a, b) => b.count - a.count);

        setStats({
          byState,
          byRegion,
          total: companies?.length || 0,
          withLocation
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas geográficas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Distribuição Geográfica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Resumo Geográfico
          </CardTitle>
          <CardDescription>
            {stats.withLocation} de {stats.total} empresas com localização mapeada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.byRegion.slice(0, 3).map((region, idx) => (
              <div key={region.region} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{region.region}</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{region.count}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {region.states.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Top Estados</CardTitle>
            <CardDescription>Distribuição por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byState}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="state" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [value, 'Empresas'];
                    return [value, name];
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por Região */}
        <Card>
          <CardHeader>
            <CardTitle>Por Região</CardTitle>
            <CardDescription>Distribuição regional</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byRegion}
                  dataKey="count"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ region, count }) => `${region}: ${count}`}
                  labelLine={false}
                >
                  {stats.byRegion.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
