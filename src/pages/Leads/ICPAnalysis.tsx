import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, Droplet, Snowflake, Copy, FileText, TrendingUp, Target, Zap, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function ICPAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const [temperatureFilter, setTemperatureFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(searchParams.get('leadId'));

  useEffect(() => {
    const leadIdFromUrl = searchParams.get('leadId');
    if (leadIdFromUrl) {
      setSelectedLeadId(leadIdFromUrl);
    }
  }, [searchParams]);

  const { data: leads, isLoading } = useQuery({
    queryKey: ['icp-leads', temperatureFilter, sectorFilter],
    queryFn: async () => {
      let query = supabase
        .from('leads_quarantine')
        .select('*')
        .eq('validation_status', 'approved')
        .order('auto_score', { ascending: false });

      if (sectorFilter !== 'all') {
        query = query.eq('sector', sectorFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const calculateICP = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-icp-score-advanced', {
        body: { leadId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: '✅ Score ICP calculado',
        description: `Score: ${data.icp_score}/100 (${data.temperature})`,
      });
    }
  });

  const generateProposal = useMutation({
    mutationFn: async ({ leadId, icpScore, temperature, painPoints, recommendedProducts }: any) => {
      const { data, error } = await supabase.functions.invoke('generate-value-proposition', {
        body: { leadId, icpScore, temperature, painPoints, recommendedProducts }
      });
      if (error) throw error;
      return data;
    }
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['icp-analysis', selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return null;

      toast({
        title: '🔄 Analisando lead...',
        description: 'Calculando score ICP e gerando proposta',
      });

      const icpData = await calculateICP.mutateAsync(selectedLeadId);
      const proposalData = await generateProposal.mutateAsync({
        leadId: selectedLeadId,
        icpScore: icpData.icp_score,
        temperature: icpData.temperature,
        painPoints: icpData.pain_points,
        recommendedProducts: icpData.recommended_products
      });

      return {
        ...icpData,
        ...proposalData
      };
    },
    enabled: !!selectedLeadId,
    retry: false
  });

  const copyScript = () => {
    if (analysis?.script_abordagem) {
      navigator.clipboard.writeText(analysis.script_abordagem);
      toast({
        title: '📋 Script copiado!',
        description: 'Script de abordagem copiado para área de transferência',
      });
    }
  };

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case 'hot': return <Flame className="w-5 h-5 text-red-500" />;
      case 'warm': return <Droplet className="w-5 h-5 text-yellow-500" />;
      case 'cold': return <Snowflake className="w-5 h-5 text-blue-500" />;
      default: return null;
    }
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'hot': return 'from-red-500 to-orange-500';
      case 'warm': return 'from-yellow-500 to-amber-500';
      case 'cold': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando análises ICP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Análise ICP + Proposta de Valor</h1>
        <p className="text-muted-foreground mt-1">
          Qualificação inteligente com IA para maximizar conversão
        </p>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Temperatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="hot">🔥 Hot</SelectItem>
              <SelectItem value="warm">🟡 Warm</SelectItem>
              <SelectItem value="cold">🔵 Cold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Agro">Agro</SelectItem>
              <SelectItem value="Construção">Construção</SelectItem>
              <SelectItem value="Varejo">Varejo</SelectItem>
              <SelectItem value="Indústria">Indústria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">
            Leads Qualificados ({leads?.length || 0})
          </h2>
          
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {leads?.map((lead) => (
              <Card
                key={lead.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedLeadId === lead.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedLeadId(lead.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.sector}</p>
                    </div>
                    {getTemperatureIcon('warm')}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{lead.state}</Badge>
                    {lead.employees && (
                      <Badge variant="outline">{lead.employees} func.</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Score de Validação</span>
                    <span className="text-sm font-semibold">{lead.auto_score}/100</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${lead.auto_score}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedLeadId && analysis && !analysisLoading ? (
            <div className="space-y-6">
              <Card className={`bg-gradient-to-r ${getTemperatureColor(analysis.temperature)} text-white`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Score ICP: {analysis.icp_score}/100</CardTitle>
                      <CardDescription className="text-white/90">
                        {analysis.temperature_label}
                      </CardDescription>
                    </div>
                    {getTemperatureIcon(analysis.temperature)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm opacity-90">Setor</div>
                      <div className="text-2xl font-bold">{analysis.score_breakdown.sector_score}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-90">Porte</div>
                      <div className="text-2xl font-bold">{analysis.score_breakdown.size_score}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-90">Região</div>
                      <div className="text-2xl font-bold">{analysis.score_breakdown.region_score}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-90">Concorrente</div>
                      <div className="text-2xl font-bold">{analysis.score_breakdown.competitor_score}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Pain Points Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.pain_points?.map((pain: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                        <Badge variant={pain.severity === 'high' ? 'destructive' : 'secondary'}>
                          {pain.severity}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{pain.category}</div>
                          <div className="text-sm text-muted-foreground">{pain.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Produtos TOTVS Recomendados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommended_products?.map((product: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Proposta de Valor Personalizada
                    </CardTitle>
                    {analysis.used_ai && (
                      <Badge className="bg-purple-500">Gerado por IA</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{analysis.value_proposition}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Script de Abordagem</CardTitle>
                    <Button onClick={copyScript} variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Script
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                    {analysis.script_abordagem}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    ROI Estimado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{analysis.roi_estimado}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : analysisLoading ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Analisando lead...
                </h3>
                <p className="text-muted-foreground">
                  Calculando score ICP e gerando proposta de valor
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Selecione um lead
                </h3>
                <p className="text-muted-foreground">
                  Clique em um lead da lista para ver a análise ICP completa
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
