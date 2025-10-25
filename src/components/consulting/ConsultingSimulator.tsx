import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConsultingCatalog, useConsultantRates, ConsultingService } from "@/hooks/useConsultingCatalog";
import { Calculator, TrendingUp } from "lucide-react";

export function ConsultingSimulator() {
  const catalog = useConsultingCatalog();
  const rates = useConsultantRates();

  const [selectedService, setSelectedService] = useState<ConsultingService | null>(null);
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [durationMonths, setDurationMonths] = useState(3);
  const [teamSize, setTeamSize] = useState(2);
  const [targetSavings, setTargetSavings] = useState(500000);
  const [successFeePercent, setSuccessFeePercent] = useState(15);
  const [editablePrice, setEditablePrice] = useState<number | null>(null);

  const estimatedHours = useMemo(() => {
    if (!selectedService) return 0;
    const base = selectedService.estimated_hours_min || 40;
    const max = selectedService.estimated_hours_max || 120;
    const complexityMultiplier = { low: 0.8, medium: 1, high: 1.3 }[complexity];
    return Math.round(((base + max) / 2) * complexityMultiplier * durationMonths);
  }, [selectedService, complexity, durationMonths]);

  const directCost = useMemo(() => {
    if (!rates.data || estimatedHours === 0) return 0;
    const avgRate = rates.data.reduce((sum, r) => sum + Number(r.hourly_rate_min + r.hourly_rate_max) / 2, 0) / rates.data.length;
    return estimatedHours * avgRate * teamSize;
  }, [estimatedHours, rates.data, teamSize]);

  const successFeeValue = useMemo(() => {
    return (targetSavings * successFeePercent) / 100;
  }, [targetSavings, successFeePercent]);

  const basePrice = editablePrice !== null ? editablePrice : directCost;
  const grossPrice = basePrice + successFeeValue;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Simulador de Consultoria OLV</CardTitle>
            <CardDescription>Configure serviço, complexidade, equipe e taxa de sucesso baseada no ganho do cliente</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Label>Serviço</Label>
            <select 
              className="w-full h-10 rounded-md border bg-background px-3" 
              value={selectedService?.id || ''} 
              onChange={e => setSelectedService(catalog.data?.find(s => s.id === e.target.value) || null)}
            >
              <option value="">Selecione um serviço</option>
              {catalog.data?.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Complexidade</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={complexity} onChange={e => setComplexity(e.target.value as any)}>
              <option value="low">Baixa (-20%)</option>
              <option value="medium">Média</option>
              <option value="high">Alta (+30%)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Duração (meses)</Label>
            <Input type="number" min={1} max={24} value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} />
          </div>
          <div>
            <Label>Tamanho da Equipe</Label>
            <Input type="number" min={1} max={10} value={teamSize} onChange={e => setTeamSize(Number(e.target.value))} />
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Taxa de Sucesso (Performance Fee)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Target de Ganhos do Cliente (R$)</Label>
              <Input 
                type="number" 
                min={0} 
                step={10000}
                value={targetSavings} 
                onChange={e => setTargetSavings(Number(e.target.value))} 
                placeholder="Ex: 500.000"
              />
            </div>
            <div>
              <Label>Taxa de Sucesso (%)</Label>
              <Input 
                type="number" 
                min={0} 
                max={50}
                step={1}
                value={successFeePercent} 
                onChange={e => setSuccessFeePercent(Number(e.target.value))} 
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A taxa de sucesso é aplicada sobre o <strong>valor do ganho evidenciado</strong> para o cliente (savings, crescimento, etc.)
          </p>
        </div>

        <div>
          <Label>Preço Base Editável (R$)</Label>
          <Input 
            type="number" 
            min={0}
            step={1000}
            value={editablePrice ?? directCost} 
            onChange={e => setEditablePrice(Number(e.target.value))} 
            placeholder="Deixe em branco para usar custo direto"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Edite o preço base para ajustar a proposta. O custo direto calculado é R$ {directCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Horas Estimadas</CardDescription>
              <CardTitle className="text-2xl">{estimatedHours}h</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Custo Direto</CardDescription>
              <CardTitle className="text-2xl">R$ {directCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Taxa de Sucesso</CardDescription>
              <CardTitle className="text-2xl text-primary">R$ {successFeeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Preço Total</CardDescription>
              <CardTitle className="text-2xl">R$ {grossPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Básico', multiplier: 0.85, variant: 'secondary' as const },
            { label: 'Padrão', multiplier: 1, variant: 'default' as const },
            { label: 'Premium', multiplier: 1.2, variant: 'default' as const }
          ].map(scenario => {
            const scenarioPrice = basePrice * scenario.multiplier;
            const scenarioTotal = scenarioPrice + successFeeValue;
            const clientROI = targetSavings > 0 ? ((targetSavings - scenarioTotal) / scenarioTotal) * 100 : 0;
            return (
              <Card key={scenario.label} className={scenario.variant === 'default' ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {scenario.label}
                    <Badge variant={scenario.variant}>{(scenario.multiplier * 100).toFixed(0)}%</Badge>
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-foreground">
                    R$ {scenarioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ganho Cliente</span>
                    <span className="font-medium">R$ {targetSavings.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ROI Cliente</span>
                    <span className="font-medium text-primary">+{clientROI.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa Sucesso</span>
                    <span className="font-medium">R$ {successFeeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Exportar Simulação</Button>
          <Button>Usar na Proposta</Button>
        </div>
      </CardContent>
    </Card>
  );
}
