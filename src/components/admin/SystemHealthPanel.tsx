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

export function SystemHealthPanel() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-health');
      
      if (error) throw error;
      
      return data as { apis: APIHealth[] };
    },
    refetchInterval: 30000, // A cada 30 segundos
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
  const onlineCount = apis.filter(api => api.status === 'online').length;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Status das APIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Sistemas Online</span>
            <span className="text-2xl font-bold">
              {onlineCount}/{apis.length}
            </span>
          </div>

          <div className="space-y-2">
            {apis.map((api, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                <div className="flex items-center gap-2">
                  {api.status === 'online' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {api.status === 'offline' && <XCircle className="h-4 w-4 text-red-600" />}
                  {api.status === 'degraded' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                  <span className="text-sm font-medium">{api.name}</span>
                </div>
                <Badge
                  variant={
                    api.status === 'online' ? 'default' :
                    api.status === 'degraded' ? 'secondary' : 'destructive'
                  }
                  className="text-xs"
                >
                  {api.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
