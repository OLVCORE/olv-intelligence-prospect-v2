import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  Eye,
  Edit,
  Target,
  Search,
  Building2,
  Sparkles,
  Zap,
  Trash2,
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { ExecutiveReportModal } from '@/components/reports/ExecutiveReportModal';

interface CompanyRowActionsProps {
  company: any;
  onDelete: () => void;
  onEnrichReceita: () => Promise<void>;
  onEnrich360: () => Promise<void>;
  onEnrichApollo: () => Promise<void>;
  onEnrichEconodata: () => Promise<void>;
  onDiscoverCNPJ?: () => void;
}

export function CompanyRowActions({
  company,
  onDelete,
  onEnrichReceita,
  onEnrich360,
  onEnrichApollo,
  onEnrichEconodata,
  onDiscoverCNPJ
}: CompanyRowActionsProps) {
  const navigate = useNavigate();
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingAction, setEnrichingAction] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const handleEnrich = async (action: string, fn: () => Promise<void>) => {
    try {
      setIsEnriching(true);
      setEnrichingAction(action);
      await fn();
    } catch (error) {
      toast.error(`Erro ao executar ${action}`);
    } finally {
      setIsEnriching(false);
      setEnrichingAction(null);
    }
  };

  const isDisabled = (action: string) => {
    if (action === 'receita' && !company.cnpj) return true;
    if (action === 'econodata' && !company.cnpj) return true;
    return false;
  };

  const getTooltip = (action: string) => {
    if (action === 'receita' && !company.cnpj) return 'Requer CNPJ';
    if (action === 'econodata' && !company.cnpj) return 'Requer CNPJ';
    return '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-testid="company-row-actions"
          aria-label="Ações da empresa"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Visualizar */}
        <DropdownMenuItem 
          onClick={() => navigate(`/company/${company.id}`)}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </DropdownMenuItem>

        {/* Relatório Executivo */}
        <DropdownMenuItem 
          onClick={() => setShowReport(true)}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          Relatório Executivo
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate(`/search?companyId=${company.id}`)}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar/Salvar Dados
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Estratégia - só quando há CNPJ e dados básicos */}
        <DropdownMenuItem 
          onClick={() => navigate(`/account-strategy?company=${company.id}`)}
          disabled={!company.cnpj}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Target className="h-4 w-4 mr-2" />
          {company.cnpj ? 'Criar Estratégia' : 'Criar Estratégia (requer CNPJ)'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Enriquecimento</DropdownMenuLabel>

        {/* Descobrir CNPJ */}
        {!company.cnpj && onDiscoverCNPJ && (
          <DropdownMenuItem 
            onClick={onDiscoverCNPJ}
            className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
          >
            <Search className="h-4 w-4 mr-2" />
            Descobrir CNPJ
          </DropdownMenuItem>
        )}

        {/* Receita Federal */}
        <DropdownMenuItem
          onClick={() => handleEnrich('Receita Federal', onEnrichReceita)}
          disabled={isDisabled('receita') || isEnriching}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          {enrichingAction === 'receita' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4 mr-2" />
          )}
          Receita Federal
          {getTooltip('receita') && <span className="ml-auto text-xs text-muted-foreground">{getTooltip('receita')}</span>}
        </DropdownMenuItem>

        {/* Apollo */}
        <DropdownMenuItem
          onClick={() => handleEnrich('Apollo', onEnrichApollo)}
          disabled={isEnriching}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          {enrichingAction === 'Apollo' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
          )}
          Apollo (Decisores)
        </DropdownMenuItem>

        {/* Eco-Booster */}
        <DropdownMenuItem
          onClick={() => handleEnrich('Eco-Booster', onEnrichEconodata)}
          disabled={isDisabled('econodata') || isEnriching}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          {enrichingAction === 'Eco-Booster' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Eco-Booster
          {getTooltip('econodata') && <span className="ml-auto text-xs text-muted-foreground">{getTooltip('econodata')}</span>}
        </DropdownMenuItem>

        {/* 360° Completo */}
        <DropdownMenuItem
          onClick={() => handleEnrich('360°', onEnrich360)}
          disabled={isEnriching}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          {enrichingAction === '360°' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          360° Completo
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Links Externos */}
        {company.website && (
          <DropdownMenuItem asChild>
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Website
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Deletar */}
        <DropdownMenuItem 
          onClick={onDelete} 
          className="text-destructive focus:text-destructive hover:bg-destructive/10 hover:border-l-4 hover:border-destructive transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
      {/* Modal de Relatório Executivo */}
      <ExecutiveReportModal 
        open={showReport} 
        onOpenChange={setShowReport} 
        companyId={company.id}
      />
    </DropdownMenu>
  );
}
