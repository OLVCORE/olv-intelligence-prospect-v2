import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Clock, ChevronDown, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { ExplainabilityButton } from "@/components/common/ExplainabilityButton";
import { LinkedInEnrichButton } from "@/components/common/LinkedInEnrichButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

interface LastUpdateInfo {
  timestamp: string | null;
  companiesProcessed: number;
}

export function EnhancedBatchEnrichment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'selected' | 'batch'>('batch');
  const [selectOpen, setSelectOpen] = useState(false);

  // Busca informação de última atualização
  const { data: lastUpdate } = useQuery({
    queryKey: ['last-enrichment-update'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) return { timestamp: null, companiesProcessed: 0 } as LastUpdateInfo;
      
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      return {
        timestamp: data?.updated_at,
        companiesProcessed: count || 0
      } as LastUpdateInfo;
    },
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  const handleBatchEnrichment = async () => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processamento Iniciado",
        description: "Analisando empresas em background. Isso pode levar alguns minutos...",
      });

      const { data, error } = await supabase.functions.invoke('batch-enrich-360');

      if (error) throw error;

      toast({
        title: "Enriquecimento Completo",
        description: `${data.processed} empresas analisadas com sucesso! ${data.failed > 0 ? `${data.failed} falharam.` : ''}`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Erro no enriquecimento em lote:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao processar empresas",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectedEnrichment = async (selectedIds: string[]) => {
    if (!selectedIds?.length) return;
    setIsProcessing(true);
    let success = 0;
    let failed = 0;
    toast({
      title: "Processamento Iniciado",
      description: `Enriquecendo ${selectedIds.length} empresa${selectedIds.length === 1 ? '' : 's'}...`,
    });
    for (const id of selectedIds) {
      try {
        const { error } = await supabase.functions.invoke('enrich-company-360', {
          body: { companyId: id }
        });
        if (error) throw error as any;
        success++;
      } catch (e) {
        console.error('Falha no enriquecimento', id, e);
        failed++;
      }
    }
    toast({
      title: "Enriquecimento finalizado",
      description: `${success} sucesso${success !== 1 ? 's' : ''}${failed ? ` • ${failed} falha${failed !== 1 ? 's' : ''}` : ''}`,
    });
    setIsProcessing(false);
    setSelectOpen(false);
  };

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return "Nunca atualizado";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return "Agora mesmo";
    if (diffMinutes < 60) return `Há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffMinutes < 1440) return `Há ${Math.floor(diffMinutes / 60)} hora${Math.floor(diffMinutes / 60) > 1 ? 's' : ''}`;
    return `Há ${Math.floor(diffMinutes / 1440)} dia${Math.floor(diffMinutes / 1440) > 1 ? 's' : ''}`;
  };

  return (
    <div className="flex items-center gap-2">

      {/* Indicador de Última Atualização */}
      {lastUpdate?.timestamp && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Última atualização: {formatLastUpdate(lastUpdate.timestamp)}</span>
        </div>
      )}

      {/* Botão Principal com Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Analisar Empresas
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 z-50 bg-popover">
          <DropdownMenuItem
            onClick={() => {
              setAnalysisMode('batch');
              setDialogOpen(true);
            }}
            className="flex flex-col items-start gap-1 p-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Análise em Lote</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Processa todas as empresas pendentes (até 50)
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setAnalysisMode('selected');
              setSelectOpen(true);
            }}
            className="flex flex-col items-start gap-1 p-3"
          >
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="font-medium">Análise por Seleção</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Escolha empresas específicas para enriquecer agora
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            disabled
            className="flex flex-col items-start gap-1 p-3 opacity-50"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Análise Agendada</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Em breve</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Configurar horários automáticos de varredura
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Confirmação */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {analysisMode === 'batch' ? 'Análise Automática em Lote' : 'Análise Individual'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {analysisMode === 'batch' ? (
                <>
                  Isso irá iniciar a análise automática completa de todas as empresas que ainda não foram analisadas (máximo 50 por execução).
                  <br /><br />
                  <strong>O processo inclui:</strong>
                  <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                    <li>Enriquecimento via ReceitaWS (CNPJ)</li>
                    <li>Busca de decisores (Apollo)</li>
                    <li>Análise de presença digital</li>
                    <li>Cálculo de maturidade digital</li>
                    <li>Score de fit TOTVS</li>
                    <li>Análise de saúde jurídica</li>
                    <li>Insights com IA</li>
                  </ul>
                  <p className="mt-3 text-sm font-medium text-orange-600">
                    ⚠️ Esse processo pode levar 3-5 minutos por empresa. Até 50 empresas serão processadas.
                  </p>
                </>
              ) : (
                <p>Selecione as empresas que deseja analisar individualmente.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchEnrichment} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Iniciar Análise
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Info sobre Análise Programada */}
      <div className="text-xs text-muted-foreground bg-card/50 border rounded-lg p-3 mt-2">
        <p className="font-medium mb-1">Análise Programada (Roadmap)</p>
        <p>
          Em breve: Configure horários automáticos para varredura completa da base.
          Exemplo: Atualização automática às 2h, 10h e 18h todos os dias.
        </p>
      </div>

      {/* Botão de Explicação */}
      <div className="mt-4">
        <ExplainabilityButton
          title="Critérios do Enriquecimento 360°"
          description="Entenda como o sistema enriquece empresas com dados de múltiplas fontes"
          analysisType="Enriquecimento Automático"
          dataSources={[
            {
              name: "ReceitaWS (CNPJ)",
              description: "Dados oficiais da Receita Federal: razão social, CNAE, porte, endereço"
            },
            {
              name: "Apollo.io",
              description: "Decisores B2B: emails corporativos, LinkedIn, cargos, departamentos"
            },
            {
              name: "Hunter.io",
              description: "Validação de emails e descoberta de contatos adicionais"
            },
            {
              name: "Tech Stack Detection",
              description: "Análise automática de tecnologias web, frameworks, analytics, CRM"
            },
            {
              name: "Google Search",
              description: "Presença digital, notícias, menções, marketplace"
            },
            {
              name: "LinkedIn Scraping",
              description: "Dados da empresa, número de funcionários, descrição, indústria"
            }
          ]}
          criteria={[
            {
              name: "Enriquecimento ReceitaWS",
              description: "Atualiza dados cadastrais oficiais via CNPJ: nome, CNAE, endereço completo, situação cadastral."
            },
            {
              name: "Busca de Decisores (Apollo)",
              description: "Identifica tomadores de decisão: C-level, diretores, gerentes. Extrai emails verificados e LinkedIn."
            },
            {
              name: "Análise de Presença Digital",
              description: "Detecta website, redes sociais (LinkedIn, Instagram, Facebook), e-commerce, blog, marketplace."
            },
            {
              name: "Cálculo de Maturidade Digital",
              description: "Score 0-10 em 5 dimensões: infraestrutura, sistemas, processos, segurança, inovação."
            },
            {
              name: "Score de Fit TOTVS",
              description: "Compatibilidade com produtos TOTVS baseado em setor, porte, maturidade e necessidades."
            },
            {
              name: "Análise de Saúde Jurídica",
              description: "Consulta bases públicas (CNEP, CEIS, JusBrasil) para identificar processos e riscos."
            },
            {
              name: "Insights com IA",
              description: "Gemini 2.5 Flash analisa todos os dados e gera recomendações de abordagem, dores, oportunidades."
            }
          ]}
          methodology="O enriquecimento 360° executa 7 etapas em sequência, cada uma dependendo da anterior. Se o CNPJ for inválido, processo é interrompido. Decisores são buscados apenas se LinkedIn da empresa for encontrado. Análise de IA só roda se houver dados mínimos (website + setor + porte)."
          interpretation="Empresas totalmente enriquecidas têm 7/7 etapas concluídas. Parcialmente enriquecidas têm 3-6 etapas. Não enriquecidas precisam de dados mínimos (CNPJ ou website). Processo pode levar 3-5 minutos por empresa."
        />
      </div>
    </div>
  );
}
