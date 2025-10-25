import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Users, TrendingUp, Target, Download, FileText, Sparkles, FileSpreadsheet, Image, RefreshCw, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { PremiumReportRequest } from "./PremiumReportRequest";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompanyReportProps {
  companyId: string;
}

export function CompanyReport({ companyId }: CompanyReportProps) {
  // Buscar dados da empresa para verificar se tem relatório premium
  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['company-report', companyId],
    queryFn: async () => {
      // Primeiro buscar relatório persistido
      const { data: existingReport } = await supabase
        .from('executive_reports')
        .select('content, data_quality_score, sources_used, run_id, updated_at')
        .eq('company_id', companyId)
        .eq('report_type', 'company')
        .maybeSingle();

      if (existingReport?.content) {
        const content = typeof existingReport.content === 'object' ? existingReport.content : {};
        return {
          ...(content as any),
          _metadata: {
            dataQualityScore: existingReport.data_quality_score,
            sourcesUsed: existingReport.sources_used,
            runId: existingReport.run_id,
            lastUpdated: existingReport.updated_at
          }
        };
      }

      // Se não existir, gerar novo
      const { data, error } = await supabase.functions.invoke('generate-company-report', {
        body: { companyId }
      });
      
      if (error) throw error;
      return data;
    },
    staleTime: 300000, // Cache por 5 minutos
  });

  const handleRefreshReport = async () => {
    toast.info("Atualizando relatório...", { description: "Buscando novos dados" });
    try {
      // Forçar geração de novo relatório
      const { data, error } = await supabase.functions.invoke('generate-company-report', {
        body: { companyId }
      });
      
      if (error) throw error;
      
      // Refetch para atualizar a UI
      await refetch();
      toast.success("Relatório atualizado com sucesso!");
    } catch (error) {
      console.error('Error refreshing report:', error);
      toast.error("Erro ao atualizar relatório");
    }
  };

  const handleExportPDF = async () => {
    toast.info("Gerando PDF...", { description: "Aguarde alguns segundos" });
    try {
      // Em produção, você pode usar jsPDF ou chamar uma edge function
      const element = document.getElementById('company-report-content');
      if (element) {
        window.print(); // Fallback simples - usar CSS @media print para formatação
        toast.success("PDF pronto para impressão");
      }
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    
    const csvData = [
      ['Campo', 'Valor'],
      ['Razão Social', report.identification.razao_social],
      ['CNPJ', report.identification.cnpj],
      ['Website', report.identification.website || 'N/A'],
      ['Cidade', report.location.cidade],
      ['Estado', report.location.estado],
      ['Setor', report.activity.setor],
      ['Funcionários', report.structure.total_funcionarios],
      ['Score Global', report.metrics.score_global],
      ['Maturidade Digital', report.metrics.componentes.maturidade_digital],
      ['Ticket Médio', report.metrics.potencial_negocio.ticket_estimado.medio],
      ['ROI Esperado', report.metrics.priorizacao.roi_esperado + '%']
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${report.identification.razao_social.replace(/\s/g, '_')}.csv`;
    link.click();
    toast.success("CSV exportado com sucesso");
  };

  const handleExportXLS = () => {
    toast.info("Formato XLS disponível em breve", { 
      description: "Use CSV como alternativa" 
    });
  };

  const handleExportPNG = async () => {
    toast.info("Captura de tela...", { description: "Preparando imagem" });
    // Você pode usar html2canvas ou similar para gerar PNG
    // Por ora, mostrar mensagem
    toast.info("Formato PNG disponível em breve");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) return null;

  const hasPremiumReport = company?.raw_data && (company.raw_data as any)?.serasa_premium;

  return (
    <div id="company-report-content" className="space-y-6">
      {/* Premium Report Request */}
      {!hasPremiumReport && company?.cnpj && (
        <PremiumReportRequest
          companyId={companyId}
          companyName={company.name}
          cnpj={company.cnpj}
        />
      )}

      {/* Premium Report Display */}
      {hasPremiumReport && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Análise Financeira Premium Serasa
                </CardTitle>
                <CardDescription>
                  Gerado em {new Date((company.raw_data as any).premium_report_generated_at).toLocaleString('pt-BR')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-primary text-primary-foreground">Premium</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshReport}
                  disabled={isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Score de Crédito</p>
                <p className="text-3xl font-bold">{(company.raw_data as any).serasa_premium.creditScore}</p>
                <Badge variant={
                  (company.raw_data as any).serasa_premium.riskClassification === 'A' ? 'default' :
                  (company.raw_data as any).serasa_premium.riskClassification === 'B' ? 'secondary' :
                  'destructive'
                } className="mt-2">
                  Risco {(company.raw_data as any).serasa_premium.riskClassification}
                </Badge>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Score Preditivo</p>
                <p className="text-3xl font-bold">{(company.raw_data as any).serasa_premium.predictiveRiskScore.toFixed(1)}%</p>
                <Progress value={(company.raw_data as any).serasa_premium.predictiveRiskScore} className="mt-2" />
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Protestos</p>
                <p className="text-3xl font-bold text-yellow-600">{(company.raw_data as any).serasa_premium.serasaData.protestos}</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ações Judiciais</p>
                <p className="text-3xl font-bold text-orange-600">{(company.raw_data as any).serasa_premium.serasaData.acoesJudiciais}</p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Histórico de Pagamentos</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pontuais</span>
                    <span className="font-semibold text-green-600">{(company.raw_data as any).serasa_premium.paymentHistory.onTimePayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atrasados</span>
                    <span className="font-semibold text-yellow-600">{(company.raw_data as any).serasa_premium.paymentHistory.latePayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atraso Médio</span>
                    <span className="font-semibold">{(company.raw_data as any).serasa_premium.paymentHistory.avgPaymentDelay.toFixed(1)} dias</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Indicadores de Dívida</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dívida Total</span>
                    <span className="font-semibold">R$ {((company.raw_data as any).serasa_premium.debtIndicators.totalDebt / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencida</span>
                    <span className="font-semibold text-red-600">R$ {((company.raw_data as any).serasa_premium.debtIndicators.overdueDebt / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dívida/Receita</span>
                    <span className="font-semibold">{((company.raw_data as any).serasa_premium.debtIndicators.debtToRevenueRatio * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header do Relatório */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                {report.identification.razao_social}
              </CardTitle>
              <CardDescription className="text-base">
                Relatório Executivo Completo
              </CardDescription>
              {report.sources && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Badge variant="outline" className="text-xs">
                    {report.sources.used.length} fontes de dados
                  </Badge>
                  {report._metadata?.dataQualityScore && (
                    <Badge variant={report._metadata.dataQualityScore >= 80 ? 'default' : 'secondary'} className="text-xs">
                      Qualidade: {report._metadata.dataQualityScore}%
                    </Badge>
                  )}
                  {report._metadata?.lastUpdated && (
                    <span className="text-xs">
                      Atualizado em {new Date(report._metadata.lastUpdated).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} title="Exportar para PDF">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} title="Exportar para CSV">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportXLS} title="Exportar para Excel">
                <Download className="h-4 w-4 mr-2" />
                XLS
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPNG} title="Exportar como imagem">
                <Image className="h-4 w-4 mr-2" />
                PNG
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <TooltipProvider>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Score Global
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Calculado com base em: Maturidade Digital (40%), Sinais de Compra (30%) e Estrutura de Decisores (30%)</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {report.metrics.score_global}
                <span className="text-lg">/100</span>
              </div>
              <Progress value={report.metrics.score_global} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Classificação: <Badge variant="outline">{report.metrics.potencial_negocio.classificacao}</Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Maturidade Digital
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Análise da presença digital da empresa: website, redes sociais e tecnologias utilizadas</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {report.metrics.componentes.maturidade_digital}
                <span className="text-lg">/100</span>
              </div>
              <Progress value={report.metrics.componentes.maturidade_digital} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {report.digitalPresence.classificacao_maturidade}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Ticket Estimado
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Critérios:</strong> Produtos TOTVS filtrados por porte ({report.financials.porte}), setor ({report.activity.setor}) e maturidade digital ({report.metrics.componentes.maturidade_digital}/100)</p>
                    {report.metrics.potencial_negocio.ticket_estimado.produtos_base && (
                      <div className="mt-2">
                        <p className="font-semibold">Produtos sugeridos:</p>
                        <ul className="text-xs list-disc pl-4 mt-1">
                          {report.metrics.potencial_negocio.ticket_estimado.produtos_base.map((p: any) => (
                            <li key={p.sku}>{p.nome} - R$ {(p.preco_base / 1000).toFixed(0)}k</li>
                          ))}
                        </ul>
                        {report.metrics.potencial_negocio.ticket_estimado.desconto_aplicado > 0 && (
                          <p className="text-xs mt-1 text-green-600">Desconto aplicado: {report.metrics.potencial_negocio.ticket_estimado.desconto_aplicado}%</p>
                        )}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {(report.metrics.potencial_negocio.ticket_estimado.medio / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Range: R$ {(report.metrics.potencial_negocio.ticket_estimado.minimo / 1000).toFixed(0)}k - 
                R$ {(report.metrics.potencial_negocio.ticket_estimado.maximo / 1000).toFixed(0)}k
              </p>
              {report.metrics.potencial_negocio.ticket_estimado.produtos_base && report.metrics.potencial_negocio.ticket_estimado.produtos_base.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {report.metrics.potencial_negocio.ticket_estimado.produtos_base.length} produto(s) sugerido(s)
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                ROI Esperado
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Baseado no tamanho da empresa ({report.structure.total_funcionarios} funcionários) e gap de maturidade digital ({100 - report.metrics.componentes.maturidade_digital}%)</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {report.metrics.priorizacao.roi_esperado}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Urgência: <Badge variant="outline">{report.metrics.priorizacao.urgencia}</Badge>
              </p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      {/* Identificação e Localização */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p className="font-semibold">{report.identification.razao_social}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-mono">{report.identification.cnpj}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Website</p>
              <a href={report.identification.website} target="_blank" rel="noopener noreferrer" 
                 className="text-primary hover:underline">
                {report.identification.website}
              </a>
            </div>
            {report.identification.linkedin_url && (
              <div>
                <p className="text-sm text-muted-foreground">LinkedIn</p>
                <a href={report.identification.linkedin_url} target="_blank" rel="noopener noreferrer"
                   className="text-primary hover:underline">
                  Ver perfil
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p>{report.location.endereco}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cidade</p>
                <p className="font-semibold">{report.location.cidade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-semibold">{report.location.estado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estrutura e Financeiro */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Estrutura Corporativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Total de Funcionários</p>
              <p className="text-2xl font-bold">{report.structure.total_funcionarios}</p>
              <Badge variant="secondary" className="mt-1">{report.structure.faixa_funcionarios}</Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Decisores Identificados</p>
              <p className="text-xl font-bold">{report.structure.total_decisores}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicadores Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Porte</p>
              <Badge variant="outline" className="text-base">{report.financials.porte}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Anual</p>
              <p className="font-semibold">{report.financials.receita_anual}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capacidade de Investimento</p>
              <Badge variant="outline" className="text-base">{report.financials.capacidade_investimento}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights da IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Insights e Recomendações
          </CardTitle>
          <CardDescription>Análise gerada por Inteligência Artificial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Resumo Executivo</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.insights.resumo_executivo}
            </p>
          </div>
          
          <Separator />
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2 text-green-600">Pontos Fortes</h4>
              <ul className="space-y-1">
                {report.insights.pontos_fortes.map((ponto: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-blue-600">Oportunidades</h4>
              <ul className="space-y-1">
                {report.insights.oportunidades.map((opp: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-blue-600">→</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-3">Recomendações de Abordagem</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Melhor Canal</p>
                <Badge>{report.insights.recomendacoes.melhor_canal}</Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Ângulo de Venda</p>
                <p className="text-sm font-medium">{report.insights.recomendacoes.angulo_venda}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Próximos Passos</h4>
            <ol className="space-y-2">
              {report.insights.recomendacoes.proximos_passos.map((passo: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Presença Digital */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Presença Digital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status do Website</span>
            <Badge variant={report.digitalPresence.website_status === 'ATIVO' ? 'default' : 'secondary'}>
              {report.digitalPresence.website_status}
            </Badge>
          </div>
          
          {report.digitalPresence.tecnologias.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tecnologias Detectadas</p>
              <div className="flex flex-wrap gap-2">
                {report.digitalPresence.tecnologias.map((tech: string, i: number) => (
                  <Badge key={i} variant="outline">{tech}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
