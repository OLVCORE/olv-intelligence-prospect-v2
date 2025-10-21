// ✅ Repository de sinais de compra
import { supabase, type BuyingSignal, type Inserts, dbLogger } from './index';

export const signalsRepository = {
  /**
   * Busca sinais de uma empresa
   */
  async findByCompany(companyId: string): Promise<BuyingSignal[]> {
    dbLogger.log('findByCompany', 'buying_signals', { companyId });

    const { data, error } = await supabase
      .from('buying_signals')
      .select('*')
      .eq('company_id', companyId)
      .order('detected_at', { ascending: false });

    if (error) {
      dbLogger.error('findByCompany', 'buying_signals', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca sinais por tipo
   */
  async findByType(companyId: string, signalType: string): Promise<BuyingSignal[]> {
    dbLogger.log('findByType', 'buying_signals', { companyId, signalType });

    const { data, error } = await supabase
      .from('buying_signals')
      .select('*')
      .eq('company_id', companyId)
      .eq('signal_type', signalType)
      .order('detected_at', { ascending: false });

    if (error) {
      dbLogger.error('findByType', 'buying_signals', error);
      return [];
    }

    return data || [];
  },

  /**
   * Cria múltiplos sinais
   */
  async createMany(signals: Inserts<'buying_signals'>[]): Promise<BuyingSignal[]> {
    dbLogger.log('createMany', 'buying_signals', { count: signals.length });

    const { data, error } = await supabase
      .from('buying_signals')
      .insert(signals)
      .select();

    if (error) {
      dbLogger.error('createMany', 'buying_signals', error);
      return [];
    }

    dbLogger.log('createMany SUCCESS', 'buying_signals', { count: data.length });
    return data || [];
  },

  /**
   * Cria sinal único
   */
  async create(signal: Inserts<'buying_signals'>): Promise<BuyingSignal | null> {
    dbLogger.log('create', 'buying_signals', { signal });

    const { data, error } = await supabase
      .from('buying_signals')
      .insert(signal)
      .select()
      .single();

    if (error) {
      dbLogger.error('create', 'buying_signals', error);
      return null;
    }

    return data;
  },

  /**
   * Busca sinais de alta confiança
   */
  async findHighConfidence(companyId: string, minScore = 0.8): Promise<BuyingSignal[]> {
    dbLogger.log('findHighConfidence', 'buying_signals', { companyId, minScore });

    const { data, error } = await supabase
      .from('buying_signals')
      .select('*')
      .eq('company_id', companyId)
      .gte('confidence_score', minScore)
      .order('confidence_score', { ascending: false });

    if (error) {
      dbLogger.error('findHighConfidence', 'buying_signals', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca análise TOTVS Fit
   */
  async findTOTVSFit(companyId: string): Promise<BuyingSignal | null> {
    dbLogger.log('findTOTVSFit', 'buying_signals', { companyId });

    const { data, error } = await supabase
      .from('buying_signals')
      .select('*')
      .eq('company_id', companyId)
      .eq('signal_type', 'totvs_fit_analysis')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      dbLogger.error('findTOTVSFit', 'buying_signals', error);
      return null;
    }

    return data;
  },

  /**
   * Conta sinais de uma empresa
   */
  async countByCompany(companyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('buying_signals')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (error) {
      dbLogger.error('countByCompany', 'buying_signals', error);
      return 0;
    }

    return count || 0;
  }
};
