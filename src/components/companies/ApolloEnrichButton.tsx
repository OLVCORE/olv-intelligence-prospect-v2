import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { ApolloSearchDialog } from "./ApolloSearchDialog";
import { CNPJDiscoveryDialog } from "./CNPJDiscoveryDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApolloEnrichButtonProps {
  companyId: string;
  companyName: string;
  companyDomain?: string;
  cnpj?: string;
  razaoSocial?: string;
  hasApolloId: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  onSuccess?: () => void;
}

export function ApolloEnrichButton({
  companyId,
  companyName,
  companyDomain,
  cnpj,
  razaoSocial,
  hasApolloId,
  variant = "outline",
  size = "sm",
  onSuccess
}: ApolloEnrichButtonProps) {
  const [enriching, setEnriching] = useState(false);
  const [showCNPJDialog, setShowCNPJDialog] = useState(false);
  const [selectedApolloOrg, setSelectedApolloOrg] = useState<any>(null);

  const handleApolloSelect = async (org: any) => {
    setSelectedApolloOrg(org);
    
    // Se já tem CNPJ, enriquecer direto
    if (cnpj) {
      await enrichWithApollo(org);
    } else {
      // Se não tem CNPJ, abrir dialog de discovery
      setShowCNPJDialog(true);
    }
  };

  const handleCNPJApplied = async () => {
    if (!selectedApolloOrg) return;
    
    // Após CNPJ aplicado, enriquecer com Apollo
    await enrichWithApollo(selectedApolloOrg);
  };

  const enrichWithApollo = async (org: any) => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'ciclo3_enrich_complete', // CICLO 3: Enriquecimento completo
          companyId,
          apolloOrganizationId: org.id,
          cnpj: cnpj || selectedApolloOrg?.cnpj
        }
      });

      if (error) throw error;

      const decisorsCount = data?.decisors_saved || data?.decisors_found || 0;
      const fieldsCount = data?.fields_enriched || 100;
      const similarsCount = data?.similar_companies || 0;

      toast.success(`✅ Empresa enriquecida com Apollo (CICLO 3)!`, {
        description: `${decisorsCount} decisores · ${fieldsCount} campos · ${similarsCount} similares`
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao enriquecer com Apollo:', error);
      toast.error("Erro ao enriquecer com Apollo");
    } finally {
      setEnriching(false);
    }
  };

  return (
    <>
      <ApolloSearchDialog
        companyName={razaoSocial || companyName}
        companyDomain={companyDomain}
        onSelect={handleApolloSelect}
        trigger={
          <Button 
            variant={variant} 
            size={size}
            disabled={enriching}
          >
            {enriching ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {hasApolloId ? 'Re-enriquecer Apollo' : 'Enriquecer Apollo'}
          </Button>
        }
      />

      {selectedApolloOrg && (
        <CNPJDiscoveryDialog
          open={showCNPJDialog}
          onOpenChange={setShowCNPJDialog}
          company={{
            id: companyId,
            name: companyName,
            domain: companyDomain
          }}
          onCNPJApplied={handleCNPJApplied}
        />
      )}
    </>
  );
}
