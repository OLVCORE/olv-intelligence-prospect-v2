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
  Settings2,
  Loader2,
  Sparkles,
  FileText,
  Building2,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Target,
  Brain
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CompanyActionsMenuProps {
  companyId: string;
  companyName: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onEnrich?: () => void;
}

export function CompanyActionsMenu({
  companyId,
  companyName,
  isLoading = false,
  onRefresh,
  onEnrich
}: CompanyActionsMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="default"
          disabled={isLoading}
          aria-label="Menu de ações da empresa"
          className="gap-2 glass-card hover:shadow-lg transition-all"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Settings2 className="h-4 w-4" />
          )}
          Ações
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 z-[100] bg-popover/95 backdrop-blur-md border-border/50"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Command Center - {companyName}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Dados & Enriquecimento</DropdownMenuLabel>
          
          {onRefresh && (
            <DropdownMenuItem 
              onClick={() => {
                onRefresh();
                setIsOpen(false);
              }}
              disabled={isLoading}
              className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Dados
              <span className="ml-auto text-xs text-muted-foreground">Smart</span>
            </DropdownMenuItem>
          )}

          {onEnrich && (
            <DropdownMenuItem 
              onClick={() => {
                onEnrich();
                setIsOpen(false);
              }}
              disabled={isLoading}
              className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
            >
              <Brain className="h-4 w-4 mr-2" />
              Enriquecer com IA
              <span className="ml-auto text-xs text-muted-foreground">Auto</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Navegação</DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => {
              navigate(`/account-strategy/${companyId}`);
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Target className="h-4 w-4 mr-2" />
            Estratégia de Conta
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              navigate(`/canvas/${companyId}`);
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <FileText className="h-4 w-4 mr-2" />
            Canvas Estratégico
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              navigate(`/central-icp/individual?company=${companyId}`);
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Brain className="h-4 w-4 mr-2" />
            Análise Individual ICP
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              navigate('/companies');
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Voltar para Empresas
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              navigate('/sdr/workspace');
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Workspace SDR
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => {
              navigate('/dashboard');
              setIsOpen(false);
            }}
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard Executivo
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
