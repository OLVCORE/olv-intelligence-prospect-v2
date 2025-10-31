import { Settings, CheckCircle, Eye, Target } from 'lucide-react';
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
import { SimpleTOTVSCheckDialog } from '@/components/intelligence/SimpleTOTVSCheckDialog';

interface PoolRowActionsProps {
  lead: any;
  onQualify: (id: string) => void;
}

export function PoolRowActions({
  lead,
  onQualify,
}: PoolRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTOTVSCheck, setShowTOTVSCheck] = useState(false);

  const handleQualify = () => {
    onQualify(lead.id);
    setIsOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Ações da empresa"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover z-[100]">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Simple TOTVS Check */}
          <DropdownMenuItem 
            onClick={() => {
              setShowTOTVSCheck(true);
              setIsOpen(false);
            }}
            className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
          >
            <Target className="h-4 w-4 mr-2" />
            Simple TOTVS Check
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {/* Qualificar */}
          <DropdownMenuItem 
            onClick={handleQualify}
            className="hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-l-4 hover:border-green-500 transition-all cursor-pointer"
          >
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Qualificar e Ativar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showTOTVSCheck && (
        <SimpleTOTVSCheckDialog
          companyId={lead.id}
          companyName={lead.razao_social || "Empresa"}
          cnpj={lead.cnpj || undefined}
          domain={lead.domain || undefined}
          open={showTOTVSCheck}
          onOpenChange={setShowTOTVSCheck}
        />
      )}
    </>
  );
}
