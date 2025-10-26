import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
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

export function BatchEnrichmentButton() {
  const [isProcessing, setIsProcessing] = useState(false);

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
        description: `${data.processed} empresas analisadas com sucesso!`,
      });

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

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Analisar Todas Empresas
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Análise Automática em Lote</AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá iniciar a análise automática completa de todas as empresas que ainda não foram analisadas. 
            O processo inclui:
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Enriquecimento via ReceitaWS (CNPJ)</li>
              <li>Busca de decisores (Apollo)</li>
              <li>Análise de presença digital</li>
              <li>Cálculo de maturidade digital</li>
              <li>Score de fit TOTVS</li>
              <li>Análise de saúde jurídica</li>
              <li>Insights com IA</li>
            </ul>
            <p className="mt-3 text-sm">Esse processo pode levar vários minutos dependendo da quantidade de empresas.</p>
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
  );
}
