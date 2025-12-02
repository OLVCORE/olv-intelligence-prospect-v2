/**
 * 🔍 BUSCA ABRANGENTE UNIFICADA DE EMPRESAS
 * 
 * Componente elegante para busca em múltiplos campos:
 * - Nome da empresa
 * - CNPJ
 * - Domínio/Website
 * - Origem
 * - Cidade/UF
 * - Setor
 */

import { Search, X, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UnifiedCompanySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalCompanies?: number;
}

export function UnifiedCompanySearch({
  value,
  onChange,
  placeholder = "Buscar por nome, CNPJ, domínio, cidade, UF, setor...",
  totalCompanies,
}: UnifiedCompanySearchProps) {
  
  return (
    <div className="w-full p-6 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-xl shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* ÍCONE + TÍTULO */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-base text-white">Buscar Empresas</span>
            {totalCompanies !== undefined && (
              <p className="text-xs text-blue-300 font-medium mt-0.5">
                {totalCompanies} {totalCompanies === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
              </p>
            )}
          </div>
        </div>
        
        {/* INPUT DE BUSCA */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" strokeWidth={2.5} />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-12 pr-12 h-12 text-base font-medium bg-background/80 border-2 border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-lg shadow-md"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-red-500/20 rounded-full"
              title="Limpar busca"
            >
              <X className="h-4 w-4 text-red-400" />
            </Button>
          )}
        </div>
      </div>
      
      {/* DICAS DE BUSCA */}
      {!value && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-300/80">
          <span className="px-2 py-1 bg-blue-500/20 rounded-md">💼 Nome da empresa</span>
          <span className="px-2 py-1 bg-cyan-500/20 rounded-md">🔢 CNPJ</span>
          <span className="px-2 py-1 bg-purple-500/20 rounded-md">🌐 Domínio</span>
          <span className="px-2 py-1 bg-pink-500/20 rounded-md">📍 Cidade/UF</span>
          <span className="px-2 py-1 bg-green-500/20 rounded-md">🏭 Setor</span>
        </div>
      )}
    </div>
  );
}

