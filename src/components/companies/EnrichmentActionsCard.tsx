import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, Sparkles, Database, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EnrichmentActionsCardProps {
  onReceita?: () => void;
  on360?: () => void;
  onEconodata?: () => void;
  isLoadingReceita?: boolean;
  isLoading360?: boolean;
  isLoadingEconodata?: boolean;
  compact?: boolean;
}

export function EnrichmentActionsCard({
  onReceita,
  on360,
  onEconodata,
  isLoadingReceita,
  isLoading360,
  isLoadingEconodata,
  compact = false
}: EnrichmentActionsCardProps) {
  if (compact) {
    // Versão compacta para header de detalhes
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onReceita}
                disabled={isLoadingReceita}
              >
                {isLoadingReceita ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enriquecer com Receita Federal</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={on360}
                disabled={isLoading360}
              >
                {isLoading360 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enriquecimento 360° Completo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={onEconodata}
                disabled={isLoadingEconodata}
              >
                {isLoadingEconodata ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enriquecer com Econodata</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Versão completa para página de listagem
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Enriquecimento:</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onReceita}
                  disabled={isLoadingReceita}
                  className="flex items-center gap-2"
                >
                  {isLoadingReceita ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  Receita Federal
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enriquece dados básicos da empresa via Receita Federal</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  onClick={on360}
                  disabled={isLoading360}
                  className="flex items-center gap-2"
                >
                  {isLoading360 ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  360° Completo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Análise completa com IA: insights, sinais, recomendações</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={onEconodata}
                  disabled={isLoadingEconodata}
                  className="flex items-center gap-2"
                >
                  {isLoadingEconodata ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  Econodata
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs space-y-1">
                  <p className="font-semibold">Fonte Primária - Econodata</p>
                  <p className="text-xs">87 campos oficiais, dados mais completos</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
