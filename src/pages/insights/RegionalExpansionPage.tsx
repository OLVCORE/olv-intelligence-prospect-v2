import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardExecutive } from "@/hooks/useDashboardExecutive";
import { MapPin, TrendingUp, Building2, DollarSign, Target, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function RegionalExpansionPage() {
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

  const regionalData = data.companiesByRegion || [];
  const topRegion = regionalData[0];
  // Get companies from the database for the top region
  const companies = regionalData.slice(0, 12);

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <BackButton />
      
      <div className="glass-card rounded-2xl p-8 border-2 border-primary/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/30">
            <MapPin className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text">Expansão Regional Detectada</h1>
            <p className="text-muted-foreground mt-1">Oportunidades de crescimento identificadas pela IA</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-lg border-emerald-500/50 text-emerald-400">
            Alto • 92%
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
              <p className="text-4xl font-bold gradient-text">{regionalData.length}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Em {topRegion?.region || "regiões estratégicas"}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Potencial de Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold gradient-text">
                R$ 2.3M
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Estimativa conservadora
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Taxa de Crescimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold gradient-text">23%</p>
              <p className="text-sm text-muted-foreground mt-2">
                Aceleração anual
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Empresas Prioritárias para Abordagem
          </h2>

          {regionalData.slice(0, 10).map((region: any, idx: number) => (
            <Card 
              key={idx}
              className="glass-card border-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => navigate('/companies')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      Região: {region.region}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {region.count} empresas
                      </span>
                      <span>
                        Maturidade Média: {region.avgMaturity}%
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    Ver Empresas
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/companies')}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Ver Todas as Empresas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
