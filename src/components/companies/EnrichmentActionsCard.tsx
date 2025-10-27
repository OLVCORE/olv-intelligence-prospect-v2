import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, Sparkles, Database, Loader2, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface EnrichmentActionsCardProps {
  onReceita?: () => void;
  on360?: () => void;
  onEconodata?: () => void;
  onApollo?: () => void;
  isLoadingReceita?: boolean;
  isLoading360?: boolean;
  isLoadingEconodata?: boolean;
  isLoadingApollo?: boolean;
  compact?: boolean;
}

export function EnrichmentActionsCard({
  onReceita,
  on360,
  onEconodata,
  onApollo,
  isLoadingReceita,
  isLoading360,
  isLoadingEconodata,
  isLoadingApollo,
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
                variant="ghost"
                size="icon"
                onClick={onReceita}
                disabled={isLoadingReceita}
                className="h-9 w-9 hover:bg-accent transition-colors"
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
                variant="ghost"
                size="icon"
                onClick={on360}
                disabled={isLoading360}
                className="h-9 w-9 hover:bg-accent transition-colors"
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
                variant="ghost"
                size="icon"
                onClick={onEconodata}
                disabled={isLoadingEconodata}
                className="h-9 w-9 hover:bg-accent transition-colors"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onApollo}
                disabled={isLoadingApollo}
                className="h-9 w-9 hover:bg-purple-500/10 hover:border-purple-500/20 transition-colors"
              >
                {isLoadingApollo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="h-4 w-4 flex items-center justify-center">
                    <img src={apolloIcon} alt="Apollo" className="h-4 w-4 object-contain" />
                  </div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enriquecer com Apollo (Decisores e Contatos)</p>
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
                  variant="default"
                  onClick={onEconodata}
                  disabled={isLoadingEconodata}
                  className="flex items-center gap-2"
                >
                  {isLoadingEconodata ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 text-primary-foreground" />
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  onClick={onApollo}
                  disabled={isLoadingApollo}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isLoadingApollo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 flex items-center justify-center">
                      <img src={apolloIcon} alt="Apollo" className="h-4 w-4 object-contain" />
                    </div>
                  )}
                  Apollo (Decisores)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs space-y-1">
                  <p className="font-semibold">Enriquecimento Apollo.io</p>
                  <p className="text-xs">Busca decisores e contatos da empresa</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
