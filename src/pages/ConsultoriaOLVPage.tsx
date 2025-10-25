import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultingCatalogManager } from "@/components/consulting/ConsultingCatalogManager";
import { ConsultingSimulator } from "@/components/consulting/ConsultingSimulator";
import { Building2, Calculator, BookOpen } from "lucide-react";

export default function ConsultoriaOLVPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Consultoria OLV</h1>
        <p className="text-muted-foreground">
          Gerencie catálogo de serviços, simule propostas e configure precificação de consultoria
        </p>
      </div>

      <Tabs defaultValue="simulator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="simulator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
        </TabsList>

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
