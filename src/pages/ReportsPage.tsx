import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyReport } from "@/components/reports/CompanyReport";
import { FileText, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [activeTab, setActiveTab] = useState('company');

  if (!companyId) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
            <CardDescription>Selecione uma empresa para gerar relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nenhuma empresa selecionada. Vá para a página de empresas e selecione uma para visualizar relatórios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Relatórios Executivos</h1>
        <p className="text-muted-foreground">
          Análises completas e insights acionáveis gerados por IA
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Empresa
            <Badge variant="secondary" className="ml-1">Completo</Badge>
          </TabsTrigger>
          <TabsTrigger value="maturity" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Maturidade
            <Badge variant="outline" className="ml-1">Em breve</Badge>
          </TabsTrigger>
          <TabsTrigger value="fit" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Fit TOTVS
            <Badge variant="outline" className="ml-1">Em breve</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <CompanyReport companyId={companyId} />
        </TabsContent>

        <TabsContent value="maturity">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Maturidade Digital</CardTitle>
              <CardDescription>Análise detalhada da evolução digital da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Em Desenvolvimento</p>
                <p className="text-muted-foreground mb-6">
                  Relatório de Maturidade Digital será implementado em breve
                </p>
                <Button variant="outline" disabled>
                  Aguarde a próxima versão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fit">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Fit TOTVS</CardTitle>
              <CardDescription>Análise de adequação aos produtos TOTVS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Em Desenvolvimento</p>
                <p className="text-muted-foreground mb-6">
                  Análise de Fit TOTVS será implementada em breve
                </p>
                <Button variant="outline" disabled>
                  Aguarde a próxima versão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
