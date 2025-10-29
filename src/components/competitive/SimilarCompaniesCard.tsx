import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, ExternalLink, Sparkles, Users, MapPin } from "lucide-react";
import { useSimilarCompanies } from "@/hooks/useSimilarCompanies";
import { toast } from "sonner";

interface SimilarCompaniesCardProps {
  companyId?: string;
  companyName?: string;
}

export function SimilarCompaniesCard({ companyId, companyName }: SimilarCompaniesCardProps) {
  const { data: similarCompanies, isLoading } = useSimilarCompanies(companyId);

  const handleAddToList = (companyName: string) => {
    toast.success(`${companyName} adicionada à lista`, {
      description: "Empresa marcada para análise em massa"
    });
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.7) return "text-yellow-600";
    return "text-orange-600";
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.9) return "Muito Similar";
    if (score >= 0.7) return "Similar";
    return "Moderadamente Similar";
  };

  if (!companyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Empresas Similares
          </CardTitle>
          <CardDescription>
            Selecione uma empresa para ver empresas similares
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Empresas Similares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Empresas Similares
        </CardTitle>
        <CardDescription>
          {similarCompanies && similarCompanies.length > 0 
            ? `Baseado na análise de "${companyName}", encontramos ${similarCompanies.length} empresas similares`
            : "Nenhuma empresa similar encontrada"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {!similarCompanies || similarCompanies.length === 0 ? (
          <Alert>
            <AlertDescription>
              Nenhuma empresa similar detectada para {companyName}. Execute a análise de similaridade primeiro.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              💡 <strong>Dica:</strong> Empresas similares têm perfil, porte e região semelhantes. 
              Adicione-as ao lote para análise em massa.
            </div>

            {similarCompanies.map((similar, idx) => (
              <div 
                key={similar.similar_company_external_id || idx}
                className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{similar.similar_name}</h4>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {similar.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {similar.location}
                        </div>
                      )}
                      
                      {(similar.employees_min || similar.employees_max) && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {similar.employees_min && similar.employees_max 
                            ? `${similar.employees_min}-${similar.employees_max} funcionários`
                            : similar.employees_min 
                            ? `${similar.employees_min}+ funcionários`
                            : `até ${similar.employees_max} funcionários`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge 
                      variant={similar.similarity_score && similar.similarity_score >= 0.9 ? "default" : "secondary"}
                      className="mb-2"
                    >
                      {similar.similarity_score 
                        ? `${Math.round(similar.similarity_score * 100)}%`
                        : 'N/A'}
                    </Badge>
                    {similar.similarity_score && (
                      <div className={`text-xs ${getSimilarityColor(similar.similarity_score)}`}>
                        {getSimilarityLabel(similar.similarity_score)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Fonte: {similar.source || 'Apollo'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToList(similar.similar_name)}
                    >
                      Adicionar ao Lote
                    </Button>
                    {similar.similar_company_external_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(similar.similar_company_external_id);
                          toast.success("ID copiado");
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {similarCompanies.length > 3 && (
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  Adicionar Todas ao Lote ({similarCompanies.length} empresas)
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
