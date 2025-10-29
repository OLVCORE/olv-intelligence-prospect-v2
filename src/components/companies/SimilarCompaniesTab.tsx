import { useSimilarCompanies } from '@/hooks/useSimilarCompanies';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users } from 'lucide-react';

interface SimilarCompaniesTabProps {
  companyId: string;
}

export function SimilarCompaniesTab({ companyId }: SimilarCompaniesTabProps) {
  const { data: similars, isLoading } = useSimilarCompanies(companyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando empresas similares...</div>
      </div>
    );
  }

  if (!similars || similars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
        <div className="text-muted-foreground">
          Nenhuma empresa similar encontrada.
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Clique em "Atualizar agora" para buscar empresas similares via Apollo.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {similars.map((similar) => (
        <Card key={`${similar.company_id}-${similar.similar_company_external_id}`} className="p-4 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{similar.similar_name}</h3>
                {similar.location && (
                  <p className="text-sm text-muted-foreground truncate">{similar.location}</p>
                )}
              </div>
              <Badge variant="secondary" className="badge-apollo">
                {similar.source}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {(similar.employees_min || similar.employees_max) && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>
                    {similar.employees_min && similar.employees_max
                      ? `${similar.employees_min}-${similar.employees_max}`
                      : similar.employees_min || similar.employees_max}
                  </span>
                </div>
              )}
            </div>

            {similar.similarity_score && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Score de similaridade</span>
                  <span className="font-medium">{(similar.similarity_score * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${similar.similarity_score * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
