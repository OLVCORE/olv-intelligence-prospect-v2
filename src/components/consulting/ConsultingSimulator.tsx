import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, Settings, DollarSign, Clock, Users, Briefcase, Package } from "lucide-react";

// Tipos de serviços OLV
const OLV_SERVICES = [
  { id: "estrategica_comex", name: "Consultoria Estratégica em Comércio Exterior", baseHoursMin: 150, baseHoursMax: 250, complexityFactor: 1.2 },
  { id: "solucoes_operacionais", name: "Soluções Operacionais para Exportação/Importação", baseHoursMin: 120, baseHoursMax: 200, complexityFactor: 1.0 },
  { id: "supply_chain", name: "Gestão de Supply Chain Integrado", baseHoursMin: 200, baseHoursMax: 400, complexityFactor: 1.3 },
  { id: "tech_competitividade", name: "Tecnologia Aplicada à Competitividade", baseHoursMin: 180, baseHoursMax: 320, complexityFactor: 1.25 },
  { id: "compliance", name: "Compliance e Governança em Comex", baseHoursMin: 100, baseHoursMax: 180, complexityFactor: 1.15 },
  { id: "importacao_exclusiva", name: "Importação Exclusiva (Estratégia Diferenciada)", baseHoursMin: 150, baseHoursMax: 250, complexityFactor: 1.2 },
  { id: "reducao_tributaria", name: "Redução Tributária Estruturada em Comex", baseHoursMin: 80, baseHoursMax: 150, complexityFactor: 1.1 },
  { id: "planejamento_logistico", name: "Planejamento Logístico Integrado", baseHoursMin: 120, baseHoursMax: 220, complexityFactor: 1.15 },
  { id: "capacitacao", name: "Capacitação e Formação Técnica", baseHoursMin: 40, baseHoursMax: 80, complexityFactor: 0.9 },
  { id: "diagnostico", name: "Diagnóstico Estratégico Inicial", baseHoursMin: 60, baseHoursMax: 100, complexityFactor: 1.0 },
];

// Setores industriais
const INDUSTRIAL_SECTORS = [
  { id: "agroindustria", name: "Agroindústria", factor: 1.15 },
  { id: "mineracao", name: "Mineração", factor: 1.25 },
  { id: "energia", name: "Energia", factor: 1.2 },
  { id: "petroleo_gas", name: "Petróleo e Gás", factor: 1.3 },
  { id: "metalurgia", name: "Metalurgia", factor: 1.15 },
  { id: "bens_capital", name: "Bens de Capital", factor: 1.1 },
  { id: "maquinas_equipamentos", name: "Máquinas e Equipamentos", factor: 1.1 },
  { id: "manufatura", name: "Manufatura", factor: 1.0 },
  { id: "logistica", name: "Logística Industrial", factor: 1.05 },
  { id: "outro", name: "Outro", factor: 1.0 },
];

// Faixas de faturamento
const REVENUE_RANGES = [
  { id: "15-30", name: "R$ 15M - R$ 30M", factor: 1.0 },
  { id: "30-50", name: "R$ 30M - R$ 50M", factor: 1.05 },
  { id: "50-100", name: "R$ 50M - R$ 100M", factor: 1.15 },
  { id: "100-150", name: "R$ 100M - R$ 150M", factor: 1.25 },
  { id: "150+", name: "Acima de R$ 150M", factor: 1.35 },
];

// Tipos de recursos/consultores
const CONSULTANT_LEVELS = [
  { id: "junior", name: "Consultor Júnior (2-5 anos)", hourlyRateMin: 180, hourlyRateMax: 280 },
  { id: "pleno", name: "Consultor Pleno (5-10 anos)", hourlyRateMin: 290, hourlyRateMax: 400 },
  { id: "senior", name: "Consultor Sênior (10-15 anos)", hourlyRateMin: 410, hourlyRateMax: 550 },
  { id: "especialista", name: "Especialista/Gerente (15+ anos)", hourlyRateMin: 560, hourlyRateMax: 750 },
  { id: "tributario", name: "Especialista Tributário Comex", hourlyRateMin: 450, hourlyRateMax: 650 },
  { id: "compliance_expert", name: "Especialista em Compliance Comex", hourlyRateMin: 480, hourlyRateMax: 680 },
];

// Plataformas OLV
const OLV_PLATFORMS = [
  { id: "stratevo", name: "STRATEVO (Inteligência de Mercado)", monthlyLicense: 3500, setupCost: 15000 },
  { id: "exceltta", name: "EXCELTTA (Gestão de Processos)", monthlyLicense: 2800, setupCost: 12000 },
  { id: "core", name: "OLV CORE (Gestão 360)", monthlyLicense: 5000, setupCost: 25000 },
  { id: "finx", name: "FINX (Gestão Financeira Comex)", monthlyLicense: 4200, setupCost: 18000 },
  { id: "veritus", name: "VERITUS (Compliance)", monthlyLicense: 3800, setupCost: 16000 },
];

export function ConsultingSimulator() {
  // Seleções principais
  const [selectedServiceId, setSelectedServiceId] = useState(OLV_SERVICES[0].id);
  const [industrialSectorId, setIndustrialSectorId] = useState(INDUSTRIAL_SECTORS[0].id);
  const [revenueRangeId, setRevenueRangeId] = useState(REVENUE_RANGES[0].id);
  const [complexity, setComplexity] = useState([3]); // 1-5 slider
  const [durationMonths, setDurationMonths] = useState(3);
  
  // Recursos e equipe
  const [consultantLevelId, setConsultantLevelId] = useState(CONSULTANT_LEVELS[1].id);
  const [teamSize, setTeamSize] = useState(2);
  const [customHourlyRate, setCustomHourlyRate] = useState<string>("");
  
  // Plataformas
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // Custos adicionais
  const [includeImplementation, setIncludeImplementation] = useState(false);
  const [includeTraining, setIncludeTraining] = useState(false);
  const [includePostSupport, setIncludePostSupport] = useState(false);
  const [onsiteDays, setOnsiteDays] = useState(0);
  
  // Taxa de sucesso (Performance Fee)
  const [targetSavings, setTargetSavings] = useState(500000);
  const [successFeePercent, setSuccessFeePercent] = useState(15);
  
  // Custos personalizáveis
  const [customIndirectPercent, setCustomIndirectPercent] = useState(18);
  const [customMarginPercent, setCustomMarginPercent] = useState(30);
  const [customBasePrice, setCustomBasePrice] = useState<string>("");

  // Obter dados selecionados
  const selectedService = OLV_SERVICES.find(s => s.id === selectedServiceId)!;
  const selectedSector = INDUSTRIAL_SECTORS.find(s => s.id === industrialSectorId)!;
  const selectedRevenue = REVENUE_RANGES.find(r => r.id === revenueRangeId)!;
  const selectedConsultant = CONSULTANT_LEVELS.find(c => c.id === consultantLevelId)!;

  // Cálculos do simulador
  const calculations = useMemo(() => {
    // 1. Calcular horas estimadas
    const complexityValue = complexity[0];
    const complexityMultiplier = 0.7 + (complexityValue * 0.15); // 0.7 a 1.45
    const avgBaseHours = (selectedService.baseHoursMin + selectedService.baseHoursMax) / 2;
    const estimatedHours = Math.round(avgBaseHours * complexityMultiplier * durationMonths * selectedService.complexityFactor);

    // 2. Calcular custo hora base
    const avgHourlyRate = customHourlyRate 
      ? parseFloat(customHourlyRate) 
      : (selectedConsultant.hourlyRateMin + selectedConsultant.hourlyRateMax) / 2;
    
    // 3. Aplicar fatores setoriais e de faturamento
    const sectorFactor = selectedSector.factor;
    const revenueFactor = selectedRevenue.factor;
    const adjustedHourlyRate = avgHourlyRate * sectorFactor * revenueFactor;

    // 4. Custo de consultoria
    const consultancyCost = estimatedHours * adjustedHourlyRate * teamSize;

    // 5. Custo de plataformas
    const platformsCost = selectedPlatforms.reduce((total, platformId) => {
      const platform = OLV_PLATFORMS.find(p => p.id === platformId);
      if (!platform) return total;
      const licenseCost = platform.monthlyLicense * durationMonths;
      return total + licenseCost + platform.setupCost;
    }, 0);

    // 6. Custos adicionais (escopo)
    let additionalCosts = 0;
    if (includeImplementation) additionalCosts += consultancyCost * 0.25;
    if (includeTraining) additionalCosts += consultancyCost * 0.15;
    if (includePostSupport) additionalCosts += consultancyCost * 0.20;
    if (onsiteDays > 0) additionalCosts += onsiteDays * 2000; // R$ 2000/dia on-site

    // 7. Subtotal
    const subtotal = consultancyCost + platformsCost + additionalCosts;

    // 8. Custos indiretos
    const indirectCosts = subtotal * (customIndirectPercent / 100);

    // 9. Custo total (sem margem)
    const totalCost = subtotal + indirectCosts;

    // 10. Margem de lucro
    const profitMargin = totalCost * (customMarginPercent / 100);

    // 11. Preço base final
    const basePrice = customBasePrice ? parseFloat(customBasePrice) : (totalCost + profitMargin);

    // 12. Taxa de sucesso
    const successFeeValue = (targetSavings * successFeePercent) / 100;

    // 13. Preço total (com taxa de sucesso)
    const totalPrice = basePrice + successFeeValue;

    // 14. ROI do cliente
    const clientROI = targetSavings > 0 ? ((targetSavings - totalPrice) / totalPrice) * 100 : 0;

    return {
      estimatedHours,
      avgHourlyRate: adjustedHourlyRate,
      consultancyCost,
      platformsCost,
      additionalCosts,
      subtotal,
      indirectCosts,
      totalCost,
      profitMargin,
      basePrice,
      successFeeValue,
      totalPrice,
      clientROI,
    };
  }, [
    selectedService,
    complexity,
    durationMonths,
    customHourlyRate,
    selectedConsultant,
    selectedSector,
    selectedRevenue,
    teamSize,
    selectedPlatforms,
    includeImplementation,
    includeTraining,
    includePostSupport,
    onsiteDays,
    customIndirectPercent,
    customMarginPercent,
    customBasePrice,
    targetSavings,
    successFeePercent,
  ]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Simulador Premium de Precificação OLV</CardTitle>
            <CardDescription>
              Simulador estratégico profissional para consultoria especializada em Comércio Exterior e Supply Chain
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="service" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="service">Serviço</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          {/* Aba 1: Serviço */}
          <TabsContent value="service" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5" />
                  Definição do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Serviço OLV Especializado</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OLV_SERVICES.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Setor Industrial do Cliente</Label>
                    <Select value={industrialSectorId} onValueChange={setIndustrialSectorId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIAL_SECTORS.map(sector => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name} (×{sector.factor})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Faturamento Anual do Cliente</Label>
                    <Select value={revenueRangeId} onValueChange={setRevenueRangeId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REVENUE_RANGES.map(range => (
                          <SelectItem key={range.id} value={range.id}>
                            {range.name} (×{range.factor})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Complexidade da Operação de Comex</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-sm text-muted-foreground">Baixa</span>
                    <Slider
                      value={complexity}
                      onValueChange={setComplexity}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">Alta</span>
                    <Badge variant="outline">{complexity[0]}/5</Badge>
                  </div>
                </div>

                <div>
                  <Label>Duração Estimada do Projeto (meses)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 2: Equipe */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Configuração da Equipe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nível de Consultor</Label>
                  <Select value={consultantLevelId} onValueChange={setConsultantLevelId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSULTANT_LEVELS.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name} (R$ {level.hourlyRateMin}-{level.hourlyRateMax}/h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tamanho da Equipe</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <Label>Taxa Horária Customizada (opcional)</Label>
                  <Input
                    type="number"
                    placeholder="Deixe vazio para usar a taxa padrão"
                    value={customHourlyRate}
                    onChange={(e) => setCustomHourlyRate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa padrão calculada: R$ {calculations.avgHourlyRate.toFixed(2)}/h
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Escopo Adicional</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="implementation"
                      checked={includeImplementation}
                      onCheckedChange={(checked) => setIncludeImplementation(checked as boolean)}
                    />
                    <label htmlFor="implementation" className="text-sm cursor-pointer">
                      Implementação Operacional Completa (+25%)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="training"
                      checked={includeTraining}
                      onCheckedChange={(checked) => setIncludeTraining(checked as boolean)}
                    />
                    <label htmlFor="training" className="text-sm cursor-pointer">
                      Treinamento Aprofundado de Equipe (+15%)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="support"
                      checked={includePostSupport}
                      onCheckedChange={(checked) => setIncludePostSupport(checked as boolean)}
                    />
                    <label htmlFor="support" className="text-sm cursor-pointer">
                      Acompanhamento Pós-Projeto 3 meses (+20%)
                    </label>
                  </div>

                  <div>
                    <Label>Dias On-site por Mês (R$ 2.000/dia)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={onsiteDays}
                      onChange={(e) => setOnsiteDays(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 3: Plataformas */}
          <TabsContent value="platforms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Plataformas OLV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {OLV_PLATFORMS.map(platform => (
                  <div key={platform.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={platform.id} className="font-medium text-sm cursor-pointer">
                        {platform.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Licença: R$ {platform.monthlyLicense.toLocaleString('pt-BR')}/mês | 
                        Setup: R$ {platform.setupCost.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 4: Avançado */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Configurações Avançadas de Precificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Taxa de Sucesso (Performance Fee)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    A taxa de sucesso é aplicada sobre o <strong>valor do ganho evidenciado</strong> para o cliente 
                    (savings, crescimento, redução de custos, etc.)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Target de Ganhos do Cliente (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={10000}
                        value={targetSavings}
                        onChange={(e) => setTargetSavings(parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => setSuccessFeePercent(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Custos Indiretos (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      step={1}
                      value={customIndirectPercent}
                      onChange={(e) => setCustomIndirectPercent(parseFloat(e.target.value) || 18)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Padrão OLV: 18%</p>
                  </div>

                  <div>
                    <Label>Margem de Lucro (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={customMarginPercent}
                      onChange={(e) => setCustomMarginPercent(parseFloat(e.target.value) || 30)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Padrão OLV: 30%</p>
                  </div>
                </div>

                <div>
                  <Label>Preço Base Customizado (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Deixe vazio para usar o cálculo automático"
                    value={customBasePrice}
                    onChange={(e) => setCustomBasePrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Preço base calculado: R$ {calculations.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba 5: Resultados */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Breakdown de Custos e Precificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Horas Estimadas</CardDescription>
                      <CardTitle className="text-xl">{calculations.estimatedHours}h</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Taxa Hora Ajustada</CardDescription>
                      <CardTitle className="text-xl">R$ {calculations.avgHourlyRate.toFixed(0)}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Equipe</CardDescription>
                      <CardTitle className="text-xl">{teamSize} consultor(es)</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Plataformas</CardDescription>
                      <CardTitle className="text-xl">{selectedPlatforms.length}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Custo de Consultoria</span>
                    <span className="font-medium">R$ {calculations.consultancyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {calculations.platformsCost > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Custo de Plataformas</span>
                      <span className="font-medium">R$ {calculations.platformsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {calculations.additionalCosts > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Custos Adicionais (Escopo)</span>
                      <span className="font-medium">R$ {calculations.additionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-medium">R$ {calculations.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Custos Indiretos ({customIndirectPercent}%)</span>
                    <span className="font-medium">R$ {calculations.indirectCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Margem de Lucro ({customMarginPercent}%)</span>
                    <span className="font-medium">R$ {calculations.profitMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Preço Base</span>
                    <span>R$ {calculations.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-primary">
                    <span className="font-medium">Taxa de Sucesso ({successFeePercent}%)</span>
                    <span className="font-bold">R$ {calculations.successFeeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>PREÇO TOTAL</span>
                    <span className="text-primary">R$ {calculations.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Retorno para o Cliente</h4>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ganho Estimado</span>
                    <span className="font-medium">R$ {targetSavings.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Investimento Total</span>
                    <span className="font-medium">R$ {calculations.totalPrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span className="font-medium">ROI do Cliente</span>
                    <span className="font-bold text-lg">+{calculations.clientROI.toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cenários */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Básico', multiplier: 0.85, variant: 'secondary' as const },
                { label: 'Padrão', multiplier: 1, variant: 'default' as const },
                { label: 'Premium', multiplier: 1.2, variant: 'default' as const }
              ].map(scenario => {
                const scenarioBase = calculations.basePrice * scenario.multiplier;
                const scenarioTotal = scenarioBase + calculations.successFeeValue;
                const scenarioROI = targetSavings > 0 ? ((targetSavings - scenarioTotal) / scenarioTotal) * 100 : 0;
                
                return (
                  <Card key={scenario.label} className={scenario.variant === 'default' && scenario.multiplier === 1 ? 'border-primary shadow-lg' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{scenario.label}</CardTitle>
                        <Badge variant={scenario.variant}>{(scenario.multiplier * 100).toFixed(0)}%</Badge>
                      </div>
                      <CardDescription className="text-2xl font-bold text-foreground">
                        R$ {scenarioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base</span>
                        <span className="font-medium">R$ {scenarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa Sucesso</span>
                        <span className="font-medium">R$ {calculations.successFeeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ganho Cliente</span>
                        <span className="font-medium">R$ {targetSavings.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-primary">
                        <span>ROI Cliente</span>
                        <span>+{scenarioROI.toFixed(0)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Exportar Simulação
              </Button>
              <Button>
                <Briefcase className="h-4 w-4 mr-2" />
                Gerar Proposta Comercial
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
