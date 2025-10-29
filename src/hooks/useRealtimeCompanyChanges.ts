import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyChangeLog {
  id: string;
  company_id: string;
  field: string;
  old_value: any;
  new_value: any;
  source: string;
  reason: string;
  changed_at: string;
}

/**
 * Hook para receber notificações em tempo real quando campos da empresa mudam
 * Exibe toasts automáticos informando qual campo foi atualizado e por qual fonte
 */
export function useRealtimeCompanyChanges(companyId: string | undefined) {
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`company-changes-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'company_change_log',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          const log = payload.new as CompanyChangeLog;
          
          // Badge de fonte com emoji
          const sourceEmoji: Record<string, string> = {
            apollo: '🔵',
            linkedin: '🔗',
            google: '🔍',
            manual: '✏️'
          };

          const emoji = sourceEmoji[log.source] || '📝';
          
          toast.info(`${emoji} Campo "${log.field}" atualizado`, {
            description: `Fonte: ${log.source} · ${log.reason}`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);
}
