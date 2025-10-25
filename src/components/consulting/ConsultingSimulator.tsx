import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useConsultantRates, useConsultingCatalog } from "@/hooks/useConsultingCatalog";

export function ConsultingSimulator() {
  const { data: services = [] } = useConsultingCatalog();
  const { data: rates = [] } = useConsultantRates();

  const [serviceId, setServiceId] = useState<string>(services[0]?.id || "");
  const [complexity, setComplexity] = useState<number>(3);
  const [duration, setDuration] = useState<"curto" | "medio" | "longo" | "estendido">("medio");
  const [team, setTeam] = useState<"pleno" | "senior" | "equipe" | "estrategica">("equipe");
  const [roiBonus, setRoiBonus] = useState<boolean>(false);
  const [scenarios, setScenarios] = useState<boolean>(true);
  const [competitive, setCompetitive] = useState<boolean>(false);

  const selectedService = useMemo(() => services.find(s => s.id === serviceId) || services[0], [services, serviceId]);

  const plenoRate = rates.find(r => r.level === 'PLENO');
  const seniorRate = rates.find(r => r.level === 'SÊNIOR');

  const durationMonths = useMemo(() => ({ curto: 1.5, medio: 3, longo: 6, estendido: 9 }[duration]), [duration]);
  const teamMultiplier = useMemo(() => ({ pleno: 1, senior: 1.2, equipe: 1.8, estrategica: 2.4 }[team]), [team]);
  const complexityFactor = useMemo(() => 0.8 + 0.2 * complexity, [complexity]);

  const hourlyCost = useMemo(() => {
    const pleno = (plenoRate?.hourly_rate_min || 300 + plenoRate?.hourly_rate_max || 380) / 2;
    const senior = (seniorRate?.hourly_rate_min || 450 + seniorRate?.hourly_rate_max || 520) / 2;
    switch (team) {
      case 'pleno': return pleno;
      case 'senior': return senior;
      case 'equipe': return (pleno + senior) / 2 * 1.1;
      case 'estrategica': return senior * 1.3;
    }
  }, [plenoRate, seniorRate, team]);

  const hoursBase = useMemo(() => {
    const baseline = 40; // horas por mês de referência
    return Math.round(baseline * durationMonths * complexityFactor * teamMultiplier);
  }, [durationMonths, complexityFactor, teamMultiplier]);

  const directCost = Math.round(hoursBase * (hourlyCost || 450));
  const indirect = Math.round(directCost * 0.15);
  const margin = Math.round((directCost + indirect) * 0.25);
  const price = directCost + indirect + margin;
  const bonus = roiBonus ? Math.round(price * 0.1) : 0;

  const premium = Math.round(price * 1.25);
  const basic = Math.round(price * 0.85);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de Proposta (Consultoria)</CardTitle>
        <CardDescription>Estruture valores por horas, complexidade e equipe; gere cenários automaticamente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Serviço</Label>
            <Select value={selectedService?.id} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label>Duração Estimada</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curto">Curto (até 1-2 meses)</SelectItem>
                <SelectItem value="medio">Médio (3 meses)</SelectItem>
                <SelectItem value="longo">Longo (6 meses)</SelectItem>
                <SelectItem value="estendido">Estendido (6-12 meses)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Equipe</Label>
            <Select value={team} onValueChange={(v) => setTeam(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pleno">1 Consultor Pleno</SelectItem>
                <SelectItem value="senior">1 Consultor Sênior</SelectItem>
                <SelectItem value="equipe">Equipe (1 Sênior + 1 Pleno)</SelectItem>
                <SelectItem value="estrategica">Equipe Estratégica (Especialista)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Complexidade: {complexity}</Label>
            <Slider min={1} max={5} step={1} value={[complexity]} onValueChange={(v) => setComplexity(v[0])} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Checkbox id="roi" checked={roiBonus} onCheckedChange={(v) => setRoiBonus(Boolean(v))} />
            <Label htmlFor="roi">Bônus por ROI (10%)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="scn" checked={scenarios} onCheckedChange={(v) => setScenarios(Boolean(v))} />
            <Label htmlFor="scn">Gerar 3 cenários</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="comp" checked={competitive} onCheckedChange={(v) => setCompetitive(Boolean(v))} />
            <Label htmlFor="comp">Análise competitiva</Label>
          </div>
        </div>

        <Separator />

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Horas Base</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{hoursBase}h</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Custo Direto</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">R$ {directCost.toLocaleString('pt-BR')}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Preço Bruto</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">R$ {price.toLocaleString('pt-BR')}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Bônus ROI</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">R$ {bonus.toLocaleString('pt-BR')}</p></CardContent>
          </Card>
        </div>

        {scenarios && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cenário Básico</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">R$ {basic.toLocaleString('pt-BR')}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cenário Padrão</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">R$ {price.toLocaleString('pt-BR')}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cenário Premium</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">R$ {premium.toLocaleString('pt-BR')}</p></CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end">
          <Button>Usar esta configuração na Proposta</Button>
        </div>
      </CardContent>
    </Card>
  );
}
