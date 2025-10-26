import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/common/BackButton";
import { LinkedInEnrichButton } from "@/components/common/LinkedInEnrichButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import LocationMap from "@/components/map/LocationMap";
import { 
  Building2, Users, FileText, BarChart3, Globe, Shield, 
  Calendar, MapPin, DollarSign, Briefcase, AlertCircle,
  CheckCircle, TrendingUp, Activity, Trash2, Loader2, RefreshCw, Target,
  UserPlus, TestTube, Phone, Mail, Eye, IdCard, MapPinned, ActivityIcon,
  UsersIcon, Wallet, Monitor, Brain, FileSpreadsheet, Zap
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCompanyReport } from "@/hooks/useCompanyReport";
import DecisionMakerAddDialog from "@/components/companies/DecisionMakerAddDialog";
import apolloLogo from "@/assets/logos/apollo.ico";
import phantomLogo from "@/assets/logos/phantombuster.png";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider 
} from "@/components/ui/sidebar";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAnalyzingFit, setIsAnalyzingFit] = useState(false);
  const [isUpdatingReceita, setIsUpdatingReceita] = useState(false);
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [isTestingApollo, setIsTestingApollo] = useState(false);
  const [isRunningPhantom, setIsRunningPhantom] = useState(false);
  const location = useLocation();

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
    staleTime: 0,
  });

  const { data: execReport, isLoading: isReportLoading, refetch: refetchReport } = useCompanyReport(id);

  const { data: fitSignal } = useQuery({
    queryKey: ['fit-analysis', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_signals')
        .select('raw_data')
        .eq('company_id', id!)
        .eq('signal_type', 'totvs_fit_analysis')
        .order('detected_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return (data as any)?.raw_data || null;
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['overview','identificacao','localizacao','atividade','estrutura','financeiro','digital','inteligencia','receita','actions'].includes(tab)) {
      setActiveSection(tab);
    }
  }, [location.search]);

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
        body: { company_id: id }
      });

      if (error) throw error;

      toast.success("Análise de Fit concluída!", {
        description: "Veja os resultados na aba Fit TOTVS"
      });

      queryClient.invalidateQueries({ queryKey: ['fit-analysis', id] });
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      setActiveSection('inteligencia');
    } catch (error: any) {
      toast.error("Erro ao analisar Fit TOTVS", {
        description: error.message
      });
    } finally {
      setIsAnalyzingFit(false);
    }
  };

  const handleUpdateReceita = async () => {
    setIsUpdatingReceita(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj: company.cnpj, company_id: id }
      });

      if (error) throw error;

      toast.success("Dados da Receita Federal atualizados!");
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    } catch (error: any) {
      toast.error("Erro ao atualizar dados da Receita Federal", {
        description: error.message
      });
    } finally {
      setIsUpdatingReceita(false);
    }
  };

  const handleSmartRefresh = async () => {
    setIsSmartRefreshing(true);
    try {
      toast.info('Executando atualização inteligente...', {
        description: 'Receita + 360° + Maturidade + Relatório'
      });

      await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj: company.cnpj, company_id: id }
      });

      await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: id }
      });

      await supabase.functions.invoke('calculate-maturity-score', {
        body: { companyId: id }
      });

      await supabase.functions.invoke('generate-company-report', {
        body: { companyId: id }
      });

      toast.success('Atualização completa realizada!');
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['company-report', id] });
    } catch (error: any) {
      toast.error('Erro na atualização', {
        description: error.message
      });
    } finally {
      setIsSmartRefreshing(false);
    }
  };

  const handleTestApollo = async () => {
    const receitaData = (company as any)?.raw_data?.receita;
    setIsTestingApollo(true);
    try {
      const searchName = (receitaData?.fantasia && receitaData.fantasia !== company.name) ? receitaData.fantasia : company.name;
      const { data: apolloData, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'people',
          organizationName: searchName,
          ...(company.domain ? { domain: company.domain } : {}),
          titles: ['CEO','CTO','CFO','CIO','Diretor','Diretora','Gerente','VP','Head','TI','Tecnologia','Financeiro','Compras','Procurement','Operations','COO']
        }
      });
      if (error) throw error;

      const people = (apolloData as any)?.people || [];
      for (const person of people.slice(0, 5)) {
        const department = person.functions?.[0]
          ? person.functions[0].charAt(0).toUpperCase() + person.functions[0].slice(1)
          : null;
        const phone = person.phone_numbers?.[0]?.raw_number || null;
        await supabase.from('decision_makers').upsert({
          company_id: id,
          name: person.name,
          title: person.title,
          email: person.email,
          phone,
          linkedin_url: person.linkedin_url,
          seniority: person.seniority,
          department,
          verified_email: person.email_status === 'verified',
          source: 'apollo'
        } as any);
      }

      await queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      await queryClient.invalidateQueries({ queryKey: ['decision_makers', id] });
      if (people.length > 0) {
        toast.success('Apollo retornou decisores!', { description: `${people.length} contatos encontrados` });
      } else {
        toast.info('Apollo não retornou decisores para esta empresa.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Falha ao testar Apollo', { description: e.message });
    } finally {
      setIsTestingApollo(false);
    }
  };

  const handleRunPhantom = async () => {
    setIsRunningPhantom(true);
    try {
      const dp = (company as any)?.digital_presence || {};
      const raw = (company as any)?.raw_data || {};
      const linkedinUrl = dp.linkedin || raw.linkedin || raw?.social?.linkedin || (company as any)?.linkedin_url || null;

      if (!linkedinUrl) {
        toast.info('LinkedIn não encontrado', { description: 'Adicione a URL do LinkedIn da empresa para usar o PhantomBuster.' });
        setIsRunningPhantom(false);
        return;
      }

      toast.info('Executando PhantomBuster...', { description: 'Raspando perfis/empresa no LinkedIn' });
      const { data, error } = await supabase.functions.invoke('linkedin-scrape', {
        body: { linkedin_url: linkedinUrl, company_id: id }
      });
      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['company-detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['decision_makers', id] }),
      ]);
      const res: any = data;
      const found = Array.isArray(res?.profiles) ? res.profiles.length : Array.isArray(res?.data?.profiles) ? res.data.profiles.length : undefined;
      const success = typeof res?.success === 'boolean' ? res.success : undefined;
      const message = typeof res?.message === 'string' ? res.message : undefined;
      if (success === false) {
        toast.info('PhantomBuster não executou', { description: message || 'Verifique as credenciais do PhantomBuster.' });
      } else {
        toast.success('PhantomBuster concluído', { description: found ? `${found} perfil(is) encontrado(s)` : (message || 'Execução iniciada') });
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Falha ao executar PhantomBuster', { description: e.message });
    } finally {
      setIsRunningPhantom(false);
    }
  };

  const receitaData = (company as any)?.raw_data?.receita;
  const maturity = (company as any)?.digital_maturity?.[0];
  const decisors = (company as any)?.decision_makers || [];
  const digitalPresence = (company as any)?.digital_presence;
  
  // Seções do menu
  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: Eye, description: 'Resumo e principais informações' },
    { id: 'identificacao', label: 'Identificação', icon: IdCard, description: 'Dados cadastrais e CNPJ' },
    { id: 'localizacao', label: 'Localização & Contato', icon: MapPinned, description: 'Endereço, telefone, emails' },
    { id: 'atividade', label: 'Atividade Econômica', icon: ActivityIcon, description: 'CNAEs, NCMs, produtos' },
    { id: 'estrutura', label: 'Estrutura', icon: UsersIcon, description: 'Decisores, sócios, organograma' },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet, description: 'Capital social, faturamento' },
    { id: 'digital', label: 'Presença Digital', icon: Monitor, description: 'Website, redes sociais, tech stack' },
    { id: 'inteligencia', label: 'Análise & IA', icon: Brain, description: 'Scores, fit TOTVS, insights' },
    { id: 'receita', label: 'Receita Federal', icon: FileSpreadsheet, description: 'Dados oficiais da RFB' },
    { id: 'actions', label: 'Ações', icon: Zap, description: 'Enriquecimento e configurações' },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar className="w-64 border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <SidebarMenuItem key={section.id}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => setActiveSection(section.id)}
                                isActive={activeSection === section.id}
                                className="w-full"
                              >
                                <Icon className="h-4 w-4" />
                                <span>{section.label}</span>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              {section.description}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 p-8 space-y-6 overflow-auto">
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
                  <div className="flex items-center justify-end gap-2">
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            size="icon"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleSmartRefresh}
                            disabled={isSmartRefreshing}
                            aria-label="Atualizar dados da empresa"
                          >
                            {isSmartRefreshing ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-primary-foreground" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Atualizar dados (Receita + 360° + Maturidade + Relatório)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Conteúdo baseado na seção ativa */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Situação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={receitaData?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                      {receitaData?.situacao || 'Desconhecido'}
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">CNPJ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono">{company.cnpj || 'N/A'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Porte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{receitaData?.porte || company.size || 'N/A'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Setor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{company.industry || 'N/A'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Funcionários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{company.employees || receitaData?.qsa?.length || 'N/A'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Data de Abertura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{receitaData?.abertura ? new Date(receitaData.abertura).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'identificacao' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    Dados Cadastrais
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                      <p className="font-mono font-semibold text-lg">{company.cnpj || 'N/A'}</p>
                    </div>
                    {receitaData?.razao_social && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                        <p className="font-semibold">{receitaData.razao_social}</p>
                      </div>
                    )}
                    {receitaData?.fantasia && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nome Fantasia</p>
                        <p className="font-semibold">{receitaData.fantasia}</p>
                      </div>
                    )}
                    {receitaData?.abertura && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data de Abertura</p>
                        <p>{new Date(receitaData.abertura).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Setor</p>
                      <p>{company.industry || 'N/A'}</p>
                    </div>
                    {receitaData?.porte && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Porte</p>
                        <p>{receitaData.porte}</p>
                      </div>
                    )}
                    {receitaData?.natureza_juridica && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Natureza Jurídica</p>
                        <p>{receitaData.natureza_juridica}</p>
                      </div>
                    )}
                    {receitaData?.situacao && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Situação Cadastral</p>
                        <Badge variant={receitaData.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                          {receitaData.situacao}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'localizacao' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPinned className="h-5 w-5" />
                    Endereço e Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Endereço</h3>
                      {receitaData?.logradouro && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Logradouro</p>
                          <p>{receitaData.logradouro}, {receitaData.numero}</p>
                          {receitaData.complemento && <p className="text-sm">{receitaData.complemento}</p>}
                        </div>
                      )}
                      {receitaData?.bairro && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Bairro</p>
                          <p>{receitaData.bairro}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cidade/Estado</p>
                        <p>{receitaData?.municipio || (company.location as any)?.city || 'N/A'} - {receitaData?.uf || (company.location as any)?.state || 'N/A'}</p>
                      </div>
                      {receitaData?.cep && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CEP</p>
                          <p className="font-mono">{receitaData.cep}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Contato</h3>
                      {receitaData?.telefone && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                          <p className="font-mono">{receitaData.telefone}</p>
                        </div>
                      )}
                      {receitaData?.email && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                          <p>{receitaData.email}</p>
                        </div>
                      )}
                      {company.website && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Website</p>
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {company.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {(receitaData?.logradouro || receitaData?.municipio || receitaData?.cep) && (
                    <div className="h-64 rounded-lg overflow-hidden border">
                      <LocationMap
                        address={receitaData?.logradouro}
                        numero={receitaData?.numero}
                        municipio={receitaData?.municipio}
                        estado={receitaData?.uf}
                        cep={receitaData?.cep}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'atividade' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5" />
                    Atividades Econômicas (CNAEs)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {receitaData?.atividade_principal && (
                    <div>
                      <h3 className="font-semibold mb-3">Atividade Principal</h3>
                      {receitaData.atividade_principal.map((ativ: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-mono text-sm text-muted-foreground">{ativ.code}</p>
                          <p className="font-medium">{ativ.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {receitaData?.atividades_secundarias && receitaData.atividades_secundarias.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Atividades Secundárias ({receitaData.atividades_secundarias.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {receitaData.atividades_secundarias.map((ativ: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-mono text-sm text-muted-foreground">{ativ.code}</p>
                            <p className="text-sm">{ativ.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!receitaData?.atividade_principal && !receitaData?.atividades_secundarias && (
                    <p className="text-muted-foreground">Nenhuma atividade econômica cadastrada</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'estrutura' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5" />
                      Decisores e Contatos ({decisors.length})
                    </CardTitle>
                    <DecisionMakerAddDialog companyId={company.id} />
                  </div>
                </CardHeader>
                <CardContent>
                  {decisors.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhum decisor cadastrado</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {decisors.map((decisor: any) => (
                        <Card key={decisor.id} className="p-4">
                          <div className="space-y-2">
                            <p className="font-semibold text-lg">{decisor.name}</p>
                            <p className="text-sm text-muted-foreground">{decisor.title || 'Cargo não informado'}</p>
                            {decisor.department && (
                              <Badge variant="outline">{decisor.department}</Badge>
                            )}
                            <Separator className="my-2" />
                            <div className="space-y-1">
                              {decisor.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3" />
                                  <a href={`mailto:${decisor.email}`} className="text-primary hover:underline">
                                    {decisor.email}
                                  </a>
                                </div>
                              )}
                              {decisor.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <a href={`tel:${decisor.phone}`} className="text-primary hover:underline">
                                    {decisor.phone}
                                  </a>
                                </div>
                              )}
                              {decisor.linkedin_url && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="h-3 w-3" />
                                  <a href={decisor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    LinkedIn
                                  </a>
                                </div>
                              )}
                            </div>
                            {decisor.source && (
                              <Badge variant="secondary" className="text-xs mt-2">
                                Fonte: {decisor.source}
                              </Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {receitaData?.qsa && receitaData.qsa.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Quadro Societário ({receitaData.qsa.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {receitaData.qsa.map((socio: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-semibold">{socio.nome}</p>
                          <p className="text-sm text-muted-foreground">{socio.qual}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'financeiro' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Informações Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {receitaData?.capital_social && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Capital Social</p>
                        <p className="text-xl font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(parseFloat(receitaData.capital_social))}
                        </p>
                      </div>
                    )}
                    
                    {company.revenue && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Faturamento Estimado</p>
                        <p className="text-xl font-semibold">{company.revenue}</p>
                      </div>
                    )}

                    {receitaData?.porte && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Porte da Empresa</p>
                        <Badge variant="outline" className="text-base">{receitaData.porte}</Badge>
                      </div>
                    )}

                    {company.employees && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Número de Funcionários</p>
                        <p className="text-lg font-semibold">{company.employees}</p>
                      </div>
                    )}
                  </div>

                  {!receitaData?.capital_social && !company.revenue && !company.employees && (
                    <p className="text-muted-foreground text-center py-8">Nenhuma informação financeira disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'digital' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Presença Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Website e Domínio</h3>
                      {company.website && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Website</p>
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {company.website}
                          </a>
                        </div>
                      )}
                      {company.domain && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Domínio</p>
                          <p className="font-mono">{company.domain}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Redes Sociais</h3>
                      {digitalPresence?.linkedin && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                          <a href={digitalPresence.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Ver perfil
                          </a>
                        </div>
                      )}
                      {digitalPresence?.facebook && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Facebook</p>
                          <a href={digitalPresence.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Ver perfil
                          </a>
                        </div>
                      )}
                      {digitalPresence?.twitter && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Twitter/X</p>
                          <a href={digitalPresence.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Ver perfil
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {company.digital_maturity_score && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Score de Maturidade Digital</p>
                          <p className="text-sm text-muted-foreground">Avaliação geral da presença digital</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">{company.digital_maturity_score.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">de 100</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!company.website && !digitalPresence?.linkedin && !company.domain && (
                    <p className="text-muted-foreground text-center py-8">Nenhuma informação de presença digital disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'inteligencia' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Análise & Inteligência Artificial
                    </CardTitle>
                    <Button onClick={handleAnalyzeFit} disabled={isAnalyzingFit}>
                      {isAnalyzingFit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Analisar Fit TOTVS
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {fitSignal ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Score de Fit</p>
                        <p className="text-2xl font-bold text-primary">{fitSignal.score || 'N/A'}</p>
                      </div>
                      {fitSignal.reasoning && (
                        <div>
                          <p className="text-sm text-muted-foreground">Análise</p>
                          <p className="text-sm">{fitSignal.reasoning}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Clique em "Analisar Fit TOTVS" para gerar a análise</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'receita' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Dados da Receita Federal
                    </CardTitle>
                    <Button onClick={handleUpdateReceita} disabled={isUpdatingReceita} variant="outline">
                      {isUpdatingReceita ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {receitaData ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Situação</p>
                        <Badge variant={receitaData.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                          {receitaData.situacao}
                        </Badge>
                      </div>
                      {receitaData.atividade_principal && (
                        <div>
                          <p className="text-sm text-muted-foreground">Atividade Principal</p>
                          <p>{receitaData.atividade_principal[0]?.text}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum dado da Receita Federal disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'actions' && (
            <div className="space-y-6">
              <DiagnosticUpload companyId={company.id} companyName={company.name} />
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <img src={apolloLogo} alt="Apollo" className="h-5 w-5" />
                      Apollo.io
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleTestApollo} disabled={isTestingApollo} className="w-full">
                      {isTestingApollo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Buscar Decisores
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <img src={phantomLogo} alt="PhantomBuster" className="h-5 w-5" />
                      PhantomBuster
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleRunPhantom} disabled={isRunningPhantom} className="w-full">
                      {isRunningPhantom ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Raspar LinkedIn
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Zona de Perigo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Empresa
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

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
    </SidebarProvider>
  );
}
