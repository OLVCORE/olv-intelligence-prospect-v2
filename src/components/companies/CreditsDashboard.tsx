import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';

export function CreditsDashboard() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['apollo-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apollo_credit_config')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
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

  return (
    <Card className={isCritical ? 'border-destructive' : isWarning ? 'border-yellow-500' : isTrial ? 'border-primary' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Créditos Apollo
          </div>
          {isTrial && (
            <div className="flex items-center gap-2 text-sm font-normal">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-primary">Trial</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrial && !trialExpired && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-md text-sm">
            <Clock className="h-4 w-4" />
            <span>
              <strong>{daysLeft} dia(s)</strong> restantes no trial
            </span>
          </div>
        )}
        
        {trialExpired && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>
              <strong>Trial expirado!</strong> Faça upgrade para continuar.
            </span>
          </div>
        )}

        <Progress
          value={percentage}
          className={isCritical ? 'bg-destructive/20' : isWarning ? 'bg-yellow-500/20' : ''}
        />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Usados</p>
            <p className="text-2xl font-bold">{used}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disponíveis</p>
            <p className={`text-2xl font-bold ${isCritical ? 'text-destructive' : 'text-green-600'}`}>
              {available}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>

        {!isTrial && (
          <div className="text-sm text-muted-foreground text-center">
            Renovação: {new Date(config.reset_date).toLocaleDateString('pt-BR')}
          </div>
        )}

        {(isCritical || isWarning) && !trialExpired && (
          <div className={`flex items-start gap-2 p-3 rounded-md ${isCritical ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-700'}`}>
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              {isCritical ? (
                <>
                  <strong>Créditos críticos!</strong> Restam apenas {available} créditos.
                  {isTrial ? ' Considere fazer upgrade antes do fim do trial.' : ' Faça upgrade urgente.'}
                </>
              ) : (
                <>
                  <strong>Atenção!</strong> Restam apenas {available} créditos.
                  Use com moderação para aproveitar o trial.
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
