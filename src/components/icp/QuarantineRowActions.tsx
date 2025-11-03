import { Settings, CheckCircle, XCircle, Eye, Trash2, RefreshCw, Target, Edit, Search, Building2, Sparkles, Zap, ExternalLink, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { QuarantineReportModal } from '@/components/icp/QuarantineReportModal';
import { DiscardCompanyModal } from '@/components/icp/DiscardCompanyModal';

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
  onEnrichTotvsCheck?: (id: string) => Promise<void>;
  onDiscoverCNPJ?: (id: string) => void;
  onOpenExecutiveReport?: () => void;
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
  onEnrichTotvsCheck,
  onDiscoverCNPJ,
  onOpenExecutiveReport,
}: QuarantineRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingAction, setEnrichingAction] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const navigate = useNavigate();

  const handleApprove = () => {
    onApprove(company.id);
    setIsOpen(false);
  };

  const handleReject = () => {
    setShowDiscardModal(true);
    setIsOpen(false);
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
    <TooltipProvider>
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
        <DropdownMenuContent align="end" className="w-72 bg-popover z-[100]">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Ver Detalhes (mesclado com Preview) */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={handlePreview}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Visualizar Análise Completa</p>
              <p className="text-xs text-muted-foreground mt-1">Abre modal com todos os dados ICP, scores, temperatura e análise detalhada da empresa</p>
            </TooltipContent>
          </Tooltip>

          {/* Editar/Salvar Dados */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Editar Cadastro da Empresa</p>
              <p className="text-xs text-muted-foreground mt-1">Abre tela de busca/edição para atualizar manualmente dados cadastrais, contatos e informações complementares</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuSeparator />

          {/* Simple TOTVS Check - Abrir modal (origem única) */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  setShowReport(true);
                  setIsOpen(false);
                  toast.info('Use o botão "Reverificar" dentro do relatório para executar o check (com cooldown).');
                }}
                disabled={isEnriching}
                className="relative animate-pulse bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 hover:from-primary/30 hover:via-primary/20 hover:to-primary/30 border-l-4 border-primary font-semibold cursor-pointer transition-all dark:from-primary/30 dark:via-primary/20 dark:to-primary/30 dark:hover:from-primary/40 dark:hover:via-primary/30 dark:hover:to-primary/40"
              >
                {enrichingAction === 'TOTVS Check' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                ) : (
                  <Target className="h-4 w-4 mr-2 text-primary" />
                )}
                <span className="text-primary">Simple TOTVS Check (STC)</span>
                <Sparkles className="h-3 w-3 ml-auto text-primary animate-pulse" />
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs bg-primary text-primary-foreground">
              <p className="font-semibold text-sm">⭐ STC - TOTVS Checker (Prioritário)</p>
              <p className="text-xs mt-1">Verifica em 17 fontes premium (CVM, notícias, deep web) se empresa já é cliente TOTVS. Detecta triple/double/single match com highlight de termos encontrados</p>
            </TooltipContent>
          </Tooltip>

          {/* Ver Relatório TOTVS (Modal) */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (onOpenExecutiveReport) {
                    onOpenExecutiveReport();
                  }
                  setIsOpen(false);
                }}
                className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Relatório Executivo ICP</p>
              <p className="text-xs text-muted-foreground mt-1">Exibe análise completa consolidada: ICP score, temperatura, fit TOTVS, maturidade digital, diagnóstico 360° e recomendações de abordagem</p>
            </TooltipContent>
          </Tooltip>

          {/* Atualizar relatório */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (onRefresh) onRefresh(company.id);
                }}
                className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar relatório
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Refresh Análise ICP</p>
              <p className="text-xs text-muted-foreground mt-1">Re-executa análise ICP completa com dados atualizados da empresa para refletir mudanças recentes no score e temperatura</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuSeparator />

          {/* Criar Estratégia */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">ROI-Labs: Estratégia de Conta</p>
              <p className="text-xs text-muted-foreground mt-1">Abre central estratégica com ROI Calculator, CPQ, análise de cenários best/expected/worst, propostas visuais e value realization</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Enriquecimento</DropdownMenuLabel>

          {/* Descobrir CNPJ */}
          {!company.cnpj && onDiscoverCNPJ && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Busca Automática de CNPJ</p>
                <p className="text-xs text-muted-foreground mt-1">Pesquisa CNPJ através de APIs públicas e motores de busca usando razão social e domínio da empresa</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Receita Federal */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Consulta Receita Federal</p>
              <p className="text-xs text-muted-foreground mt-1">Busca dados oficiais da empresa: situação cadastral, atividade econômica (CNAE), porte, endereço completo e sócios diretamente da base da Receita Federal (requer CNPJ)</p>
            </TooltipContent>
          </Tooltip>

          {/* Apollo */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Apollo.io - Pessoas Decisoras</p>
              <p className="text-xs text-muted-foreground mt-1">Identifica contatos C-Level, diretores e decisores com nome, cargo, e-mail, telefone e perfil LinkedIn usando base Apollo.io</p>
            </TooltipContent>
          </Tooltip>

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
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Intelligence 360° - Análise Completa</p>
              <p className="text-xs text-muted-foreground mt-1">Executa diagnóstico completo com IA: análise de site, redes sociais, notícias, tech stack, maturidade digital, saúde online, benchmark setorial e recomendações estratégicas personalizadas</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuSeparator />

          {/* Abrir Website */}
          {company.website && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Visitar Site da Empresa</p>
                <p className="text-xs text-muted-foreground mt-1">Abre o website oficial da empresa em nova aba para análise manual de produtos, serviços e presença digital</p>
              </TooltipContent>
            </Tooltip>
          )}

          {company.status === 'pendente' && (
            <>
              <DropdownMenuSeparator />
              
              {/* Aprovar */}
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem 
                    onClick={handleApprove}
                    className="hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-l-4 hover:border-green-500 transition-all cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Aprovar e Mover para Pool
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-semibold text-sm">Aprovar Lead Qualificado</p>
                  <p className="text-xs text-muted-foreground mt-1">Move empresa aprovada da quarentena para o pool ativo de leads, disponível para equipe de vendas trabalhar na prospecção</p>
                </TooltipContent>
              </Tooltip>

              {/* Descartar */}
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem 
                    onClick={handleReject}
                    className="hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-l-4 hover:border-orange-500 transition-all cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 mr-2 text-orange-600" />
                    Descartar (Não qualificado)
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-semibold text-sm">Descartar Lead</p>
                  <p className="text-xs text-muted-foreground mt-1">Remove empresa da quarentena por não atender critérios ICP. Move para histórico de descartados com motivo registrado para auditoria</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Ação Perigosa</DropdownMenuLabel>
          
          {/* Deletar */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 hover:border-l-4 hover:border-destructive transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Permanentemente
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm text-destructive">⚠️ Exclusão Permanente</p>
              <p className="text-xs text-muted-foreground mt-1">Remove definitivamente todos os dados da empresa do sistema. Esta ação é irreversível e não pode ser desfeita</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuContent>

        {/* Modal de Relatório (Quarentena) */}
        <QuarantineReportModal 
          open={showReport}
          onOpenChange={setShowReport}
          analysisId={company.id}
          companyId={company.company_id || undefined}
          companyName={company.razao_social || 'Empresa'}
          cnpj={company.cnpj}
          domain={company.domain || company.website}
        />

        {/* Modal de Descarte com motivos */}
        <DiscardCompanyModal
          open={showDiscardModal}
          onOpenChange={setShowDiscardModal}
          company={{
            id: company.company_id || company.id,
            name: company.razao_social || 'Empresa',
            cnpj: company.cnpj,
            icp_score: company.icp_score,
            icp_temperature: company.temperatura,
          }}
          analysisId={company.id}
          onSuccess={() => {
            onReject(company.id, 'Descartado via modal');
          }}
        />
      </DropdownMenu>
    </TooltipProvider>
  );
}
