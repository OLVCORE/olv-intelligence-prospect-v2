import { Button } from '@/components/ui/button';
import { Zap, Loader2 } from 'lucide-react';
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
                {size === 'icon' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriquecendo...
                  </>
                )}
              </>
            ) : (
              <>
                {size === 'icon' ? (
                  <Zap className="h-4 w-4" />
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Eco-Booster
                  </>
                )}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs space-y-2">
            <p className="font-semibold">🚀 Eco-Booster</p>
            <p className="text-sm">
              Busca os 87 campos oficiais completos e atualizados.
              Dados mais precisos e detalhados do mercado.
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