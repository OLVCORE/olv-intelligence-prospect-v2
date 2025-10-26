import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertTriangle, Target, TrendingUp, Award, MessageSquare, Save, Eye, ArrowLeft } from "lucide-react";
import { useCompetitors, useBattleCards } from "@/hooks/useCompetitiveIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/export/ExportButton";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";

export function BattleCardViewer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: competitors, isLoading: loadingCompetitors } = useCompetitors();
  const { data: battleCards, isLoading: loadingCards } = useBattleCards();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('competitive_data', JSON.stringify({
        competitors,
        battleCards,
        savedAt: new Date().toISOString(),
      }));
      toast({
        title: "✅ Battle Cards salvos",
        description: "Seus dados foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingCompetitors || loadingCards) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <ScrollToTopButton />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Battle Cards - Inteligência Competitiva
              </CardTitle>
              <CardDescription>
                Estratégias para vencer contra principais competidores
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              {battleCards && battleCards.length > 0 && (
                <>
                  <Button variant="default" size="sm" onClick={handleSaveData} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <ExportButton
                    data={{ competitors, battleCards }}
                    filename="battle_cards"
                    variant="outline"
                    size="sm"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue={competitors?.[0]?.id} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {competitors?.map((comp) => (
            <TabsTrigger key={comp.id} value={comp.id}>
              {comp.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {competitors?.map((competitor) => {
          const card = battleCards?.find((bc) => bc.competitor_id === competitor.id);

          return (
            <TabsContent key={competitor.id} value={competitor.id} className="space-y-4">
              {/* Overview do Competidor */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{competitor.name}</CardTitle>
                    <Badge>{competitor.market_position}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold">Forças</h4>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {competitor.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <h4 className="font-semibold">Fraquezas</h4>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {competitor.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {card && (
                <>
                  {/* Estratégia de Vitória */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5" />
                        Estratégia de Vitória
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{card.win_strategy}</p>
                    </CardContent>
                  </Card>

                  {/* Comparação de Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Comparação de Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-primary flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            TOTVS
                          </h4>
                          <ul className="space-y-1 text-sm">
                            {card.feature_comparison?.totvs?.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2 text-primary">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-muted-foreground">{competitor.name}</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {card.feature_comparison?.competitor?.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tratamento de Objeções */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageSquare className="h-5 w-5" />
                        Tratamento de Objeções
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {card.objection_handling?.map((obj: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-primary pl-4 space-y-2">
                          <div>
                            <span className="text-sm font-semibold text-muted-foreground">Objeção:</span>
                            <p className="text-sm">{obj.objection}</p>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-primary">Resposta:</span>
                            <p className="text-sm">{obj.response}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Proof Points */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Proof Points & Casos de Sucesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {card.proof_points?.map((point: any, idx: number) => (
                          <div key={idx} className="p-3 bg-accent/50 rounded-lg">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-sm">{point.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {point.type}
                              </Badge>
                            </div>
                            {point.result && (
                              <p className="text-sm text-muted-foreground">{point.result}</p>
                            )}
                            {point.quote && (
                              <p className="text-sm italic text-muted-foreground mt-1">"{point.quote}"</p>
                            )}
                            {point.source && (
                              <p className="text-xs text-muted-foreground mt-1">Fonte: {point.source}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vantagens TOTVS */}
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-lg text-primary">Por que escolher TOTVS?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {competitor.totvs_advantages.map((advantage, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2 text-primary font-bold">✓</span>
                            <span className="text-sm">{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
