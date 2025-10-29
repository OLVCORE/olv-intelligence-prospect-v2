import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  showNavigation?: boolean;
}

export default function PageHeader({ 
  title, 
  description, 
  actions, 
  showNavigation = true 
}: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbNameMap: Record<string, string> = {
    'central-icp': 'Central ICP',
    'individual': 'Análise Individual',
    'batch': 'Análise em Massa',
    'dashboard': 'Dashboard',
    'audit': 'Auditoria',
    'sales-intelligence': 'Sales Intelligence',
    'feed': 'Feed de Sinais',
    'config': 'Configuração',
    'companies': 'Empresas Monitoradas',
    'competitive-intelligence': 'Inteligência Competitiva',
    'battle-cards': 'Battle Cards',
    'win-loss': 'Win-Loss Analysis',
    'monitoring': 'Monitoramento',
    'account-strategy': 'Estratégia de Conta',
    'intelligence': 'Intelligence',
    'intelligence-360': 'Intelligence 360',
    'company': 'Empresa',
    'digital-presence': 'Presença Digital',
    'analysis-360': 'Análise 360',
    'tech-stack': 'Tech Stack',
    'fit-totvs': 'Fit TOTVS',
    'governance': 'Governança',
    'benchmark': 'Benchmark',
    'personas-library': 'Biblioteca de Personas',
    'playbooks': 'Playbooks',
    'canvas': 'Canvas',
    'consultoria-olv': 'Consultoria OLV',
    'reports': 'Relatórios',
    'geographic-analysis': 'Análise Geográfica',
    'goals': 'Metas',
    'sdr': 'SDR',
    'workspace': 'Workspace',
    'inbox': 'Inbox',
    'sequences': 'Sequências',
    'tasks': 'Tarefas',
    'integrations': 'Integrações',
    'analytics': 'Analytics',
    'settings': 'Configurações',
    'email-settings': 'Configurações de Email',
    'data-migration': 'Migração de Dados',
    'search': 'Busca',
    'maturity': 'Maturidade',
    'strategy-history': 'Histórico de Estratégias',
    'discovery': 'Descoberta',
  };

  return (
    <div className="mb-6">
      {showNavigation && (
        <div className="flex items-center justify-between mb-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-8 px-2"
            >
              <Home className="w-4 h-4" />
            </Button>
            {pathnames.length > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const label = breadcrumbNameMap[value] || value;

              return (
                <React.Fragment key={to}>
                  {isLast ? (
                    <span className="text-foreground font-medium">{label}</span>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(to)}
                        className="hover:text-foreground transition-colors"
                      >
                        {label}
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(1)}
              className="h-8"
            >
              Avançar
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}