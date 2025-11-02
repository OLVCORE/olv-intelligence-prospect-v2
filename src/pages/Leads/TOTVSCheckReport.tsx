import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2, Printer, UserPlus } from "lucide-react";
import TOTVSCheckCard from "@/components/totvs/TOTVSCheckCard";
import { supabase } from "@/integrations/supabase/client";
import { DraggableDialog } from "@/components/ui/draggable-dialog";
import { toast } from "sonner";

export default function TOTVSCheckReport() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();

  const [companyMeta, setCompanyMeta] = useState<{ name: string; cnpj?: string; domain?: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const qpName = searchParams.get("name") || undefined;
  const qpCnpj = searchParams.get("cnpj") || undefined;
  const qpDomain = searchParams.get("domain") || undefined;
  const qpCompanyId = searchParams.get("companyId") || undefined;
  const resolvedCompanyId = companyId || qpCompanyId;

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!resolvedCompanyId) return;

      // Preferir dados vindos por query string para evitar consultas desnecessárias
      if (qpName || qpCnpj || qpDomain) {
        if (!ignore) setCompanyMeta({ name: qpName || "Empresa", cnpj: qpCnpj || undefined, domain: qpDomain || undefined });
        return;
      }

      // Fallback: tentar obter metadados da quarentena
      const { data } = await supabase
        .from("icp_analysis_results")
        .select("razao_social, cnpj, domain")
        .eq("id", resolvedCompanyId)
        .maybeSingle();

      if (!ignore) {
        setCompanyMeta({
          name: (data as any)?.razao_social || "Empresa",
          cnpj: (data as any)?.cnpj || undefined,
          domain: (data as any)?.domain || undefined,
        });
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [resolvedCompanyId, qpName, qpCnpj, qpDomain]);

  const headerTitle = useMemo(() => companyMeta?.name || "Relatório TOTVS Check", [companyMeta]);

  const handlePrint = () => {
    window.print();
    toast.success("Preparando relatório para impressão...");
  };

  const handleAssign = () => {
    setShowAssignDialog(true);
    toast.info("Funcionalidade de atribuição em breve!");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const reportContent = (
    <>
      {resolvedCompanyId && (
        <TOTVSCheckCard
          companyId={resolvedCompanyId}
          companyName={companyMeta?.name || "Empresa"}
          cnpj={companyMeta?.cnpj}
          domain={companyMeta?.domain}
          autoVerify={false}
        />
      )}
    </>
  );

  // Modo Fullscreen
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Relatório TOTVS Check</h1>
                <p className="text-muted-foreground">Relatório completo com evidências por fonte</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleAssign}>
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Minimize2 className="h-4 w-4 mr-2" />
                Sair Fullscreen
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{headerTitle}</CardTitle>
              {companyMeta?.cnpj && (
                <CardDescription>CNPJ: {companyMeta.cnpj}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {reportContent}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Modo Minimizado
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="default" 
          onClick={toggleMinimize}
          className="shadow-lg"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          {headerTitle}
        </Button>
      </div>
    );
  }

  // Modo Normal (Arrastável)
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Relatório TOTVS Check</h1>
            <p className="text-muted-foreground">Relatório completo com evidências por fonte</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleAssign}>
            <UserPlus className="h-4 w-4 mr-2" />
            Atribuir
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMinimize}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="cursor-move">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl">{headerTitle}</CardTitle>
          {companyMeta?.cnpj && (
            <CardDescription>CNPJ: {companyMeta.cnpj}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {reportContent}
        </CardContent>
      </Card>
    </div>
  );
}
