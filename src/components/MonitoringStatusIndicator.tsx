import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

type SystemStatus = 'online' | 'warning' | 'offline';

interface StatusIndicatorProps {
  variant?: 'compact' | 'full';
}

export function MonitoringStatusIndicator({ variant = 'full' }: StatusIndicatorProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SystemStatus>('offline');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [nextCheck, setNextCheck] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  // Query para buscar status do monitoramento ativo mais recente
  const { data: monitoringStatus, isLoading } = useQuery({
    queryKey: ['monitoring-health-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('intelligence_monitoring_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Query para verificar última execução do cron (via logs de sinais)
  const { data: lastActivity } = useQuery({
    queryKey: ['last-signal-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buying_signals')
        .select('detected_at')
        .order('detected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Relógio local para atualizar contadores em tempo real
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcular status baseado nos dados
  useEffect(() => {
    if (!monitoringStatus) {
      setStatus('offline');
      return;
    }

    const now = new Date();
    const lastCheckDate = monitoringStatus.last_check_at ? new Date(monitoringStatus.last_check_at) : null;
    const nextCheckDate = monitoringStatus.next_check_at ? new Date(monitoringStatus.next_check_at) : null;

    setLastCheck(lastCheckDate);
    setNextCheck(nextCheckDate);

    if (!monitoringStatus.is_active) {
      setStatus('offline');
      return;
    }

    // Se nunca executou
    if (!lastCheckDate) {
      setStatus('warning');
      return;
    }

    // Calcular quanto tempo passou desde última verificação
    const hoursSinceLastCheck = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60);
    const expectedFrequency = monitoringStatus.check_frequency_hours || 24;

    // Verde: última verificação foi recente (dentro do esperado)
    if (hoursSinceLastCheck <= expectedFrequency * 1.2) {
      setStatus('online');
    }
    // Amarelo: atrasado mas não muito (até 2x o tempo esperado)
    else if (hoursSinceLastCheck <= expectedFrequency * 2) {
      setStatus('warning');
    }
    // Vermelho: muito atrasado (mais de 2x o tempo esperado)
    else {
      setStatus('offline');
    }
  }, [monitoringStatus, now]);

  // Realtime: Escutar mudanças na config
  useEffect(() => {
    const channel = supabase
      .channel('monitoring-status-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intelligence_monitoring_config',
        },
        (payload) => {
          console.log('[Realtime] Config atualizada:', payload);
          // Query será revalidada automaticamente
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buying_signals',
        },
        (payload) => {
          console.log('[Realtime] Novo sinal detectado:', payload);
          // Atualizar status para verde quando novo sinal é detectado
          setStatus('online');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          icon: CheckCircle,
          label: 'Online',
          description: 'Sistema monitorando ativamente',
          badgeVariant: 'default' as const,
        };
      case 'warning':
        return {
          color: 'bg-yellow-500',
          icon: AlertCircle,
          label: 'Oscilando',
          description: 'Última verificação atrasada',
          badgeVariant: 'secondary' as const,
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          icon: Activity,
          label: 'Offline',
          description: 'Sistema não está executando',
          badgeVariant: 'destructive' as const,
        };
    }
   };

  // Utilitários de tempo para contagem regressiva e relativo
  const formatDuration = (ms: number) => {
    const abs = Math.abs(ms);
    const h = Math.floor(abs / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const timeSince = (date: Date) => formatDuration(now.getTime() - date.getTime());
  const timeUntil = (date: Date) => formatDuration(date.getTime() - now.getTime());

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className={`h-3 w-3 rounded-full ${config.color} animate-pulse`} />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{config.description}</p>
              {lastCheck && (
                <p className="text-xs">Última: {lastCheck.toLocaleString('pt-BR')}</p>
              )}
              {nextCheck && (
                <p className="text-xs">Próxima: {nextCheck.toLocaleString('pt-BR')}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Semáforo pulsante */}
          <div className="relative">
            <div className={`h-12 w-12 rounded-full ${config.color} flex items-center justify-center`}>
              <StatusIcon className="h-6 w-6 text-white" />
            </div>
            <div className={`absolute inset-0 h-12 w-12 rounded-full ${config.color} animate-ping opacity-75`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{config.label}</h3>
              <Badge variant={config.badgeVariant} className="gap-1">
                <Activity className="h-3 w-3" />
                24/7 Monitoring
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            
            {/* Botão de ação - sempre visível */}
            <Button
              variant={status === 'offline' ? 'default' : 'outline'}
              size="sm"
              className="mt-3"
              onClick={() => navigate('/sales-intelligence/config')}
            >
              <Settings className="h-4 w-4 mr-2" />
              {status === 'offline' ? 'Ativar Monitoramento' : 'Ajustar Configuração'}
            </Button>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-right space-y-1">
          {lastCheck && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Última verificação</p>
                <p className="font-medium">{lastCheck.toLocaleTimeString('pt-BR')}</p>
                <p className="text-[10px] text-muted-foreground">há {timeSince(lastCheck)}</p>
              </div>
            </div>
          )}
          {nextCheck && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Próxima verificação</p>
                <p className="font-medium">{nextCheck.toLocaleTimeString('pt-BR')}</p>
                <p className="text-[10px] text-muted-foreground">
                  {nextCheck.getTime() >= now.getTime()
                    ? `em ${timeUntil(nextCheck)}`
                    : `atrasada há ${timeSince(nextCheck)}`}
                </p>
              </div>
            </div>
          )}
          {lastActivity?.detected_at && (
            <div className="text-xs text-muted-foreground mt-2">
              Último sinal: {new Date(lastActivity.detected_at).toLocaleTimeString('pt-BR')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
