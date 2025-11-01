import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TOTVSVerificationCard from "@/components/totvs/TOTVSVerificationCard";
import { supabase } from "@/integrations/supabase/client";

export default function TOTVSCheckReport() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();

  const [companyMeta, setCompanyMeta] = useState<{ name: string; cnpj?: string; domain?: string } | null>(null);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Relatório TOTVS Check</h1>
          <p className="text-muted-foreground">Relatório completo com evidências por fonte</p>
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
          {resolvedCompanyId && (
            <TOTVSVerificationCard
              companyId={resolvedCompanyId}
              companyName={companyMeta?.name || "Empresa"}
              cnpj={companyMeta?.cnpj}
              domain={companyMeta?.domain}
              autoVerify={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
