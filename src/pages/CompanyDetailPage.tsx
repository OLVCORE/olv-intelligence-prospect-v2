import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      const { data } = await supabase
        .from('companies')
        .select(`
          *,
          decision_makers (*),
          digital_maturity (*),
          buying_signals (*)
        `)
        .eq('id', id)
        .single();
      return data;
    }
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
    try {
      const { data, error } = await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj: company.cnpj }
      });
      if (error) throw error;

      const receita = data?.data;
      if (receita) {
        const baseRaw: Record<string, any> = (company.raw_data && typeof company.raw_data === 'object') ? (company.raw_data as any) : {};
        const newRaw = { ...baseRaw, receita };
        const { error: updError } = await supabase
          .from('companies')
          .update({ raw_data: newRaw })
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
              <Badge variant={receitaData?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                {receitaData?.situacao || 'Status desconhecido'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório Completo</TabsTrigger>
          <TabsTrigger value="receita">Receita Federal</TabsTrigger>
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
          <div className="grid md:grid-cols-3 gap-6">
            {/* Coluna 1 - Identificação e Situação */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dados Cadastrais Completos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Razão Social</p>
                    <p className="font-semibold">{company.name}</p>
                  </div>
                  {receitaData?.fantasia && (
                    <div>
                      <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                      <p className="font-semibold">{receitaData.fantasia}</p>
                    </div>
                  )}
                  {receitaData?.cnpj && (
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      <p className="font-mono">{receitaData.cnpj}</p>
                    </div>
                  )}
                  {receitaData?.tipo && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <Badge variant="outline">{receitaData.tipo}</Badge>
                    </div>
                  )}
                  {receitaData?.porte && (
                    <div>
                      <p className="text-xs text-muted-foreground">Porte</p>
                      <Badge>{receitaData.porte}</Badge>
                    </div>
                  )}
                  {receitaData?.abertura && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Abertura</p>
                      <p className="font-medium">{receitaData.abertura}</p>
                    </div>
                  )}
                  {receitaData?.natureza_juridica && (
                    <div>
                      <p className="text-xs text-muted-foreground">Natureza Jurídica</p>
                      <p className="text-xs">{receitaData.natureza_juridica}</p>
                    </div>
                  )}
                  {receitaData?.capital_social && (
                    <div>
                      <p className="text-xs text-muted-foreground">Capital Social</p>
                      <p className="font-bold text-green-600">
                        R$ {parseFloat(receitaData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Situação Cadastral */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Situação Cadastral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={receitaData?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                      {receitaData?.situacao || 'N/A'}
                    </Badge>
                  </div>
                  {receitaData?.data_situacao && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Data Situação</span>
                      <span className="font-medium">{receitaData.data_situacao}</span>
                    </div>
                  )}
                  {receitaData?.motivo_situacao && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                      <p className="text-xs">{receitaData.motivo_situacao}</p>
                    </div>
                  )}
                  {receitaData?.situacao_especial && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Situação Especial</p>
                      <p className="text-xs">{receitaData.situacao_especial}</p>
                      {receitaData.data_situacao_especial && (
                        <p className="text-xs text-muted-foreground">Data: {receitaData.data_situacao_especial}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Regimes Tributários */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Regimes Tributários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {receitaData?.simples && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Simples Nacional</span>
                        <Badge variant={receitaData.simples.optante ? 'default' : 'secondary'}>
                          {receitaData.simples.optante ? 'Optante' : 'Não Optante'}
                        </Badge>
                      </div>
                      {receitaData.simples.data_opcao && (
                        <p className="text-xs text-muted-foreground">Opção: {receitaData.simples.data_opcao}</p>
                      )}
                      {receitaData.simples.data_exclusao && (
                        <p className="text-xs text-muted-foreground">Exclusão: {receitaData.simples.data_exclusao}</p>
                      )}
                      {receitaData.simples.ultima_atualizacao && (
                        <p className="text-xs text-muted-foreground">Atualização: {receitaData.simples.ultima_atualizacao}</p>
                      )}
                    </div>
                  )}
                  {receitaData?.simei && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">MEI (Simei)</span>
                        <Badge variant={receitaData.simei.optante ? 'default' : 'secondary'}>
                          {receitaData.simei.optante ? 'Optante' : 'Não Optante'}
                        </Badge>
                      </div>
                      {receitaData.simei.data_opcao && (
                        <p className="text-xs text-muted-foreground">Opção: {receitaData.simei.data_opcao}</p>
                      )}
                    </div>
                  )}
                  {receitaData?.efr && (
                    <div>
                      <span className="text-xs text-muted-foreground">EFR</span>
                      <p className="font-medium">{receitaData.efr}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna 2 - Endereço e Contato */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço Completo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {receitaData?.logradouro && (
                    <div>
                      <p className="text-xs text-muted-foreground">Logradouro</p>
                      <p className="font-medium">{receitaData.logradouro}, {receitaData.numero || 'S/N'}</p>
                    </div>
                  )}
                  {receitaData?.complemento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Complemento</p>
                      <p>{receitaData.complemento}</p>
                    </div>
                  )}
                  {receitaData?.bairro && (
                    <div>
                      <p className="text-xs text-muted-foreground">Bairro</p>
                      <p className="font-medium">{receitaData.bairro}</p>
                    </div>
                  )}
                  {receitaData?.municipio && (
                    <div>
                      <p className="text-xs text-muted-foreground">Município</p>
                      <p className="font-semibold">{receitaData.municipio}/{receitaData.uf}</p>
                    </div>
                  )}
                  {receitaData?.cep && (
                    <div>
                      <p className="text-xs text-muted-foreground">CEP</p>
                      <p className="font-mono">{receitaData.cep}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {receitaData?.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-mono text-xs break-all">{receitaData.email}</p>
                    </div>
                  )}
                  {receitaData?.telefone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{receitaData.telefone}</p>
                    </div>
                  )}
                  {company.website && (
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.linkedin_url && (
                    <div>
                      <p className="text-xs text-muted-foreground">LinkedIn</p>
                      <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                        Ver perfil
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* QSA - Quadro de Sócios */}
              {receitaData?.qsa && receitaData.qsa.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Quadro de Sócios e Administradores ({receitaData.qsa.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {receitaData.qsa.map((socio: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/30">
                          <p className="font-semibold text-sm">{socio.nome}</p>
                          <Badge variant="outline" className="text-xs mt-1">{socio.qual}</Badge>
                          {socio.pais_origem && socio.pais_origem !== 'BRASIL' && (
                            <p className="text-xs text-muted-foreground mt-1">País: {socio.pais_origem}</p>
                          )}
                          {socio.nome_rep_legal && (
                            <div className="mt-2 pt-2 border-t text-xs">
                              <p className="text-muted-foreground">Representante Legal:</p>
                              <p className="font-medium">{socio.nome_rep_legal}</p>
                              <p className="text-xs text-muted-foreground">{socio.qual_rep_legal}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Coluna 3 - Atividades e Metadata */}
            <div className="space-y-6">
              {/* Atividade Principal */}
              {receitaData?.atividade_principal && receitaData.atividade_principal.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Atividade Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {receitaData.atividade_principal.map((ativ: any, idx: number) => (
                      <div key={idx} className="p-3 bg-primary/5 rounded-lg">
                        <Badge variant="outline" className="mb-2">{ativ.code}</Badge>
                        <p className="text-sm leading-relaxed">{ativ.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Atividades Secundárias */}
              {receitaData?.atividades_secundarias && receitaData.atividades_secundarias.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Atividades Secundárias ({receitaData.atividades_secundarias.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {receitaData.atividades_secundarias.map((ativ: any, idx: number) => (
                        <div key={idx} className="p-2 bg-muted/50 rounded text-sm border-l-2 border-primary/20">
                          <Badge variant="secondary" className="text-xs mb-1">{ativ.code}</Badge>
                          <p className="text-xs leading-relaxed">{ativ.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata da API */}
              {receitaData?.ultima_atualizacao && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informações da Base de Dados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Última Atualização (ReceitaWS)</p>
                      <p className="font-medium">{receitaData.ultima_atualizacao}</p>
                    </div>
                    {receitaData.status && (
                      <div>
                        <p className="text-muted-foreground">Status da Consulta</p>
                        <Badge variant="secondary">{receitaData.status}</Badge>
                      </div>
                    )}
                    {receitaData.billing && (
                      <div>
                        <p className="text-muted-foreground">Billing Info</p>
                        <div className="flex gap-2 mt-1">
                          {receitaData.billing.free && <Badge variant="outline" className="text-[10px]">Free</Badge>}
                          {receitaData.billing.database && <Badge variant="outline" className="text-[10px]">Database</Badge>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
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
                  <Badge variant={receitaData?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
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

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
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
