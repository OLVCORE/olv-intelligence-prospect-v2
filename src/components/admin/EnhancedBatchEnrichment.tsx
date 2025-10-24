import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Clock, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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

      const { data, error } = await supabase.functions.invoke('trigger-batch-enrichment');

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
    <div className="flex flex-col gap-2">
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
        <DropdownMenuContent align="end" className="w-64">
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
        <p className="font-medium mb-1">💡 Análise Programada (Roadmap)</p>
        <p>
          Em breve: Configure horários automáticos para varredura completa da base.
          Exemplo: Atualização automática às 2h, 10h e 18h todos os dias.
        </p>
      </div>
    </div>
  );
}
