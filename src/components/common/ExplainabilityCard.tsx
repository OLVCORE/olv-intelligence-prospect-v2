import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Database, Brain, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DataSource {
  name: string;
  description: string;
}

interface Criterion {
  name: string;
  weight?: string;
  description: string;
}

interface ExplainabilityCardProps {
  title: string;
  description: string;
  analysisType: string;
  dataSources: DataSource[];
  criteria: Criterion[];
  methodology?: string;
  interpretation?: string;
}

export function ExplainabilityCard({
  title,
  description,
  analysisType,
  dataSources,
  criteria,
  methodology,
  interpretation,
}: ExplainabilityCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {title}
              <Badge variant="secondary">{analysisType}</Badge>
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {/* Fontes de Dados */}
          <AccordionItem value="data-sources">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="font-semibold">Fontes de Dados Utilizadas</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {dataSources.map((source, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-muted-foreground">{source.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Critérios de Análise */}
          <AccordionItem value="criteria">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-semibold">Critérios de Análise</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {criteria.map((criterion, idx) => (
                  <div key={idx} className="border-l-2 border-primary/30 pl-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{criterion.name}</p>
                      {criterion.weight && (
                        <Badge variant="outline" className="text-xs">
                          Peso: {criterion.weight}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{criterion.description}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Metodologia */}
          {methodology && (
            <AccordionItem value="methodology">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Metodologia de Cálculo</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground pt-2">{methodology}</p>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Interpretação */}
          {interpretation && (
            <AccordionItem value="interpretation">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Como Interpretar os Resultados</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground pt-2">{interpretation}</p>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Footer */}
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>
            <strong>Transparência Total:</strong> Todos os dados são verificáveis e os
            cálculos seguem metodologias auditáveis. Nenhum dado é inventado ou estimado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
