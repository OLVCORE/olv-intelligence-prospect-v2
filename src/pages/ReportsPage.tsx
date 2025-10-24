import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyReport } from "@/components/reports/CompanyReport";
import { MaturityReport } from "@/components/reports/MaturityReport";
import { FitReport } from "@/components/reports/FitReport";
import { CompanySelector } from "@/components/intelligence/CompanySelector";
import { FileText, BarChart3, Target, Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { ExplainabilityButton } from "@/components/common/ExplainabilityButton";
import { BackButton } from "@/components/common/BackButton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companyId = searchParams.get('companyId');
  const [activeTab, setActiveTab] = useState('company');
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectMode, setSelectMode] = useState<'single' | 'multiple'>('single');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConfirmGeneration = async (companyIds: string[]) => {
    if (selectMode === 'single' && companyIds.length === 1) {
      setSearchParams({ companyId: companyIds[0] });
      setSelectOpen(false);
      return;
    }

    setIsGenerating(true);
    let success = 0;
    let failed = 0;

    toast({
      title: "Geração de relatórios iniciada",
      description: `Processando ${companyIds.length} empresa${companyIds.length === 1 ? '' : 's'}...`,
    });

    for (const id of companyIds) {
      try {
        const { error } = await supabase.functions.invoke('generate-company-report', {
          body: { companyId: id }
        });
        if (error) throw error;
        success++;
      } catch (e) {
        console.error('Falha na geração', id, e);
        failed++;
      }
    }

    toast({
      title: "Relatórios gerados",
      description: `${success} sucesso${success !== 1 ? 's' : ''}${failed ? ` • ${failed} falha${failed !== 1 ? 's' : ''}` : ''}`,
    });

    setIsGenerating(false);
    setSelectOpen(false);
  };

  if (!companyId) {
    return (
      <div className="p-8 space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Relatórios Executivos</h1>
            <p className="text-muted-foreground">
              Análises completas e insights acionáveis gerados por IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSelectMode('single');
                setSelectOpen(true);
              }}
              disabled={isGenerating}
              variant="outline"
            >
              <Target className="h-4 w-4 mr-2" />
              Relatório Individual
            </Button>
            <Button
              onClick={() => {
                setSelectMode('multiple');
                setSelectOpen(true);
              }}
              disabled={isGenerating}
            >
              <Users className="h-4 w-4 mr-2" />
              Relatórios em Massa
            </Button>
          </div>
        </div>

        <CompanySelectDialog
          open={selectOpen}
          onOpenChange={setSelectOpen}
          mode={selectMode}
          onConfirm={handleConfirmGeneration}
          title={selectMode === 'single' ? 'Selecionar Empresa para Relatório' : 'Selecionar Empresas para Relatórios'}
          confirmLabel={selectMode === 'single' ? 'Gerar relatório' : 'Gerar relatórios'}
        />

        <div className="flex justify-center my-6">
          <ExplainabilityButton
            title="Critérios dos Relatórios Executivos"
            description="Entenda como geramos análises completas com dados reais e IA"
            analysisType="Relatórios IA"
            dataSources={[
              { name: "Dados Cadastrais", description: "Receita Federal (CNPJ), localização, porte, setor" },
              { name: "Presença Digital", description: "Website, redes sociais, marketplace, tech stack" },
              { name: "Decisores", description: "LinkedIn (PhantomBuster), Apollo.io, Hunter.io para contatos B2B" },
              { name: "Inteligência de Mercado", description: "Notícias, sentimento, sinais de compra, empresas similares" }
            ]}
            criteria={[
              { name: "Relatório de Empresa", description: "Visão 360°: dados oficiais, presença digital, tech stack, maturidade, decisores mapeados, sinais de compra." },
              { name: "Relatório de Maturidade", description: "Deep dive nos 5 pilares (infraestrutura, sistemas, processos, segurança, inovação) com gaps identificados." },
              { name: "Relatório de Fit TOTVS", description: "Análise de compatibilidade: produtos recomendados, fit score, timing score, estratégia de abordagem." }
            ]}
            methodology="Cada relatório agrega dados de 8+ fontes distintas, processa com IA para gerar insights acionáveis, e apresenta em formato executivo. Todos os dados são verificáveis - fontes são citadas. IA (Gemini 2.5 Flash) é usada para síntese, não para invenção de dados."
            interpretation="Use os relatórios para embasar estratégias de vendas, pitch personalizado, identificar momentos de abordagem e construir business cases. Quanto mais completo o enriquecimento da empresa, mais preciso o relatório."
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Selecione uma Empresa
            </CardTitle>
            <CardDescription>
              Escolha uma empresa da base para gerar relatórios executivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanySelector redirectTo="/reports" queryParamName="companyId" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <BackButton className="mb-4" />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Relatórios Executivos</h1>
        <p className="text-muted-foreground">
          Análises completas e insights acionáveis gerados por IA
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Empresa
            <Badge variant="secondary" className="ml-1">Completo</Badge>
          </TabsTrigger>
          <TabsTrigger value="maturity" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Maturidade
            <Badge variant="secondary" className="ml-1">Completo</Badge>
          </TabsTrigger>
          <TabsTrigger value="fit" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Fit TOTVS
            <Badge variant="secondary" className="ml-1">Completo</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <CompanyReport companyId={companyId} />
        </TabsContent>

        <TabsContent value="maturity" className="space-y-6">
          <MaturityReport companyId={companyId} />
        </TabsContent>

        <TabsContent value="fit" className="space-y-6">
          <FitReport companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
