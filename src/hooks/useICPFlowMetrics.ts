import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useICPFlowMetrics() {
  const [data, setData] = useState({ quarentena: 0, pool: 0, ativas: 0, total: 0 });

  useEffect(() => {
    let mounted = true;
    
    supabase.from('icp_analysis_results').select('id', { count: 'exact', head: true }).eq('status', 'pendente').then(r1 => {
      if (!mounted) return;
      supabase.from('leads_pool').select('id', { count: 'exact', head: true }).then(r2 => {
        if (!mounted) return;
        supabase.from('companies').select('id', { count: 'exact', head: true }).then(r3 => {
          if (!mounted) return;
          const q = r1.count || 0;
          const p = r2.count || 0;
          const a = r3.count || 0;
          setData({ quarentena: q, pool: p, ativas: a, total: q + p + a });
        });
      });
    });

    return () => { mounted = false; };
  }, []);

  return { data };
}
