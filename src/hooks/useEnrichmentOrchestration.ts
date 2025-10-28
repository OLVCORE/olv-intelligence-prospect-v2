import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para orquestrar a ordem correta de execução dos engines de enriquecimento.
 * 
 * ORDEM RECOMENDADA:
 * 1. Lock da Empresa (org_id/domain/CNPJ confirmados)
 * 2. Apollo Company
 * 3. Apollo People + Similar Companies
 * 4. CNPJ Discovery → Receita/Econodata
 * 5. Financeiro (Serasa, quando configurado)
 */

interface EnrichmentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  error?: string;
  required: boolean;
  prerequisite?: string; // ID da etapa necessária antes desta
}

interface EnrichmentOptions {
  companyId: string;
  cnpj?: string;
  includePremium?: boolean;
  onProgress?: (steps: EnrichmentStep[]) => void;
}

export function useEnrichmentOrchestration() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [steps, setSteps] = useState<EnrichmentStep[]>([]);

  const logActivity = (
    companyId: string,
    action: string,
    status: 'success' | 'error',
    details?: any
  ) => {
    // Telemetria simplificada via console
    const timestamp = new Date().toISOString();
    console.log(`[Enrichment-${status.toUpperCase()}] ${action}`, {
      companyId,
      timestamp,
      details
    });
  };

  const updateStep = (
    stepId: string, 
    updates: Partial<EnrichmentStep>,
    notifyProgress?: (steps: EnrichmentStep[]) => void
  ) => {
    setSteps(prev => {
      const newSteps = prev.map(s => 
        s.id === stepId ? { ...s, ...updates } : s
      );
      notifyProgress?.(newSteps);
      return newSteps;
    });
  };

  const checkPrerequisite = (step: EnrichmentStep, currentSteps: EnrichmentStep[]) => {
    if (!step.prerequisite) return true;
    
    const prereq = currentSteps.find(s => s.id === step.prerequisite);
    if (!prereq) return true;
    
    return prereq.status === 'success';
  };

  const orchestrateEnrichment = async (options: EnrichmentOptions) => {
    const { companyId, cnpj, includePremium = false, onProgress } = options;

    setIsEnriching(true);

    // Definir etapas na ordem correta
    const initialSteps: EnrichmentStep[] = [
      {
        id: 'lock',
        name: 'Lock da Empresa',
        status: 'pending',
        required: true
      },
      {
        id: 'apollo_company',
        name: 'Apollo Company',
        status: 'pending',
        required: false,
        prerequisite: 'lock'
      },
      {
        id: 'apollo_people',
        name: 'Apollo People',
        status: 'pending',
        required: false,
        prerequisite: 'apollo_company'
      },
      {
        id: 'receita',
        name: 'Receita Federal',
        status: 'pending',
        required: !!cnpj,
        prerequisite: 'lock'
      },
      {
        id: 'econodata',
        name: 'Econodata',
        status: includePremium ? 'pending' : 'skipped',
        required: false,
        prerequisite: 'receita'
      }
    ];

    setSteps(initialSteps);
    onProgress?.(initialSteps);

    try {
      // 1. Lock da Empresa
      updateStep('lock', { status: 'running' }, onProgress);
      try {
        // Buscar dados atuais da empresa
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (!company) throw new Error('Empresa não encontrada');

        // Verificar se já tem org_id, domain ou CNPJ
        const isLocked = !!(company.domain || cnpj || (company as any).org_id);
        
        if (isLocked) {
          updateStep('lock', { status: 'success' }, onProgress);
          logActivity(companyId, 'lock_verified', 'success', { 
            domain: company.domain, 
            cnpj 
          });
        } else {
          throw new Error('Empresa não possui domain, CNPJ ou org_id');
        }
      } catch (error: any) {
        updateStep('lock', { 
          status: 'error', 
          error: error.message 
        }, onProgress);
        logActivity(companyId, 'lock_failed', 'error', { error: error.message });
        throw error;
      }

      // 2. Apollo Company
      if (checkPrerequisite(initialSteps[1], steps)) {
        updateStep('apollo_company', { status: 'running' }, onProgress);
        try {
          const { data, error } = await supabase.functions.invoke('enrich-apollo', {
            body: { 
              type: 'enrich_company',
              companyId
            }
          });

          if (error) throw error;

          updateStep('apollo_company', { status: 'success' }, onProgress);
          logActivity(companyId, 'apollo_company_enriched', 'success');
        } catch (error: any) {
          updateStep('apollo_company', { 
            status: 'error', 
            error: error.message 
          }, onProgress);
          logActivity(companyId, 'apollo_company_failed', 'error', { error: error.message });
        }
      }

      // 3. Apollo People
      if (checkPrerequisite(initialSteps[2], steps)) {
        updateStep('apollo_people', { status: 'running' }, onProgress);
        try {
          const { data, error } = await supabase.functions.invoke('enrich-apollo', {
            body: { 
              type: 'people',
              companyId
            }
          });

          if (error) throw error;

          updateStep('apollo_people', { status: 'success' }, onProgress);
          logActivity(companyId, 'apollo_people_enriched', 'success', { 
            count: (data as any)?.people?.length || 0 
          });
        } catch (error: any) {
          updateStep('apollo_people', { 
            status: 'error', 
            error: error.message 
          }, onProgress);
          logActivity(companyId, 'apollo_people_failed', 'error', { error: error.message });
        }
      }

      // 4. Receita Federal
      if (cnpj && checkPrerequisite(initialSteps[3], steps)) {
        updateStep('receita', { status: 'running' }, onProgress);
        try {
          const { data, error } = await supabase.functions.invoke('enrich-receitaws', {
            body: { cnpj, company_id: companyId }
          });

          if (error) throw error;

          updateStep('receita', { status: 'success' }, onProgress);
          logActivity(companyId, 'receita_enriched', 'success');
        } catch (error: any) {
          updateStep('receita', { 
            status: 'error', 
            error: error.message 
          }, onProgress);
          logActivity(companyId, 'receita_failed', 'error', { error: error.message });
        }
      }

      // 5. Econodata (Premium)
      if (includePremium && cnpj && checkPrerequisite(initialSteps[4], steps)) {
        updateStep('econodata', { status: 'running' }, onProgress);
        try {
          const { data, error } = await supabase.functions.invoke('enrich-econodata', {
            body: { companyId, cnpj }
          });

          if (error) throw error;

          updateStep('econodata', { status: 'success' }, onProgress);
          logActivity(companyId, 'econodata_enriched', 'success');
        } catch (error: any) {
          updateStep('econodata', { 
            status: 'error', 
            error: error.message 
          }, onProgress);
          logActivity(companyId, 'econodata_failed', 'error', { error: error.message });
        }
      }

      const successCount = steps.filter(s => s.status === 'success').length;
      const errorCount = steps.filter(s => s.status === 'error').length;

      toast.success(`Enriquecimento concluído: ${successCount} sucesso, ${errorCount} erros`);

      return { success: true, steps };
    } catch (error: any) {
      toast.error('Erro no enriquecimento orquestrado');
      return { success: false, error: error.message, steps };
    } finally {
      setIsEnriching(false);
    }
  };

  return {
    isEnriching,
    steps,
    orchestrateEnrichment
  };
}
