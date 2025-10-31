import { Settings, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { toast } from 'sonner';

interface QuarantineRowActionsProps {
  company: any;
  onApprove: (id: string) => void;
  onReject: (id: string, motivo: string) => void;
  onDelete: (id: string) => void;
  onPreview: (company: any) => void;
}

export function QuarantineRowActions({
  company,
  onApprove,
  onReject,
  onDelete,
  onPreview,
}: QuarantineRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleApprove = () => {
    onApprove(company.id);
    setIsOpen(false);
  };

  const handleReject = () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja descartar "${company.razao_social}"?`
    );
    if (confirmed) {
      onReject(company.id, 'Descartado manualmente');
      setIsOpen(false);
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja DELETAR permanentemente "${company.razao_social}"? Esta ação não pode ser desfeita.`
    );
    if (confirmed) {
      onDelete(company.id);
      setIsOpen(false);
    }
  };

  const handlePreview = () => {
    onPreview(company);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-testid="quarantine-row-actions"
          aria-label="Ações da empresa"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-[100]">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Preview */}
        <DropdownMenuItem 
          onClick={handlePreview}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Preview
        </DropdownMenuItem>

        {company.status === 'pendente' && (
          <>
            <DropdownMenuSeparator />
            
            {/* Aprovar */}
            <DropdownMenuItem 
              onClick={handleApprove}
              className="hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-l-4 hover:border-green-500 transition-all cursor-pointer"
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Aprovar e Mover para Pool
            </DropdownMenuItem>

            {/* Descartar */}
            <DropdownMenuItem 
              onClick={handleReject}
              className="hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-l-4 hover:border-orange-500 transition-all cursor-pointer"
            >
              <XCircle className="h-4 w-4 mr-2 text-orange-600" />
              Descartar (Não qualificado)
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Ação Perigosa</DropdownMenuLabel>
        
        {/* Deletar */}
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-destructive hover:bg-destructive/10 hover:border-l-4 hover:border-destructive transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Deletar Permanentemente
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
