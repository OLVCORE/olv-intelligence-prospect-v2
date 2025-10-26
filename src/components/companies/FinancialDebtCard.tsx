import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DollarSign, AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FinancialDebtCardProps {
  rawData: any;
}

export function FinancialDebtCard({ rawData }: FinancialDebtCardProps) {
  const formatCurrency = (value: string | null | undefined) => {
    if (!value) return 'R$ 0,00';
    // Se já está formatado, retorna direto
    if (value.includes('R$')) return value;
    // Tenta converter e formatar
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const parsePercentage = (value: string | null | undefined): number => {
    if (!value) return 0;
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const getSeverityColor = (percentage: number) => {
    if (percentage === 0) return 'text-green-600';
    if (percentage < 5) return 'text-yellow-600';
    if (percentage < 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const percCnpj = parsePercentage(rawData.perc_dividas_cnpj_sobre_faturamento);
  const percTotal = parsePercentage(rawData.perc_dividas_cnpj_socios_sobre_faturamento);

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wallet className="h-5 w-5 text-primary" />
          Financeiro & Dívidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Dados Financeiros */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Dados Financeiros
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/20">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Capital Social</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(rawData.capital_social)}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-background dark:from-green-950/20">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Faturamento Presumido (Matriz+CNPJ)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {rawData.faturamento_presumido_matriz_cnpj || 'N/A'}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-background dark:from-purple-950/20">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Faturamento (Este CNPJ)</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {rawData.faturamento_presumido_este_cnpj || 'N/A'}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Crescimento</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {rawData.crescimento_empresa || 'Estável'}
                    </p>
                  </div>
                </div>
              </div>

              {rawData.recebimentos_governo_federal && (
                <div className="p-4 rounded-lg border bg-gradient-to-br from-indigo-50 to-background dark:from-indigo-950/20">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Recebimentos do Governo Federal</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(rawData.recebimentos_governo_federal)}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Dívidas - Visão Geral */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Análise de Dívidas
              </h3>
              
              {(percCnpj > 0 || percTotal > 0) ? (
                <div className="grid gap-4">
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Dívidas CNPJ / Faturamento</p>
                      <Badge className={getSeverityColor(percCnpj)} variant="outline">
                        {percCnpj.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(percCnpj, 100)} className="h-2" />
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-red-50 to-background dark:from-red-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Dívidas CNPJ + Sócios / Faturamento</p>
                      <Badge className={getSeverityColor(percTotal)} variant="outline">
                        {percTotal.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(percTotal, 100)} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-background dark:from-green-950/20 text-center">
                  <p className="text-green-600 dark:text-green-400 font-semibold">✅ Sem dívidas registradas</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Dívidas Detalhadas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Dívidas Detalhadas</h3>
              
              <div className="space-y-3">
                {[
                  { label: "Total Dívidas CNPJ com a União", value: rawData.total_dividas_cnpj_uniao },
                  { label: "Total Dívidas CNPJ + Sócios com a União", value: rawData.total_dividas_cnpj_socios_uniao },
                  { label: "Dívidas Gerais CNPJ com a União", value: rawData.dividas_gerais_cnpj_uniao },
                  { label: "Dívidas Gerais CNPJ + Sócios com a União", value: rawData.dividas_gerais_cnpj_socios_uniao },
                  { label: "Dívidas CNPJ com o FGTS", value: rawData.dividas_cnpj_fgts },
                  { label: "Dívidas CNPJ + Sócios com o FGTS", value: rawData.dividas_cnpj_socios_fgts },
                  { label: "Dívidas CNPJ com a Previdência", value: rawData.dividas_cnpj_previdencia },
                  { label: "Dívidas CNPJ + Sócios com a Previdência", value: rawData.dividas_cnpj_socios_previdencia },
                ].map((item, idx) => (
                  item.value && (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-sm font-bold font-mono">{formatCurrency(item.value)}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
