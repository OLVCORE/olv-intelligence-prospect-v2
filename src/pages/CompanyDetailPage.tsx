import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, Users, FileText, BarChart3, Globe, Shield, 
  Calendar, MapPin, DollarSign, Briefcase, AlertCircle,
  CheckCircle, TrendingUp, Activity, Trash2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DiagnosticUpload } from "@/components/sdr/DiagnosticUpload";
import { CompanyReport } from "@/components/reports/CompanyReport";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAnalyzingFit, setIsAnalyzingFit] = useState(false);
  const [isUpdatingReceita, setIsUpdatingReceita] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: async () => {
      const { data: base, error: baseErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id!)
        .single();
      if (baseErr) throw baseErr;
      if (!base) return null;

      // Busca relações em paralelo (evita erro 400 de joins)
      const [decisorsRes, maturityRes, insightsRes, presenceRes] = await Promise.all([
        supabase.from('decision_makers').select('*').eq('company_id', id!),
        supabase.from('digital_maturity').select('*').eq('company_id', id!),
        supabase.from('insights').select('*').eq('company_id', id!),
        supabase.from('digital_presence').select('*').eq('company_id', id!).maybeSingle(),
      ]);

      return {
        ...base,
        decision_makers: decisorsRes.data || [],
        digital_maturity: maturityRes.data || [],
        insights: insightsRes.data || [],
        digital_presence: presenceRes.data,
      } as any;
    },
    staleTime: 0, // Força refresh para garantir dados atualizados
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p>Empresa não encontrada</p>
      </div>
    );
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-report', {
        body: { companyId: id }
      });

      if (error) throw error;

      toast.success("Relatório gerado com sucesso!", {
        description: "Relatório disponível para visualização"
      });

      // Atualiza o relatório persistido na aba Relatório Completo
      queryClient.invalidateQueries({ queryKey: ['company-report', id] });
      console.log('Report data:', data);
    } catch (error: any) {
      toast.error("Erro ao gerar relatório", {
        description: error.message
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAnalyzeFit = async () => {
    setIsAnalyzingFit(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-totvs-fit', {
        body: { companyId: id }
      });

      if (error) throw error;

      const fitScore = data?.analysis?.fitScore ?? 'N/A';
      toast.success("Análise de Fit TOTVS concluída!", {
        description: `Score de adequação: ${fitScore}`
      });

      console.log('Fit analysis:', data?.analysis);

      // Refresh company data
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    } catch (error: any) {
      toast.error("Erro ao analisar Fit TOTVS", { description: error.message });
    } finally {
      setIsAnalyzingFit(false);
    }
  };

  const handleUpdateReceita = async () => {
    if (!company?.cnpj) {
      toast.error("CNPJ não disponível", { description: "Não é possível atualizar dados sem CNPJ" });
      return;
    }

    setIsUpdatingReceita(true);
    toast.info("Buscando dados da Receita Federal...", {
      description: "Aguarde..."
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj: company.cnpj }
      });
      if (error) throw error;

      const receita = data?.data;
      if (receita) {
      // Merge seguro - preservar dados existentes em raw_data
        const existingRaw = (company.raw_data && typeof company.raw_data === 'object') ? (company.raw_data as any) : {};
        const mergedRaw = {
          ...existingRaw,
          receita,
          // Preservar outros dados importantes
          ...(existingRaw.apollo && { apollo: existingRaw.apollo }),
          ...(existingRaw.segment && { segment: existingRaw.segment }),
          ...(existingRaw.refinamentos && { refinamentos: existingRaw.refinamentos })
        };
        
        const { error: updError } = await supabase
          .from('companies')
          .update({ raw_data: mergedRaw })
          .eq('id', id);
        if (updError) throw updError;
      }

      toast.success("Dados da Receita atualizados!", { description: "Informações cadastrais foram salvas" });

      // Refresh company data
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    } catch (error: any) {
      toast.error("Erro ao atualizar dados da Receita", { description: error.message });
    } finally {
      setIsUpdatingReceita(false);
    }
  };

  const receitaData = (company.raw_data as any)?.receita;
  const maturity = company.digital_maturity?.[0];
  const analysisData = maturity?.analysis_data as any;

  return (
    <div className="p-8 space-y-6">
      <BackButton to="/companies" />
      {/* Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                {company.name}
              </CardTitle>
              {receitaData?.fantasia && receitaData.fantasia !== company.name && (
                <p className="text-lg text-muted-foreground">Nome Fantasia: {receitaData.fantasia}</p>
              )}
            </div>
            <div className="text-right space-y-2">
              {company.digital_maturity_score && (
                <div>
                  <div className="text-4xl font-bold text-primary">{company.digital_maturity_score.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">Score Digital</p>
                </div>
              )}
              <Badge 
                className={`${
                  receitaData?.situacao === 'ATIVA' 
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' 
                    : receitaData?.situacao === 'ALERTA'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
                    : 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                }`}
              >
                {receitaData?.situacao || 'Status desconhecido'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório Completo</TabsTrigger>
          <TabsTrigger value="receita">Receita Federal</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="digital">Presença Digital</TabsTrigger>
          <TabsTrigger value="decisores">Decisores</TabsTrigger>
          <TabsTrigger value="maturity">Maturidade</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados Cadastrais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="font-mono font-semibold">{company.cnpj || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Setor</p>
                  <p className="text-sm">{company.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Porte</p>
                  <p className="text-sm">{receitaData?.porte || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="text-sm">
                    {receitaData?.logradouro}, {receitaData?.numero}
                  </p>
                  <p className="text-sm">{receitaData?.complemento}</p>
                  <p className="text-sm">{receitaData?.bairro}</p>
                  <p className="text-sm font-semibold">
                    {receitaData?.municipio}/{receitaData?.uf} - {receitaData?.cep}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Informações Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Capital Social</p>
                  <p className="text-lg font-bold text-green-600">
                    {receitaData?.capital_social 
                      ? `R$ ${parseFloat(receitaData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data de Abertura</p>
                  <p className="text-sm">{receitaData?.abertura || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividades Econômicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2 text-primary">Atividade Principal:</p>
                {receitaData?.atividade_principal?.map((ativ: any) => (
                  <div key={ativ.code} className="p-3 bg-primary/5 rounded-lg">
                    <Badge variant="outline" className="mb-2">{ativ.code}</Badge>
                    <p className="text-sm">{ativ.text}</p>
                  </div>
                ))}
              </div>

              {receitaData?.atividades_secundarias && receitaData.atividades_secundarias.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Atividades Secundárias: ({receitaData.atividades_secundarias.length})</p>
                  <div className="grid md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {receitaData.atividades_secundarias.slice(0, 10).map((ativ: any, idx: number) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                        <Badge variant="secondary" className="text-xs mb-1">{ativ.code}</Badge>
                        <p className="text-xs">{ativ.text}</p>
                      </div>
                    ))}
                  </div>
                  {receitaData.atividades_secundarias.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{receitaData.atividades_secundarias.length - 10} atividades adicionais
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório Completo Tab - NOVO */}
        <TabsContent value="relatorio" className="space-y-6">
          <CompanyReport companyId={id!} />
        </TabsContent>

        {/* Receita Federal Tab */}
        <TabsContent value="receita" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quadro de Sócios e Administradores (QSA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receitaData?.qsa && receitaData.qsa.length > 0 ? (
                <div className="space-y-3">
                  {receitaData.qsa.map((socio: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">{socio.nome}</p>
                        <Badge variant="outline">{socio.qual}</Badge>
                      </div>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum sócio cadastrado</p>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Situação Cadastral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge 
                    className={`${
                      receitaData?.situacao === 'ATIVA' 
                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' 
                        : receitaData?.situacao === 'ALERTA'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
                        : 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                    }`}
                  >
                    {receitaData?.situacao || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Situação</span>
                  <span className="text-sm font-medium">{receitaData?.data_situacao || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Natureza Jurídica</span>
                  <span className="text-sm font-medium">{receitaData?.natureza_juridica || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Regimes Especiais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Simples Nacional</p>
                  <div className="flex items-center gap-2">
                    {receitaData?.simples?.optante ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Optante desde {receitaData.simples.data_opcao}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Não optante</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">MEI (Simei)</p>
                  <div className="flex items-center gap-2">
                    {receitaData?.simei?.optante ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Optante</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Não optante</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-mono">{receitaData?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm">{receitaData?.telefone || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digital Presence Tab */}
        <TabsContent value="digital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Análise de Presença Digital
              </CardTitle>
              <CardDescription>
                Dados coletados via Serper API e análise de conteúdo web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisData?.organic && analysisData.organic.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Resultados Orgânicos Encontrados:</p>
                  {analysisData.organic.map((result: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">Posição #{result.position}</Badge>
                        {result.date && <span className="text-xs text-muted-foreground">{result.date}</span>}
                      </div>
                      <a 
                        href={result.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {result.title}
                      </a>
                      <p className="text-sm text-muted-foreground">{result.snippet}</p>
                      <a 
                        href={result.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {result.link}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum dado de presença digital disponível</p>
              )}

              {company.website && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Website Principal:</p>
                  <a 
                    href={`https://${company.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.domain}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {company.technologies && company.technologies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tecnologias Detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {company.technologies.map((tech: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Decisores Tab */}
        <TabsContent value="decisores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Decisores Mapeados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.decision_makers && company.decision_makers.length > 0 ? (
                <div className="space-y-3">
                  {company.decision_makers.map((decisor: any) => (
                    <div key={decisor.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-lg">{decisor.name}</p>
                          <p className="text-sm text-muted-foreground">{decisor.title}</p>
                        </div>
                        {decisor.verified_email && (
                          <Badge variant="default">✓ Email Verificado</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        {decisor.email && <p>📧 {decisor.email}</p>}
                        {decisor.department && <p>🏢 {decisor.department}</p>}
                        {decisor.seniority && <p>📊 {decisor.seniority}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum decisor identificado ainda. A API Apollo não retornou contatos para esta empresa.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maturity Tab */}
        <TabsContent value="maturity" className="space-y-6">
          {maturity ? (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Score Geral</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {maturity.overall_score?.toFixed(1)}
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(maturity.overall_score || 0) * 10}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Infraestrutura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{maturity.infrastructure_score?.toFixed(1)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Sistemas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{maturity.systems_score?.toFixed(1)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Processos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{maturity.processes_score?.toFixed(1)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Segurança</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{maturity.security_score?.toFixed(1)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Inovação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{maturity.innovation_score?.toFixed(1)}</div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma análise de maturidade disponível
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scores Tab - NOVA ABA com Financeiro e Jurídico */}
        <TabsContent value="scores" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Score Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Score Financeiro
                </CardTitle>
                <CardDescription>
                  Dados de crédito e saúde financeira
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(company.raw_data as any)?.financial ? (
                  <>
                    {/* Classificação de Risco */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Classificação de Risco</span>
                        <Badge 
                          className={`text-lg px-4 py-1 ${
                            (company.raw_data as any).financial.risk_classification === 'A' ? 'bg-green-600 hover:bg-green-700' :
                            (company.raw_data as any).financial.risk_classification === 'B' ? 'bg-blue-600 hover:bg-blue-700' :
                            (company.raw_data as any).financial.risk_classification === 'C' ? 'bg-yellow-600 hover:bg-yellow-700' :
                            (company.raw_data as any).financial.risk_classification === 'D' ? 'bg-orange-600 hover:bg-orange-700' :
                            'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {(company.raw_data as any).financial.risk_classification}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(company.raw_data as any).financial.risk_classification === 'A' && 'Excelente - Risco Muito Baixo'}
                        {(company.raw_data as any).financial.risk_classification === 'B' && 'Bom - Risco Baixo'}
                        {(company.raw_data as any).financial.risk_classification === 'C' && 'Regular - Risco Médio'}
                        {(company.raw_data as any).financial.risk_classification === 'D' && 'Atenção - Risco Alto'}
                        {(company.raw_data as any).financial.risk_classification === 'E' && 'Crítico - Risco Muito Alto'}
                      </p>
                    </div>

                    {/* Scores Principais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Score de Crédito</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(company.raw_data as any).financial.credit_score}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">de 1000</p>
                      </div>
                      
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Risco Preditivo</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(company.raw_data as any).financial.predictive_risk_score}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">de 100</p>
                      </div>
                    </div>

                    {/* Histórico de Pagamentos */}
                    {(company.raw_data as any).financial.payment_history && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm font-semibold mb-3">Histórico de Pagamentos</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">No Prazo:</span>
                            <span className="font-medium text-green-600">
                              {(company.raw_data as any).financial.payment_history.on_time} pagamentos
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Atrasados:</span>
                            <span className="font-medium text-orange-600">
                              {(company.raw_data as any).financial.payment_history.late} pagamentos
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Inadimplentes:</span>
                            <span className="font-medium text-red-600">
                              {(company.raw_data as any).financial.payment_history.defaulted} pagamentos
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Indicadores de Dívida */}
                    {(company.raw_data as any).financial.debt_indicators && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm font-semibold mb-3">Indicadores de Dívida</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total de Protestos:</span>
                            <Badge variant={(company.raw_data as any).financial.debt_indicators.total_protests > 0 ? 'destructive' : 'secondary'}>
                              {(company.raw_data as any).financial.debt_indicators.total_protests}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Protestos Ativos:</span>
                            <Badge variant={(company.raw_data as any).financial.debt_indicators.active_protests > 0 ? 'destructive' : 'secondary'}>
                              {(company.raw_data as any).financial.debt_indicators.active_protests}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor Total:</span>
                            <span className="font-bold text-red-600">
                              R$ {(company.raw_data as any).financial.debt_indicators.total_debt?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fontes de Dados */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold mb-2">Fontes Consultadas:</p>
                      <div className="flex flex-wrap gap-2">
                        {(company.raw_data as any).financial.serasa_data && <Badge variant="outline" className="text-[10px]">Serasa</Badge>}
                        {(company.raw_data as any).financial.scpc_data && <Badge variant="outline" className="text-[10px]">SCPC</Badge>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Dados financeiros não disponíveis
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Execute o enriquecimento 360° para obter estes dados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Jurídico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Score Jurídico
                </CardTitle>
                <CardDescription>
                  Processos judiciais e saúde jurídica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(company.raw_data as any)?.legal ? (
                  <>
                    {/* Nível de Risco */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Nível de Risco Jurídico</span>
                        <Badge 
                          className={`text-lg px-4 py-1 ${
                            (company.raw_data as any).legal.risk_level === 'baixo' ? 'bg-green-500 hover:bg-green-600 text-white' :
                            (company.raw_data as any).legal.risk_level === 'medio' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                            (company.raw_data as any).legal.risk_level === 'alto' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                            'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {(company.raw_data as any).legal.risk_level?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(company.raw_data as any).legal.risk_level === 'baixo' && 'Baixo risco - Poucas ações judiciais'}
                        {(company.raw_data as any).legal.risk_level === 'medio' && 'Risco moderado - Processos sob controle'}
                        {(company.raw_data as any).legal.risk_level === 'alto' && 'Alto risco - Muitos processos ativos'}
                        {(company.raw_data as any).legal.risk_level === 'critico' && 'Risco crítico - Situação preocupante'}
                      </p>
                    </div>

                    {/* Scores Principais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Processos Ativos</p>
                        <p className="text-2xl font-bold text-red-600">
                          {(company.raw_data as any).legal.active_processes}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">em andamento</p>
                      </div>
                      
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">Total de Processos</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {(company.raw_data as any).legal.total_processes}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">histórico completo</p>
                      </div>
                    </div>

                    {/* Saúde Jurídica Score */}
                    <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Saúde Jurídica</span>
                        <span className="text-3xl font-bold text-green-600">
                          {(company.raw_data as any).legal.legal_health_score}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (company.raw_data as any).legal.legal_health_score >= 70 ? 'bg-green-500' :
                            (company.raw_data as any).legal.legal_health_score >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(company.raw_data as any).legal.legal_health_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Tipos de Processos */}
                    {(company.raw_data as any).legal.jusbrasil_data?.processesByType && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm font-semibold mb-3">Processos por Tipo</p>
                        <div className="space-y-2">
                          {Object.entries((company.raw_data as any).legal.jusbrasil_data.processesByType).map(([tipo, qtd]: [string, any]) => (
                            qtd > 0 && (
                              <div key={tipo} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground capitalize">{tipo}:</span>
                                <Badge variant="outline">{qtd} processos</Badge>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status dos Processos */}
                    {(company.raw_data as any).legal.jusbrasil_data?.processesByStatus && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm font-semibold mb-3">Processos por Status</p>
                        <div className="space-y-2">
                          {Object.entries((company.raw_data as any).legal.jusbrasil_data.processesByStatus).map(([status, qtd]: [string, any]) => (
                            qtd > 0 && (
                              <div key={status} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground capitalize">{status}:</span>
                                <Badge 
                                  variant={status === 'ativo' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {qtd}
                                </Badge>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fontes de Dados */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold mb-2">Fontes Consultadas:</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px]">JusBrasil</Badge>
                        {(company.raw_data as any).legal.ceis_data && <Badge variant="outline" className="text-[10px]">CEIS</Badge>}
                        {(company.raw_data as any).legal.cnep_data && <Badge variant="outline" className="text-[10px]">CNEP</Badge>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Dados jurídicos não disponíveis
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Execute o enriquecimento 360° para obter estes dados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Nota sobre os dados */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Sobre os Scores</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Os scores financeiro e jurídico são calculados com base em dados de múltiplas fontes públicas e privadas.
                    <strong className="text-foreground"> Score Financeiro:</strong> Serasa, SCPC e histórico de crédito.
                    <strong className="text-foreground"> Score Jurídico:</strong> JusBrasil, CEIS e CNEP.
                    Os dados são atualizados periodicamente para garantir precisão nas análises.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          {/* Upload de Diagnóstico SDR */}
          <DiagnosticUpload companyId={company.id} companyName={company.name} />

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ações Recomendadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
                  ) : (
                    <><FileText className="h-4 w-4 mr-2" />Gerar Relatório Completo (PDF)</>
                  )}
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleAnalyzeFit}
                  disabled={isAnalyzingFit}
                >
                  {isAnalyzingFit ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analisando...</>
                  ) : (
                    <><TrendingUp className="h-4 w-4 mr-2" />Analisar Fit TOTVS</>
                  )}
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleUpdateReceita}
                  disabled={isUpdatingReceita}
                >
                  {isUpdatingReceita ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Atualizando...</>
                  ) : (
                    <><Shield className="h-4 w-4 mr-2" />Atualizar Dados da Receita</>
                  )}
                </Button>
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Empresa
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Dados cadastrais coletados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Análise de maturidade concluída</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span>Mapear decisores (Apollo API)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span>Enriquecer emails (Hunter.io)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{company?.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('companies')
                    .delete()
                    .eq('id', id);

                  if (error) throw error;

                  toast.success('Empresa excluída com sucesso');
                  navigate('/companies');
                } catch (error) {
                  console.error('Error deleting company:', error);
                  toast.error('Erro ao excluir empresa');
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}
