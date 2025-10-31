import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApolloEnrichButton } from "./ApolloEnrichButton";
import { EconodataEnrichButton } from "./EconodataEnrichButton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, Globe, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface EnrichmentActionsCardProps {
  company: any;
  onEnrichmentComplete?: () => void;
}

export function EnrichmentActionsCard({ company, onEnrichmentComplete }: EnrichmentActionsCardProps) {
  const [isEnrichingReceita, setIsEnrichingReceita] = useState(false);
  const hasApolloData = !!company.apollo_organization_id;
  const hasCNPJ = !!company.cnpj;
  const hasEconodataData = !!company.econodata_enriched_at;

  const handleEnrichReceita = async () => {
    if (!hasCNPJ) {
      toast.error("CNPJ não disponível");
      return;
    }

    setIsEnrichingReceita(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-receitaws', {
        body: {
          cnpj: company.cnpj,
          companyId: company.id
        }
      });

      if (error) throw error;

      toast.success("Dados da Receita Federal atualizados!");
      onEnrichmentComplete?.();
    } catch (error: any) {
      console.error('Erro ao enriquecer ReceitaWS:', error);
      toast.error("Erro ao atualizar dados da Receita Federal");
    } finally {
      setIsEnrichingReceita(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Ações de Enriquecimento
        </CardTitle>
        <CardDescription>
          Enriqueça os dados da empresa com múltiplas fontes de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Apollo Enrichment */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Apollo.io</h4>
              {hasApolloData && (
                <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                  ✓ Enriquecido
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              42 campos organizacionais + Decisores + PhantomBuster fallback
            </p>
          </div>
          <ApolloEnrichButton
            companyId={company.id}
            companyName={company.name}
            companyDomain={company.domain}
            cnpj={company.cnpj}
            razaoSocial={company.razao_social}
            hasApolloId={hasApolloData}
            onSuccess={onEnrichmentComplete}
          />
        </div>

        {/* CNPJ / ReceitaWS Enrichment */}
        {hasCNPJ && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">ReceitaWS</h4>
                {company.cnpj_enriched_at && (
                  <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                    ✓ Enriquecido
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Dados cadastrais e jurídicos da Receita Federal
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEnrichReceita}
              disabled={isEnrichingReceita}
            >
              {isEnrichingReceita ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        )}

        {/* ECONODATA: Desabilitado - será usado na fase 2 */}
        {/* Mantendo estrutura intacta para uso futuro
        {hasCNPJ && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Econodata</h4>
                {hasEconodataData && (
                  <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                    ✓ Enriquecido
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Score de crédito e saúde financeira
              </p>
            </div>
            <EconodataEnrichButton
              companyId={company.id}
              cnpj={company.cnpj}
              variant="outline"
              size="sm"
            />
          </div>
        )}
        */}

        {/* External Validation Links */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Links Externos de Validação
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Valide os dados da empresa em fontes externas em 2-3 cliques
          </p>
          <div className="flex flex-wrap gap-2">
            {company.linkedin_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(company.linkedin_url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                LinkedIn
              </Button>
            )}
            {company.domain && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://${company.domain}`, '_blank')}
              >
                <Globe className="h-3 w-3 mr-1" />
                Website
              </Button>
            )}
            {hasCNPJ && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Receita Federal
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://app.apollo.io/#/home?sortByField=latest_reply_received_at`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Buscar no Apollo
            </Button>
            {company.linkedin_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.linkedin.com/company/${company.linkedin_url.split('/company/')[1]?.split('/')[0]}/people/`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Pessoas no LinkedIn
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
