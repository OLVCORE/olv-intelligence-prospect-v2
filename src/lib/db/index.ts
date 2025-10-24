// ✅ Cliente Supabase central e helpers de database
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export { supabase };

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// Tabelas principais
export type Company = Tables<'companies'>;
export type DecisionMaker = Tables<'decision_makers'>;
export type DigitalMaturity = Tables<'digital_maturity'>;
export type GovernanceSignal = Tables<'governance_signals'>;
export type Canvas = Tables<'canvas'>;
export type CanvasComment = Tables<'canvas_comments'>;
export type SearchHistory = Tables<'search_history'>;

// Helper para tratar erros do Supabase
export function handleSupabaseError(error: any): never {
  console.error('[Supabase] Erro:', error);
  throw new Error(error.message || 'Erro ao acessar banco de dados');
}

// Helper para queries com tratamento de erro
export async function executeQuery<T>(
  queryPromise: Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  const { data, error } = await queryPromise;
  
  if (error) {
    handleSupabaseError(error);
  }
  
  return data;
}

// Logger de queries (útil para debug)
export const dbLogger = {
  log: (operation: string, table: string, details?: any) => {
    console.log(`[DB:${table}] ${operation}`, details || '');
  },
  error: (operation: string, table: string, error: any) => {
    console.error(`[DB:${table}] ${operation} ERRO:`, error);
  }
};
