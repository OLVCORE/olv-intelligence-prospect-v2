import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbNameMap: Record<string, string> = {
  'central-icp': 'Central ICP',
  'discovery': 'Descoberta de Empresas',
  'individual': 'Análise Individual',
  'batch': 'Análise em Massa',
  'dashboard': 'Dashboard de Resultados',
  'audit': 'Auditoria e Compliance',
  'competitive-intelligence': 'Inteligência Competitiva',
  'company-discovery': 'Descoberta de Empresas',
  'battle-cards': 'Battle Cards',
  'win-loss': 'Win-Loss Analysis',
  'monitoring': 'Monitoramento Competitivo',
  'companies': 'Empresas',
  'intelligence-360': 'Intelligence 360°',
  'account-strategy': 'Account Strategy',
  'settings': 'Configurações',
};

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || location.pathname === '/dashboard') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4 px-2">
      <Link 
        to="/dashboard" 
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = breadcrumbNameMap[value] || value;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            {isLast ? (
              <span className={cn(
                "font-medium text-foreground truncate",
                "max-w-[200px] sm:max-w-none"
              )}>
                {label}
              </span>
            ) : (
              <Link 
                to={to} 
                className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
