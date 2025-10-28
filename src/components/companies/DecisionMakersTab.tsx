import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Mail, Phone, Linkedin } from 'lucide-react';
import { useDecisionMakers } from '@/hooks/useDecisionMakers';
import type { DecisionMaker } from '@/lib/db';

interface DecisionMakersTabProps {
  companyId: string;
}

export function DecisionMakersTab({ companyId }: DecisionMakersTabProps) {
  const { data: decisors, isLoading } = useDecisionMakers(companyId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (!decisors || decisors.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>Nenhum decisor encontrado.</p>
        <p className="text-sm mt-2">Execute o enriquecimento Apollo para coletar decisores.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Mostrando <strong>{decisors.length}</strong> decisor(es) validado(s)
        </p>
      </div>

      {decisors.map((decisor: DecisionMaker) => (
        <Card key={decisor.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Nome e Cargo */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {decisor.name}
                </h3>
                <p className="text-sm text-muted-foreground">{decisor.title}</p>
              </div>

              {/* Badges: Seniority + Departamentos */}
              <div className="flex flex-wrap gap-2">
                {decisor.seniority && (
                  <Badge variant="secondary">{decisor.seniority}</Badge>
                )}
                {Array.isArray(decisor.departments) &&
                  decisor.departments.map((dept: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {dept}
                    </Badge>
                  ))}
              </div>

              {/* Score Apollo */}
              {decisor.recommendations_score && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Apollo Score:</span>
                  <span className="font-medium text-primary">
                    {decisor.people_auto_score_label || 'N/A'} {decisor.recommendations_score}/100
                  </span>
                </div>
              )}

              {/* Contatos */}
              <div className="flex flex-wrap gap-3 text-sm">
                {decisor.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${decisor.email}`}
                      className="text-primary hover:underline"
                    >
                      {decisor.email}
                    </a>
                    {decisor.email_status && (
                      <Badge variant="outline" className="text-xs">
                        {decisor.email_status}
                      </Badge>
                    )}
                  </div>
                )}
                {decisor.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{decisor.phone}</span>
                  </div>
                )}
              </div>

              {/* Localização */}
              {(decisor.city || decisor.state || decisor.country) && (
                <p className="text-sm text-muted-foreground">
                  📍 {[decisor.city, decisor.state, decisor.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Links externos */}
            <div className="flex flex-col gap-2">
              {decisor.linkedin_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={decisor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {decisor.apollo_person_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={decisor.apollo_person_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apollo
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
