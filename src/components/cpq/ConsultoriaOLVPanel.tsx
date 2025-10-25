import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Users, TrendingUp, BookOpen, Mail, Phone, Award, CheckCircle } from "lucide-react";

export function ConsultoriaOLVPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultoria Premium OLV</CardTitle>
        <CardDescription>
          Serviços especializados de implementação, PMO e transformação digital
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Diagnóstico e Planejamento */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Diagnóstico Estratégico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Análise completa da maturidade organizacional e digital
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Assessment de processos atuais (AS-IS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Mapeamento de gaps e oportunidades</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Roadmap de transformação digital</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Plano de implementação faseado</span>
                </li>
              </ul>
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold">Duração: 2-4 semanas</p>
                <p className="text-xs text-muted-foreground">Investimento sob consulta</p>
              </div>
            </CardContent>
          </Card>

          {/* PMO */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                PMO de Implementação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Gestão completa do projeto de transformação
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Project Manager dedicado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Governança e controle de riscos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Gestão de stakeholders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Reports executivos periódicos</span>
                </li>
              </ul>
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold">Duração: Todo o projeto</p>
                <p className="text-xs text-muted-foreground">Modelo mensal ou por projeto</p>
              </div>
            </CardContent>
          </Card>

          {/* Change Management */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Change Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Gestão de mudança organizacional e cultural
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Análise de impacto e resistências</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Plano de comunicação estratégica</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Engajamento de lideranças</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Acompanhamento pós go-live</span>
                </li>
              </ul>
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold">Duração: 3-6 meses</p>
                <p className="text-xs text-muted-foreground">Incluso em projetos premium</p>
              </div>
            </CardContent>
          </Card>

          {/* Treinamento */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Treinamento & Capacitação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Desenvolvimento de equipes e key users
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Train the trainer (multiplicadores)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Workshops hands-on práticos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Material didático customizado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Certificação de usuários</span>
                </li>
              </ul>
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold">Formato: Presencial ou remoto</p>
                <p className="text-xs text-muted-foreground">Por turma ou horas contratadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Award className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Pacotes Customizados</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Cada projeto é único. Nossos especialistas criam pacotes sob medida combinando 
                serviços de diagnóstico, PMO, change management e treinamento de acordo com 
                a maturidade e necessidades da sua organização.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button size="lg" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Solicitar Proposta
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Agendar Reunião
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
