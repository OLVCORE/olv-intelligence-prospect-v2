// ORDEM OPERACIONAL #SAFE-00 — Banner de aviso visível
// Indica que o modo seguro está ativo (sem custos)

import { SAFE_MODE, DISABLE_AUTOSAVE, DISABLE_AUTO_DISCOVERY, BLOCK_WRITES } from '@/lib/flags';
import { Shield, Lock, Pause, AlertTriangle } from 'lucide-react';

/**
 * Banner fixo que aparece quando SAFE_MODE está ativo
 * Mostra claramente que operações custosas estão desabilitadas
 */
export default function SafeModeBanner() {
  if (!SAFE_MODE) return null;

  return (
    <div className="fixed top-20 left-4 z-[9999] rounded-xl bg-gradient-to-r from-amber-900/95 to-orange-900/95 text-amber-50 px-5 py-3 shadow-2xl border-2 border-amber-500/50 backdrop-blur-sm animate-pulse">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 flex-shrink-0" />
        <div>
          <div className="font-bold text-sm flex items-center gap-2">
            🔒 SAFE MODE ATIVO
          </div>
          <div className="text-xs text-amber-200 mt-1 space-y-0.5">
            {DISABLE_AUTOSAVE && (
              <div className="flex items-center gap-1">
                <Pause className="w-3 h-3" />
                <span>Autosave OFF</span>
              </div>
            )}
            {DISABLE_AUTO_DISCOVERY && (
              <div className="flex items-center gap-1">
                <Pause className="w-3 h-3" />
                <span>Auto-discovery OFF</span>
              </div>
            )}
            {BLOCK_WRITES && (
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Writes bloqueadas (dry-run)</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-amber-300 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Nenhum custo de API será gerado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
