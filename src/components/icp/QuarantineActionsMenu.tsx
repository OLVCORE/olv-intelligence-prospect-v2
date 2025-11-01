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
  Trash2,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Target,
  Building2,
  Sparkles,
  Search,
  CheckCircle
} from 'lucide-react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { useState } from 'react';

interface QuarantineActionsMenuProps {
  selectedCount: number;
  onDeleteSelected: () => Promise<void>;
  onExportSelected: () => void;
  onPreviewSelected: () => void;
  onRefreshSelected?: () => void;
  onBulkEnrichReceita?: () => Promise<void>;
  onBulkEnrichApollo?: () => Promise<void>;
  onBulkEnrich360?: () => Promise<void>;
  onBulkTotvsCheck?: () => Promise<void>;
  onBulkDiscoverCNPJ?: () => Promise<void>;
  onBulkApprove?: () => Promise<void>;
  onReverifyAllV2?: () => void;
  isProcessing?: boolean;
  isReverifying?: boolean;
  selectedItems?: any[];
  totalCompanies?: any[];
}

export function QuarantineActionsMenu({
  selectedCount,
  onDeleteSelected,
  onExportSelected,
  onPreviewSelected,
  onRefreshSelected,
  onBulkEnrichReceita,
  onBulkEnrichApollo,
  onBulkEnrich360,
  onBulkTotvsCheck,
  onBulkDiscoverCNPJ,
  onBulkApprove,
  onReverifyAllV2,
  isProcessing = false,
  isReverifying = false,
  selectedItems = [],
  totalCompanies = []
}: QuarantineActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteSelected();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="default"
            disabled={isProcessing || isDeleting}
            data-testid="quarantine-actions-menu"
            aria-label="Ações em Massa"
            className="gap-2"
          >
            {isProcessing || isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            Ações em Massa ({selectedCount})
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 z-[100] bg-popover"
        data-testid="quarantine-actions-dropdown"
      >
        <DropdownMenuLabel>
          {selectedCount > 0 ? `${selectedCount} selecionada(s)` : 'Nenhuma empresa selecionada'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => {
              if (selectedCount === 0) {
                return; // Componente visual está desabilitado, mas prevenção extra
              }
              onPreviewSelected();
            }}
            disabled={selectedCount === 0 || isDeleting}
            data-testid="action-preview"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview das Selecionadas
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              if (selectedCount === 0) {
                return;
              }
              onExportSelected();
            }}
            disabled={selectedCount === 0 || isDeleting}
            data-testid="action-export"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              if (selectedCount === 0) {
                return;
              }
              onExportSelected();
            }}
            disabled={selectedCount === 0 || isDeleting}
            data-testid="action-export-pdf"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              if (selectedCount === 0 || !onRefreshSelected) {
                return;
              }
              onRefreshSelected();
            }}
            disabled={selectedCount === 0 || isDeleting}
            data-testid="action-refresh"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Relatórios
          </DropdownMenuItem>


          {/* 🔄 RE-VERIFICAR TUDO V2 - Botão Principal */}
          {onReverifyAllV2 && totalCompanies.length > 0 && (
            <DropdownMenuItem 
              onClick={() => {
                if (!onReverifyAllV2 || totalCompanies.length === 0) return;
                onReverifyAllV2();
              }}
              disabled={isReverifying || totalCompanies.length === 0}
              className="transition-all duration-200 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:shadow-md hover:border-l-2 hover:border-amber-500"
            >
              {isReverifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isReverifying ? 'Re-verificando...' : `Re-Verificar Tudo (V2) - ${totalCompanies.length}`}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Enriquecimento em Massa</DropdownMenuLabel>
        
        <DropdownMenuGroup>
          {onBulkDiscoverCNPJ && (
            <DropdownMenuItem 
              onClick={() => {
                if (selectedCount === 0 || !onBulkDiscoverCNPJ) return;
                onBulkDiscoverCNPJ();
              }}
              disabled={selectedCount === 0 || isProcessing}
              className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
            >
              <Search className="h-4 w-4 mr-2" />
              Descobrir CNPJ
            </DropdownMenuItem>
          )}

          {onBulkEnrichReceita && (
            <DropdownMenuItem 
              onClick={() => {
                if (selectedCount === 0 || !onBulkEnrichReceita) return;
                onBulkEnrichReceita();
              }}
              disabled={selectedCount === 0 || isProcessing}
              className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Receita Federal
            </DropdownMenuItem>
          )}

          {onBulkEnrichApollo && (
            <DropdownMenuItem 
              onClick={() => {
                if (selectedCount === 0 || !onBulkEnrichApollo) return;
                onBulkEnrichApollo();
              }}
              disabled={selectedCount === 0 || isProcessing}
              className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
            >
              <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
              Apollo (Decisores)
            </DropdownMenuItem>
          )}

          {onBulkEnrich360 && (
            <DropdownMenuItem 
              onClick={() => {
                if (selectedCount === 0 || !onBulkEnrich360) return;
                onBulkEnrich360();
              }}
              disabled={selectedCount === 0 || isProcessing}
              className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              360° Completo
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Aprovar/Rejeitar</DropdownMenuLabel>
        
        <DropdownMenuGroup>
          {onBulkApprove && (
            <DropdownMenuItem 
              onClick={() => {
                if (selectedCount === 0 || !onBulkApprove) return;
                onBulkApprove();
              }}
              disabled={selectedCount === 0 || isProcessing}
              className="transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 hover:shadow-md hover:border-l-2 hover:border-green-500"
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Aprovar e Mover para Pool
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Ações Perigosas</DropdownMenuLabel>
        
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => {
              if (selectedCount === 0) {
                return;
              }
              handleDelete();
            }}
            disabled={selectedCount === 0 || isDeleting}
            data-testid="action-delete"
            className="text-destructive transition-all duration-200 cursor-pointer hover:bg-destructive/10 hover:shadow-md hover:border-l-2 hover:border-destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Deletar Selecionadas
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
