import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface UnsavedChangesWarningProps {
  hasUnsavedChanges: boolean;
  onSave?: () => Promise<void>;
}

export function UnsavedChangesWarning({ hasUnsavedChanges, onSave }: UnsavedChangesWarningProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);
  const [shouldBlock, setShouldBlock] = useState(true);

  // Interceptar navegação via React Router
  useEffect(() => {
    if (!hasUnsavedChanges || !shouldBlock) return;

    // Interceptar cliques em links internos
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        const href = anchor.getAttribute('href');
        if (href && href !== location.pathname) {
          e.preventDefault();
          setNextLocation(href);
          setShowDialog(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges, location, shouldBlock]);

  const handleConfirmLeave = useCallback(() => {
    setShouldBlock(false);
    setShowDialog(false);
    if (nextLocation) {
      // Navegar após um pequeno delay para garantir que o bloqueio foi removido
      setTimeout(() => {
        navigate(nextLocation);
      }, 50);
    }
  }, [nextLocation, navigate]);

  const handleSaveAndLeave = useCallback(async () => {
    if (onSave) {
      await onSave();
    }
    handleConfirmLeave();
  }, [onSave, handleConfirmLeave]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setNextLocation(null);
  }, []);

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem alterações não salvas</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja salvar suas alterações antes de sair? Se você sair sem salvar, as alterações serão perdidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sair sem salvar
          </AlertDialogAction>
          {onSave && (
            <AlertDialogAction onClick={handleSaveAndLeave}>
              Salvar e sair
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
