import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyReport } from "@/components/reports/CompanyReport";
import { MaturityReport } from "@/components/reports/MaturityReport";
import { FitReport } from "@/components/reports/FitReport";
import { FileText, BarChart3, Target } from "lucide-react";
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
            <Badge variant="secondary" className="ml-1">Completo</Badge>
          </TabsTrigger>
          <TabsTrigger value="fit" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Fit TOTVS
            <Badge variant="secondary" className="ml-1">Completo</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <CompanyReport companyId={companyId} />
        </TabsContent>

        <TabsContent value="maturity" className="space-y-6">
          <MaturityReport companyId={companyId} />
        </TabsContent>

        <TabsContent value="fit" className="space-y-6">
          <FitReport companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
