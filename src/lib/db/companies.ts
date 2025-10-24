// ✅ Repository de empresas
import { supabase, type Company, type Inserts, type Updates, dbLogger, executeQuery } from './index';

export interface CompanyWithRelations extends Company {
  decision_makers?: any[];
  governance_signals?: any[];
}

export const companiesRepository = {
  /**
   * Busca empresa por ID com relações
   */
  async findById(id: string, includeRelations = false): Promise<CompanyWithRelations | null> {
    dbLogger.log('findById', 'companies', { id, includeRelations });

    // Busca base da empresa
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      dbLogger.error('findById', 'companies', error);
      return null;
    }

    // Se não precisa de relações, retorna direto
    if (!includeRelations) {
      return data as CompanyWithRelations;
    }

    // Busca relações separadamente (evita erro 400)
    const [decisorsRes, signalsRes] = await Promise.all([
      supabase.from('decision_makers').select('*').eq('company_id', id),
      supabase.from('governance_signals').select('*').eq('company_id', id),
    ]);

    return {
      ...data,
      decision_makers: decisorsRes.data || [],
      governance_signals: signalsRes.data || [],
    } as CompanyWithRelations;
  },

  /**
   * Busca empresa por CNPJ
   */
  async findByCNPJ(cnpj: string): Promise<Company | null> {
    dbLogger.log('findByCNPJ', 'companies', { cnpj });

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('cnpj', cnpj)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrado
        return null;
      }
      dbLogger.error('findByCNPJ', 'companies', error);
      return null;
    }

    return data;
  },

  /**
   * Lista empresas com paginação
   */
  async list(page = 0, limit = 10, orderBy: 'created_at' | 'name' = 'created_at'): Promise<Company[]> {
    dbLogger.log('list', 'companies', { page, limit, orderBy });

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order(orderBy, { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      dbLogger.error('list', 'companies', error);
      return [];
    }

    return data || [];
  },

  /**
   * Cria ou atualiza empresa (upsert por CNPJ)
   */
  async upsert(company: Inserts<'companies'>): Promise<Company | null> {
    dbLogger.log('upsert', 'companies', { name: company.name });

    const { data, error } = await supabase
      .from('companies')
      .upsert(company, { onConflict: 'cnpj' })
      .select()
      .single();

    if (error) {
      dbLogger.error('upsert', 'companies', error);
      return null;
    }

    dbLogger.log('upsert SUCCESS', 'companies', { id: data.id });
    return data;
  },

  /**
   * Atualiza empresa
   */
  async update(id: string, updates: Updates<'companies'>): Promise<Company | null> {
    dbLogger.log('update', 'companies', { id, updates });

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      dbLogger.error('update', 'companies', error);
      return null;
    }

    return data;
  },

  /**
   * Busca empresas por score de maturidade
   */
  async findByMaturityScore(minScore: number, maxScore: number): Promise<Company[]> {
    dbLogger.log('findByMaturityScore', 'companies', { minScore, maxScore });

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .gte('digital_maturity_score', minScore)
      .lte('digital_maturity_score', maxScore)
      .order('digital_maturity_score', { ascending: false });

    if (error) {
      dbLogger.error('findByMaturityScore', 'companies', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca empresas por indústria
   */
  async findByIndustry(industry: string): Promise<Company[]> {
    dbLogger.log('findByIndustry', 'companies', { industry });

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .ilike('industry', `%${industry}%`)
      .order('created_at', { ascending: false });

    if (error) {
      dbLogger.error('findByIndustry', 'companies', error);
      return [];
    }

    return data || [];
  },

  /**
   * Conta total de empresas
   */
  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      dbLogger.error('count', 'companies', error);
      return 0;
    }

    return count || 0;
  }
};
