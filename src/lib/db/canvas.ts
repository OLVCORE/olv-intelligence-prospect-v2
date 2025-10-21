// ✅ Repository de canvas colaborativo
import { supabase, type Canvas, type CanvasComment, type Inserts, type Updates, dbLogger } from './index';

export const canvasRepository = {
  /**
   * Busca canvas por ID
   */
  async findById(id: string): Promise<Canvas | null> {
    dbLogger.log('findById', 'canvas', { id });

    const { data, error } = await supabase
      .from('canvas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      dbLogger.error('findById', 'canvas', error);
      return null;
    }

    return data;
  },

  /**
   * Lista todos os canvas
   */
  async list(): Promise<Canvas[]> {
    dbLogger.log('list', 'canvas');

    const { data, error } = await supabase
      .from('canvas')
      .select(`
        *,
        companies (name)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      dbLogger.error('list', 'canvas', error);
      return [];
    }

    return data || [];
  },

  /**
   * Cria novo canvas
   */
  async create(canvas: Inserts<'canvas'>): Promise<Canvas | null> {
    dbLogger.log('create', 'canvas', { title: canvas.title });

    const { data, error } = await supabase
      .from('canvas')
      .insert(canvas)
      .select()
      .single();

    if (error) {
      dbLogger.error('create', 'canvas', error);
      return null;
    }

    dbLogger.log('create SUCCESS', 'canvas', { id: data.id });
    return data;
  },

  /**
   * Atualiza canvas
   */
  async update(id: string, updates: Updates<'canvas'>): Promise<Canvas | null> {
    dbLogger.log('update', 'canvas', { id });

    const { data, error } = await supabase
      .from('canvas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      dbLogger.error('update', 'canvas', error);
      return null;
    }

    return data;
  },

  /**
   * Busca canvas de uma empresa
   */
  async findByCompany(companyId: string): Promise<Canvas[]> {
    dbLogger.log('findByCompany', 'canvas', { companyId });

    const { data, error } = await supabase
      .from('canvas')
      .select('*')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false });

    if (error) {
      dbLogger.error('findByCompany', 'canvas', error);
      return [];
    }

    return data || [];
  }
};

export const canvasCommentsRepository = {
  /**
   * Busca comentários de um canvas
   */
  async findByCanvas(canvasId: string): Promise<CanvasComment[]> {
    dbLogger.log('findByCanvas', 'canvas_comments', { canvasId });

    const { data, error } = await supabase
      .from('canvas_comments')
      .select('*')
      .eq('canvas_id', canvasId)
      .order('created_at', { ascending: false });

    if (error) {
      dbLogger.error('findByCanvas', 'canvas_comments', error);
      return [];
    }

    return data || [];
  },

  /**
   * Cria comentário
   */
  async create(comment: Inserts<'canvas_comments'>): Promise<CanvasComment | null> {
    dbLogger.log('create', 'canvas_comments', { type: comment.type });

    const { data, error } = await supabase
      .from('canvas_comments')
      .insert(comment)
      .select()
      .single();

    if (error) {
      dbLogger.error('create', 'canvas_comments', error);
      return null;
    }

    return data;
  },

  /**
   * Atualiza status do comentário
   */
  async updateStatus(id: string, status: string): Promise<CanvasComment | null> {
    dbLogger.log('updateStatus', 'canvas_comments', { id, status });

    const { data, error } = await supabase
      .from('canvas_comments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      dbLogger.error('updateStatus', 'canvas_comments', error);
      return null;
    }

    return data;
  },

  /**
   * Deleta comentário
   */
  async delete(id: string): Promise<boolean> {
    dbLogger.log('delete', 'canvas_comments', { id });

    const { error } = await supabase
      .from('canvas_comments')
      .delete()
      .eq('id', id);

    if (error) {
      dbLogger.error('delete', 'canvas_comments', error);
      return false;
    }

    return true;
  }
};
