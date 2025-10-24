import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface APIHealth {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastCheck: string;
}

interface APIHealthResponse {
  apis: Array<{
    name: string;
    status: 'online' | 'offline';
    configured: boolean;
    category: string;
  }>;
  summary: {
    online: number;
    total: number;
    percentage: number;
  };
}

export function SystemHealthPanel() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-health');
      
      if (error) throw error;
      
      return data as APIHealthResponse;
    },
    refetchInterval: 300000,
    staleTime: 240000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  const apis = health?.apis || [];
  const summary = health?.summary || { online: 0, total: 0, percentage: 0 };

  // Agrupar por categoria
  const categories = {
    data: apis.filter(api => api.category === 'data'),
    email: apis.filter(api => api.category === 'email'),
    people: apis.filter(api => api.category === 'people'),
    location: apis.filter(api => api.category === 'location' || api.category === 'maps'),
    ai: apis.filter(api => api.category === 'ai'),
    messaging: apis.filter(api => api.category === 'messaging'),
    search: apis.filter(api => api.category === 'search'),
    scraping: apis.filter(api => api.category === 'scraping'),
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Status das APIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div>
              <span className="text-sm text-muted-foreground">Sistemas Configurados</span>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.percentage}% das integrações ativas
              </p>
            </div>
            <span className="text-3xl font-bold text-primary">
              {summary.online}/{summary.total}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(categories).map(([category, categoryApis]) => {
              if (categoryApis.length === 0) return null;
              
              return (
                <div key={category} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {category}
                  </p>
                  {categoryApis.map((api, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                      <div className="flex items-center gap-2">
                        {api.status === 'online' ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm font-medium">{api.name}</span>
                      </div>
                      <Badge
                        variant={api.status === 'online' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {api.status === 'online' ? '🟢 Ativo' : '🔴 Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
