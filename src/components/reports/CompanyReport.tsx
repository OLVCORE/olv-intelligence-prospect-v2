import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, MapPin, Users, TrendingUp, Target, Download, FileText, 
  Sparkles, FileSpreadsheet, Image, RefreshCw, HelpCircle, Phone, Mail,
  Globe, DollarSign, Activity, AlertTriangle, Shield, CheckCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompanyReportProps {
  companyId: string;
}

export function CompanyReport({ companyId }: CompanyReportProps) {
  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['company-report', companyId],
    queryFn: async () => {
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

      const { data, error } = await supabase.functions.invoke('generate-company-report', {
        body: { companyId }
      });
      
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  const handleRefreshReport = async () => {
    toast.info("Atualizando relatório...");
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-report', {
        body: { companyId }
      });
      if (error) throw error;
      await refetch();
      toast.success("Relatório atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar relatório");
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    
    const csvRows = [
      ['Campo', 'Valor'],
      // Identificação (12 campos)
      ['CNPJ', report.identification.cnpj || ''],
      ['Razão Social', report.identification.razao_social || ''],
      ['Nome Fantasia', report.identification.nome_fantasia || ''],
      ['Nome da Empresa', report.identification.nome_empresa || ''],
      ['Tipo Unidade', report.identification.tipo_unidade || ''],
      ['Natureza Jurídica', report.identification.natureza_juridica || ''],
      ['Data de Abertura', report.identification.data_abertura || ''],
      ['Situação Cadastral', report.identification.situacao_cadastral || ''],
      ['Data Situação', report.identification.data_situacao || ''],
      ['Website', report.identification.website || ''],
      ['LinkedIn', report.identification.linkedin_url || ''],
      ['Domain', report.identification.domain || ''],
      
      // Localização (10 campos)
      ['Logradouro', report.location.logradouro || ''],
      ['Número', report.location.numero || ''],
      ['Complemento', report.location.complemento || ''],
      ['Bairro', report.location.bairro || ''],
      ['CEP', report.location.cep || ''],
      ['Cidade', report.location.cidade || ''],
      ['Microrregião', report.location.microrregiao || ''],
      ['Mesorregião', report.location.mesorregiao || ''],
      ['Estado', report.location.estado || ''],
      ['País', report.location.pais || ''],
      
      // Contatos - Telefones (13 campos)
      ['Assertividade', report.contacts.assertividade || ''],
      ['Melhor Telefone', report.contacts.melhor_telefone || ''],
      ['Segundo Melhor Telefone', report.contacts.segundo_melhor_telefone || ''],
      ['Telefones Alta Assertividade', report.contacts.telefones_alta_assertividade?.join('; ') || ''],
      ['Telefones Média Assertividade', report.contacts.telefones_media_assertividade?.join('; ') || ''],
      ['Telefones Baixa Assertividade', report.contacts.telefones_baixa_assertividade?.join('; ') || ''],
      ['Telefones Matriz', report.contacts.telefones_matriz?.join('; ') || ''],
      ['Telefones Filiais', report.contacts.telefones_filiais?.join('; ') || ''],
      ['Celulares', report.contacts.celulares?.join('; ') || ''],
      ['Melhor Celular', report.contacts.melhor_celular || ''],
      ['Fixos', report.contacts.fixos?.join('; ') || ''],
      ['PAT Telefone', report.contacts.pat_telefone || ''],
      ['WhatsApp', report.contacts.whatsapp || ''],
      
      // Contatos - Emails (7 campos)
      ['Emails Departamentos', report.contacts.emails_validados_departamentos?.join('; ') || ''],
      ['Emails Sócios', report.contacts.emails_validados_socios?.join('; ') || ''],
      ['Emails Decisores', report.contacts.emails_validados_decisores?.join('; ') || ''],
      ['Emails Colaboradores', report.contacts.emails_validados_colaboradores?.join('; ') || ''],
      ['Email PAT', report.contacts.email_pat || ''],
      ['Email Receita Federal', report.contacts.email_receita_federal || ''],
      ['Emails Públicos', report.contacts.emails_publicos?.join('; ') || ''],
      
      // Atividade (12 campos)
      ['Setor Amigável', report.activity.setor_amigavel || ''],
      ['Setor', report.activity.setor || ''],
      ['Segmento', report.activity.segmento || ''],
      ['Atividade Econômica', report.activity.atividade_economica || ''],
      ['Código Atividade Econômica', report.activity.cod_atividade_economica || ''],
      ['Atividades Secundárias', report.activity.atividades_secundarias?.join('; ') || ''],
      ['Códigos Atividades Secundárias', report.activity.cod_atividades_secundarias?.join('; ') || ''],
      ['Códigos NCMs Primários', report.activity.cod_ncms_primarios?.join('; ') || ''],
      ['NCMs Primários', report.activity.ncms_primarios?.join('; ') || ''],
      ['Importação', report.activity.importacao ? 'Sim' : 'Não'],
      ['Exportação', report.activity.exportacao ? 'Sim' : 'Não'],
      ['Regime Tributário', report.activity.regime_tributario || ''],
      
      // Estrutura (13 campos)
      ['Funcionários Presumido Matriz+CNPJ', report.structure.funcionarios_presumido_matriz_cnpj?.toString() || ''],
      ['Funcionários Presumido Este CNPJ', report.structure.funcionarios_presumido_este_cnpj?.toString() || ''],
      ['PAT Funcionários', report.structure.pat_funcionarios?.toString() || ''],
      ['Total Funcionários', report.structure.total_funcionarios?.toString() || ''],
      ['Faixa Funcionários', report.structure.faixa_funcionarios || ''],
      ['Porte Estimado', report.structure.porte_estimado || ''],
      ['Quantidade Filiais', report.structure.qtd_filiais?.toString() || ''],
      ['Sócios e Administradores', report.structure.socios_administradores?.map(s => s.nome).join('; ') || ''],
      ['Decisores - Cargos', report.structure.decisores_cargos?.join('; ') || ''],
      ['Decisores - LinkedIn', report.structure.decisores_linkedin?.join('; ') || ''],
      ['Colaboradores - Cargos', report.structure.colaboradores_cargos?.join('; ') || ''],
      ['Colaboradores - LinkedIn', report.structure.colaboradores_linkedin?.join('; ') || ''],
      ['Total Decisores', report.structure.total_decisores?.toString() || ''],
      
      // Financeiro (19 campos)
      ['Capital Social', report.financials.capital_social?.toString() || ''],
      ['Recebimentos Governo Federal', report.financials.recebimentos_governo_federal?.toString() || ''],
      ['Enquadramento Porte', report.financials.enquadramento_porte || ''],
      ['Faturamento Presumido Matriz+CNPJ', report.financials.faturamento_presumido_matriz_cnpj?.toString() || ''],
      ['Faturamento Presumido Este CNPJ', report.financials.faturamento_presumido_este_cnpj?.toString() || ''],
      ['Crescimento Empresa', report.financials.crescimento_empresa || ''],
      ['Receita Anual', report.financials.receita_anual || ''],
      ['Porte', report.financials.porte || ''],
      ['Capacidade Investimento', report.financials.capacidade_investimento || ''],
      ['% Dívidas CNPJ sobre Faturamento', report.financials.perc_dividas_cnpj_sobre_faturamento?.toString() || ''],
      ['% Dívidas CNPJ+Sócios sobre Faturamento', report.financials.perc_dividas_cnpj_socios_sobre_faturamento?.toString() || ''],
      ['Total Dívidas CNPJ com União', report.financials.total_dividas_cnpj_uniao?.toString() || ''],
      ['Total Dívidas CNPJ+Sócios com União', report.financials.total_dividas_cnpj_socios_uniao?.toString() || ''],
      ['Dívidas Gerais CNPJ com União', report.financials.dividas_gerais_cnpj_uniao?.toString() || ''],
      ['Dívidas Gerais CNPJ+Sócios com União', report.financials.dividas_gerais_cnpj_socios_uniao?.toString() || ''],
      ['Dívidas CNPJ com FGTS', report.financials.dividas_cnpj_fgts?.toString() || ''],
      ['Dívidas CNPJ+Sócios com FGTS', report.financials.dividas_cnpj_socios_fgts?.toString() || ''],
      ['Dívidas CNPJ com Previdência', report.financials.dividas_cnpj_previdencia?.toString() || ''],
      ['Dívidas CNPJ+Sócios com Previdência', report.financials.dividas_cnpj_socios_previdencia?.toString() || ''],
      
      // Presença Digital (13 campos)
      ['Sites', report.digitalPresence.sites?.join('; ') || ''],
      ['Melhor Site', report.digitalPresence.melhor_site || ''],
      ['Segundo Melhor Site', report.digitalPresence.segundo_melhor_site || ''],
      ['Website Status', report.digitalPresence.website_status || ''],
      ['Instagram', report.digitalPresence.instagram || ''],
      ['Facebook', report.digitalPresence.facebook || ''],
      ['LinkedIn', report.digitalPresence.linkedin || ''],
      ['Twitter', report.digitalPresence.twitter || ''],
      ['YouTube', report.digitalPresence.youtube || ''],
      ['Outras Redes', report.digitalPresence.outras_redes?.join('; ') || ''],
      ['Tecnologias', report.digitalPresence.tecnologias?.join('; ') || ''],
      ['Ferramentas', report.digitalPresence.ferramentas?.join('; ') || ''],
      ['Nível Atividade', report.metrics.nivel_atividade || ''],
    ];

    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_completo_${report.identification.razao_social.replace(/\s/g, '_')}.csv`;
    link.click();
    toast.success("CSV exportado com 87 campos!");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div id="company-report-content" className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                {report.identification.razao_social}
              </CardTitle>
              <CardDescription className="text-base">
                Relatório Completo - 87 Campos Detalhados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshReport} disabled={isRefetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{report.metrics.score_global}/100</div>
            <Progress value={report.metrics.score_global} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maturidade Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{report.digitalPresence.maturidade_digital}/100</div>
            <Badge variant="outline" className="mt-2">{report.digitalPresence.classificacao_maturidade}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {report.metrics.potencial_negocio.ticket_estimado.medio.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Min: R$ {report.metrics.potencial_negocio.ticket_estimado.minimo.toLocaleString('pt-BR')} | 
              Max: R$ {report.metrics.potencial_negocio.ticket_estimado.maximo.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI Esperado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{report.metrics.priorizacao.roi_esperado}%</div>
            <Badge variant="outline" className="mt-2">{report.metrics.priorizacao.urgencia}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo em Abas */}
      <Tabs defaultValue="identificacao" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="identificacao">Identificação</TabsTrigger>
          <TabsTrigger value="localizacao">Localização</TabsTrigger>
          <TabsTrigger value="contatos">Contatos</TabsTrigger>
          <TabsTrigger value="atividade">Atividade</TabsTrigger>
          <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="digital">Digital</TabsTrigger>
        </TabsList>

        {/* ABA 1: IDENTIFICAÇÃO (12 campos) */}
        <TabsContent value="identificacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados de Identificação (12 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-semibold">{report.identification.cnpj}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Razão Social</p>
                <p className="font-semibold">{report.identification.razao_social}</p>
              </div>
              {report.identification.nome_fantasia && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p className="font-semibold">{report.identification.nome_fantasia}</p>
                </div>
              )}
              {report.identification.nome_empresa && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nome da Empresa</p>
                  <p className="font-semibold">{report.identification.nome_empresa}</p>
                </div>
              )}
              {report.identification.tipo_unidade && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tipo Unidade</p>
                  <p className="font-semibold">{report.identification.tipo_unidade}</p>
                </div>
              )}
              {report.identification.natureza_juridica && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Natureza Jurídica</p>
                  <p className="font-semibold">{report.identification.natureza_juridica}</p>
                </div>
              )}
              {report.identification.data_abertura && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data de Abertura</p>
                  <p className="font-semibold">{report.identification.data_abertura}</p>
                </div>
              )}
              {report.identification.situacao_cadastral && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Situação Cadastral</p>
                  <Badge variant={report.identification.situacao_cadastral.toLowerCase().includes('ativa') ? 'default' : 'destructive'}>
                    {report.identification.situacao_cadastral}
                  </Badge>
                </div>
              )}
              {report.identification.data_situacao && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Data da Situação</p>
                  <p className="font-semibold">{report.identification.data_situacao}</p>
                </div>
              )}
              {report.identification.website && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a href={report.identification.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.identification.website}
                  </a>
                </div>
              )}
              {report.identification.linkedin_url && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a href={report.identification.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.identification.linkedin_url}
                  </a>
                </div>
              )}
              {report.identification.domain && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Domínio</p>
                  <p className="font-semibold">{report.identification.domain}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: LOCALIZAÇÃO (10 campos) */}
        <TabsContent value="localizacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço Completo (10 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Logradouro</p>
                <p className="font-semibold">{report.location.logradouro}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-semibold">{report.location.numero}</p>
              </div>
              {report.location.complemento && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Complemento</p>
                  <p className="font-semibold">{report.location.complemento}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Bairro</p>
                <p className="font-semibold">{report.location.bairro}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CEP</p>
                <p className="font-semibold">{report.location.cep}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cidade</p>
                <p className="font-semibold">{report.location.cidade}</p>
              </div>
              {report.location.microrregiao && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Microrregião</p>
                  <p className="font-semibold">{report.location.microrregiao}</p>
                </div>
              )}
              {report.location.mesorregiao && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mesorregião</p>
                  <p className="font-semibold">{report.location.mesorregiao}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-semibold">{report.location.estado}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">País</p>
                <p className="font-semibold">{report.location.pais}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: CONTATOS (20 campos - telefones + emails) */}
        <TabsContent value="contatos" className="space-y-4">
          {/* Telefones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Telefones (13 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {report.contacts.assertividade && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Assertividade</p>
                      <Badge>{report.contacts.assertividade}</Badge>
                    </div>
                  )}
                  {report.contacts.melhor_telefone && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Melhor Telefone</p>
                      <p className="font-semibold text-lg text-primary">{report.contacts.melhor_telefone}</p>
                    </div>
                  )}
                  {report.contacts.segundo_melhor_telefone && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Segundo Melhor Telefone</p>
                      <p className="font-semibold">{report.contacts.segundo_melhor_telefone}</p>
                    </div>
                  )}
                  {report.contacts.telefones_alta_assertividade && report.contacts.telefones_alta_assertividade.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Telefones Alta Assertividade</p>
                      <div className="flex flex-wrap gap-2">
                        {report.contacts.telefones_alta_assertividade.map((tel, i) => (
                          <Badge key={i} variant="default">{tel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.telefones_media_assertividade && report.contacts.telefones_media_assertividade.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Telefones Média Assertividade</p>
                      <div className="flex flex-wrap gap-2">
                        {report.contacts.telefones_media_assertividade.map((tel, i) => (
                          <Badge key={i} variant="secondary">{tel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.telefones_baixa_assertividade && report.contacts.telefones_baixa_assertividade.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Telefones Baixa Assertividade</p>
                      <div className="flex flex-wrap gap-2">
                        {report.contacts.telefones_baixa_assertividade.map((tel, i) => (
                          <Badge key={i} variant="outline">{tel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.telefones_matriz && report.contacts.telefones_matriz.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Telefones Matriz</p>
                      <div className="flex flex-wrap gap-2">
                        {report.contacts.telefones_matriz.map((tel, i) => (
                          <Badge key={i}>{tel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.telefones_filiais && report.contacts.telefones_filiais.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Telefones Filiais</p>
                      <div className="flex flex-wrap gap-2">
                        {report.contacts.telefones_filiais.map((tel, i) => (
                          <Badge key={i} variant="secondary">{tel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.celulares && report.contacts.celulares.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Celulares</p>
                      <div className="flex flex-wrap gap-2">
                        {report.contacts.celulares.map((tel, i) => (
                          <Badge key={i}>{tel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.melhor_celular && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Melhor Celular</p>
                      <p className="font-semibold text-primary">{report.contacts.melhor_celular}</p>
                    </div>
                  )}
                  {report.contacts.fixos && report.contacts.fixos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Telefones Fixos</p>
                      <div className="flex flex-wrap gap-2">
                        {report.contacts.fixos.map((tel, i) => (
                          <Badge key={i} variant="outline">{tel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.pat_telefone && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">PAT - Telefone</p>
                      <p className="font-semibold">{report.contacts.pat_telefone}</p>
                    </div>
                  )}
                  {report.contacts.whatsapp && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <Badge variant="default" className="bg-green-600">{report.contacts.whatsapp}</Badge>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Emails */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-mails (7 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {report.contacts.emails_validados_departamentos && report.contacts.emails_validados_departamentos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">E-mails Validados Departamentos</p>
                      <div className="space-y-1">
                        {report.contacts.emails_validados_departamentos.map((email, i) => (
                          <p key={i} className="text-sm font-mono">{email}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.emails_validados_socios && report.contacts.emails_validados_socios.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">E-mails Validados Sócios</p>
                      <div className="space-y-1">
                        {report.contacts.emails_validados_socios.map((email, i) => (
                          <p key={i} className="text-sm font-mono">{email}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.emails_validados_decisores && report.contacts.emails_validados_decisores.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">E-mails Validados Decisores</p>
                      <div className="space-y-1">
                        {report.contacts.emails_validados_decisores.map((email, i) => (
                          <p key={i} className="text-sm font-mono text-primary font-semibold">{email}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.emails_validados_colaboradores && report.contacts.emails_validados_colaboradores.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">E-mails Validados Colaboradores</p>
                      <div className="space-y-1">
                        {report.contacts.emails_validados_colaboradores.map((email, i) => (
                          <p key={i} className="text-sm font-mono">{email}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.contacts.email_pat && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email PAT</p>
                      <p className="font-semibold font-mono">{report.contacts.email_pat}</p>
                    </div>
                  )}
                  {report.contacts.email_receita_federal && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email Receita Federal</p>
                      <p className="font-semibold font-mono">{report.contacts.email_receita_federal}</p>
                    </div>
                  )}
                  {report.contacts.emails_publicos && report.contacts.emails_publicos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">E-mails Públicos</p>
                      <div className="space-y-1">
                        {report.contacts.emails_publicos.map((email, i) => (
                          <p key={i} className="text-sm font-mono">{email}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: ATIVIDADE ECONÔMICA (12 campos) */}
        <TabsContent value="atividade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividade Econômica (12 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Setor Amigável</p>
                  <Badge className="text-base">{report.activity.setor_amigavel}</Badge>
                </div>
                {report.activity.setor && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Setor</p>
                    <p className="font-semibold">{report.activity.setor}</p>
                  </div>
                )}
                {report.activity.segmento && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Segmento</p>
                    <p className="font-semibold">{report.activity.segmento}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Atividade Econômica</p>
                  <p className="font-semibold">{report.activity.atividade_economica}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Código Atividade Econômica</p>
                  <p className="font-mono font-semibold">{report.activity.cod_atividade_economica}</p>
                </div>
                {report.activity.regime_tributario && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Regime Tributário</p>
                    <Badge variant="secondary">{report.activity.regime_tributario}</Badge>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Importação</p>
                  <Badge variant={report.activity.importacao ? "default" : "outline"}>
                    {report.activity.importacao ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Exportação</p>
                  <Badge variant={report.activity.exportacao ? "default" : "outline"}>
                    {report.activity.exportacao ? "Sim" : "Não"}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Atividades Secundárias com Scroll */}
              {report.activity.atividades_secundarias && report.activity.atividades_secundarias.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Atividades Secundárias ({report.activity.atividades_secundarias.length})</p>
                  <ScrollArea className="h-[200px] border rounded-lg p-3">
                    <div className="space-y-2">
                      {report.activity.atividades_secundarias.map((atividade, i) => (
                        <div key={i} className="text-sm p-2 bg-muted/50 rounded">
                          <p className="font-semibold">{atividade}</p>
                          {report.activity.cod_atividades_secundarias && report.activity.cod_atividades_secundarias[i] && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              Código: {report.activity.cod_atividades_secundarias[i]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* NCMs Primários com Scroll */}
              {report.activity.ncms_primarios && report.activity.ncms_primarios.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">NCMs Primários ({report.activity.ncms_primarios.length})</p>
                  <ScrollArea className="h-[300px] border rounded-lg p-3">
                    <div className="space-y-2">
                      {report.activity.ncms_primarios.map((ncm, i) => (
                        <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                          <p className="font-semibold">{ncm}</p>
                          {report.activity.cod_ncms_primarios && report.activity.cod_ncms_primarios[i] && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              Código: {report.activity.cod_ncms_primarios[i]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 5: ESTRUTURA (13 campos) */}
        <TabsContent value="estrutura" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estrutura Organizacional (13 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Funcionários */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Funcionários (7 campos)</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Funcionários</p>
                    <p className="text-2xl font-bold text-primary">{report.structure.total_funcionarios}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Faixa Funcionários</p>
                    <Badge>{report.structure.faixa_funcionarios}</Badge>
                  </div>
                  {report.structure.porte_estimado && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Porte Estimado</p>
                      <Badge variant="secondary">{report.structure.porte_estimado}</Badge>
                    </div>
                  )}
                  {report.structure.funcionarios_presumido_matriz_cnpj && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Func. Presumido Matriz+CNPJ</p>
                      <p className="font-semibold">{report.structure.funcionarios_presumido_matriz_cnpj}</p>
                    </div>
                  )}
                  {report.structure.funcionarios_presumido_este_cnpj && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Func. Presumido Este CNPJ</p>
                      <p className="font-semibold">{report.structure.funcionarios_presumido_este_cnpj}</p>
                    </div>
                  )}
                  {report.structure.pat_funcionarios && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">PAT - Funcionários</p>
                      <p className="font-semibold">{report.structure.pat_funcionarios}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Filiais */}
              {report.structure.qtd_filiais !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Quantidade de Filiais</p>
                  <p className="text-xl font-bold">{report.structure.qtd_filiais}</p>
                </div>
              )}

              <Separator />

              {/* Sócios e Administradores */}
              {report.structure.socios_administradores && report.structure.socios_administradores.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Sócios e Administradores ({report.structure.socios_administradores.length})</p>
                  <ScrollArea className="h-[200px] border rounded-lg p-3">
                    <div className="space-y-2">
                      {report.structure.socios_administradores.map((socio, i) => (
                        <div key={i} className="p-2 bg-muted/50 rounded">
                          <p className="font-semibold">{socio.nome}</p>
                          <p className="text-xs text-muted-foreground">{socio.qualificacao}</p>
                          {socio.cpf && <p className="text-xs font-mono">{socio.cpf}</p>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Decisores */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Decisores</h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Decisores</p>
                  <p className="text-2xl font-bold text-primary">{report.structure.total_decisores}</p>
                </div>
                
                {report.structure.decisores_cargos && report.structure.decisores_cargos.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cargos dos Decisores</p>
                    <div className="flex flex-wrap gap-1">
                      {report.structure.decisores_cargos.map((cargo, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{cargo}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {report.structure.decisores_linkedin && report.structure.decisores_linkedin.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">LinkedIn dos Decisores</p>
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-1">
                        {report.structure.decisores_linkedin.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                            {url}
                          </a>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <Separator />

              {/* Colaboradores */}
              {(report.structure.colaboradores_cargos?.length || report.structure.colaboradores_linkedin?.length) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Colaboradores</h4>
                  
                  {report.structure.colaboradores_cargos && report.structure.colaboradores_cargos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Cargos dos Colaboradores</p>
                      <div className="flex flex-wrap gap-1">
                        {report.structure.colaboradores_cargos.map((cargo, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{cargo}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.structure.colaboradores_linkedin && report.structure.colaboradores_linkedin.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">LinkedIn dos Colaboradores</p>
                      <ScrollArea className="h-[100px]">
                        <div className="space-y-1">
                          {report.structure.colaboradores_linkedin.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                              {url}
                            </a>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 6: FINANCEIRO (19 campos) */}
        <TabsContent value="financeiro" className="space-y-4">
          {/* Dados Básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Dados Financeiros Básicos (9 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              {report.financials.capital_social && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Capital Social</p>
                  <p className="font-semibold">R$ {report.financials.capital_social.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {report.financials.recebimentos_governo_federal && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Recebimentos Governo Federal</p>
                  <p className="font-semibold">R$ {report.financials.recebimentos_governo_federal.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {report.financials.enquadramento_porte && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Enquadramento de Porte</p>
                  <Badge>{report.financials.enquadramento_porte}</Badge>
                </div>
              )}
              {report.financials.faturamento_presumido_matriz_cnpj && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Faturamento Presumido Matriz+CNPJ</p>
                  <p className="font-semibold">R$ {report.financials.faturamento_presumido_matriz_cnpj.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {report.financials.faturamento_presumido_este_cnpj && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Faturamento Presumido Este CNPJ</p>
                  <p className="font-semibold">R$ {report.financials.faturamento_presumido_este_cnpj.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {report.financials.crescimento_empresa && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Crescimento da Empresa</p>
                  <Badge variant="secondary">{report.financials.crescimento_empresa}</Badge>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Receita Anual</p>
                <p className="font-semibold text-lg text-green-600">{report.financials.receita_anual}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Porte</p>
                <Badge className="text-base">{report.financials.porte}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Capacidade de Investimento</p>
                <Badge variant="outline" className="text-base">{report.financials.capacidade_investimento}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Dívidas - com scroll */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Análise de Dívidas (10 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {report.financials.perc_dividas_cnpj_sobre_faturamento !== undefined && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">% Dívidas CNPJ sobre Faturamento Anual</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                        {report.financials.perc_dividas_cnpj_sobre_faturamento.toFixed(2)}%
                      </p>
                    </div>
                  )}
                  {report.financials.perc_dividas_cnpj_socios_sobre_faturamento !== undefined && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">% Dívidas CNPJ e Sócios sobre Faturamento Anual</p>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                        {report.financials.perc_dividas_cnpj_socios_sobre_faturamento.toFixed(2)}%
                      </p>
                    </div>
                  )}
                  
                  <Separator />

                  <div className="grid md:grid-cols-2 gap-3">
                    {report.financials.total_dividas_cnpj_uniao !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total Dívidas CNPJ com União</p>
                        <p className="font-semibold text-red-600">R$ {report.financials.total_dividas_cnpj_uniao.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {report.financials.total_dividas_cnpj_socios_uniao !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total Dívidas CNPJ e Sócios com União</p>
                        <p className="font-semibold text-red-600">R$ {report.financials.total_dividas_cnpj_socios_uniao.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {report.financials.dividas_gerais_cnpj_uniao !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Dívidas Gerais CNPJ com União</p>
                        <p className="font-semibold">R$ {report.financials.dividas_gerais_cnpj_uniao.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {report.financials.dividas_gerais_cnpj_socios_uniao !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Dívidas Gerais CNPJ e Sócios com União</p>
                        <p className="font-semibold">R$ {report.financials.dividas_gerais_cnpj_socios_uniao.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-3">
                    {report.financials.dividas_cnpj_fgts !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Dívidas CNPJ com FGTS</p>
                        <p className="font-semibold">R$ {report.financials.dividas_cnpj_fgts.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {report.financials.dividas_cnpj_socios_fgts !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Dívidas CNPJ e Sócios com FGTS</p>
                        <p className="font-semibold">R$ {report.financials.dividas_cnpj_socios_fgts.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {report.financials.dividas_cnpj_previdencia !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Dívidas CNPJ com Previdência</p>
                        <p className="font-semibold">R$ {report.financials.dividas_cnpj_previdencia.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    {report.financials.dividas_cnpj_socios_previdencia !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Dívidas CNPJ e Sócios com Previdência</p>
                        <p className="font-semibold">R$ {report.financials.dividas_cnpj_socios_previdencia.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 7: PRESENÇA DIGITAL (13 campos) */}
        <TabsContent value="digital" className="space-y-4">
          {/* Sites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sites e Domínios (4 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Website Status</p>
                <Badge variant={report.digitalPresence.website_status.toLowerCase().includes('ativo') ? 'default' : 'destructive'}>
                  {report.digitalPresence.website_status}
                </Badge>
              </div>
              {report.digitalPresence.melhor_site && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Melhor Site</p>
                  <a href={report.digitalPresence.melhor_site} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    {report.digitalPresence.melhor_site}
                  </a>
                </div>
              )}
              {report.digitalPresence.segundo_melhor_site && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Segundo Melhor Site</p>
                  <a href={report.digitalPresence.segundo_melhor_site} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.digitalPresence.segundo_melhor_site}
                  </a>
                </div>
              )}
              {report.digitalPresence.sites && report.digitalPresence.sites.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Todos os Sites ({report.digitalPresence.sites.length})</p>
                  <div className="space-y-1">
                    {report.digitalPresence.sites.map((site, i) => (
                      <a key={i} href={site} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                        {site}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Redes Sociais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Redes Sociais (6 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {report.digitalPresence.instagram && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Instagram</p>
                  <a href={report.digitalPresence.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.digitalPresence.instagram}
                  </a>
                </div>
              )}
              {report.digitalPresence.facebook && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Facebook</p>
                  <a href={report.digitalPresence.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.digitalPresence.facebook}
                  </a>
                </div>
              )}
              {report.digitalPresence.linkedin && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a href={report.digitalPresence.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.digitalPresence.linkedin}
                  </a>
                </div>
              )}
              {report.digitalPresence.twitter && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Twitter/X</p>
                  <a href={report.digitalPresence.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.digitalPresence.twitter}
                  </a>
                </div>
              )}
              {report.digitalPresence.youtube && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">YouTube</p>
                  <a href={report.digitalPresence.youtube} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {report.digitalPresence.youtube}
                  </a>
                </div>
              )}
              {report.digitalPresence.outras_redes && report.digitalPresence.outras_redes.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Outras Redes</p>
                  <div className="space-y-1">
                    {report.digitalPresence.outras_redes.map((rede, i) => (
                      <a key={i} href={rede} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                        {rede}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tecnologias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Stack Tecnológico (3 Campos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Maturidade Digital</p>
                  <Badge className="text-base">{report.digitalPresence.maturidade_digital}/100</Badge>
                </div>
                <Progress value={report.digitalPresence.maturidade_digital} className="h-2" />
                <p className="text-xs text-muted-foreground">{report.digitalPresence.classificacao_maturidade}</p>
              </div>

              <Separator />

              {report.digitalPresence.tecnologias && report.digitalPresence.tecnologias.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Tecnologias Detectadas ({report.digitalPresence.tecnologias.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {report.digitalPresence.tecnologias.map((tech, i) => (
                      <Badge key={i} variant="default">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {report.digitalPresence.ferramentas && report.digitalPresence.ferramentas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Ferramentas ({report.digitalPresence.ferramentas.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {report.digitalPresence.ferramentas.map((tool, i) => (
                      <Badge key={i} variant="secondary">{tool}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {report.metrics.nivel_atividade && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nível de Atividade</p>
                  <Badge variant="outline" className="text-base">{report.metrics.nivel_atividade}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Insights e Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Resumo Executivo</p>
                <p className="text-sm">{report.insights.resumo_executivo}</p>
              </div>

              {report.insights.pontos_fortes && report.insights.pontos_fortes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Pontos Fortes
                  </p>
                  <ul className="space-y-1">
                    {report.insights.pontos_fortes.map((ponto, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.insights.oportunidades && report.insights.oportunidades.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Oportunidades
                  </p>
                  <ul className="space-y-1">
                    {report.insights.oportunidades.map((op, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{op}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.insights.recomendacoes && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">Recomendações</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Melhor Canal</p>
                      <Badge variant="default">{report.insights.recomendacoes.melhor_canal}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ângulo de Venda</p>
                      <p className="text-sm font-semibold">{report.insights.recomendacoes.angulo_venda}</p>
                    </div>
                  </div>
                  {report.insights.recomendacoes.proximos_passos && report.insights.recomendacoes.proximos_passos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Próximos Passos</p>
                      <ol className="space-y-1">
                        {report.insights.recomendacoes.proximos_passos.map((passo, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary font-semibold">{i + 1}.</span>
                            <span>{passo}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {report.insights.tags && report.insights.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {report.insights.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {report.insights.notas && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Notas</p>
                  <p className="text-sm p-3 bg-muted/50 rounded">{report.insights.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
