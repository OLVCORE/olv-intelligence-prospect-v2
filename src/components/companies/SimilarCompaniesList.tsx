import { ExternalLink, Building2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimilarCompany {
  name: string;
  apollo_url: string;
  location?: string;
  employees?: number;
  apollo_id?: string;
}

interface SimilarCompaniesListProps {
  similarCompanies: SimilarCompany[];
}

export function SimilarCompaniesList({ similarCompanies }: SimilarCompaniesListProps) {
  if (!similarCompanies || similarCompanies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma empresa similar encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Exibindo 1 – {similarCompanies.length} de {similarCompanies.length} empresas similares
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {similarCompanies.map((company, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Nome */}
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{company.name}</h3>
                </div>

                {/* Localização */}
                {company.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{company.location}</span>
                  </div>
                )}

                {/* Número de empregados */}
                {company.employees && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{company.employees.toLocaleString()} empregados</span>
                  </div>
                )}
              </div>

              {/* Link Apollo */}
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 shrink-0"
              >
                <a
                  href={company.apollo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver no Apollo
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
