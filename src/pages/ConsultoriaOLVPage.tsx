import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ConsultingCatalogManager } from "@/components/consulting/ConsultingCatalogManager";
import { ConsultingSimulator } from "@/components/consulting/ConsultingSimulator";
import { OLVPremiumServicesSelector, type OLVServiceItem } from "@/components/consulting/OLVPremiumServicesSelector";
import { ArrowLeft, Download, Calculator, BookOpen, Briefcase, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportButton } from "@/components/export/ExportButton";
// ScrollToTopButton removido
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ConsultoriaOLVPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedServices, setSelectedServices] = useState<OLVServiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSaveData = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('consultoria_olv_data', JSON.stringify({
        selectedServices,
        savedAt: new Date().toISOString(),
      }));
      toast({
        title: "✅ Dados salvos",
        description: "Seus serviços foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro desconhecido",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    try {
      toast({
        title: "Exportando para PDF",
        description: "Gerando documento de serviços OLV Premium...",
      });

      // ✅ IMPLEMENTADO: Export PDF completo
      const doc = new jsPDF();
      
      // Header com logo/branding
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('CONSULTORIA OLV PREMIUM', 14, 25);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text('Proposta de Serviços Especializados', 14, 32);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}`, 14, 38);
      
      // Linha separadora
      doc.setDrawColor(200);
      doc.line(14, 42, 196, 42);
      
      // Serviços selecionados
      if (selectedServices.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        doc.text('Serviços Selecionados', 14, 52);
        
        (doc as any).autoTable({
          startY: 56,
          head: [['Serviço', 'Descrição', 'Horas', 'Valor Hora', 'Total']],
          body: selectedServices.map(s => [
            s.name,
            s.shortDescription.substring(0, 50) + '...',
            s.estimatedHours.toString(),
            `R$ ${s.hourlyRate.toLocaleString('pt-BR')}`,
            formatCurrency(s.estimatedHours * s.hourlyRate)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          margin: { left: 14, right: 14 }
        });
        
        // Total
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(
          `INVESTIMENTO TOTAL: ${formatCurrency(getTotalInvestment())}`,
          14,
          finalY
        );
        
        // Observações
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(100);
        doc.text('Valores sujeitos a ajustes após análise detalhada do projeto.', 14, finalY + 10);
      } else {
        doc.setFontSize(12);
        doc.text('Nenhum serviço selecionado ainda.', 14, 56);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('© 2025 OLV Internacional - Consultoria Premium', 14, pageHeight - 10);
      doc.text('https://olvcore.com | contato@olvcore.com', 14, pageHeight - 6);
      
      // Salvar
      doc.save(`consultoria_olv_premium_${new Date().toISOString().slice(0,10)}.pdf`);
      
      toast({
        title: "✅ PDF Exportado com Sucesso!",
        description: `Proposta salva: consultoria_olv_premium_${new Date().toISOString().slice(0,10)}.pdf`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao exportar PDF",
        description: error.message || "Não foi possível gerar o documento",
        variant: "destructive"
      });
    }
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
      {/* ScrollToTopButton removido */}
      {/* Header com navegação */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
        <div className="flex gap-2 flex-wrap">
          {selectedServices.length > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveData}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <ExportButton
                data={selectedServices}
                filename="consultoria_olv_premium"
                variant="outline"
                size="sm"
              />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
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
