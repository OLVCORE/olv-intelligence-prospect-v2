import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface ICPScoreTooltipProps {
  score: number;
  breakdown?: {
    porte_score?: number;
    setor_score?: number;
    localizacao_score?: number;
    totvs_score?: number;
    dados_score?: number;
  };
  porte?: string;
  setor?: string;
  uf?: string;
  is_cliente_totvs?: boolean | null;
  hasReceitaData?: boolean;
  hasApolloData?: boolean;
  hasWebsite?: boolean;
  hasContact?: boolean;
}

export function ICPScoreTooltip({
  score,
  breakdown,
  porte,
  setor,
  uf,
  is_cliente_totvs,
  hasReceitaData,
  hasApolloData,
  hasWebsite,
  hasContact,
}: ICPScoreTooltipProps) {
  // Se não tem breakdown explícito, calcular baseado nos dados disponíveis
  const calculatedBreakdown = breakdown || {
    porte_score: calculatePorteScore(porte),
    setor_score: calculateSetorScore(setor),
    localizacao_score: calculateLocalizacaoScore(uf),
    totvs_score: calculateTotvsScore(is_cliente_totvs),
    dados_score: calculateDadosScore(hasReceitaData, hasApolloData, hasWebsite, hasContact),
  };

  const getBadgeVariant = (score: number) => {
    if (score >= 75) return 'default';
    if (score >= 50) return 'secondary';
    return 'outline';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            <Badge 
              variant={getBadgeVariant(score)}
              className="font-semibold"
            >
              {score}
            </Badge>
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4 space-y-3" side="left">
          <div className="space-y-2">
            <p className="font-semibold text-sm border-b pb-2">
              Breakdown do Score ICP: {score} pontos
            </p>
            
            <div className="space-y-1.5 text-xs">
              {/* Porte */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Porte{porte ? `: ${porte}` : ''}
                </span>
                <Badge variant="outline" className="text-xs">
                  {calculatedBreakdown.porte_score}/30
                </Badge>
              </div>

              {/* Setor */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Setor{setor ? `: ${setor.substring(0, 25)}...` : ''}
                </span>
                <Badge variant="outline" className="text-xs">
                  {calculatedBreakdown.setor_score}/25
                </Badge>
              </div>

              {/* Localização */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Localização{uf ? `: ${uf}` : ''}
                </span>
                <Badge variant="outline" className="text-xs">
                  {calculatedBreakdown.localizacao_score}/15
                </Badge>
              </div>

              {/* TOTVS */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  TOTVS Check: {is_cliente_totvs === false ? '✅ Não cliente' : is_cliente_totvs === true ? '⚠️ Cliente' : 'Não verificado'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {calculatedBreakdown.totvs_score}/10
                </Badge>
              </div>

              {/* Dados Completos */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Dados Completos
                </span>
                <Badge variant="outline" className="text-xs">
                  {calculatedBreakdown.dados_score}/20
                </Badge>
              </div>
            </div>

            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <Badge variant={getBadgeVariant(score)}>
                  {score}/100
                </Badge>
              </div>
            </div>

            {/* Detalhes dos dados */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p className="font-medium">Enriquecimentos:</p>
              <ul className="space-y-0.5 pl-4">
                <li>{hasReceitaData ? '✅' : '⬜'} Receita Federal</li>
                <li>{hasApolloData ? '✅' : '⬜'} Apollo/360°</li>
                <li>{hasWebsite ? '✅' : '⬜'} Website identificado</li>
                <li>{hasContact ? '✅' : '⬜'} Email/Telefone</li>
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Funções auxiliares para calcular scores parciais
function calculatePorteScore(porte?: string): number {
  if (!porte) return 0;
  const porteUpper = porte.toUpperCase();
  if (porteUpper.includes('GRANDE') || porteUpper.includes('DEMAIS')) return 30;
  if (porteUpper.includes('MEDIO') || porteUpper.includes('MÉDIO')) return 20;
  if (porteUpper.includes('PEQUENO')) return 10;
  return 5;
}

function calculateSetorScore(setor?: string): number {
  if (!setor) return 0;
  const setorUpper = setor.toUpperCase();
  if (
    setorUpper.includes('INDUSTRIA') ||
    setorUpper.includes('INDÚSTRIA') ||
    setorUpper.includes('MANUFATURA') ||
    setorUpper.includes('TECNOLOGIA') ||
    setorUpper.includes('SOFTWARE') ||
    setorUpper.includes('LOGISTICA') ||
    setorUpper.includes('LOGÍSTICA')
  ) return 25;
  if (
    setorUpper.includes('COMERCIO') ||
    setorUpper.includes('COMÉRCIO') ||
    setorUpper.includes('VAREJO')
  ) return 15;
  return 10;
}

function calculateLocalizacaoScore(uf?: string): number {
  if (!uf) return 0;
  const ufMap: Record<string, number> = {
    'SP': 15,
    'RJ': 12, 'MG': 12, 'PR': 12, 'RS': 12, 'SC': 12,
    'BA': 8, 'PE': 8, 'CE': 8, 'GO': 8, 'DF': 8,
  };
  return ufMap[uf] || 5;
}

function calculateTotvsScore(is_cliente_totvs?: boolean | null): number {
  if (is_cliente_totvs === false) return 10;
  if (is_cliente_totvs === null || is_cliente_totvs === undefined) return 5;
  return 0; // Já é cliente
}

function calculateDadosScore(
  hasReceitaData?: boolean,
  hasApolloData?: boolean,
  hasWebsite?: boolean,
  hasContact?: boolean
): number {
  let score = 0;
  if (hasReceitaData) score += 5;
  if (hasApolloData) score += 5;
  if (hasWebsite) score += 5;
  if (hasContact) score += 5;
  return score;
}
