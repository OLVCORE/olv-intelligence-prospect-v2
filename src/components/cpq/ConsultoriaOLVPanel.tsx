import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InteractiveROICalculator } from "@/components/roi/InteractiveROICalculator";
import { BattleCardViewer } from "@/components/competitive/BattleCardViewer";
import { ValueRealizationDashboard } from "@/components/value/ValueRealizationDashboard";
import { Award, Mail, Phone, ExternalLink } from "lucide-react";

type Props = {
  companyId?: string;
  accountStrategyId?: string;
};

export function ConsultoriaOLVPanel({ companyId, accountStrategyId }: Props) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consultoria de Implementação TOTVS</CardTitle>
              <CardDescription>Diagnóstico, mapeamento e consultoria focada na implementação</CardDescription>
            </div>
          </div>
          
          {/* Botão Premium em destaque */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-semibold text-lg">Consultoria Premium OLV</h4>
                  <p className="text-sm text-muted-foreground">
                    Supply Chain, Comex, Expansão Global e Logística
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 shadow-lg"
                onClick={() => navigate('/consultoria-olv')}
              >
                <ExternalLink className="h-5 w-5" />
                Acessar Consultoria Premium
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="cpq" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="roi">ROI</TabsTrigger>
            <TabsTrigger value="cpq">Implementação</TabsTrigger>
            <TabsTrigger value="scenarios">Cenários</TabsTrigger>
            <TabsTrigger value="proposals">Propostas</TabsTrigger>
            <TabsTrigger value="competitive">Competitivo</TabsTrigger>
            <TabsTrigger value="value">Valor</TabsTrigger>
          </TabsList>

          <TabsContent value="roi" className="space-y-4">
            {companyId ? (
              <InteractiveROICalculator companyId={companyId} accountStrategyId={accountStrategyId} initialData={{}} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Selecione uma empresa</CardTitle>
                  <CardDescription>Para calcular ROI OLV, selecione uma empresa no topo.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cpq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consultoria de Implementação</CardTitle>
                <CardDescription>
                  Configure os serviços de diagnóstico, mapeamento e consultoria para o projeto TOTVS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use o seletor detalhado na aba ROI para configurar todos os custos de consultoria de implementação.
                </p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/consultoria-olv')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Para consultoria estratégica premium (Supply Chain, Comex, Expansão Global), 
                  acesse a página dedicada
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geração de Cenários</CardTitle>
                <CardDescription>Monte cenários Básico/Padrão/Premium com diferentes escopos e margens.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Use o simulador na aba CPQ para criar variações e exporte para proposta.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Proposta Comercial OLV</CardTitle>
                <CardDescription>Gere uma proposta com escopo, equipe, cronograma e investimentos detalhados.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <Button className="gap-2"><Award className="h-4 w-4"/>Gerar Proposta OLV</Button>
                  <Button variant="outline" className="gap-2"><Mail className="h-4 w-4"/>Enviar por E-mail</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Integração com gerador visual pode ser ativada posteriormente.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-4">
            <BattleCardViewer />
          </TabsContent>

          <TabsContent value="value" className="space-y-4">
            {companyId ? (
              <ValueRealizationDashboard companyId={companyId} accountStrategyId={accountStrategyId} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Tracking de Valor</CardTitle>
                  <CardDescription>Selecione uma empresa para iniciar o acompanhamento.</CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Award className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Pacotes Customizados</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Combine diagnóstico, PMO, change management, treinamento e plataformas OLV de acordo com a maturidade e necessidade.
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
