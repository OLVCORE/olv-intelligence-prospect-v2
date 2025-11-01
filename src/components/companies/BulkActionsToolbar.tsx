import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Loader2, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Building2,
  Download,
  FileSpreadsheet,
  Zap,
  MoreHorizontal,
  Target,
  Search,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkEnrichReceita: () => Promise<void>;
  onBulkEnrich360: () => Promise<void>;
  onBulkEnrichApollo: () => Promise<void>;
  onBulkEnrichEconodata: () => Promise<void>;
  onBulkEnrichTotvsCheck?: () => Promise<void>;
  onBulkDiscoverCNPJ?: () => Promise<void>;
  onBulkApprove?: () => Promise<void>;
  onExportSelected: () => void;
  isProcessing?: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkEnrichReceita,
  onBulkEnrich360,
  onBulkEnrichApollo,
  onBulkEnrichEconodata,
  onBulkEnrichTotvsCheck,
  onBulkDiscoverCNPJ,
  onBulkApprove,
  onExportSelected,
  isProcessing = false
}: BulkActionsToolbarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onBulkDelete();
      setDeleteDialogOpen(false);
      toast.success(`${selectedCount} empresa(s) excluída(s)`);
    } catch (error) {
      toast.error('Erro ao excluir empresas');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <>
      <div 
        className="flex items-center justify-between p-4 border-b bg-muted/30"
        data-testid="bulk-actions-toolbar"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={allSelected ? onClearSelection : onSelectAll}
            data-testid="toggle-select-all"
            aria-label={allSelected ? 'Limpar seleção' : 'Selecionar tudo'}
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {allSelected ? 'Limpar' : 'Selecionar tudo'}
          </Button>

          {hasSelection && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Badge variant="secondary" className="font-mono">
                {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Enriquecer em Lote */}
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isProcessing}
                  data-testid="bulk-enrich-dropdown"
                  aria-label="Enriquecer empresas selecionadas"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Enriquecer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onBulkDiscoverCNPJ && (
                  <>
                    <DropdownMenuItem 
                      onClick={onBulkDiscoverCNPJ}
                      disabled={isProcessing}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Descobrir CNPJ
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={onBulkEnrichReceita}
                  disabled={isProcessing}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Receita Federal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onBulkEnrichApollo}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apollo (Decisores)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onBulkEnrichEconodata}
                  disabled={isProcessing}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Eco-Booster
                </DropdownMenuItem>
                {onBulkEnrichTotvsCheck && (
                  <DropdownMenuItem 
                    onClick={onBulkEnrichTotvsCheck}
                    disabled={isProcessing}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    TOTVS Check
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onBulkEnrich360}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  360° Completo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Exportar Selecionadas */}
          {hasSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportSelected}
              disabled={isProcessing}
              data-testid="export-selected"
              aria-label="Exportar empresas selecionadas"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}

          {/* Ações em Massa */}
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing || isDeleting}
                  data-testid="bulk-actions-dropdown"
                  aria-label="Ações em Massa"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Ações em Massa
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onBulkApprove && (
                  <>
                    <DropdownMenuItem onClick={onBulkApprove} disabled={isProcessing}>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Aprovar e Mover para Pool
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onExportSelected} disabled={isProcessing}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} disabled={isProcessing || isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir em Massa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Deletar Selecionadas */}
          {hasSelection && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isProcessing || isDeleting}
              data-testid="bulk-delete"
              aria-label="Deletar empresas selecionadas"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Deletar
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{selectedCount}</strong> empresa{selectedCount !== 1 ? 's' : ''}.
              <br /><br />
              Esta ação <strong>não pode ser desfeita</strong> e todos os dados relacionados serão perdidos permanentemente.
              <br /><br />
              Digite <strong>CONFIRMAR</strong> para prosseguir:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            id="bulk-delete-confirm"
            className="w-full p-2 border rounded"
            placeholder="Digite CONFIRMAR"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const input = document.getElementById('bulk-delete-confirm') as HTMLInputElement;
                if (input?.value === 'CONFIRMAR') {
                  handleDelete();
                } else {
                  toast.error('Digite CONFIRMAR para prosseguir');
                }
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
