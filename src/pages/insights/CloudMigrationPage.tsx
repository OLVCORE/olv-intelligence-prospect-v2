import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardExecutive } from "@/hooks/useDashboardExecutive";
import { Cloud, TrendingUp, Building2, DollarSign, Target, ArrowRight, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function CloudMigrationPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardExecutive();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <BackButton />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const cloudOpportunities = data.emergingOpportunities?.filter((o: any) => 
    o.type === "Transformação Digital" || o.type === "cloud_migration"
  ) || [];
  
  const allCompanies = cloudOpportunities.flatMap((o: any) => o.companies || []);
  const uniqueCompanies = Array.from(new Set(allCompanies.map((c: any) => c.id)))
    .map(id => allCompanies.find((c: any) => c.id === id));

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <BackButton />
      
      <div className="glass-card rounded-2xl p-8 border-2 border-blue-500/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30">
            <Cloud className="h-8 w-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text">Tendência: Cloud Migration</h1>
            <p className="text-muted-foreground mt-1">Empresas com potencial para soluções cloud da TOTVS</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-lg border-blue-500/50 text-blue-400">
            Alto • 78%
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Empresas Identificadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold gradient-text">{uniqueCompanies.length}</p>
              <p className="text-sm text-muted-foreground mt-2">
                No pipeline de migração
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Oportunidade TOTVS Cloud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold gradient-text">
                R$ {((uniqueCompanies.length * 150000) / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Potencial estimado
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold gradient-text">45%</p>
              <p className="text-sm text-muted-foreground mt-2">
                Média do segmento
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Empresas Prontas para Migração Cloud
          </h2>

          {uniqueCompanies.length > 0 ? (
            uniqueCompanies.slice(0, 10).map((company: any, idx: number) => (
              <Card 
                key={company.id || idx}
                className="glass-card border-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/companies/${company.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                          Cloud Ready
                        </Badge>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {company.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          Fit Score: {company.fit_score || 0}%
                        </span>
                        <span>
                          Maturidade Digital: {company.digital_maturity_score || 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-blue-400 mt-2">
                        Oportunidade para TOTVS Cloud, migração de ERP legado
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      Analisar
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="glass-card border-primary/10">
              <CardContent className="p-8 text-center">
                <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma empresa identificada no momento. Continue enriquecendo dados para insights mais precisos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate('/companies')}
            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            Ver Todas as Empresas
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
