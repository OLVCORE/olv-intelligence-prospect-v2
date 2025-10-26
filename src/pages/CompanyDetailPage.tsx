import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DecisionMakerAddDialog from "@/components/companies/DecisionMakerAddDialog";
import { DecisorsCollaboratorsCard } from "@/components/companies/DecisorsCollaboratorsCard";
import { RichContactsCard } from "@/components/companies/RichContactsCard";
import { FinancialDebtCard } from "@/components/companies/FinancialDebtCard";
import apolloLogo from "@/assets/logos/apollo.ico";
import phantomLogo from "@/assets/logos/phantombuster.png";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);
  const [isTestingApollo, setIsTestingApollo] = useState(false);
  const [isRunningPhantom, setIsRunningPhantom] = useState(false);

  // Função para parsear colaboradores/decisores do formato da planilha
  const parseCollaborators = (cargosStr?: string, linkedinStr?: string) => {
    if (!cargosStr) return [];
    const cargos = cargosStr.split('\n').filter(c => c.trim());
    const linkedins = linkedinStr ? linkedinStr.split('\n').filter(l => l.trim()) : [];
    
    return cargos.map((cargo, i) => {
      const parts = cargo.split(' - ');
      return {
        name: parts[0]?.trim() || '',
        role: parts.slice(1).join(' - ').trim() || '',
        linkedin: linkedins[i]?.trim() || ''
      };
    });
  };

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

  const handleSmartRefresh = async () => {
    setIsSmartRefreshing(true);
    try {
      toast.info('Executando atualização inteligente...');
      
      await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj: company.cnpj, company_id: id }
      });

      await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: id }
      });

      toast.success('Atualização completa realizada!');
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    } catch (error: any) {
      toast.error('Erro na atualização', { description: error.message });
    } finally {
      setIsSmartRefreshing(false);
    }
  };

  const handleTestApollo = async () => {
    setIsTestingApollo(true);
    try {
      const searchName = company.name;
      const { data: apolloData, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'people',
          organizationName: searchName,
          ...(company.domain ? { domain: company.domain } : {}),
          titles: ['CEO','CTO','CFO','Diretor','Gerente','VP']
        }
      });
      if (error) throw error;

      const people = (apolloData as any)?.people || [];
      for (const person of people.slice(0, 5)) {
        await supabase.from('decision_makers').upsert({
          company_id: id,
          name: person.name,
          title: person.title,
          email: person.email,
          phone: person.phone_numbers?.[0]?.raw_number || null,
          linkedin_url: person.linkedin_url,
          source: 'apollo'
        } as any);
      }

      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      toast.success(`${people.length} contatos encontrados via Apollo`);
    } catch (e: any) {
      toast.error('Erro ao buscar decisores via Apollo');
    } finally {
      setIsTestingApollo(false);
    }
  };

  const handleRunPhantom = async () => {
    setIsRunningPhantom(true);
    try {
      const linkedinUrl = (company as any)?.digital_presence?.linkedin;
      if (!linkedinUrl) {
        toast.info('LinkedIn não encontrado');
        setIsRunningPhantom(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('linkedin-scrape', {
        body: { linkedin_url: linkedinUrl, company_id: id }
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      toast.success('PhantomBuster concluído');
    } catch (e: any) {
      toast.error('Erro ao executar PhantomBuster');
    } finally {
      setIsRunningPhantom(false);
    }
  };

  const receitaData = (company as any)?.raw_data?.receita;
  const decisors = (company as any)?.decision_makers || [];
  const digitalPresence = (company as any)?.digital_presence;
  const rawData = (company as any)?.raw_data || {};

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
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
              <Badge variant={receitaData?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                {receitaData?.situacao || 'Status desconhecido'}
              </Badge>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSmartRefresh}
                  disabled={isSmartRefreshing}
                >
                  {isSmartRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex w-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visão Geral
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Resumo executivo com CNPJ, razão social, situação, porte e data de abertura
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="identificacao" className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    Identificação
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Dados cadastrais: CNPJ, razão social, nome fantasia, natureza jurídica, tipo unidade, situação cadastral
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="localizacao" className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4" />
                    Localização
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Endereço completo, telefones (assertividade, matriz, filiais, celulares), e-mails, WhatsApp e mapa
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="atividade" className="flex items-center gap-2">
                    <ActivityIcon className="h-4 w-4" />
                    Atividade
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Setor, CNAEs primários e secundários, NCMs, regime tributário, importação/exportação
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="estrutura" className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Estrutura
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Funcionários (matriz e filiais), sócios, decisores, colaboradores e quantidade de filiais
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="financeiro" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Financeiro
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Capital social, faturamento, recebimentos do governo, crescimento e todas as dívidas (CNPJ, sócios, FGTS, Previdência)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="digital" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Digital
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Websites, redes sociais (Instagram, Facebook, LinkedIn, Twitter, YouTube), tecnologias, ferramentas, tags e notas
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="inteligencia" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Inteligência
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Score digital, nível de atividade, classificação e insights capturados pela IA
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="receita" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Receita
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Dados oficiais completos da Receita Federal (JSON raw)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="actions" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Ações
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Enriquecimento de dados (Apollo, PhantomBuster, LinkedIn), adicionar decisores e excluir empresa
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
        </ScrollArea>

        {/* TAB 1: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">CNPJ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono font-semibold">{company.cnpj || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Razão Social</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{receitaData?.razao_social || company.name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Nome Fantasia</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{receitaData?.fantasia || rawData.nome_fantasia || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Situação</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={receitaData?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                  {receitaData?.situacao || rawData.situacao_cadastral || 'Desconhecido'}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Porte</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{receitaData?.porte || rawData.porte_estimado || company.size || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Data Abertura</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{receitaData?.abertura || rawData.data_abertura ? new Date(receitaData?.abertura || rawData.data_abertura).toLocaleDateString('pt-BR') : 'N/A'}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Identificação */}
        <TabsContent value="identificacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                Dados Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="font-mono font-semibold text-lg">{company.cnpj || rawData.cnpj || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p className="font-semibold">{receitaData?.razao_social || rawData.razao_social || company.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome Fantasia</p>
                <p>{receitaData?.fantasia || rawData.nome_fantasia || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome da Empresa</p>
                <p>{rawData.nome_empresa || company.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo Unidade</p>
                <p>{rawData.tipo_unidade || receitaData?.tipo || 'Matriz'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Natureza Jurídica</p>
                <p>{receitaData?.natureza_juridica || rawData.natureza_juridica || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Abertura</p>
                <p>{receitaData?.abertura || rawData.data_abertura ? new Date(receitaData?.abertura || rawData.data_abertura).toLocaleDateString('pt-BR') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Situação Cadastral</p>
                <Badge variant={receitaData?.situacao === 'ATIVA' ? 'default' : 'destructive'}>
                  {receitaData?.situacao || rawData.situacao_cadastral || 'N/A'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Website</p>
                {company.website || digitalPresence?.website ? (
                  <a href={company.website || digitalPresence?.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {company.website || digitalPresence?.website}
                  </a>
                ) : (
                  <p className="text-muted-foreground">N/A</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Localização & Contato */}
        <TabsContent value="localizacao" className="space-y-4">
          <RichContactsCard rawData={rawData} />
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinned className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Logradouro</p>
                  <p>{receitaData?.logradouro || rawData.logradouro || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número</p>
                  <p>{receitaData?.numero || rawData.numero || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Complemento</p>
                  <p>{receitaData?.complemento || rawData.complemento || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bairro</p>
                  <p>{receitaData?.bairro || rawData.bairro || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CEP</p>
                  <p className="font-mono">{receitaData?.cep || rawData.cep || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                  <p>{receitaData?.municipio || rawData.cidade || (company.location as any)?.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Microrregião</p>
                  <p>{rawData.microrregiao || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mesorregião</p>
                  <p>{rawData.mesorregiao || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">UF</p>
                  <p>{receitaData?.uf || rawData.uf || (company.location as any)?.state || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contatos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assertividade</p>
                  <p>{rawData.assertividade || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Melhor Telefone</p>
                  <p className="font-mono">{rawData.melhor_telefone || receitaData?.telefone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Segundo Melhor Telefone</p>
                  <p className="font-mono">{rawData.segundo_melhor_telefone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefones Alta Assertividade</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.telefones_alta_assertividade || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefones Média Assertividade</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.telefones_media_assertividade || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefones Baixa Assertividade</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.telefones_baixa_assertividade || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefones - Matriz</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.telefones_matriz || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefones - Filiais</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.telefones_filiais || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Celulares</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.celulares || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Melhor Celular</p>
                  <p className="font-mono">{rawData.melhor_celular || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fixos</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.fixos || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PAT - Telefone</p>
                  <p className="font-mono">{rawData.pat_telefone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                  <p className="font-mono">{rawData.whatsapp || digitalPresence?.whatsapp || 'N/A'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">E-mails Departamentos</p>
                  <ScrollArea className="h-24 border rounded p-2">
                    <p className="text-xs">{rawData.emails_validados_departamentos || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">E-mails Sócios</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.emails_validados_socios || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">E-mails Decisores</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.emails_validados_decisores || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">E-mails Colaboradores</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.emails_validados_colaboradores || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email PAT</p>
                  <p className="text-sm">{rawData.email_pat || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email Receita Federal</p>
                  <p className="text-sm">{rawData.email_receita_federal || receitaData?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Emails Públicos</p>
                  <ScrollArea className="h-20 border rounded p-2">
                    <p className="text-xs">{rawData.emails_publicos || 'N/A'}</p>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mapa */}
          {receitaData?.cep && (
            <Card>
              <CardHeader>
                <CardTitle>Localização no Mapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 rounded-lg overflow-hidden border">
                  <LocationMap
                    address={receitaData?.logradouro}
                    numero={receitaData?.numero}
                    municipio={receitaData?.municipio}
                    estado={receitaData?.uf}
                    cep={receitaData?.cep}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 4: Atividade Econômica */}
        <TabsContent value="atividade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5" />
                Atividade Econômica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Setor Amigável</p>
                  <p>{rawData.setor_amigavel || company.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Atividade Principal</p>
                  <p>{receitaData?.atividade_principal?.text || rawData.atividade_economica || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Código CNAE</p>
                  <p className="font-mono">{receitaData?.atividade_principal?.code || rawData.cod_atividade_economica || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Regime Tributário</p>
                  <p>{rawData.regime_tributario || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Importação</p>
                  <Badge variant={rawData.importacao ? 'default' : 'secondary'}>
                    {rawData.importacao ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Exportação</p>
                  <Badge variant={rawData.exportacao ? 'default' : 'secondary'}>
                    {rawData.exportacao ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Atividades Secundárias</p>
                <ScrollArea className="h-32 border rounded p-3">
                  {receitaData?.atividades_secundarias && receitaData.atividades_secundarias.length > 0 ? (
                    receitaData.atividades_secundarias.map((ativ: any, i: number) => (
                      <div key={i} className="mb-2">
                        <p className="text-sm font-mono">{ativ.code}</p>
                        <p className="text-xs text-muted-foreground">{ativ.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">{rawData.atividades_secundarias || 'N/A'}</p>
                  )}
                </ScrollArea>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Códigos NCM</p>
                <ScrollArea className="h-40 border rounded p-3">
                  <p className="text-xs whitespace-pre-wrap font-mono">{rawData.cod_ncms_primarios || 'N/A'}</p>
                </ScrollArea>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Descrição NCMs</p>
                <ScrollArea className="h-64 border rounded p-3">
                  <p className="text-xs whitespace-pre-wrap">{rawData.ncms_primarios || 'N/A'}</p>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Estrutura Organizacional */}
        <TabsContent value="estrutura" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Funcionários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Funcionários (Matriz + CNPJ)</p>
                  <p className="text-2xl font-bold">{rawData.funcionarios_presumido_matriz_cnpj || company.employees || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Funcionários (Este CNPJ)</p>
                  <p className="text-xl font-semibold">{rawData.funcionarios_presumido_este_cnpj || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PAT - Funcionários</p>
                  <p>{rawData.pat_funcionarios || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Qtd. Filiais</p>
                  <p>{rawData.qtd_filiais || '0'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Sócios e Administradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 border rounded p-3">
                  {receitaData?.qsa && receitaData.qsa.length > 0 ? (
                    receitaData.qsa.map((socio: any, i: number) => (
                      <div key={i} className="mb-3 pb-3 border-b last:border-0">
                        <p className="font-semibold">{socio.nome}</p>
                        <p className="text-sm text-muted-foreground">{socio.qual}</p>
                      </div>
                    ))
                  ) : rawData.socios_administradores ? (
                    <p className="text-sm whitespace-pre-wrap">{rawData.socios_administradores}</p>
                  ) : (
                    <p className="text-muted-foreground">Nenhum sócio cadastrado</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <DecisorsCollaboratorsCard
            decisors={parseCollaborators(rawData.decisores_cargos, rawData.decisores_linkedin)}
            collaborators={parseCollaborators(rawData.colaboradores_cargos, rawData.colaboradores_linkedin)}
          />
              <CardDescription>Decisores identificados pela Econodata</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 border rounded p-4">
                {parseCollaborators(rawData.decisores_cargos, rawData.decisores_linkedin).length > 0 ? (
                  <div className="grid gap-3">
                    {parseCollaborators(rawData.decisores_cargos, rawData.decisores_linkedin).map((decisor, i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{decisor.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{decisor.role}</p>
                          </div>
                          {decisor.linkedin && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={decisor.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                LinkedIn
                              </a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum decisor encontrado na planilha</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Colaboradores da Planilha ({parseCollaborators(rawData.colaboradores_cargos, rawData.colaboradores_linkedin).length})
              </CardTitle>
              <CardDescription>Colaboradores identificados pela Econodata - Use para buscar manualmente no LinkedIn</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 border rounded p-4">
                {parseCollaborators(rawData.colaboradores_cargos, rawData.colaboradores_linkedin).length > 0 ? (
                  <div className="grid gap-3">
                    {parseCollaborators(rawData.colaboradores_cargos, rawData.colaboradores_linkedin).map((colab, i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{colab.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{colab.role}</p>
                          </div>
                          {colab.linkedin && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={colab.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                LinkedIn
                              </a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum colaborador encontrado na planilha</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Decisores cadastrados no sistema */}
          {decisors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Decisores Cadastrados ({decisors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {decisors.map((dec: any) => (
                    <div key={dec.id} className="border rounded p-3">
                      <p className="font-semibold">{dec.name}</p>
                      <p className="text-sm text-muted-foreground">{dec.title}</p>
                      {dec.email && <p className="text-xs">{dec.email}</p>}
                      {dec.phone && <p className="text-xs">{dec.phone}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 6: Financeiro */}
        <TabsContent value="financeiro" className="space-y-4">
          <FinancialDebtCard rawData={rawData} />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Capital Social</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {receitaData?.capital_social || rawData.capital_social
                    ? `R$ ${parseFloat(receitaData?.capital_social || rawData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recebimentos Governo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {rawData.recebimentos_governo_federal
                    ? `R$ ${parseFloat(rawData.recebimentos_governo_federal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Porte</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{rawData.enquadramento_porte || receitaData?.porte || rawData.porte_estimado || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Faturamento (Matriz + CNPJ)</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{rawData.faturamento_presumido_matriz_cnpj || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Faturamento (Este CNPJ)</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{rawData.faturamento_presumido_este_cnpj || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{rawData.crescimento_empresa || 'Estável'}</Badge>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Dívidas e Débitos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">% Dívidas CNPJ / Faturamento</p>
                  <p className="text-lg font-semibold">{rawData.perc_dividas_cnpj_sobre_faturamento || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">% Dívidas CNPJ + Sócios / Faturamento</p>
                  <p className="text-lg font-semibold">{rawData.perc_dividas_cnpj_socios_sobre_faturamento || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Dívidas CNPJ com União</p>
                  <p className="text-lg font-semibold text-red-600">{rawData.total_dividas_cnpj_uniao || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Dívidas CNPJ + Sócios com União</p>
                  <p className="text-lg font-semibold text-red-600">{rawData.total_dividas_cnpj_socios_uniao || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dívidas Gerais CNPJ</p>
                  <p>{rawData.dividas_gerais_cnpj_uniao || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dívidas Gerais CNPJ + Sócios</p>
                  <p>{rawData.dividas_gerais_cnpj_socios_uniao || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dívidas FGTS (CNPJ)</p>
                  <p>{rawData.dividas_cnpj_fgts || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dívidas FGTS (CNPJ + Sócios)</p>
                  <p>{rawData.dividas_cnpj_socios_fgts || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dívidas Previdência (CNPJ)</p>
                  <p>{rawData.dividas_cnpj_previdencia || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dívidas Previdência (CNPJ + Sócios)</p>
                  <p>{rawData.dividas_cnpj_socios_previdencia || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 7: Presença Digital */}
        <TabsContent value="digital" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Websites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Sites Encontrados</p>
                  <ScrollArea className="h-24 border rounded p-3">
                    <p className="text-sm whitespace-pre-wrap break-all">{rawData.sites || digitalPresence?.website || 'N/A'}</p>
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Melhor Site</p>
                  {rawData.melhor_site || digitalPresence?.website ? (
                    <a href={rawData.melhor_site || digitalPresence?.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {rawData.melhor_site || digitalPresence?.website}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Segundo Melhor Site</p>
                  {rawData.segundo_melhor_site ? (
                    <a href={rawData.segundo_melhor_site} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {rawData.segundo_melhor_site}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">N/A</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Redes Sociais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">WhatsApp</span>
                  <span className="font-mono text-sm">{rawData.whatsapp || digitalPresence?.whatsapp || 'N/A'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Instagram</span>
                  {rawData.instagram || digitalPresence?.instagram ? (
                    <a href={rawData.instagram || digitalPresence?.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Link
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Facebook</span>
                  {rawData.facebook || digitalPresence?.facebook ? (
                    <a href={rawData.facebook || digitalPresence?.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Link
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">LinkedIn</span>
                  {rawData.linkedin || digitalPresence?.linkedin ? (
                    <a href={rawData.linkedin || digitalPresence?.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Link
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Twitter</span>
                  {rawData.twitter || digitalPresence?.twitter ? (
                    <a href={rawData.twitter || digitalPresence?.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Link
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">YouTube</span>
                  {rawData.youtube || digitalPresence?.youtube ? (
                    <a href={rawData.youtube || digitalPresence?.youtube} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Link
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Outras Redes</span>
                  <span className="text-xs">{rawData.outras || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tecnologias e Ferramentas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tecnologias</p>
                <ScrollArea className="h-32 border rounded p-3">
                  <p className="text-sm whitespace-pre-wrap">{rawData.tecnologias || digitalPresence?.technologies?.join(', ') || 'N/A'}</p>
                </ScrollArea>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Ferramentas</p>
                <ScrollArea className="h-32 border rounded p-3">
                  <p className="text-sm whitespace-pre-wrap">{rawData.ferramentas || 'N/A'}</p>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-24 border rounded p-3">
                  <p className="text-sm">{rawData.tags || company.tags?.join(', ') || 'N/A'}</p>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-24 border rounded p-3">
                  <p className="text-sm">{rawData.notas || 'N/A'}</p>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 8: Inteligência e Análise */}
        <TabsContent value="inteligencia" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Score Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {company.digital_maturity_score?.toFixed(1) || 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Nível de Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{rawData.nivel_atividade || 'N/A'}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Classificação</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{company.classification || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insights Capturados</CardTitle>
            </CardHeader>
            <CardContent>
              {(company as any)?.insights && (company as any).insights.length > 0 ? (
                <div className="space-y-2">
                  {(company as any).insights.map((insight: any) => (
                    <div key={insight.id} className="border rounded p-3">
                      <p className="font-semibold">{insight.insight_type}</p>
                      <p className="text-sm text-muted-foreground">{insight.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum insight capturado ainda</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 9: Receita Federal */}
        <TabsContent value="receita" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Dados da Receita Federal
              </CardTitle>
              <CardDescription>Informações oficiais da RFB</CardDescription>
            </CardHeader>
            <CardContent>
              {receitaData ? (
                <ScrollArea className="h-96 border rounded p-4">
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(receitaData, null, 2)}</pre>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground">Nenhum dado da Receita Federal disponível</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 10: Ações */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Enriquecimento de Dados</CardTitle>
                <CardDescription>Buscar decisores e enriquecer informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSmartRefresh}
                  disabled={isSmartRefreshing}
                  className="w-full justify-start"
                  variant="default"
                >
                  {isSmartRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Atualização Inteligente (360°)
                </Button>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Buscar Decisores</p>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleTestApollo}
                          disabled={isTestingApollo}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          {isTestingApollo ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <img src={apolloLogo} className="h-4 w-4 mr-2" alt="Apollo" />
                          )}
                          Apollo.io
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Busca decisores via Apollo.io (API paga)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleRunPhantom}
                          disabled={isRunningPhantom}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          {isRunningPhantom ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <img src={phantomLogo} className="h-4 w-4 mr-2" alt="PhantomBuster" />
                          )}
                          PhantomBuster
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Raspagem de perfis LinkedIn via PhantomBuster
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <LinkedInEnrichButton 
                    companyId={id!}
                    linkedinUrl={digitalPresence?.linkedin || rawData.linkedin}
                    variant="outline"
                    size="sm"
                    showLabel={true}
                  />

                  <DecisionMakerAddDialog companyId={id!} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis</CardDescription>
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
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{company?.name}</strong>?
              Esta ação não pode ser desfeita.
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

                  toast.success('Empresa excluída');
                  navigate('/companies');
                } catch (error) {
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
