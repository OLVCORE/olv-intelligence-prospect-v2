import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Clock, Zap, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

export function CreditsDashboard() {
  const { data: config, isLoading, refetch } = useQuery({
    queryKey: ['apollo-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apollo_credit_config')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000
  });

  if (isLoading || !config) return null;

  const used = config.used_credits;
  const total = config.total_credits;
  const available = total - used;
  const percentage = (used / total) * 100;
  const isCritical = available < config.block_threshold;
  const isWarning = available < config.alert_threshold && !isCritical;
  const isTrial = config.plan_type === 'trial';
  
  const daysLeft = Math.ceil((new Date(config.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const trialExpired = daysLeft <= 0;

  const dailyAverage = used > 0 && daysLeft > 0 ? Math.round(used / (30 - daysLeft)) : 0;
  const projectedTotal = dailyAverage > 0 ? Math.min(used + (dailyAverage * daysLeft), total) : used;

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isCritical ? 'bg-destructive/10' : isWarning ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
            <Activity className={`h-6 w-6 ${isCritical ? 'text-destructive' : isWarning ? 'text-yellow-600' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Status de Créditos</h3>
            <p className="text-sm text-muted-foreground">Apollo.io API</p>
          </div>
        </div>
        {isTrial && (
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Zap className="h-3.5 w-3.5 mr-1" />
            Trial Ativo
          </Badge>
        )}
      </div>

      {/* Alertas críticos */}
      {trialExpired && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl animate-pulse">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">⚠️ Trial Expirado!</p>
            <p className="text-sm text-destructive/80 mt-1">
              Faça upgrade do plano para continuar utilizando os recursos de enriquecimento.
            </p>
          </div>
        </div>
      )}

      {isCritical && !trialExpired && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">🚨 Créditos Críticos!</p>
            <p className="text-sm text-destructive/80 mt-1">
              Restam apenas <strong>{available} créditos</strong> de {total}.
              {isTrial ? ' Considere fazer upgrade antes do fim do trial.' : ' Faça upgrade urgente para continuar enriquecendo empresas.'}
            </p>
          </div>
        </div>
      )}

      {isWarning && !isCritical && !trialExpired && (
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-xl">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-700">⚠️ Atenção ao Consumo!</p>
            <p className="text-sm text-yellow-700/80 mt-1">
              Restam <strong>{available} créditos</strong>. Use com moderação para aproveitar ao máximo o trial.
            </p>
          </div>
        </div>
      )}

      {!isCritical && !isWarning && !trialExpired && (
        <div className="flex items-start gap-3 p-4 bg-green-500/10 border-2 border-green-500/20 rounded-xl">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-700">✅ Créditos Saudáveis</p>
            <p className="text-sm text-green-700/80 mt-1">
              Você tem <strong>{available} créditos disponíveis</strong>. Continue enriquecendo suas empresas!
            </p>
          </div>
        </div>
      )}

      {/* Trial countdown */}
      {isTrial && !trialExpired && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span>Trial Restante</span>
            </div>
            <p className="text-3xl font-bold text-primary">{Math.max(0, daysLeft)}</p>
            <p className="text-xs text-muted-foreground mt-1">dias</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span>Média Diária</span>
            </div>
            <p className="text-3xl font-bold">{dailyAverage}</p>
            <p className="text-xs text-muted-foreground mt-1">créditos/dia</p>
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Consumo</span>
          <span className="font-semibold">
            {used} / {total} créditos ({percentage.toFixed(1)}%)
          </span>
        </div>
        <Progress
          value={percentage}
          className={`h-3 ${isCritical ? '[&>*]:bg-destructive' : isWarning ? '[&>*]:bg-yellow-500' : '[&>*]:bg-primary'}`}
        />
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground mb-2">Usados</p>
          <p className="text-2xl font-bold">{used}</p>
          <p className="text-xs text-muted-foreground mt-1">créditos</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground mb-2">Disponíveis</p>
          <p className={`text-2xl font-bold ${isCritical ? 'text-destructive' : isWarning ? 'text-yellow-600' : 'text-green-600'}`}>
            {available}
          </p>
          <p className="text-xs text-muted-foreground mt-1">créditos</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground mb-2">Total</p>
          <p className="text-2xl font-bold text-primary">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">créditos</p>
        </div>
      </div>

      {/* Projeção e renovação */}
      <div className="grid grid-cols-2 gap-4">
        {dailyAverage > 0 && (
          <div className="p-4 rounded-xl bg-muted/20 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Projeção de Uso</p>
            <p className="text-xl font-bold">{projectedTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">créditos até o fim do período</p>
          </div>
        )}
        <div className="p-4 rounded-xl bg-muted/20 border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            {isTrial ? 'Fim do Trial' : 'Renovação'}
          </p>
          <p className="text-xl font-bold">
            {new Date(isTrial ? config.trial_ends_at : config.reset_date).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isTrial ? 'Upgrade necessário após essa data' : 'Créditos resetam automaticamente'}
          </p>
        </div>
      </div>

      {/* Limites configurados */}
      <div className="p-4 rounded-xl bg-muted/20 border border-border">
        <p className="text-sm font-semibold mb-3">Limites de Alerta Configurados</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">⚠️ Alerta em:</p>
            <p className="font-semibold text-yellow-600">{config.alert_threshold} créditos</p>
          </div>
          <div>
            <p className="text-muted-foreground">🚨 Bloqueio em:</p>
            <p className="font-semibold text-destructive">{config.block_threshold} créditos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
