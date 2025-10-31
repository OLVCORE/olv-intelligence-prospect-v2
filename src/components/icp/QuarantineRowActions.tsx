import { Settings, CheckCircle, XCircle, Eye, Trash2, RefreshCw, Target, Edit, Search, Building2, Sparkles, Zap, ExternalLink, Loader2 } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface QuarantineRowActionsProps {
  company: any;
  onApprove: (id: string) => void;
  onReject: (id: string, motivo: string) => void;
  onDelete: (id: string) => void;
  onPreview: (company: any) => void;
  onRefresh?: (id: string) => void;
  onEnrichReceita?: (id: string) => Promise<void>;
  onEnrichApollo?: (id: string) => Promise<void>;
  onEnrichEconodata?: (id: string) => Promise<void>;
  onEnrich360?: (id: string) => Promise<void>;
  onDiscoverCNPJ?: (id: string) => void;
}

export function QuarantineRowActions({
  company,
  onApprove,
  onReject,
  onDelete,
  onPreview,
  onRefresh,
  onEnrichReceita,
  onEnrichApollo,
  onEnrichEconodata,
  onEnrich360,
  onDiscoverCNPJ,
}: QuarantineRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingAction, setEnrichingAction] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleEnrich = async (action: string, fn?: (id: string) => Promise<void>) => {
    if (!fn) return;
    try {
      setIsEnriching(true);
      setEnrichingAction(action);
      await fn(company.id);
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
        
        {/* Ver Detalhes (mesclado com Preview) */}
        <DropdownMenuItem 
          onClick={handlePreview}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </DropdownMenuItem>

        {/* Editar/Salvar Dados */}
        <DropdownMenuItem 
          onClick={() => {
            // Se já tem company_id vinculado, vai para edição
            if (company.company_id) {
              navigate(`/search?companyId=${company.company_id}`);
            } else {
              toast.info('Complete a aprovação para editar dados completos');
            }
            setIsOpen(false);
          }}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar/Salvar Dados
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Simple TOTVS Check */}
        <DropdownMenuItem 
          onClick={() => {
            const name = encodeURIComponent(company.razao_social || 'Empresa');
            const cnpj = encodeURIComponent(company.cnpj || '');
            const domain = encodeURIComponent(company.domain || '');
            navigate(`/leads/icp-quarantine/report/${company.id}?name=${name}&cnpj=${cnpj}&domain=${domain}`);
            setIsOpen(false);
          }}
          className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Target className="h-4 w-4 mr-2" />
          Simple TOTVS Check
        </DropdownMenuItem>

        {/* Atualizar relatório */}
        <DropdownMenuItem 
          onClick={() => {
            if (onRefresh) onRefresh(company.id);
          }}
          className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar relatório
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Criar Estratégia */}
        <DropdownMenuItem 
          onClick={() => {
            if (company.company_id) {
              navigate(`/account-strategy?company=${company.company_id}`);
            } else {
              toast.info('Aprove a empresa primeiro para criar estratégia');
            }
            setIsOpen(false);
          }}
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
            onClick={() => {
              onDiscoverCNPJ(company.id);
              setIsOpen(false);
            }}
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
          {enrichingAction === 'Receita Federal' ? (
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

        {/* ECONODATA: Desabilitado - fase 2 */}
        {/* Eco-Booster
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
        */}

        {/* 360° Completo */}
        <DropdownMenuItem
          onClick={() => handleEnrich('360° Completo', onEnrich360)}
          disabled={isEnriching}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          {enrichingAction === '360° Completo' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          360° Completo
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Abrir Website */}
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
      
      {/* Dialog removido aqui: navegação para subpágina dedicada */}
    </DropdownMenu>
  );
}
