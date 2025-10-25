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
import LocationMap from "@/components/map/LocationMap";
import { useNavigate, useLocation } from "react-router-dom";

interface CompanyReportProps {
  companyId: string;
}

export function CompanyReport({ companyId }: CompanyReportProps) {
  const navigate = useNavigate();
  const location = useLocation();
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
              <Button variant="outline" size="sm" onClick={handleRefreshReport} title="Atualizar" disabled={isRefetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
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
      <TooltipProvider delayDuration={200}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Score Global</span>
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs z-50 bg-popover">
                    <p className="font-semibold mb-2">Fórmula de Cálculo:</p>
                    <ul className="text-xs space-y-1 mb-2">
                      <li>• <strong>Maturidade Digital:</strong> {report.metrics.componentes.maturidade_digital}/100 (peso 40%)</li>
                      <li>• <strong>Sinais de Compra:</strong> {report.metrics.componentes.sinais_compra}/100 (peso 15%)</li>
                      <li>• <strong>Estrutura Decisores:</strong> {report.metrics.componentes.estrutura_decisores}/100 (peso 15%)</li>
                      {report.metrics.componentes?.financeiro !== undefined && (
                        <li>• <strong>Financeiro:</strong> {report.metrics.componentes.financeiro}/100 (peso 15%)</li>
                      )}
                      {report.metrics.componentes?.juridico !== undefined && (
                        <li>• <strong>Jurídico:</strong> {report.metrics.componentes.juridico}/100 (peso 15%)</li>
                      )}
                    </ul>
                    <p className="text-xs text-muted-foreground bg-muted p-1 rounded">Score = soma ponderada dos componentes</p>
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
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <span>Classificação:</span>
                <Badge variant="outline">{report.metrics.potencial_negocio.classificacao}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <span>Maturidade Digital</span>
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs z-50 bg-popover">
                    <p className="font-semibold mb-2">Base de Cálculo:</p>
                    <ul className="text-xs space-y-1 mb-2">
                      <li>• <strong>Presença Digital:</strong> website, redes sociais</li>
                      <li>• <strong>Tech Stack:</strong> tecnologias utilizadas</li>
                      <li>• <strong>Engajamento:</strong> métricas de social media</li>
                    </ul>
                    <p className="text-xs text-muted-foreground bg-muted p-1 rounded">
                      Fonte: tabela <code>digital_presence</code>
                    </p>
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

          <Card
            className="cursor-pointer hover:border-primary transition-colors hover:shadow-md"
            onClick={() => {
              navigate(`/company/${companyId}?tab=fit`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="Clique para ver produtos detalhados na aba Fit TOTVS"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help" onClick={(e) => e.stopPropagation()}>
                      <span>Ticket Estimado</span>
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs z-50 bg-popover">
                    <p className="font-semibold mb-2">Critérios de Cálculo:</p>
                    <ul className="text-xs space-y-1 mb-2">
                      <li>• <strong>Porte:</strong> {report.financials.porte} ({report.structure.total_funcionarios} funcionários)</li>
                      <li>• <strong>Setor:</strong> {report.activity.setor}</li>
                      <li>• <strong>Maturidade:</strong> {report.metrics.componentes.maturidade_digital}/100</li>
                    </ul>
                    {report.metrics.potencial_negocio.ticket_estimado.produtos_base && report.metrics.potencial_negocio.ticket_estimado.produtos_base.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="font-semibold">{report.metrics.potencial_negocio.ticket_estimado.produtos_base.length} Produtos sugeridos:</p>
                        <ul className="text-xs list-disc pl-4 mt-1">
                          {report.metrics.potencial_negocio.ticket_estimado.produtos_base.map((p: any) => (
                            <li key={p.sku}>{p.nome} - R$ {(p.preco_base / 1000).toFixed(0)}k</li>
                          ))}
                        </ul>
                        {report.metrics.potencial_negocio.ticket_estimado.desconto_aplicado > 0 && (
                          <p className="text-xs mt-1 text-green-600 font-semibold">✓ Desconto: {report.metrics.potencial_negocio.ticket_estimado.desconto_aplicado}%</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-blue-600 font-semibold mt-2 bg-blue-50 p-1 rounded">💡 Clique no card para ver recomendações na aba "Fit TOTVS"</p>
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
                <Badge variant="secondary" className="mt-2 text-xs">
                  {report.metrics.potencial_negocio.ticket_estimado.produtos_base.length} produtos → Ver Fit TOTVS
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <span>ROI Esperado</span>
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs z-50 bg-popover">
                    <p className="font-semibold mb-2">Fórmula de Cálculo:</p>
                    <ul className="text-xs space-y-1 mb-2">
                      <li>• <strong>Base:</strong> 150% ROI</li>
                      <li>• <strong>Multiplicador Tamanho:</strong> log10({report.structure.total_funcionarios} + 1) × 50</li>
                      <li>• <strong>Gap Maturidade:</strong> (100 - {report.metrics.componentes.maturidade_digital}) / 100 × 100</li>
                    </ul>
                    <p className="text-xs text-muted-foreground bg-muted p-1 rounded mt-2">
                      ROI = Base + (Tamanho × 50) + (Gap × 100)
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Quanto maior o gap de maturidade, maior o potencial de retorno
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {report.metrics.priorizacao.roi_esperado}%
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <span>Urgência:</span>
                <Badge variant="outline">{report.metrics.priorizacao.urgencia}</Badge>
              </div>
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
              {report.identification.website ? (
                <a href={report.identification.website} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  {report.identification.website}
                </a>
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )}
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
            <div className="mt-4">
              <LocationMap
                address={(company?.raw_data as any)?.receita?.logradouro || report.location.endereco}
                numero={(company?.raw_data as any)?.receita?.numero}
                municipio={(company?.raw_data as any)?.receita?.municipio || report.location.cidade}
                estado={(company?.raw_data as any)?.receita?.uf || report.location.estado}
                cep={(company?.raw_data as any)?.receita?.cep}
              />
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Fontes de Dados:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Funcionários: tabela <code>companies.employees</code></li>
                    <li>• Decisores: tabela <code>decision_makers</code></li>
                    <li>• Enriquecimento: Apollo.io, PhantomBuster, LinkedIn</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Total de Funcionários
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Dados de LinkedIn, Receita Federal ou enriquecimento via Apollo/PhantomBuster</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-2xl font-bold">{report.structure.total_funcionarios || 'N/A'}</p>
              <Badge variant="secondary" className="mt-1">{report.structure.faixa_funcionarios}</Badge>
              {(!report.structure.total_funcionarios || report.structure.total_funcionarios === 0) && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Executar enriquecimento
                </Badge>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                Decisores Identificados
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Decisores mapeados via LinkedIn (PhantomBuster), Apollo.io e Hunter.io</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-xl font-bold">{report.structure.total_decisores || 0}</p>
              {report.structure.total_decisores === 0 && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Nenhum decisor mapeado
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicadores Financeiros
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Fontes de Dados:</p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Porte:</strong> nº funcionários (MICRO ≤10, PEQUENO ≤50, MÉDIO ≤200, GRANDE &gt;200)</li>
                    <li>• <strong>Receita:</strong> Receita Federal ou raw_data.receita_anual</li>
                    <li>• <strong>Capacidade:</strong> porte + histórico financeiro</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Porte
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Classificação: MICRO (≤10), PEQUENO (≤50), MÉDIO (≤200), GRANDE (&gt;200 funcionários)</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <Badge variant="outline" className="text-base">{report.financials.porte || 'N/A'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Receita Anual
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Fonte: Receita Federal (raw_data.receita_anual) ou estimativa baseada em porte/setor</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="font-semibold">{report.financials.receita_anual || 'Não disponível'}</p>
              {!report.financials.receita_anual && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Executar enriquecimento premium
                </Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Capacidade de Investimento
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs mb-1">Cálculo:</p>
                    <ul className="text-xs space-y-1">
                      <li>• &gt;500 func: MUITO ALTA</li>
                      <li>• &gt;200 func: ALTA</li>
                      <li>• &gt;50 func: MÉDIA</li>
                      <li>• Demais: BAIXA</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </p>
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
