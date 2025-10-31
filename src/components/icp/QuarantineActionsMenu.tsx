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
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';

interface QuarantineActionsMenuProps {
  selectedCount: number;
  onDeleteSelected: () => Promise<void>;
  onExportSelected: () => void;
  onPreviewSelected: () => void;
  onRefreshSelected?: () => void;
  isProcessing?: boolean;
}

export function QuarantineActionsMenu({
  selectedCount,
  onDeleteSelected,
  onExportSelected,
  onPreviewSelected,
  onRefreshSelected,
  isProcessing = false
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
