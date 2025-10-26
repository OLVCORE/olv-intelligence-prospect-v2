import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ModuleType = 'roi' | 'cpq' | 'scenarios' | 'proposals' | 'competitive' | 'value' | 'consultoria_olv';

interface UseModuleDraftOptions<T> {
  module: ModuleType;
  companyId?: string;
  accountStrategyId?: string;
  title?: string;
  autoSaveInterval?: number; // ms (default: 5000 = 5s)
}

interface ModuleDraftData<T> {
  data: T;
  savedData: T | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isLoading: boolean;
  save: () => Promise<void>;
  load: () => Promise<void>;
  updateData: (newData: T | ((prev: T) => T)) => void;
}

export function useModuleDraft<T extends Record<string, any>>(
  initialData: T,
  options: UseModuleDraftOptions<T>
): ModuleDraftData<T> {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<T>(initialData);
  const [savedData, setSavedData] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
const initialDataRef = useRef(initialData);
const loadingRef = useRef(false);

  const { module, companyId, accountStrategyId, title, autoSaveInterval = 5000 } = options;

  const hasUnsavedChanges = savedData !== null && JSON.stringify(data) !== JSON.stringify(savedData);

  // Load data from backend
  const load = useCallback(async () => {
    if (!user || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      let query = supabase
        .from('account_strategy_modules')
        .select('*')
        .eq('user_id', user.id)
        .eq('module', module);

      if (accountStrategyId) {
        query = query.eq('account_strategy_id', accountStrategyId);
      } else if (companyId) {
        query = query.eq('company_id', companyId).is('account_strategy_id', null);
      } else {
        // Se não tem nem accountStrategyId nem companyId, não carrega nada
        setIsLoading(false);
        loadingRef.current = false;
        return;
      }

      const { data: result, error } = await query
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (result && result.data) {
        const loadedData = result.data as T;
        setData(loadedData);
        setSavedData(loadedData);
      } else {
        // Nenhum draft salvo, usa initialData
        setSavedData(initialDataRef.current);
      }
    } catch (error: any) {
      console.error('Error loading module draft:', error);
      toast({
        title: 'Erro ao carregar dados salvos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [user, module, accountStrategyId, companyId, toast]);

  // Save data to backend
  const save = useCallback(async () => {
    if (!user) return;
    if (!companyId && !accountStrategyId) {
      toast({
        title: 'Não é possível salvar',
        description: 'Nenhuma empresa ou estratégia selecionada.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Buscar registro existente
      let query = supabase
        .from('account_strategy_modules')
        .select('id, version')
        .eq('user_id', user.id)
        .eq('module', module);

      if (accountStrategyId) {
        query = query.eq('account_strategy_id', accountStrategyId);
      } else if (companyId) {
        query = query.eq('company_id', companyId).is('account_strategy_id', null);
      }

      const { data: existing, error: fetchError } = await query
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const payload = {
        user_id: user.id,
        company_id: companyId || null,
        account_strategy_id: accountStrategyId || null,
        module,
        title: title || `${module} - ${new Date().toLocaleString('pt-BR')}`,
        data: data as any,
        is_draft: true,
        version: existing ? (existing.version || 0) + 1 : 1,
      };

      if (existing) {
        // Update
        const { error: updateError } = await supabase
          .from('account_strategy_modules')
          .update(payload)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('account_strategy_modules')
          .insert(payload);

        if (insertError) throw insertError;
      }

      setSavedData(data);
      toast({
        title: '✅ Dados salvos com sucesso',
        description: `${module.toUpperCase()} salvo. Você pode trocar de aba sem perder dados.`,
      });
    } catch (error: any) {
      console.error('Error saving module draft:', error);
      toast({
        title: 'Erro ao salvar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, companyId, accountStrategyId, module, title, data, toast]);

  // Update data locally and reset auto-save timer
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData((prev) => {
      const updated = typeof newData === 'function' ? (newData as (prev: T) => T)(prev) : newData;
      return updated;
    });

    // Reset auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      save();
    }, autoSaveInterval);
  }, [save, autoSaveInterval]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (user) {
      load();
    }
  }, [load, user]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Warn before leaving page if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    data,
    savedData,
    hasUnsavedChanges,
    isSaving,
    isLoading,
    save,
    load,
    updateData,
  };
}
