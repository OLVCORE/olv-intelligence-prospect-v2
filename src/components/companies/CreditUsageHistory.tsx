import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CreditUsageHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['credit-usage-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apollo_credit_usage')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Carregando histórico...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum uso registrado ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Histórico de Uso (últimos 10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item) => {
            const isCompleted = item.status === 'completed';
            const isBlocked = item.status === 'insufficient_credits';
            
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : isBlocked ? (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">
                      {item.company_name || 'Empresa sem nome'}
                    </p>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      {item.actual_credits || item.estimated_credits} créditos
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{format(new Date(item.requested_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {item.modes.join(', ')}
                    </span>
                  </div>
                  
                  {item.error_message && (
                    <p className="text-xs text-destructive mt-1">
                      {item.error_message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
