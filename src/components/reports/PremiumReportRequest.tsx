import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, ShieldCheck, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PremiumReportRequestProps {
  companyId: string;
  companyName: string;
  cnpj: string;
}

export function PremiumReportRequest({ companyId, companyName, cnpj }: PremiumReportRequestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const premiumFeatures = [
    { icon: ShieldCheck, title: 'Score de Crédito Serasa', description: 'Pontuação 0-1000 + Classificação de Risco' },
    { icon: AlertTriangle, title: 'Negativações Completas', description: 'Protestos, Ações, Cheques sem Fundo, Falências' },
    { icon: TrendingUp, title: 'Histórico de Pagamentos', description: 'Análise de pontualidade e inadimplência' },
    { icon: FileText, title: 'Indicadores de Dívida', description: 'Dívida total, vencida e relação dívida/receita' },
  ];

  const handleRequestPremium = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-premium-report', {
        body: { company_id: companyId, cnpj }
      });

      if (error) throw error;

      toast({
        title: "Relatório Premium Gerado!",
        description: `Análise Serasa completa para ${companyName}`,
      });

      // Recarregar página para mostrar novo relatório
      window.location.reload();
    } catch (error: any) {
      console.error('Error generating premium report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Relatório Premium Serasa
            </CardTitle>
            <CardDescription>
              Análise financeira completa com dados oficiais Serasa Experian
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Sob Demanda
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!showPreview ? (
          <Button
            onClick={() => setShowPreview(true)}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Ver Detalhes do Relatório Premium
          </Button>
        ) : (
          <>
            <Alert className="border-primary/30 bg-primary/5">
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">O que está incluído:</p>
                  <div className="grid gap-2 mt-2">
                    {premiumFeatures.map((feature) => (
                      <div key={feature.title} className="flex items-start gap-2">
                        <feature.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-xs">{feature.title}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertDescription className="text-sm">
                <p className="font-semibold text-yellow-600 dark:text-yellow-500">Investimento:</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs">• Custo Serasa: <span className="font-mono">R$ 30-50</span></p>
                  <p className="text-xs">• Preço sugerido cliente: <span className="font-mono font-semibold">R$ 200-300</span></p>
                  <p className="text-xs text-green-600 dark:text-green-500">• Margem: <span className="font-semibold">R$ 150-250</span> por relatório</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRequestPremium}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Relatório Premium
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Modo Demonstração: Dados simulados até integração Serasa
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
