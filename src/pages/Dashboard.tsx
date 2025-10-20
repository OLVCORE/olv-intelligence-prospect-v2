import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function CompaniesTable() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name, cnpj, industry, digital_maturity_score, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-2">
      {companies?.map((company: any) => (
        <Link key={company.id} to={`/company/${company.id}`}>
          <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold">{company.name}</p>
                <p className="text-sm text-muted-foreground">{company.industry}</p>
              </div>
              <div className="flex items-center gap-4">
                {company.digital_maturity_score && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{company.digital_maturity_score.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                )}
                <Button variant="outline" size="sm">Ver Detalhes →</Button>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [companiesRes, decisorsRes, maturityRes, historyRes] = await Promise.all([
        supabase.from('companies').select('id, digital_maturity_score', { count: 'exact' }),
        supabase.from('decision_makers').select('id', { count: 'exact' }),
        supabase.from('digital_maturity').select('overall_score'),
        supabase.from('search_history').select('id', { count: 'exact' })
      ]);

      const avgScore = maturityRes.data?.length 
        ? maturityRes.data.reduce((acc, m) => acc + (m.overall_score || 0), 0) / maturityRes.data.length
        : 0;

      return {
        companies: companiesRes.count || 0,
        decisors: decisorsRes.count || 0,
        avgScore: avgScore.toFixed(1),
        searches: historyRes.count || 0
      };
    }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de prospecção inteligente</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Cadastradas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.companies}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.companies === 0 ? 'Nenhuma empresa cadastrada ainda' : 'Empresas no sistema'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisores Encontrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.decisors}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.decisors === 0 ? 'Aguardando análise de empresas' : 'Contatos identificados'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.avgScore || '-'}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.avgScore === '0.0' ? 'Sem dados para calcular' : 'Maturidade digital'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buscas Realizadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.searches}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.searches === 0 ? 'Nenhuma busca realizada' : 'Total de buscas'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
          <CardDescription>Clique para ver relatório completo</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : stats && stats.companies > 0 ? (
            <CompaniesTable />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma empresa cadastrada. Vá em "Buscar Empresas" para começar.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Começar Prospecção</CardTitle>
            <CardDescription>
              Busque empresas usando CNPJ ou nome e obtenha insights em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O sistema usa APIs reais para buscar dados de empresas, decisores e tecnologias.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>ReceitaWS - Dados oficiais da Receita Federal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Apollo.io - Decisores e contatos B2B</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Hunter.io - Verificação de emails</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>PhantomBuster - Scraping LinkedIn</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>Guia rápido para usar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <span>Vá em <strong>Buscar Empresas</strong> e digite um CNPJ para começar</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <span>Acesse <strong>Decisores</strong> para ver decisores e sinais de compra</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <span>Analise a <strong>Maturidade Digital</strong> da empresa</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                <span>Gere <strong>Playbooks</strong> de abordagem comercial</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
