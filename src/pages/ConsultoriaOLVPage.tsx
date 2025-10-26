import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ConsultingCatalogManager } from "@/components/consulting/ConsultingCatalogManager";
import { ConsultingSimulator } from "@/components/consulting/ConsultingSimulator";
import { OLVPremiumServicesSelector, type OLVServiceItem } from "@/components/consulting/OLVPremiumServicesSelector";
import { ArrowLeft, Download, Calculator, BookOpen, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConsultoriaOLVPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedServices, setSelectedServices] = useState<OLVServiceItem[]>([]);

  const handleExportPDF = () => {
    toast({
      title: "Exportando para PDF",
      description: "Gerando documento de serviços OLV Premium...",
    });
    // TODO: Implementar exportação real
  };

  const getTotalInvestment = () => {
    return selectedServices.reduce((sum, service) => 
      sum + (service.estimatedHours * service.hourlyRate), 0
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Consultoria OLV Premium</h1>
          </div>
          <p className="text-muted-foreground">
            Gestão estratégica, Supply Chain, Internacionalização e Novos Negócios
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExportPDF}
        >
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="services" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Serviços Premium
          </TabsTrigger>
          <TabsTrigger value="simulator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Composição de Serviços OLV Premium</CardTitle>
              <CardDescription>
                Selecione os serviços especializados de consultoria estratégica
              </CardDescription>
              {selectedServices.length > 0 && (
                <div className="pt-4 border-t mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Serviços selecionados: {selectedServices.length}</div>
                      <div className="text-sm text-muted-foreground">
                        Total de horas: {selectedServices.reduce((sum, s) => sum + s.estimatedHours, 0)}h
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground text-right">Investimento Total</div>
                      <div className="text-2xl font-bold text-primary">{formatCurrency(getTotalInvestment())}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
          
          <OLVPremiumServicesSelector
            selectedServices={selectedServices}
            onServicesChange={setSelectedServices}
          />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-4">
          <ConsultingSimulator />
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <ConsultingCatalogManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
