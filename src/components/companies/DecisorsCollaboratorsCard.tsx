import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Target, Users, Linkedin, Mail, Phone, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Person {
  name: string;
  role: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  source?: 'apollo' | 'phantom' | 'manual';
}

interface DecisorsCollaboratorsCardProps {
  decisors: Person[];
  collaborators: Person[];
  title?: string;
  icon?: React.ReactNode;
}

export function DecisorsCollaboratorsCard({ 
  decisors, 
  collaborators, 
  title = "Decisores & Colaboradores",
  icon 
}: DecisorsCollaboratorsCardProps) {
  const PersonCard = ({ person, type }: { person: Person; type: 'decisor' | 'colaborador' }) => (
    <div className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base">{person.name}</h4>
            <Badge variant={type === 'decisor' ? 'default' : 'secondary'} className="text-xs">
              {type === 'decisor' ? 'Decisor' : 'Colaborador'}
            </Badge>
            {person.source && person.source !== 'manual' && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  person.source === 'phantom' 
                    ? 'border-purple-500 text-purple-700 dark:text-purple-400' 
                    : 'border-blue-500 text-blue-700 dark:text-blue-400'
                }`}
              >
                {person.source === 'phantom' ? '🔮 Phantom' : '🚀 Apollo'}
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground font-medium">{person.role}</p>
          
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {person.linkedin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                asChild
              >
                <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="ml-1 text-xs">LinkedIn</span>
                  <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                </a>
              </Button>
            )}
            
            {person.email && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-green-50 dark:hover:bg-green-950"
                asChild
              >
                <a href={`mailto:${person.email}`}>
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="ml-1 text-xs">{person.email}</span>
                </a>
              </Button>
            )}
            
            {person.phone && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-purple-50 dark:hover:bg-purple-950"
                asChild
              >
                <a href={`tel:${person.phone}`}>
                  <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="ml-1 text-xs font-mono">{person.phone}</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          {icon || <Target className="h-5 w-5 text-primary" />}
          {title}
          <Badge variant="outline" className="ml-auto">
            {decisors.length + collaborators.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {decisors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Decisores ({decisors.length})
                </h3>
              </div>
              
              <div className="space-y-3">
                {decisors.map((decisor, idx) => (
                  <PersonCard key={`decisor-${idx}`} person={decisor} type="decisor" />
                ))}
              </div>
            </div>
          )}
          
          {decisors.length > 0 && collaborators.length > 0 && (
            <Separator className="my-6" />
          )}
          
          {collaborators.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Colaboradores ({collaborators.length})
                </h3>
              </div>
              
              <div className="space-y-3">
                {collaborators.map((colaborador, idx) => (
                  <PersonCard key={`colab-${idx}`} person={colaborador} type="colaborador" />
                ))}
              </div>
            </div>
          )}
          
          {decisors.length === 0 && collaborators.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum decisor ou colaborador identificado</p>
              <p className="text-sm mt-1">Use os botões Apollo ou PhantomBuster para enriquecer</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
