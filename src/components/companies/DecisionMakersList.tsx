import { Badge } from "@/components/ui/badge";
import { ExternalLink, Mail, Phone, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDecisionMakers } from "@/hooks/useDecisionMakers";
import { Skeleton } from "@/components/ui/skeleton";

interface DecisionMakersListProps {
  companyId: string;
}

export function DecisionMakersList({ companyId }: DecisionMakersListProps) {
  const { data: decisionMakers, isLoading } = useDecisionMakers(companyId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!decisionMakers || decisionMakers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum decisor encontrado para esta empresa.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Exibindo 1 – {decisionMakers.length} de {decisionMakers.length} decisores
      </div>

      {decisionMakers.map((person) => (
        <div
          key={person.id}
          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Nome e Cargo */}
              <div>
                <h3 className="font-semibold text-lg">{person.name}</h3>
                <p className="text-sm text-muted-foreground">{person.title}</p>
              </div>

              {/* Senioridade e Departamentos */}
              <div className="flex flex-wrap gap-2">
                {person.seniority && (
                  <Badge variant="secondary">{person.seniority}</Badge>
                )}
                {person.departments && Array.isArray(person.departments) &&
                  (person.departments as string[]).map((dept, idx) => (
                    <Badge key={idx} variant="outline">
                      {dept}
                    </Badge>
                  ))}
              </div>

              {/* Localização */}
              {(person.city || person.state || person.country) && (
                <p className="text-sm text-muted-foreground">
                  📍 {[person.city, person.state, person.country].filter(Boolean).join(", ")}
                </p>
              )}

              {/* Score */}
              {person.recommendations_score !== null && (
                <div className="text-sm">
                  <span className="font-medium">Apollo Score:</span>{" "}
                  <Badge variant="secondary">{person.recommendations_score}</Badge>
                  {person.people_auto_score_label && (
                    <span className="ml-2 text-muted-foreground">
                      {person.people_auto_score_label} {person.people_auto_score_value}
                    </span>
                  )}
                </div>
              )}

              {/* Contatos */}
              <div className="flex flex-wrap gap-3">
                {person.email && (
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${person.email}`}
                      className="hover:underline text-primary"
                    >
                      {person.email}
                    </a>
                    {person.email_status && (
                      <Badge
                        variant={
                          person.email_status === "verified"
                            ? "default"
                            : person.email_status === "personal"
                            ? "secondary"
                            : "outline"
                        }
                        className="ml-1"
                      >
                        {person.email_status === "verified"
                          ? "✓ Verificado"
                          : person.email_status === "personal"
                          ? "Email pessoal"
                          : "Indisponível"}
                      </Badge>
                    )}
                  </div>
                )}

                {(person.phone || person.mobile_phone) && (
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-4 w-4" />
                    <span>{person.phone || person.mobile_phone}</span>
                  </div>
                )}
              </div>

              {/* Contexto da Empresa */}
              {person.company_name && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{person.company_name}</span>
                  {person.company_employees && (
                    <span> · {person.company_employees.toLocaleString()} empregados</span>
                  )}
                </div>
              )}
            </div>

            {/* Links externos */}
            <div className="flex flex-col gap-2">
              {person.linkedin_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={person.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}

              {person.apollo_person_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={person.apollo_person_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apollo
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
