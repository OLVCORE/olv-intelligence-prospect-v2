import React from 'react';
import { Bell, Flame, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function NotificationCenter() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: hotLeads } = await supabase
        .from('companies')
        .select('id, name, icp_score, created_at')
        .gte('icp_score', 80)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const { data: stagnantDeals } = await supabase
        .from('companies')
        .select('id, name, deal_stage, days_in_stage')
        .gte('days_in_stage', 7)
        .not('deal_stage', 'in', '("closed_won","closed_lost")')
        .order('days_in_stage', { ascending: false });

      const { data: followUps } = await supabase
        .from('companies')
        .select('id, name, next_follow_up_action')
        .eq('next_follow_up_date', new Date().toISOString().split('T')[0])
        .order('next_follow_up_date', { ascending: true });

      return {
        hotLeads: hotLeads || [],
        stagnantDeals: stagnantDeals || [],
        followUps: followUps || []
      };
    },
    refetchInterval: 60000
  });

  const totalNotifications = 
    (notifications?.hotLeads.length || 0) +
    (notifications?.stagnantDeals.length || 0) +
    (notifications?.followUps.length || 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {totalNotifications > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500"
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <p className="text-sm text-muted-foreground">{totalNotifications} novas</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications?.hotLeads.map((lead) => (
            <DropdownMenuItem key={lead.id} className="p-4 cursor-pointer">
              <div className="flex items-start gap-3 w-full">
                <Flame className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    Lead Quente Detectado!
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {lead.name} - Score: {lead.icp_score}/100
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lead.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          {notifications?.stagnantDeals.map((deal) => (
            <DropdownMenuItem key={deal.id} className="p-4 cursor-pointer">
              <div className="flex items-start gap-3 w-full">
                <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    Deal Estagnado
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {deal.name} - {deal.days_in_stage} dias em {deal.deal_stage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ação necessária!
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          {notifications?.followUps.map((followUp) => (
            <DropdownMenuItem key={followUp.id} className="p-4 cursor-pointer">
              <div className="flex items-start gap-3 w-full">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    Follow-up Hoje
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {followUp.name} - {followUp.next_follow_up_action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agendado para hoje
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          {totalNotifications === 0 && (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação nova</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
