import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreVertical, Eye, Edit, Trash2, UserPlus, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DealCardActionsProps {
  dealId: string;
  dealTitle: string;
  companyId?: string;
  onDeleted?: () => void;
}

export function DealCardActions({ dealId, dealTitle, companyId, onDeleted }: DealCardActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('sdr_deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      toast({
        title: '✅ Deal deletado',
        description: `"${dealTitle}" foi removido do pipeline`,
      });

      setShowDeleteDialog(false);
      onDeleted?.();
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast({
        title: 'Erro ao deletar deal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(`/sdr/inbox`)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Conversa
          </DropdownMenuItem>
          {companyId && (
            <DropdownMenuItem onClick={() => navigate(`/intelligence-360?company=${companyId}`)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Detalhes da Empresa
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar Deal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Deal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar <strong>"{dealTitle}"</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
