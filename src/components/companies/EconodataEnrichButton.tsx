import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { useEconodataEnrichment } from '@/hooks/useEconodataEnrichment';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EconodataEnrichButtonProps {
  companyId: string;
  cnpj: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function EconodataEnrichButton({ 
  companyId, 
  cnpj, 
  variant = 'default',
  size = 'default',
  className 
}: EconodataEnrichButtonProps) {
  const { mutate: enrichWithEconodata, isPending } = useEconodataEnrichment();

  const handleEnrich = () => {
    if (!cnpj) {
      return;
    }
    enrichWithEconodata({ companyId, cnpj });
  };

  const isDisabled = isPending || !cnpj;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleEnrich}
            disabled={isDisabled}
            variant={variant}
            size={size}
            className={className}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enriquecendo...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Enriquecer com Econodata
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs space-y-2">
            <p className="font-semibold">🌟 Fonte Primária - Econodata</p>
            <p className="text-sm">
              Busca os 87 campos oficiais diretamente da base Econodata.
              Dados mais completos e atualizados do mercado.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ✓ Preserva dados existentes válidos<br/>
              ✓ Atualiza apenas campos vazios ou NA<br/>
              ✓ Adiciona sócios e decisores automaticamente
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}