// ✅ Repository de sinais de governança
import { supabase, type GovernanceSignal, type Inserts, dbLogger } from './index';

export const signalsRepository = {
  /**
   * Busca sinais de uma empresa
   */
  async findByCompany(companyId: string): Promise<GovernanceSignal[]> {
    dbLogger.log('findByCompany', 'governance_signals', { companyId });

    const { data, error } = await supabase
      .from('governance_signals')
      .select('*')
      .eq('company_id', companyId)
      .order('detected_at', { ascending: false });

    if (error) {
      dbLogger.error('findByCompany', 'governance_signals', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca sinais por tipo
   */
  async findByType(companyId: string, signalType: string): Promise<GovernanceSignal[]> {
    dbLogger.log('findByType', 'governance_signals', { companyId, signalType });

    const { data, error } = await supabase
      .from('governance_signals')
      .select('*')
      .eq('company_id', companyId)
      .eq('signal_type', signalType)
      .order('detected_at', { ascending: false });

    if (error) {
      dbLogger.error('findByType', 'governance_signals', error);
      return [];
    }

    return data || [];
  },

  /**
   * Cria múltiplos sinais
   */
  async createMany(signals: Inserts<'governance_signals'>[]): Promise<GovernanceSignal[]> {
    dbLogger.log('createMany', 'governance_signals', { count: signals.length });

    const { data, error } = await supabase
      .from('governance_signals')
      .insert(signals)
      .select();

    if (error) {
      dbLogger.error('createMany', 'governance_signals', error);
      return [];
    }

    dbLogger.log('createMany SUCCESS', 'governance_signals', { count: data.length });
    return data || [];
  },

  /**
   * Cria sinal único
   */
  async create(signal: Inserts<'governance_signals'>): Promise<GovernanceSignal | null> {
    dbLogger.log('create', 'governance_signals', { signal });

    const { data, error } = await supabase
      .from('governance_signals')
      .insert(signal)
      .select()
      .single();

    if (error) {
      dbLogger.error('create', 'governance_signals', error);
      return null;
    }

    return data;
  },

  /**
   * Busca sinais de alta confiança
   */
  async findHighConfidence(companyId: string, minScore = 0.8): Promise<GovernanceSignal[]> {
    dbLogger.log('findHighConfidence', 'governance_signals', { companyId, minScore });

    const { data, error } = await supabase
      .from('governance_signals')
      .select('*')
      .eq('company_id', companyId)
      .gte('confidence_score', minScore)
      .order('confidence_score', { ascending: false });

    if (error) {
      dbLogger.error('findHighConfidence', 'governance_signals', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca análise de Governança (antes TOTVS Fit)
   */
  async findGovernanceAnalysis(companyId: string): Promise<GovernanceSignal | null> {
    dbLogger.log('findGovernanceAnalysis', 'governance_signals', { companyId });

    const { data, error } = await supabase
      .from('governance_signals')
      .select('*')
      .eq('company_id', companyId)
      .eq('signal_type', 'governance_gap_analysis')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      dbLogger.error('findGovernanceAnalysis', 'governance_signals', error);
      return null;
    }

    return data;
  },

  /**
   * Conta sinais de uma empresa
   */
  async countByCompany(companyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('governance_signals')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (error) {
      dbLogger.error('countByCompany', 'governance_signals', error);
      return 0;
    }

    return count || 0;
  }
};
