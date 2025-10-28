import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EnrichmentProgress {
  layer: string;
  source: string;
  status: 'pending' | 'running' | 'success' | 'error';
  fields_enriched?: number;
  error?: string;
}

export function useMultiLayerEnrichment() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState<EnrichmentProgress[]>([]);

  const enrichCompany = async (companyId: string, cnpj: string, forcePremium = false) => {
    setIsEnriching(true);
    setProgress([
      { layer: 'layer_1', source: 'empresaqui', status: 'pending' },
      { layer: 'layer_2', source: 'apollo', status: 'pending' },
      { layer: 'layer_2', source: 'receitaws', status: 'pending' },
      ...(forcePremium ? [{ layer: 'layer_3', source: 'econodata', status: 'pending' as const }] : [])
    ]);

    try {
      console.log('[MultiLayer] 🚀 Iniciando enriquecimento:', { companyId, cnpj, forcePremium });

      const { data, error } = await supabase.functions.invoke('enrich-multi-layer', {
        body: { companyId, cnpj, force_premium: forcePremium }
      });

      if (error) throw error;

      console.log('[MultiLayer] ✅ Resultado:', data);

      // Atualizar progresso com resultados reais
      if (data?.results) {
        setProgress(data.results.map((r: any) => ({
          layer: r.layer,
          source: r.source,
          status: r.success ? 'success' as const : 'error' as const,
          fields_enriched: r.fields_enriched,
          error: r.error
        })));
      }

      const successCount = data?.results?.filter((r: any) => r.success).length || 0;
      const totalLayers = data?.results?.length || 0;

      toast.success(
        `Enriquecimento concluído: ${successCount}/${totalLayers} camadas`,
        {
          description: `${data?.total_fields_enriched || 0} campos enriquecidos`,
          duration: 5000
        }
      );

      return { success: true, data };
    } catch (error: any) {
      console.error('[MultiLayer] ❌ Erro:', error);
      
      toast.error('Erro no enriquecimento multi-layer', {
        description: error.message || 'Tente novamente'
      });

      // Marcar todos como erro
      setProgress(prev => prev.map(p => ({ ...p, status: 'error' as const, error: error.message })));
      
      return { success: false, error: error.message };
    } finally {
      setIsEnriching(false);
    }
  };

  return {
    isEnriching,
    progress,
    enrichCompany
  };
}
