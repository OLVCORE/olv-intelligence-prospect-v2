import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Upload,
  Building2,
  Sparkles,
  Zap,
  Search,
  Database,
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { useState } from 'react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface HeaderActionsMenuProps {
  onUploadClick: () => void;
  onBatchEnrichReceita: () => Promise<void>;
  onBatchEnrich360: () => Promise<void>;
  onBatchEnrichApollo: () => Promise<void>;
  onBatchEnrichEconodata: () => Promise<void>;
  onApolloImport: () => void;
  onSearchCompanies: () => void;
  isProcessing?: boolean;
}

export function HeaderActionsMenu({
  onUploadClick,
  onBatchEnrichReceita,
  onBatchEnrich360,
  onBatchEnrichApollo,
  onBatchEnrichEconodata,
  onApolloImport,
  onSearchCompanies,
  isProcessing = false
}: HeaderActionsMenuProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingAction, setEnrichingAction] = useState<string | null>(null);

  const handleEnrich = async (action: string, fn: () => Promise<void>) => {
    try {
      setIsEnriching(true);
      setEnrichingAction(action);
      await fn();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setIsEnriching(false);
      setEnrichingAction(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="default"
          disabled={isProcessing || isEnriching}
          data-testid="header-actions-menu"
          aria-label="Menu de ações em massa"
          className="gap-2"
        >
          {isProcessing || isEnriching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          Ações em Massa
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 z-[100] bg-popover"
        data-testid="header-actions-dropdown"
      >
        <DropdownMenuLabel>Importar & Adicionar</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={onUploadClick}
            disabled={isEnriching}
            data-testid="action-upload-bulk"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload em Massa
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onApolloImport}
            disabled={isEnriching}
            data-testid="action-apollo-import"
          >
            <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
            Importar do Apollo
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onSearchCompanies}
            disabled={isEnriching}
            data-testid="action-search-companies"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar Empresas
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Enriquecimento em Lote</DropdownMenuLabel>
        
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => handleEnrich('Receita Federal', onBatchEnrichReceita)}
            disabled={isEnriching}
            data-testid="action-batch-receita"
          >
            {enrichingAction === 'Receita Federal' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            Receita Federal (Lote)
            <span className="ml-auto text-xs text-muted-foreground">Apenas sem dados</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleEnrich('Apollo', onBatchEnrichApollo)}
            disabled={isEnriching}
            data-testid="action-batch-apollo"
          >
            {enrichingAction === 'Apollo' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
            )}
            Apollo (Decisores & Contatos)
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleEnrich('Eco-Booster', onBatchEnrichEconodata)}
            disabled={isEnriching}
            data-testid="action-batch-econodata"
          >
            {enrichingAction === 'Eco-Booster' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Eco-Booster (Premium)
            <span className="ml-auto text-xs text-muted-foreground">Com CNPJ</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleEnrich('360° Completo', onBatchEnrich360)}
            disabled={isEnriching}
            data-testid="action-batch-360"
            className="font-medium"
          >
            {enrichingAction === '360° Completo' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            360° Completo + IA
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Ordem de execução:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
            <li>Lock (org_id/domain/CNPJ)</li>
            <li>Apollo Company</li>
            <li>Apollo People</li>
            <li>Receita/Econodata</li>
          </ol>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
