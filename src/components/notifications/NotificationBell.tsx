import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'signal' | 'decision_maker' | 'maturity' | 'canvas' | 'system';
  read: boolean;
  created_at: string;
  link?: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Simular notificações baseadas em dados reais
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const notifs: Notification[] = [];

      // Buscar sinais recentes (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: signals } = await supabase
        .from('governance_signals')
        .select('*, companies(name)')
        .gte('detected_at', yesterday.toISOString())
        .order('detected_at', { ascending: false })
        .limit(5);

      signals?.forEach(signal => {
        notifs.push({
          id: `signal-${signal.id}`,
          title: '🎯 Novo Gap de Governança',
          message: `${signal.companies?.name}: ${signal.signal_type}`,
          type: 'signal',
          read: false,
          created_at: signal.detected_at,
          link: `/governance`
        });
      });

      // Buscar novos decisores
      const { data: decisors } = await supabase
        .from('decision_makers')
        .select('*, companies(name)')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      decisors?.forEach(decisor => {
        notifs.push({
          id: `decisor-${decisor.id}`,
          title: '👤 Novo Decisor Identificado',
          message: `${decisor.name} em ${decisor.companies?.name}`,
          type: 'decision_maker',
          read: false,
          created_at: decisor.created_at,
          link: `/intelligence`
        });
      });

      // Buscar empresas com score alto
      const { data: companies } = await supabase
        .from('companies')
        .select('*, digital_maturity(overall_score)')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      companies?.forEach(company => {
        const score = company.digital_maturity?.[0]?.overall_score;
        if (score && score >= 7) {
          notifs.push({
            id: `company-${company.id}`,
            title: '⭐ Empresa de Alto Potencial',
            message: `${company.name} - Score ${score.toFixed(1)}`,
            type: 'maturity',
            read: false,
            created_at: company.created_at,
            link: `/company/${company.id}`
          });
        }
      });

      // Ordenar por data
      return notifs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    refetchInterval: 60000 // Refetch a cada minuto
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'signal': return '🎯';
      case 'decision_maker': return '👤';
      case 'maturity': return '⭐';
      case 'canvas': return '📋';
      default: return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} novas</Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação recente
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, idx) => (
                <a
                  key={notification.id}
                  href={notification.link}
                  className={`block p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
