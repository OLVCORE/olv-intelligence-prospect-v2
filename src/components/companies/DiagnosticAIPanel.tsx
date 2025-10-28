import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, Target, Users, MapPin, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DiagnosticAIPanelProps {
  company: any;
}

interface DiagnosticResult {
  overview: string;
  segment_analysis: string;
  ideal_buyer_persona: string;
  recommended_approach: string;
  totvs_products: string[];
  business_potential: string;
  similar_companies: Array<{
    name: string;
    domain?: string;
    employees?: number;
    location?: string;
    apollo_url?: string;
  }>;
  risks: string[];
  opportunities: string[];
}

export function DiagnosticAIPanel({ company }: DiagnosticAIPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      toast.info("Gerando diagnóstico 360° com IA...");

      const { data, error } = await supabase.functions.invoke('generate-company-diagnostic', {
        body: {
          companyId: company.id,
          companyData: {
            name: company.name,
            cnpj: company.cnpj,
            domain: company.domain || company.website,
            linkedin_url: company.linkedin_url,
            employees_count: company.employees_count,
            sic_codes: company.sic_codes,
            naics_codes: company.naics_codes,
            founded_year: company.founded_year,
            keywords: company.keywords,
            phone: company.phone,
            social_links: company.social_links,
            raw_data: company.raw_data,
            location: company.city && company.state ? `${company.city}, ${company.state}` : null
          }
        }
      });

      if (error) throw error;

      setDiagnostic(data);
      toast.success("Diagnóstico 360° gerado com sucesso!");
    } catch (error: any) {
      console.error('Erro ao gerar diagnóstico:', error);
      toast.error("Erro ao gerar diagnóstico", { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Diagnóstico 360° por IA
              </CardTitle>
              <CardDescription>
                Análise completa de inteligência, segmentação e oportunidades
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Diagnóstico
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {diagnostic && (
        <div className="space-y-4">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {diagnostic.overview}
              </p>
            </CardContent>
          </Card>

          {/* Segment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Análise de Segmento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {diagnostic.segment_analysis}
              </p>
            </CardContent>
          </Card>

          {/* Ideal Buyer Persona */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Perfil Ideal de Decisor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {diagnostic.ideal_buyer_persona}
              </p>
            </CardContent>
          </Card>

          {/* Recommended Approach */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estratégia de Abordagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {diagnostic.recommended_approach}
              </p>
            </CardContent>
          </Card>

          {/* TOTVS Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Produtos TOTVS Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {diagnostic.totvs_products.map((product, i) => (
                  <Badge key={i} variant="default" className="bg-primary/10 text-primary">
                    {product}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Potential */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Potencial de Negócio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {diagnostic.business_potential}
              </p>
            </CardContent>
          </Card>

          {/* Risks & Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Riscos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diagnostic.risks.map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diagnostic.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Similar Companies */}
          {diagnostic.similar_companies && diagnostic.similar_companies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Empresas Similares ({diagnostic.similar_companies.length})
                </CardTitle>
                <CardDescription>
                  Empresas da mesma região/segmento com presença no Apollo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diagnostic.similar_companies.map((sim, i) => (
                    <div key={i} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">{sim.name}</h4>
                          {sim.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {sim.location}
                            </p>
                          )}
                          {sim.employees && (
                            <p className="text-xs text-muted-foreground">
                              {sim.employees} funcionários
                            </p>
                          )}
                        </div>
                        {sim.apollo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(sim.apollo_url, '_blank')}
                          >
                            Ver no Apollo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
