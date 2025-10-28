import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Phone, 
  Linkedin, 
  CheckCircle, 
  AlertCircle,
  User,
  Building2,
  Target,
  Twitter,
  Facebook,
  Github,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface DecisorWithApollo {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  direct_phone?: string;
  mobile_phone?: string;
  linkedin_url?: string;
  email_status?: string;
  contact_accuracy_score?: number;
  seniority_level?: string;
  departments?: string[];
  persona_tags?: string[];
  functions?: string[];
  photo_url?: string;
  intent_strength?: string;
  show_intent?: boolean;
  apollo_person_metadata?: any;
  // 🆕 NOVOS CAMPOS APOLLO
  headline?: string;
  city?: string;
  state?: string;
  country?: string;
  education?: Array<{
    school_name?: string;
    degree?: string;
    field_of_study?: string;
  }>;
  twitter_url?: string;
  facebook_url?: string;
  github_url?: string;
  organization_data?: {
    name?: string;
    industry?: string;
  };
  apollo_last_enriched_at?: string;
}

interface ApolloDecisorsCardProps {
  decisors: DecisorWithApollo[];
}

export function ApolloDecisorsCard({ decisors }: ApolloDecisorsCardProps) {
  if (!decisors || decisors.length === 0) {
    return null;
  }

  // Filtrar decisores que foram enriquecidos pelo Apollo (têm apollo_last_enriched_at ou source='apollo')
  const apolloDecisors = decisors.filter(d => 
    d.apollo_person_metadata || 
    d.email_status || 
    d.headline || 
    d.city || 
    d.functions || 
    d.apollo_last_enriched_at
  );

  if (apolloDecisors.length === 0) {
    return null;
  }

  const getEmailStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return 'text-green-500';
      case 'guessed': return 'text-yellow-500';
      case 'unavailable': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getEmailStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'guessed': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <img src={apolloIcon} alt="Apollo" className="h-5 w-5" />
          <div>
            <CardTitle>Decisores & Contatos Apollo</CardTitle>
            <CardDescription>
              {apolloDecisors.length} contato(s) enriquecido(s) com dados verificados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apolloDecisors.map((decisor, idx) => (
            <div key={decisor.id}>
              {idx > 0 && <Separator className="my-4" />}
              
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  {decisor.photo_url && (
                    <AvatarImage src={decisor.photo_url} alt={decisor.name} />
                  )}
                  <AvatarFallback>
                    {decisor.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Nome e Cargo */}
                  <div className="mb-2">
                    <h4 className="font-semibold text-base">{decisor.name}</h4>
                    {decisor.title && (
                      <p className="text-sm text-muted-foreground">{decisor.title}</p>
                    )}
                    {/* 🆕 Headline LinkedIn */}
                    {decisor.headline && (
                      <p className="text-xs text-muted-foreground italic mt-1">"{decisor.headline}"</p>
                    )}
                    {/* 🆕 Localização */}
                    {(decisor.city || decisor.state) && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[decisor.city, decisor.state, decisor.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Seniority e Departamentos */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {decisor.seniority_level && (
                      <Badge variant="secondary" className="text-xs">
                        {decisor.seniority_level}
                      </Badge>
                    )}
                    {decisor.departments && decisor.departments.length > 0 && (
                      decisor.departments.map((dept: string, i: number) => (
                        <Badge key={`dept-${i}`} variant="outline" className="text-xs">
                          {dept}
                        </Badge>
                      ))
                    )}
                    {/* 🆕 Functions (prioriza sobre persona_tags) */}
                    {(decisor.functions || decisor.persona_tags) && 
                     (decisor.functions || decisor.persona_tags)!.length > 0 && (
                      (decisor.functions || decisor.persona_tags)!.slice(0, 2).map((tag: string, i: number) => (
                        <Badge key={`func-${i}`} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Contatos */}
                  <div className="space-y-2">
                    {decisor.email && decisor.email !== 'email_not_unlocked@domain.com' ? (
                      <div className="flex items-center gap-2 text-sm">
                        {getEmailStatusIcon(decisor.email_status)}
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
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getEmailStatusIcon(decisor.email_status)}
                        <span>E-mail protegido (Apollo)</span>
                      </div>
                    )}

                    {(decisor.direct_phone || decisor.mobile_phone || decisor.phone) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">
                          {decisor.direct_phone || decisor.mobile_phone || decisor.phone}
                        </span>
                        {decisor.direct_phone && (
                          <Badge variant="secondary" className="text-xs">Direto</Badge>
                        )}
                      </div>
                    )}

                    {/* 🆕 Redes Sociais */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {decisor.linkedin_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(decisor.linkedin_url, '_blank')}
                          className="h-8 gap-2"
                        >
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </Button>
                      )}
                      {decisor.twitter_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(decisor.twitter_url, '_blank')}
                          className="h-8 gap-1"
                        >
                          <Twitter className="h-3 w-3" />
                        </Button>
                      )}
                      {decisor.facebook_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(decisor.facebook_url, '_blank')}
                          className="h-8 gap-1"
                        >
                          <Facebook className="h-3 w-3" />
                        </Button>
                      )}
                      {decisor.github_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(decisor.github_url, '_blank')}
                          className="h-8 gap-1"
                        >
                          <Github className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Contact Accuracy Score */}
                  {decisor.contact_accuracy_score !== undefined && decisor.contact_accuracy_score > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Precisão do Contato</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={decisor.contact_accuracy_score} 
                            className="h-1.5 w-20"
                          />
                          <span className="text-xs font-medium">{decisor.contact_accuracy_score}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Intent Signal */}
                  {decisor.show_intent && decisor.intent_strength && (
                    <div className="mt-2">
                      <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <Target className="h-3 w-3 mr-1" />
                        Intent: {decisor.intent_strength}
                      </Badge>
                    </div>
                  )}

                  {/* 🆕 Educação */}
                  {decisor.education && Array.isArray(decisor.education) && decisor.education.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <h5 className="text-xs font-medium mb-1">Educação</h5>
                          {decisor.education.slice(0, 2).map((edu, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              {edu.degree && <span className="font-medium">{edu.degree}</span>}
                              {edu.degree && edu.school_name && ' - '}
                              {edu.school_name}
                              {edu.field_of_study && (
                                <span className="block text-xs opacity-75">{edu.field_of_study}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🆕 Organização Atual */}
                  {decisor.organization_data && decisor.organization_data.name && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{decisor.organization_data.name}</span>
                        {decisor.organization_data.industry && (
                          <Badge variant="outline" className="text-xs">
                            {decisor.organization_data.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
