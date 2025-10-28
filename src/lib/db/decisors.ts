// ✅ Repository de decisores
import { supabase, type DecisionMaker, type Inserts, type Updates, dbLogger } from './index';

export const decisorsRepository = {
  /**
   * Busca decisores de uma empresa
   */
  async findByCompany(companyId: string): Promise<DecisionMaker[]> {
    dbLogger.log('findByCompany', 'decision_makers', { companyId });

    const { data, error } = await supabase
      .from('decision_makers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      dbLogger.error('findByCompany', 'decision_makers', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca decisor por ID
   */
  async findById(id: string): Promise<DecisionMaker | null> {
    dbLogger.log('findById', 'decision_makers', { id });

    const { data, error } = await supabase
      .from('decision_makers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      dbLogger.error('findById', 'decision_makers', error);
      return null;
    }

    return data;
  },

  /**
   * Cria múltiplos decisores
   */
  async createMany(decisors: Inserts<'decision_makers'>[]): Promise<DecisionMaker[]> {
    dbLogger.log('createMany', 'decision_makers', { count: decisors.length });

    const { data, error } = await supabase
      .from('decision_makers')
      .insert(decisors)
      .select();

    if (error) {
      dbLogger.error('createMany', 'decision_makers', error);
      return [];
    }

    dbLogger.log('createMany SUCCESS', 'decision_makers', { count: data.length });
    return data || [];
  },

  /**
   * Atualiza decisor
   */
  async update(id: string, updates: Updates<'decision_makers'>): Promise<DecisionMaker | null> {
    dbLogger.log('update', 'decision_makers', { id, updates });

    const { data, error } = await supabase
      .from('decision_makers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      dbLogger.error('update', 'decision_makers', error);
      return null;
    }

    return data;
  },

  /**
   * Busca decisores com email verificado
   */
  async findVerifiedEmails(companyId: string): Promise<DecisionMaker[]> {
    dbLogger.log('findVerifiedEmails', 'decision_makers', { companyId });

    const { data, error } = await supabase
      .from('decision_makers')
      .select('*')
      .eq('company_id', companyId)
      .eq('email_status', 'verified');

    if (error) {
      dbLogger.error('findVerifiedEmails', 'decision_makers', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca decisores por seniority
   */
  async findBySeniority(companyId: string, seniority: string): Promise<DecisionMaker[]> {
    dbLogger.log('findBySeniority', 'decision_makers', { companyId, seniority });

    const { data, error } = await supabase
      .from('decision_makers')
      .select('*')
      .eq('company_id', companyId)
      .ilike('seniority', `%${seniority}%`);

    if (error) {
      dbLogger.error('findBySeniority', 'decision_makers', error);
      return [];
    }

    return data || [];
  },

  /**
   * Conta decisores de uma empresa
   */
  async countByCompany(companyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('decision_makers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (error) {
      dbLogger.error('countByCompany', 'decision_makers', error);
      return 0;
    }

    return count || 0;
  }
};
