/**
 * 📊 DASHBOARD DE MÉTRICAS - REDESIGN ELEGANTE (02/12/2025)
 * 
 * Visual sofisticado com cores vibrantes e layout otimizado
 * - Cards de métricas principais no topo
 * - Gráficos elegantes e legíveis
 * - Gradientes e sombras para profundidade
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Target, 
  TrendingUp,
  FileText,
  Globe,
  Package
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface Evidence {
  match_type: 'single' | 'double' | 'triple';
  source?: string;
  source_name?: string;
  detected_products?: string[];
  validation_method?: 'ai' | 'basic';
}

interface MetricsDashboardProps {
  evidences: Evidence[];
  tripleMatches: number;
  doubleMatches: number;
  singleMatches: number;
  totalScore?: number;
  sources?: number;
  confidence?: 'high' | 'medium' | 'low';
}

// 🎨 CORES ELEGANTES E VIBRANTES
const COLORS = {
  triple: '#10b981',     // Emerald green
  double: '#3b82f6',     // Blue
  single: '#8b5cf6',     // Purple
};

export function MetricsDashboard({
  evidences,
  tripleMatches,
  doubleMatches,
  singleMatches,
  totalScore = 0,
  sources = 0,
  confidence = 'medium',
}: MetricsDashboardProps) {
  
  // 📊 DADOS PARA GRÁFICOS
  const totalEvidences = evidences.length;
  const triplePercentage = totalEvidences > 0 ? Math.round((tripleMatches / totalEvidences) * 100) : 0;
  const doublePercentage = totalEvidences > 0 ? Math.round((doubleMatches / totalEvidences) * 100) : 0;
  
  // Distribuição por tipo de match
  const matchDistribution = [
    { name: 'Triple', value: tripleMatches, color: COLORS.triple },
    { name: 'Double', value: doubleMatches, color: COLORS.double },
    { name: 'Single', value: singleMatches, color: COLORS.single },
  ].filter(item => item.value > 0);
  
  if (matchDistribution.length === 0) {
    matchDistribution.push({ name: 'Nenhuma evidência', value: 1, color: '#6b7280' });
  }
  
  // Top 10 fontes
  const sourceCounts = evidences.reduce((acc, e) => {
    const source = e.source_name || e.source || 'Desconhecida';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sourceDistribution = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  // Top 10 produtos
  const productCounts = evidences.reduce((acc, e) => {
    (e.detected_products || []).forEach(product => {
      acc[product] = (acc[product] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const productDistribution = Object.entries(productCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  return (
    <div className="space-y-4 mb-6">
      {/* 📊 CARDS DE MÉTRICAS - LAYOUT 2x2 COMPACTO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card: Total de Evidências */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                  Evidências
                </p>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {totalEvidences}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card: Triple Matches */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30 hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                  Triple
                </p>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  {tripleMatches}
                </p>
                <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                  {triplePercentage}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-400" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card: Double Matches */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                  Double
                </p>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {doubleMatches}
                </p>
                <p className="text-[10px] text-cyan-400 mt-1 font-semibold">
                  {doublePercentage}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyan-400" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card: Fontes Consultadas */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                  Fontes
                </p>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {sources}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-400" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 📊 GRÁFICOS - LAYOUT COMPACTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRÁFICO: DISTRIBUIÇÃO POR TIPO DE MATCH */}
        <Card className="shadow-xl border-2 border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Distribuição por Tipo de Match
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <RechartsPieChart>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '2px solid #334155',
                    borderRadius: '16px',
                    padding: '16px',
                    fontWeight: 700,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                  }}
                  labelStyle={{ color: '#e2e8f0', fontSize: 14 }}
                  itemStyle={{ color: '#94a3b8', fontSize: 13 }}
                />
                <Pie
                  data={matchDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={110}
                  strokeWidth={4}
                  stroke="#0f172a"
                  dataKey="value"
                >
                  {matchDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
            
            {/* Legenda customizada */}
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {matchDistribution.map((item) => (
                <div 
                  key={item.name} 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/60 border-2"
                  style={{ borderColor: item.color + '40' }}
                >
                  <div 
                    className="w-4 h-4 rounded-full shadow-md" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-bold">
                    {item.name}: <span style={{ color: item.color }}>{item.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* GRÁFICO: TOP 10 FONTES */}
        <Card className="shadow-xl border-2 border-cyan-500/20 bg-gradient-to-br from-background to-cyan-500/5">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Globe className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Top 10 Fontes de Evidências
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {sourceDistribution.length > 0 && sourceDistribution[0].value > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart 
                  data={sourceDistribution}
                  margin={{ top: 5, right: 10, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeWidth={1} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    fontSize={11}
                    fontWeight={700}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    fontSize={12}
                    fontWeight={700}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '2px solid #334155',
                      borderRadius: '16px',
                      padding: '16px',
                      fontWeight: 700,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }}
                    labelStyle={{ color: '#e2e8f0', fontSize: 14 }}
                    itemStyle={{ color: '#3b82f6', fontSize: 13 }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#sourceGradient)"
                    radius={[12, 12, 0, 0]}
                    maxBarSize={70}
                  />
                  <defs>
                    <linearGradient id="sourceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma fonte encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 📊 ROW 3: PRODUTOS DETECTADOS (se houver) */}
      {productDistribution.length > 0 && productDistribution[0].value > 0 && (
        <Card className="shadow-xl border-2 border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Top 10 Produtos TOTVS Detectados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart 
                data={productDistribution}
                margin={{ top: 5, right: 10, left: 10, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeWidth={1} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  fontSize={11}
                  fontWeight={700}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  fontSize={12}
                  fontWeight={700}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '2px solid #334155',
                    borderRadius: '16px',
                    padding: '16px',
                    fontWeight: 700,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                  }}
                  labelStyle={{ color: '#e2e8f0', fontSize: 14 }}
                  itemStyle={{ color: '#a855f7', fontSize: 13 }}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#productGradient)"
                  radius={[12, 12, 0, 0]}
                  maxBarSize={70}
                />
                <defs>
                  <linearGradient id="productGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
