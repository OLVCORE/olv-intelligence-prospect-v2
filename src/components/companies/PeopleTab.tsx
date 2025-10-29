import { useCompanyPeople } from '@/hooks/useCompanyPeople';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Mail, MapPin, Linkedin, Briefcase } from 'lucide-react';

interface PeopleTabProps {
  companyId: string;
}

export function PeopleTab({ companyId }: PeopleTabProps) {
  const { data: people, isLoading } = useCompanyPeople(companyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando pessoas...</div>
      </div>
    );
  }

  if (!people || people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <div className="text-muted-foreground">
          Nenhuma pessoa vinculada a esta empresa.
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Clique em "Atualizar agora" para buscar decisores via Apollo.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {people.map((cp) => {
        const person = cp.people;
        if (!person) return null;

        const source = person.apollo_person_id ? 'apollo' : person.linkedin_profile_id ? 'linkedin' : 'google';
        const initials = person.full_name
          ?.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || '??';

        return (
          <Card key={person.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{person.full_name}</h3>
                  {(person.job_title || cp.title_at_company) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {person.job_title || cp.title_at_company}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={`badge-${source} text-xs`}>
                      {source}
                    </Badge>
                    {cp.seniority && (
                      <Badge variant="outline" className="text-xs">
                        {cp.seniority}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {cp.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{cp.department}</span>
                  </div>
                )}

                {person.email_primary && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{person.email_primary}</span>
                  </div>
                )}

                {(cp.location_city || cp.location_state || cp.location_country) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {[cp.location_city, cp.location_state, cp.location_country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {person.linkedin_url && (
                  <a
                    href={person.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Linkedin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Ver perfil no LinkedIn</span>
                  </a>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
