import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function IntelligencePage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['intelligence-stats'],
    queryFn: async () => {
      const [decisorsRes, signalsRes, companiesRes] = await Promise.all([
        supabase.from('decision_makers').select('id', { count: 'exact' }),
        supabase.from('governance_signals').select('id', { count: 'exact' }),
        supabase.from('companies').select('id', { count: 'exact' })
      ]);

      return {
        decisors: decisorsRes.count || 0,
        signals: signalsRes.count || 0,
        companies: companiesRes.count || 0
      };
    }
  });

  const { data: decisors, isLoading: decisorsLoading } = useQuery({
    queryKey: ['decision-makers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('decision_makers')
        .select(`
          *,
          companies (name, industry)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  const { data: signals, isLoading: signalsLoading } = useQuery({
    queryKey: ['governance-signals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('governance_signals')
        .select(`
          *,
          companies (name)
        `)
        .order('detected_at', { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Intelligence</h1>
        <p className="text-muted-foreground">
          Insights sobre decisores, sinais de compra e oportunidades de negócio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.decisors}</div>
                <p className="text-xs text-muted-foreground">Contatos identificados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gaps de Governança</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.signals}</div>
                <p className="text-xs text-muted-foreground">Gaps identificados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Analisadas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.companies}</div>
                <p className="text-xs text-muted-foreground">No sistema</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Decisores Recentes</CardTitle>
            <CardDescription>Últimos contatos identificados</CardDescription>
          </CardHeader>
          <CardContent>
            {decisorsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : decisors && decisors.length > 0 ? (
              <div className="space-y-4">
                {decisors.map((decisor: any) => (
                  <div key={decisor.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{decisor.name}</p>
                        <p className="text-sm text-muted-foreground">{decisor.title}</p>
                      </div>
                      {decisor.verified_email && (
                        <Badge variant="outline" className="text-xs">✓ Verificado</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {decisor.companies?.name} • {decisor.department}
                    </p>
                    {decisor.email && (
                      <p className="text-xs font-mono">📧 {decisor.email}</p>
                    )}
                    {decisor.phone && (
                      <p className="text-xs font-mono">📱 {decisor.phone}</p>
                    )}
                    {decisor.linkedin_url && (
                      <a href={decisor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                        🔗 LinkedIn
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum decisor encontrado ainda. Faça uma busca de empresas para começar.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gaps de Governança</CardTitle>
            <CardDescription>Oportunidades de transformação</CardDescription>
          </CardHeader>
          <CardContent>
            {signalsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : signals && signals.length > 0 ? (
              <div className="space-y-4">
                {signals.map((signal: any) => (
                  <div key={signal.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge>{signal.signal_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Score: {((signal.confidence_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium">{signal.companies?.name}</p>
                    <p className="text-xs text-muted-foreground">{signal.description}</p>
                    <p className="text-xs text-muted-foreground">Fonte: {signal.source}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum gap de governança detectado ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
