import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { useAutoEnrich } from "@/hooks/useAutoEnrich";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AutoEnrichButton() {
  const { mutate: autoEnrich, isPending } = useAutoEnrich();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => autoEnrich()}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Auto-Enriquecer
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">
            Enriquece automaticamente até 50 empresas que têm Apollo ID mas não foram atualizadas nos últimos 30 dias
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
