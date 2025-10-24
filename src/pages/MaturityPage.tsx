import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, TrendingUp, Activity, Target, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { ExplainabilityButton } from "@/components/common/ExplainabilityButton";

export default function MaturityPage() {
  const { toast } = useToast();
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectMode, setSelectMode] = useState<'single' | 'multiple'>('single');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['maturity-stats'],
    queryFn: async () => {
      const { data: maturityData } = await supabase
        .from('digital_maturity')
        .select('overall_score');

      const avgScore = maturityData?.length 
        ? maturityData.reduce((acc, m) => acc + (m.overall_score || 0), 0) / maturityData.length
        : 0;

      return {
        avgScore: avgScore.toFixed(1),
        evaluated: maturityData?.length || 0,
        opportunities: maturityData?.filter(m => (m.overall_score || 0) < 5).length || 0
      };
    }
  });

  const { data: maturityList, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ['maturity-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('digital_maturity')
        .select(`
          *,
          companies (name, industry)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  const handleConfirmAnalysis = async (companyIds: string[]) => {
    setIsAnalyzing(true);
    let success = 0;
    let failed = 0;

    toast({
      title: "Análise de Maturidade Iniciada",
      description: `Processando ${companyIds.length} empresa${companyIds.length === 1 ? '' : 's'}...`,
    });

    for (const id of companyIds) {
      try {
        const { error } = await supabase.functions.invoke('calculate-maturity-score', {
          body: { companyId: id }
        });
        if (error) throw error;
        success++;
      } catch (e) {
        console.error('Falha na análise', id, e);
        failed++;
      }
    }

    toast({
      title: "Análise concluída",
      description: `${success} sucesso${success !== 1 ? 's' : ''}${failed ? ` • ${failed} falha${failed !== 1 ? 's' : ''}` : ''}`,
    });

    setIsAnalyzing(false);
    setSelectOpen(false);
    refetchStats();
    refetchList();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Maturidade Digital</h1>
          <p className="text-muted-foreground">
            Análise da maturidade digital das empresas prospectadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectMode('single');
              setSelectOpen(true);
            }}
            disabled={isAnalyzing}
            variant="outline"
          >
            <Target className="h-4 w-4 mr-2" />
            Análise Individual
          </Button>
          <Button
            onClick={() => {
              setSelectMode('multiple');
              setSelectOpen(true);
            }}
            disabled={isAnalyzing}
          >
            <Users className="h-4 w-4 mr-2" />
            Análise em Massa
          </Button>
        </div>
      </div>

      <CompanySelectDialog
        open={selectOpen}
        onOpenChange={setSelectOpen}
        mode={selectMode}
        onConfirm={handleConfirmAnalysis}
        title={selectMode === 'single' ? 'Selecionar Empresa para Análise' : 'Selecionar Empresas para Análise'}
        confirmLabel={selectMode === 'single' ? 'Analisar maturidade' : 'Analisar selecionadas'}
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.avgScore || '-'}</div>
                <p className="text-xs text-muted-foreground">De 0 a 10</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Avaliadas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.evaluated}</div>
                <p className="text-xs text-muted-foreground">Total analisadas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.opportunities}</div>
                <p className="text-xs text-muted-foreground">Score &lt; 5</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Análises Recentes</CardTitle>
          <CardDescription>Últimas avaliações de maturidade digital</CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : maturityList && maturityList.length > 0 ? (
            <div className="space-y-6">
              {maturityList.map((maturity: any) => (
                <div key={maturity.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{maturity.companies?.name}</p>
                      <p className="text-sm text-muted-foreground">{maturity.companies?.industry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{maturity.overall_score?.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Score geral</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Infraestrutura</p>
                      <Progress value={(maturity.infrastructure_score || 0) * 10} />
                      <p className="text-xs font-medium">{maturity.infrastructure_score?.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Sistemas</p>
                      <Progress value={(maturity.systems_score || 0) * 10} />
                      <p className="text-xs font-medium">{maturity.systems_score?.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Processos</p>
                      <Progress value={(maturity.processes_score || 0) * 10} />
                      <p className="text-xs font-medium">{maturity.processes_score?.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Segurança</p>
                      <Progress value={(maturity.security_score || 0) * 10} />
                      <p className="text-xs font-medium">{maturity.security_score?.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Inovação</p>
                      <Progress value={(maturity.innovation_score || 0) * 10} />
                      <p className="text-xs font-medium">{maturity.innovation_score?.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma análise de maturidade disponível. Busque empresas para ver análises aqui.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
