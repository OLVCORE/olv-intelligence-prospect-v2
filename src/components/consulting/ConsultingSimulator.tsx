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
import { Calculator, TrendingUp, Settings, DollarSign, Users, Briefcase, MapPin, Percent, AlertTriangle, Plus, X } from "lucide-react";

// Serviços detalhados conforme documento
const SERVICES = [
  { 
    id: "diagnostico_completo", 
    name: "Diagnóstico Empresarial Completo",
    description: "Análise de processos, finanças, mercado, operações e RH",
    hoursMin: 40, 
    hoursMax: 80,
    level: "pleno-senior"
  },
  { 
    id: "otimizacao_fornecedores", 
    name: "Análise e Otimização de Fornecedores",
    description: "Mapeamento, avaliação de performance e negociação",
    hoursMin: 20, 
    hoursMax: 40,
    level: "pleno-senior"
  },
  { 
    id: "supply_chain_map", 
    name: "Mapeamento e Otimização de Supply Chain",
    description: "Análise ponta a ponta, identificação de ineficiências",
    hoursMin: 30, 
    hoursMax: 60,
    level: "senior-especialista"
  },
  { 
    id: "comex_iniciacao", 
    name: "Consultoria em Comércio Exterior (Iniciação)",
    description: "Suporte para iniciar ou otimizar import/export",
    hoursMin: 15, 
    hoursMax: 35,
    level: "pleno-senior"
  },
  { 
    id: "negociacao_estrategica", 
    name: "Negociação Estratégica com Fornecedores",
    description: "Apoio em rodadas de negociação de alto valor",
    hoursMin: 10, 
    hoursMax: 25,
    level: "senior-especialista"
  },
  { 
    id: "implementacao_processos", 
    name: "Implementação de Processos (Procurement/Logística)",
    description: "Implementação prática com treinamento de equipe",
    hoursMin: 50, 
    hoursMax: 120,
    level: "pleno-senior"
  },
  { 
    id: "expansao_global", 
    name: "Análise de Viabilidade de Expansão Global",
    description: "Estudo de mercado internacional e análise regulatória",
    hoursMin: 25, 
    hoursMax: 55,
    level: "senior-especialista"
  },
  { 
    id: "tech_totvs", 
    name: "Consultoria em Tecnologia TOTVS",
    description: "Configuração, customização e treinamento sistemas TOTVS",
    hoursMin: 30, 
    hoursMax: 70,
    level: "pleno-senior"
  },
  { 
    id: "mentoria_executiva", 
    name: "Mentoria Executiva em Supply Chain/Procurement",
    description: "Sessões periódicas de mentoria com lideranças",
    hoursMin: 8, 
    hoursMax: 24,
    level: "especialista-diretor"
  },
  { 
    id: "procurement_estrategico", 
    name: "Procurement Estratégico",
    description: "Gestão estratégica de compras e fornecedores",
    hoursMin: 40, 
    hoursMax: 100,
    level: "senior-especialista"
  },
  { 
    id: "logistica_internacional", 
    name: "Consultoria em Logística Internacional",
    description: "Otimização de cadeia logística global",
    hoursMin: 50, 
    hoursMax: 120,
    level: "senior-especialista"
  },
  { 
    id: "pmo_implantacao", 
    name: "PMO para Implantação de Soluções TOTVS",
    description: "Gestão de projetos de implementação de sistemas",
    hoursMin: 80, 
    hoursMax: 200,
    level: "senior-especialista"
  },
];

// Níveis técnicos com faixas salariais
const CONSULTANT_LEVELS = [
  { id: "estagiario", name: "Estagiário", hourlyMin: 80, hourlyMax: 120 },
  { id: "junior", name: "Júnior", hourlyMin: 150, hourlyMax: 220 },
  { id: "pleno", name: "Pleno", hourlyMin: 280, hourlyMax: 380 },
  { id: "senior", name: "Sênior", hourlyMin: 450, hourlyMax: 600 },
  { id: "especialista", name: "Especialista", hourlyMin: 700, hourlyMax: 900 },
  { id: "diretor", name: "Diretor/Partner", hourlyMin: 1000, hourlyMax: 1500 },
];

// Fatores de complexidade
const COMPLEXITY_FACTORS = [
  { value: 1, label: "Básico", factor: 0.9, description: "Tarefas rotineiras, baixo risco" },
  { value: 2, label: "Moderado", factor: 1.0, description: "Desafio padrão com customização" },
  { value: 3, label: "Complexo", factor: 1.15, description: "Novos processos, múltiplos stakeholders" },
  { value: 4, label: "Muito Complexo", factor: 1.25, description: "Alta inovação e integração de sistemas" },
];

// Fatores de urgência
const URGENCY_FACTORS = [
  { id: "normal", name: "Normal", factor: 1.0 },
  { id: "acelerado", name: "Acelerado (50-70% do tempo)", factor: 1.2 },
  { id: "emergencial", name: "Emergencial (<50% do tempo)", factor: 1.4 },
];

// Fatores de localização
const LOCATION_FACTORS = [
  { id: "local", name: "Local (mesma região)", factor: 1.0 },
  { id: "regional", name: "Regional (dentro do estado)", factor: 1.1 },
  { id: "nacional", name: "Nacional (outros estados)", factor: 1.15 },
  { id: "internacional", name: "Internacional", factor: 1.25 },
];

// Setores do cliente
const CLIENT_SECTORS = [
  { id: "servicos", name: "Serviços (genérico)", factor: 1.0 },
  { id: "manufatura", name: "Manufatura", factor: 1.05 },
  { id: "varejo", name: "Varejo", factor: 1.05 },
  { id: "alimentos", name: "Alimentos & Bebidas", factor: 1.05 },
  { id: "quimico", name: "Químico & Petroquímico", factor: 1.1 },
  { id: "automotivo", name: "Automotivo", factor: 1.1 },
  { id: "textil", name: "Têxtil & Confecções", factor: 1.05 },
  { id: "tecnologia", name: "Tecnologia", factor: 1.05 },
  { id: "agronegocio", name: "Agronegócio", factor: 1.1 },
  { id: "logistica", name: "Logística (Operadores)", factor: 1.15 },
  { id: "comex", name: "Exportação/Importação (core)", factor: 1.2 },
];

// Porte do cliente (faturamento)
const CLIENT_SIZES = [
  { id: "micro", name: "Abaixo de R$ 15M", factor: 0.85 },
  { id: "pequena", name: "R$ 15M - R$ 30M", factor: 0.95 },
  { id: "media", name: "R$ 30M - R$ 100M", factor: 1.0 },
  { id: "media-grande", name: "R$ 100M - R$ 150M", factor: 1.1 },
  { id: "grande", name: "Acima de R$ 150M", factor: 1.25 },
];

// Relacionamento com cliente
const RELATIONSHIP_FACTORS = [
  { id: "novo", name: "Novo Cliente", factor: 1.0 },
  { id: "recorrente", name: "Cliente Recorrente", factor: 0.95 },
  { id: "parceiro", name: "Parceiro Estratégico", factor: 0.9 },
];

// Interface para serviços selecionados
interface SelectedService {
  serviceId: string;
  customHours?: number;
}

interface CustomService {
  id: string;
  name: string;
  hours: number;
}

export function ConsultingSimulator() {
  // ========== SELEÇÃO DE MÚLTIPLOS SERVIÇOS ==========
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  
  // ========== MODELO DE PRECIFICAÇÃO ==========
  const [pricingModel, setPricingModel] = useState<"hourly" | "fixed" | "retainer">("fixed");
  const [retainerMonths, setRetainerMonths] = useState(6);
  
  // ========== CONTEXTO DO PROJETO ==========
  const [complexityValue, setComplexityValue] = useState([2]); // 1-4
  const [urgencyId, setUrgencyId] = useState(URGENCY_FACTORS[0].id);
  const [locationId, setLocationId] = useState(LOCATION_FACTORS[0].id);
  
  // ========== CLIENTE ==========
  const [clientSectorId, setClientSectorId] = useState(CLIENT_SECTORS[0].id);
  const [clientSizeId, setClientSizeId] = useState(CLIENT_SIZES[2].id);
  const [relationshipId, setRelationshipId] = useState(RELATIONSHIP_FACTORS[0].id);
  
  // ========== EQUIPE ==========
  const [consultantLevelId, setConsultantLevelId] = useState(CONSULTANT_LEVELS[2].id);
  const [teamSize, setTeamSize] = useState(2);
  const [customHourlyRate, setCustomHourlyRate] = useState<string>("");
  const [resourceScarcity, setResourceScarcity] = useState(false);
  
  // ========== CUSTOS VARIÁVEIS ==========
  const [includeTravel, setIncludeTravel] = useState(false);
  const [travelDays, setTravelDays] = useState(0);
  const [travelKm, setTravelKm] = useState(0);
  const [flightTickets, setFlightTickets] = useState(0);
  
  const [includeAccommodation, setIncludeAccommodation] = useState(false);
  const [accommodationNights, setAccommodationNights] = useState(0);
  const [accommodationConsultants, setAccommodationConsultants] = useState(1);
  
  const [includeMeals, setIncludeMeals] = useState(false);
  const [mealDays, setMealDays] = useState(0);
  const [mealConsultants, setMealConsultants] = useState(1);
  
  const [additionalMaterials, setAdditionalMaterials] = useState(0);
  const [thirdPartyCosts, setThirdPartyCosts] = useState(0);
  
  // ========== CROSS-SELL / UPSELL ==========
  const [crossSellValue, setCrossSellValue] = useState(0);
  const [upsellValue, setUpsellValue] = useState(0);
  
  // ========== CONFIGURAÇÕES AVANÇADAS ==========
  const [taxRate, setTaxRate] = useState(15);
  const [targetROI, setTargetROI] = useState(500000);
  
  // ========== NOVO SERVIÇO CUSTOMIZADO ==========
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceHours, setNewServiceHours] = useState(0);
  
  // ========== DADOS DERIVADOS ==========
  const selectedComplexity = COMPLEXITY_FACTORS.find(c => c.value === complexityValue[0])!;
  const selectedUrgency = URGENCY_FACTORS.find(u => u.id === urgencyId)!;
  const selectedLocation = LOCATION_FACTORS.find(l => l.id === locationId)!;
  const selectedSector = CLIENT_SECTORS.find(s => s.id === clientSectorId)!;
  const selectedSize = CLIENT_SIZES.find(s => s.id === clientSizeId)!;
  const selectedRelationship = RELATIONSHIP_FACTORS.find(r => r.id === relationshipId)!;
  const selectedLevel = CONSULTANT_LEVELS.find(c => c.id === consultantLevelId)!;

  // ========== FUNÇÕES AUXILIARES ==========
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === serviceId);
      if (exists) {
        return prev.filter(s => s.serviceId !== serviceId);
      } else {
        return [...prev, { serviceId }];
      }
    });
  };

  const updateServiceHours = (serviceId: string, hours: number) => {
    setSelectedServices(prev => 
      prev.map(s => s.serviceId === serviceId ? { ...s, customHours: hours } : s)
    );
  };

  const addCustomService = () => {
    if (newServiceName && newServiceHours > 0) {
      const id = `custom_${Date.now()}`;
      setCustomServices(prev => [...prev, { id, name: newServiceName, hours: newServiceHours }]);
      setNewServiceName("");
      setNewServiceHours(0);
    }
  };

  const removeCustomService = (id: string) => {
    setCustomServices(prev => prev.filter(s => s.id !== id));
  };

  // ========== CÁLCULOS PRINCIPAIS ==========
  const calculations = useMemo(() => {
    // 1. CALCULAR TOTAL DE HORAS
    let totalHours = 0;
    
    // Horas dos serviços padrão selecionados
    selectedServices.forEach(sel => {
      const service = SERVICES.find(s => s.id === sel.serviceId);
      if (service) {
        const hours = sel.customHours || ((service.hoursMin + service.hoursMax) / 2);
        totalHours += hours;
      }
    });
    
    // Horas dos serviços customizados
    customServices.forEach(cs => {
      totalHours += cs.hours;
    });
    
    // Aplicar fator de complexidade
    const estimatedHours = Math.round(totalHours * selectedComplexity.factor);
    
    // 2. TAXA HORÁRIA BASE
    const baseHourlyRate = customHourlyRate 
      ? parseFloat(customHourlyRate)
      : (selectedLevel.hourlyMin + selectedLevel.hourlyMax) / 2;
    
    // 3. APLICAR FATORES DE AJUSTE
    let adjustedRate = baseHourlyRate;
    adjustedRate *= selectedUrgency.factor;
    adjustedRate *= selectedLocation.factor;
    adjustedRate *= selectedSector.factor;
    adjustedRate *= selectedSize.factor;
    adjustedRate *= selectedRelationship.factor;
    if (resourceScarcity) adjustedRate *= 1.1;
    
    // 4. CUSTO BASE DE MÃO DE OBRA
    const laborCost = estimatedHours * adjustedRate * teamSize;
    
    // 5. CUSTOS VARIÁVEIS
    let variableCosts = 0;
    
    if (includeTravel) {
      const kmCost = travelKm * 1.5;
      const tollsCost = travelKm > 200 ? 50 * travelDays : 0;
      const ticketsCost = flightTickets * 800;
      variableCosts += kmCost + tollsCost + ticketsCost;
    }
    
    if (includeAccommodation) {
      variableCosts += accommodationNights * accommodationConsultants * 250;
    }
    
    if (includeMeals) {
      variableCosts += mealDays * mealConsultants * 120;
    }
    
    variableCosts += additionalMaterials + thirdPartyCosts;
    
    // 6. CROSS-SELL E UPSELL
    const crossUpsellTotal = crossSellValue + upsellValue;
    
    // 7. SUBTOTAL DE CUSTOS DIRETOS
    const directCosts = laborCost + variableCosts + crossUpsellTotal;
    
    // 8. IMPOSTOS
    const taxAmount = (directCosts / (1 - taxRate/100)) - directCosts;
    
    // 9. CUSTO TOTAL ANTES DA MARGEM
    const totalCostBeforeMargin = directCosts + taxAmount;
    
    // 10. CÁLCULO DOS 3 CENÁRIOS COM BASE NO MODELO DE PRECIFICAÇÃO
    const scenarios = [
      { name: "Básico", margin: 25, color: "secondary" as const },
      { name: "Padrão", margin: 35, color: "default" as const },
      { name: "Premium", margin: 45, color: "default" as const },
    ].map(scenario => {
      let finalPrice = 0;
      const marginAmount = totalCostBeforeMargin * (scenario.margin / 100);
      const basePrice = totalCostBeforeMargin + marginAmount;
      
      if (pricingModel === "hourly") {
        // Modelo por hora: preço = (custo total + margem) / horas
        finalPrice = basePrice;
        const pricePerHour = finalPrice / (estimatedHours * teamSize);
        return {
          ...scenario,
          marginAmount,
          finalPrice,
          pricePerHour,
          isHourly: true,
          clientGain: targetROI - finalPrice,
          clientROI: targetROI > 0 ? ((targetROI - finalPrice) / finalPrice) * 100 : 0,
          cpq: pricePerHour,
        };
      } else if (pricingModel === "retainer") {
        // Modelo retainer: valor mensal
        finalPrice = basePrice / retainerMonths;
        return {
          ...scenario,
          marginAmount,
          finalPrice: finalPrice * retainerMonths, // Total do contrato
          monthlyPrice: finalPrice,
          isRetainer: true,
          months: retainerMonths,
          clientGain: targetROI - (finalPrice * retainerMonths),
          clientROI: targetROI > 0 ? ((targetROI - (finalPrice * retainerMonths)) / (finalPrice * retainerMonths)) * 100 : 0,
          cpq: basePrice / (estimatedHours * teamSize),
        };
      } else {
        // Modelo projeto fechado (fixed)
        finalPrice = basePrice;
        return {
          ...scenario,
          marginAmount,
          finalPrice,
          isFixed: true,
          clientGain: targetROI - finalPrice,
          clientROI: targetROI > 0 ? ((targetROI - finalPrice) / finalPrice) * 100 : 0,
          cpq: finalPrice / (estimatedHours * teamSize),
        };
      }
    });
    
    return {
      estimatedHours,
      totalServices: selectedServices.length + customServices.length,
      baseHourlyRate,
      adjustedRate,
      laborCost,
      variableCosts,
      crossUpsellTotal,
      directCosts,
      taxAmount,
      taxRate,
      totalCostBeforeMargin,
      scenarios,
    };
  }, [
    selectedServices,
    customServices,
    selectedComplexity,
    selectedUrgency,
    selectedLocation,
    selectedSector,
    selectedSize,
    selectedRelationship,
    customHourlyRate,
    selectedLevel,
    teamSize,
    resourceScarcity,
    includeTravel,
    travelDays,
    travelKm,
    flightTickets,
    includeAccommodation,
    accommodationNights,
    accommodationConsultants,
    includeMeals,
    mealDays,
    mealConsultants,
    additionalMaterials,
    thirdPartyCosts,
    crossSellValue,
    upsellValue,
    taxRate,
    targetROI,
    pricingModel,
    retainerMonths,
  ]);

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Simulador Flexível de Consultoria Especializada</CardTitle>
            <CardDescription>
              Sistema profissional com combinação ilimitada de serviços, cross-selling e múltiplos modelos de precificação
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="context">Contexto</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="costs">Custos</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          {/* ========== ABA 1: SERVIÇOS (MÚLTIPLA SELEÇÃO) ========== */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5" />
                  Seleção de Serviços (Combinação Livre)
                </CardTitle>
                <CardDescription>
                  Selecione quantos serviços desejar. Horas podem ser editadas individualmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {SERVICES.map(service => {
                    const isSelected = selectedServices.some(s => s.serviceId === service.id);
                    const selectedService = selectedServices.find(s => s.serviceId === service.id);
                    const avgHours = (service.hoursMin + service.hoursMax) / 2;
                    const currentHours = selectedService?.customHours || avgHours;

                    return (
                      <div key={service.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={service.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <label htmlFor={service.id} className="font-medium text-sm cursor-pointer">
                              {service.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {service.description}
                            </p>
                          </div>
                          
                          {isSelected && (
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1">
                                <Label className="text-xs">Horas para este serviço</Label>
                                <Input
                                  type="number"
                                  min={service.hoursMin}
                                  max={service.hoursMax * 2}
                                  value={currentHours}
                                  onChange={(e) => updateServiceHours(service.id, parseFloat(e.target.value) || avgHours)}
                                  className="h-8"
                                />
                              </div>
                              <div className="text-xs text-muted-foreground pt-5">
                                Padrão: {service.hoursMin}-{service.hoursMax}h
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Serviços Customizados */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Serviços Customizados/Adicionais</h4>
                  <p className="text-xs text-muted-foreground">
                    Adicione serviços específicos não listados acima (ex: "Workshop de Integração", "Auditoria Fiscal", etc.)
                  </p>

                  {customServices.map(cs => (
                    <div key={cs.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cs.name}</p>
                        <p className="text-xs text-muted-foreground">{cs.hours}h</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomService(cs.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome do serviço customizado"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Horas"
                        min={1}
                        value={newServiceHours || ""}
                        onChange={(e) => setNewServiceHours(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <Button onClick={addCustomService} disabled={!newServiceName || !newServiceHours}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Total de Serviços Selecionados</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedServices.length} padrão + {customServices.length} customizados
                      </p>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {calculations.totalServices}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modelo de Precificação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modelo de Precificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Engajamento</Label>
                  <Select value={pricingModel} onValueChange={(v: any) => setPricingModel(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Projeto Fechado (Escopo Fixo)</SelectItem>
                      <SelectItem value="hourly">Por Hora Trabalhada</SelectItem>
                      <SelectItem value="retainer">Retainer Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pricingModel === "fixed" && "Valor total definido para entregáveis específicos"}
                    {pricingModel === "hourly" && "Cobrado por hora efetivamente trabalhada"}
                    {pricingModel === "retainer" && "Valor fixo mensal com volume de horas/serviços"}
                  </p>
                </div>

                {pricingModel === "retainer" && (
                  <div>
                    <Label>Duração do Contrato (meses)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={retainerMonths}
                      onChange={(e) => setRetainerMonths(parseInt(e.target.value) || 6)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 2: CONTEXTO ========== */}
          <TabsContent value="context" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contexto do Projeto e Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nível de Complexidade do Projeto</Label>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-4">
                      <Slider
                        value={complexityValue}
                        onValueChange={setComplexityValue}
                        min={1}
                        max={4}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="outline">{selectedComplexity.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedComplexity.description} (×{selectedComplexity.factor})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Urgência/Prazo</Label>
                    <Select value={urgencyId} onValueChange={setUrgencyId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {URGENCY_FACTORS.map(urgency => (
                          <SelectItem key={urgency.id} value={urgency.id}>
                            {urgency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Fator: ×{selectedUrgency.factor}</p>
                  </div>

                  <div>
                    <Label>Localização</Label>
                    <Select value={locationId} onValueChange={setLocationId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_FACTORS.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Fator: ×{selectedLocation.factor}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Perfil do Cliente</h4>
                  
                  <div>
                    <Label>Setor</Label>
                    <Select value={clientSectorId} onValueChange={setClientSectorId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_SECTORS.map(sector => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Fator: ×{selectedSector.factor}</p>
                  </div>

                  <div>
                    <Label>Porte (Faturamento)</Label>
                    <Select value={clientSizeId} onValueChange={setClientSizeId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_SIZES.map(size => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Fator: ×{selectedSize.factor}</p>
                  </div>

                  <div>
                    <Label>Relacionamento</Label>
                    <Select value={relationshipId} onValueChange={setRelationshipId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_FACTORS.map(rel => (
                          <SelectItem key={rel.id} value={rel.id}>
                            {rel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Fator: ×{selectedRelationship.factor}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 3: EQUIPE ========== */}
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
                  <Label>Nível de Consultor Predominante</Label>
                  <Select value={consultantLevelId} onValueChange={setConsultantLevelId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSULTANT_LEVELS.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name} (R$ {level.hourlyMin}-{level.hourlyMax}/h)
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
                    placeholder="Deixe vazio para usar taxa padrão"
                    value={customHourlyRate}
                    onChange={(e) => setCustomHourlyRate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa ajustada: {formatCurrency(calculations.adjustedRate)}/h
                  </p>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="scarcity"
                    checked={resourceScarcity}
                    onCheckedChange={(checked) => setResourceScarcity(checked as boolean)}
                  />
                  <div className="flex-1">
                    <label htmlFor="scarcity" className="font-medium text-sm cursor-pointer flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Recursos Escassos (+10%)
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 4: CUSTOS VARIÁVEIS ========== */}
          <TabsContent value="costs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Custos Variáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Deslocamento */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="travel"
                      checked={includeTravel}
                      onCheckedChange={(checked) => setIncludeTravel(checked as boolean)}
                    />
                    <label htmlFor="travel" className="font-medium cursor-pointer">
                      Custos de Deslocamento
                    </label>
                  </div>

                  {includeTravel && (
                    <div className="ml-6 p-3 border rounded-lg bg-muted/30 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Dias</Label>
                          <Input
                            type="number"
                            min={0}
                            value={travelDays}
                            onChange={(e) => setTravelDays(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">KM Total</Label>
                          <Input
                            type="number"
                            min={0}
                            value={travelKm}
                            onChange={(e) => setTravelKm(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Passagens</Label>
                          <Input
                            type="number"
                            min={0}
                            value={flightTickets}
                            onChange={(e) => setFlightTickets(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Hospedagem */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accommodation"
                      checked={includeAccommodation}
                      onCheckedChange={(checked) => setIncludeAccommodation(checked as boolean)}
                    />
                    <label htmlFor="accommodation" className="font-medium cursor-pointer">
                      Hospedagem
                    </label>
                  </div>

                  {includeAccommodation && (
                    <div className="ml-6 p-3 border rounded-lg bg-muted/30 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Noites</Label>
                          <Input
                            type="number"
                            min={0}
                            value={accommodationNights}
                            onChange={(e) => setAccommodationNights(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Consultores</Label>
                          <Input
                            type="number"
                            min={0}
                            max={teamSize}
                            value={accommodationConsultants}
                            onChange={(e) => setAccommodationConsultants(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Alimentação */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meals"
                      checked={includeMeals}
                      onCheckedChange={(checked) => setIncludeMeals(checked as boolean)}
                    />
                    <label htmlFor="meals" className="font-medium cursor-pointer">
                      Alimentação
                    </label>
                  </div>

                  {includeMeals && (
                    <div className="ml-6 p-3 border rounded-lg bg-muted/30 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Dias</Label>
                          <Input
                            type="number"
                            min={0}
                            value={mealDays}
                            onChange={(e) => setMealDays(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Consultores</Label>
                          <Input
                            type="number"
                            min={0}
                            max={teamSize}
                            value={mealConsultants}
                            onChange={(e) => setMealConsultants(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label>Materiais Adicionais (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={additionalMaterials}
                      onChange={(e) => setAdditionalMaterials(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label>Serviços de Terceiros (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={thirdPartyCosts}
                      onChange={(e) => setThirdPartyCosts(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 5: AVANÇADO ========== */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Configurações Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cross-Selling e Upselling */}
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-sm">Cross-Selling e Upselling</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Adicione valores de serviços complementares ou upgrades vendidos durante o projeto
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Cross-Sell (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={crossSellValue}
                        onChange={(e) => setCrossSellValue(parseFloat(e.target.value) || 0)}
                        placeholder="Serviços complementares"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Upsell (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={upsellValue}
                        onChange={(e) => setUpsellValue(parseFloat(e.target.value) || 0)}
                        placeholder="Upgrades/Expansões"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Impostos</h4>
                  </div>
                  <div>
                    <Label>Alíquota Total (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 15)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">ROI do Cliente</h4>
                  </div>
                  <div>
                    <Label>Target de Ganhos Estimados (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={10000}
                      value={targetROI}
                      onChange={(e) => setTargetROI(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 6: RESULTADOS ========== */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo Executivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Serviços</CardDescription>
                      <CardTitle className="text-2xl">{calculations.totalServices}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Horas Total</CardDescription>
                      <CardTitle className="text-2xl">{calculations.estimatedHours}h</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Taxa Ajustada</CardDescription>
                      <CardTitle className="text-xl">{formatCurrency(calculations.adjustedRate)}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Equipe</CardDescription>
                      <CardTitle className="text-2xl">{teamSize}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Modelo</CardDescription>
                      <CardTitle className="text-base">
                        {pricingModel === "fixed" && "Projeto"}
                        {pricingModel === "hourly" && "Por Hora"}
                        {pricingModel === "retainer" && "Retainer"}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Custo de Mão de Obra</span>
                    <span className="font-medium">{formatCurrency(calculations.laborCost)}</span>
                  </div>

                  {calculations.variableCosts > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Custos Variáveis</span>
                      <span className="font-medium">{formatCurrency(calculations.variableCosts)}</span>
                    </div>
                  )}

                  {calculations.crossUpsellTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cross-Sell + Upsell</span>
                      <span className="font-medium text-green-600">{formatCurrency(calculations.crossUpsellTotal)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold">
                    <span className="text-sm">Custos Diretos</span>
                    <span>{formatCurrency(calculations.directCosts)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Impostos ({taxRate}%)</span>
                    <span className="font-medium">{formatCurrency(calculations.taxAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Custo Total (antes margem)</span>
                    <span>{formatCurrency(calculations.totalCostBeforeMargin)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cenários */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Cenários de Precificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {calculations.scenarios.map((scenario, index) => (
                  <Card 
                    key={scenario.name} 
                    className={index === 1 ? "border-primary shadow-lg" : ""}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <Badge variant={scenario.color}>{scenario.margin}%</Badge>
                      </div>
                      <CardDescription className="text-3xl font-bold text-foreground mt-2">
                        {formatCurrency(scenario.finalPrice)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Separator />
                      
                      <div className="space-y-2 text-sm">
                        {'isHourly' in scenario && scenario.isHourly && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Preço/Hora</span>
                            <span className="font-medium">{formatCurrency(scenario.pricePerHour)}/h</span>
                          </div>
                        )}
                        {'isRetainer' in scenario && scenario.isRetainer && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mensal</span>
                              <span className="font-medium">{formatCurrency(scenario.monthlyPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duração</span>
                              <span className="font-medium">{scenario.months} meses</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Margem</span>
                          <span className="font-medium">{formatCurrency(scenario.marginAmount)}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <h5 className="font-semibold">Valor para Cliente</h5>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ganho Estimado</span>
                          <span className="font-medium">{formatCurrency(targetROI)}</span>
                        </div>
                        <div className="flex justify-between text-primary font-bold">
                          <span>ROI</span>
                          <span>+{scenario.clientROI.toFixed(0)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">
                <Briefcase className="h-4 w-4 mr-2" />
                Exportar (PDF)
              </Button>
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Gerar Proposta Comercial
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
