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
import { Calculator, TrendingUp, Settings, DollarSign, Users, Briefcase, MapPin, Percent, AlertTriangle } from "lucide-react";

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

export function ConsultingSimulator() {
  // ========== SELEÇÕES PRINCIPAIS ==========
  const [selectedServiceId, setSelectedServiceId] = useState(SERVICES[0].id);
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
  
  // ========== CONFIGURAÇÕES AVANÇADAS ==========
  const [taxRate, setTaxRate] = useState(15); // Alíquota efetiva total de impostos
  const [targetROI, setTargetROI] = useState(500000); // Ganho estimado para o cliente
  
  // ========== DADOS DERIVADOS ==========
  const selectedService = SERVICES.find(s => s.id === selectedServiceId)!;
  const selectedComplexity = COMPLEXITY_FACTORS.find(c => c.value === complexityValue[0])!;
  const selectedUrgency = URGENCY_FACTORS.find(u => u.id === urgencyId)!;
  const selectedLocation = LOCATION_FACTORS.find(l => l.id === locationId)!;
  const selectedSector = CLIENT_SECTORS.find(s => s.id === clientSectorId)!;
  const selectedSize = CLIENT_SIZES.find(s => s.id === clientSizeId)!;
  const selectedRelationship = RELATIONSHIP_FACTORS.find(r => r.id === relationshipId)!;
  const selectedLevel = CONSULTANT_LEVELS.find(c => c.id === consultantLevelId)!;

  // ========== CÁLCULOS PRINCIPAIS ==========
  const calculations = useMemo(() => {
    // 1. HORAS ESTIMADAS
    const avgHours = (selectedService.hoursMin + selectedService.hoursMax) / 2;
    const estimatedHours = Math.round(avgHours * selectedComplexity.factor);
    
    // 2. TAXA HORÁRIA BASE
    const baseHourlyRate = customHourlyRate 
      ? parseFloat(customHourlyRate)
      : (selectedLevel.hourlyMin + selectedLevel.hourlyMax) / 2;
    
    // 3. APLICAR FATORES DE AJUSTE NA MÃO DE OBRA
    let adjustedRate = baseHourlyRate;
    adjustedRate *= selectedUrgency.factor;
    adjustedRate *= selectedLocation.factor;
    adjustedRate *= selectedSector.factor;
    adjustedRate *= selectedSize.factor;
    adjustedRate *= selectedRelationship.factor;
    if (resourceScarcity) adjustedRate *= 1.1; // +10% se recursos escassos
    
    // 4. CUSTO BASE DE MÃO DE OBRA
    const laborCost = estimatedHours * adjustedRate * teamSize;
    
    // 5. CUSTOS VARIÁVEIS
    let variableCosts = 0;
    
    // Deslocamento
    if (includeTravel) {
      const kmCost = travelKm * 1.5; // R$ 1,50/km
      const tollsCost = travelKm > 200 ? 50 * travelDays : 0; // Pedágios estimados
      const ticketsCost = flightTickets * 800; // R$ 800 média por passagem
      variableCosts += kmCost + tollsCost + ticketsCost;
    }
    
    // Hospedagem
    if (includeAccommodation) {
      const avgNightCost = 250; // R$ 250/noite média
      variableCosts += accommodationNights * accommodationConsultants * avgNightCost;
    }
    
    // Alimentação
    if (includeMeals) {
      const avgMealCost = 120; // R$ 120/dia por pessoa
      variableCosts += mealDays * mealConsultants * avgMealCost;
    }
    
    // Materiais e terceiros
    variableCosts += additionalMaterials + thirdPartyCosts;
    
    // 6. SUBTOTAL DE CUSTOS DIRETOS
    const directCosts = laborCost + variableCosts;
    
    // 7. IMPOSTOS (aplicados sobre o faturamento)
    // Usando alíquota efetiva simplificada
    const taxAmount = (directCosts / (1 - taxRate/100)) - directCosts;
    
    // 8. CUSTO TOTAL ANTES DA MARGEM
    const totalCostBeforeMargin = directCosts + taxAmount;
    
    // 9. CÁLCULO DOS 3 CENÁRIOS DE MARGEM
    const scenarios = [
      { name: "Básico", margin: 25, color: "secondary" as const },
      { name: "Padrão", margin: 35, color: "default" as const },
      { name: "Premium", margin: 45, color: "default" as const },
    ].map(scenario => {
      const marginAmount = totalCostBeforeMargin * (scenario.margin / 100);
      const finalPrice = totalCostBeforeMargin + marginAmount;
      const clientGain = targetROI - finalPrice;
      const clientROI = targetROI > 0 ? ((clientGain / finalPrice) * 100) : 0;
      const cpq = finalPrice / (estimatedHours * teamSize); // Custo por qualidade (hora/recurso)
      
      return {
        ...scenario,
        marginAmount,
        finalPrice,
        clientGain,
        clientROI,
        cpq,
      };
    });
    
    return {
      estimatedHours,
      baseHourlyRate,
      adjustedRate,
      laborCost,
      variableCosts,
      directCosts,
      taxAmount,
      taxRate,
      totalCostBeforeMargin,
      scenarios,
    };
  }, [
    selectedService,
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
    taxRate,
    targetROI,
  ]);

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Simulador Premium de Consultoria Especializada</CardTitle>
            <CardDescription>
              Sistema profissional de precificação baseado em metodologia estratégica de custos e valor
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="service" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="service">Serviço</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="costs">Custos Variáveis</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          {/* ========== ABA 1: SERVIÇO ========== */}
          <TabsContent value="service" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5" />
                  Definição do Serviço e Contexto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Serviço de Consultoria</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedService.description} | 
                    Estimativa: {selectedService.hoursMin}-{selectedService.hoursMax}h
                  </p>
                </div>

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
                    <Label>Urgência/Prazo de Entrega</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Fator: ×{selectedUrgency.factor}
                    </p>
                  </div>

                  <div>
                    <Label>Localização do Cliente</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Fator: ×{selectedLocation.factor}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Perfil do Cliente</h4>
                  
                  <div>
                    <Label>Setor de Atuação</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Fator de especialização: ×{selectedSector.factor}
                    </p>
                  </div>

                  <div>
                    <Label>Porte do Cliente (Faturamento Anual)</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Fator de porte: ×{selectedSize.factor}
                    </p>
                  </div>

                  <div>
                    <Label>Relacionamento com o Cliente</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Fator de relacionamento: ×{selectedRelationship.factor}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 2: EQUIPE ========== */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Configuração da Equipe e Recursos
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Faixa horária: {formatCurrency(selectedLevel.hourlyMin)} - {formatCurrency(selectedLevel.hourlyMax)}
                  </p>
                </div>

                <div>
                  <Label>Tamanho da Equipe (número de consultores)</Label>
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
                    placeholder="Deixe vazio para usar a taxa padrão do nível"
                    value={customHourlyRate}
                    onChange={(e) => setCustomHourlyRate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa calculada após ajustes: {formatCurrency(calculations.adjustedRate)}/h
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
                      Recursos Escassos/Difíceis de Alocar
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Adiciona +10% ao custo por necessidade de especialistas raros
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 3: CUSTOS VARIÁVEIS ========== */}
          <TabsContent value="costs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Custos Variáveis do Projeto
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
                      Incluir Custos de Deslocamento
                    </label>
                  </div>

                  {includeTravel && (
                    <div className="ml-6 space-y-3 p-3 border rounded-lg bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Dias de Deslocamento</Label>
                          <Input
                            type="number"
                            min={0}
                            value={travelDays}
                            onChange={(e) => setTravelDays(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Distância Total (KM)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={travelKm}
                            onChange={(e) => setTravelKm(parseInt(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">R$ 1,50/km</p>
                        </div>
                        <div>
                          <Label className="text-xs">Passagens Aéreas/Rodoviárias</Label>
                          <Input
                            type="number"
                            min={0}
                            value={flightTickets}
                            onChange={(e) => setFlightTickets(parseInt(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">~R$ 800/passagem</p>
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
                      Incluir Custos de Hospedagem
                    </label>
                  </div>

                  {includeAccommodation && (
                    <div className="ml-6 space-y-3 p-3 border rounded-lg bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Número de Noites</Label>
                          <Input
                            type="number"
                            min={0}
                            value={accommodationNights}
                            onChange={(e) => setAccommodationNights(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Consultores Hospedados</Label>
                          <Input
                            type="number"
                            min={0}
                            max={teamSize}
                            value={accommodationConsultants}
                            onChange={(e) => setAccommodationConsultants(parseInt(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">~R$ 250/noite por pessoa</p>
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
                      Incluir Custos de Alimentação
                    </label>
                  </div>

                  {includeMeals && (
                    <div className="ml-6 space-y-3 p-3 border rounded-lg bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Dias com Alimentação Fora</Label>
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
                          <p className="text-xs text-muted-foreground">~R$ 120/dia por pessoa</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Outros Custos */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Outros Custos Variáveis</h4>
                  
                  <div>
                    <Label>Materiais Adicionais (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={additionalMaterials}
                      onChange={(e) => setAdditionalMaterials(parseFloat(e.target.value) || 0)}
                      placeholder="Impressões, relatórios, licenças temporárias..."
                    />
                  </div>

                  <div>
                    <Label>Serviços de Terceiros/Subcontratações (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={thirdPartyCosts}
                      onChange={(e) => setThirdPartyCosts(parseFloat(e.target.value) || 0)}
                      placeholder="Parceiros especializados, freelancers..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 4: AVANÇADO ========== */}
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
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Impostos e Tributos</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alíquota efetiva total de impostos (ISS + IRPJ + CSLL + PIS/COFINS).
                    Para Lucro Presumido, recomenda-se 15-20%.
                  </p>
                  <div>
                    <Label>Alíquota Total de Impostos (%)</Label>
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
                    <h4 className="font-semibold text-sm">ROI e Valor para o Cliente</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimativa de valor/ganho que o projeto irá gerar para o cliente
                    (economia de custos, aumento de receita, etc.)
                  </p>
                  <div>
                    <Label>Target de Ganhos Estimados do Cliente (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={10000}
                      value={targetROI}
                      onChange={(e) => setTargetROI(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Nota:</strong> Os cálculos finais incluem 3 cenários de margem de lucro 
                    (Básico 25%, Padrão 35%, Premium 45%) aplicados sobre o custo total 
                    (custos diretos + impostos).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ABA 5: RESULTADOS ========== */}
          <TabsContent value="results" className="space-y-6">
            {/* Resumo Executivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo Executivo do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Horas Estimadas</CardDescription>
                      <CardTitle className="text-2xl">{calculations.estimatedHours}h</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Taxa Hora Ajustada</CardDescription>
                      <CardTitle className="text-2xl">{formatCurrency(calculations.adjustedRate)}</CardTitle>
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
                      <CardDescription className="text-xs">Alíquota Impostos</CardDescription>
                      <CardTitle className="text-2xl">{taxRate}%</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <Separator />

                {/* Breakdown de Custos */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm mb-3">Composição de Custos</h4>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Custo de Mão de Obra ({calculations.estimatedHours}h × {formatCurrency(calculations.adjustedRate)}/h × {teamSize})
                    </span>
                    <span className="font-medium">{formatCurrency(calculations.laborCost)}</span>
                  </div>

                  {calculations.variableCosts > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Custos Variáveis (deslocamento, hospedagem, etc.)</span>
                      <span className="font-medium">{formatCurrency(calculations.variableCosts)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-sm">Custos Diretos Totais</span>
                    <span>{formatCurrency(calculations.directCosts)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Impostos e Tributos ({taxRate}%)</span>
                    <span className="font-medium">{formatCurrency(calculations.taxAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Custo Total (antes da Margem)</span>
                    <span>{formatCurrency(calculations.totalCostBeforeMargin)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cenários de Precificação */}
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
                        <Badge variant={scenario.color}>
                          {scenario.margin}% margem
                        </Badge>
                      </div>
                      <CardDescription className="text-3xl font-bold text-foreground mt-2">
                        {formatCurrency(scenario.finalPrice)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Separator />
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo Base</span>
                          <span className="font-medium">{formatCurrency(calculations.totalCostBeforeMargin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Margem ({scenario.margin}%)</span>
                          <span className="font-medium">{formatCurrency(scenario.marginAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Preço Final</span>
                          <span>{formatCurrency(scenario.finalPrice)}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <h5 className="font-semibold">Valor para o Cliente</h5>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ganho Estimado</span>
                          <span className="font-medium">{formatCurrency(targetROI)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Investimento</span>
                          <span className="font-medium">{formatCurrency(scenario.finalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-primary font-bold">
                          <span>ROI Cliente</span>
                          <span>+{scenario.clientROI.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>CPQ (Custo/Qualidade)</span>
                          <span>{formatCurrency(scenario.cpq)}/h/recurso</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Benchmarking */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">Análise Competitiva de Mercado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Referências de mercado (Brasil 2024/2025):</strong>
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground ml-4">
                  <li>• Consultoria Genérica: R$ 5.000 - R$ 50.000</li>
                  <li>• Consultoria Especializada: R$ 15.000 - R$ 200.000+</li>
                  <li>• Taxa Horária Média: R$ 300 - R$ 900/h</li>
                  <li>• Margem Típica do Setor: 25% - 40%</li>
                </ul>
                <p className="text-xs text-muted-foreground italic mt-3">
                  {calculations.scenarios[1].finalPrice > 100000 
                    ? "Sua proposta está na faixa premium de mercado, justificada pela expertise e complexidade do projeto."
                    : calculations.scenarios[1].finalPrice > 50000
                    ? "Sua proposta está na faixa média-alta de mercado para projetos especializados."
                    : "Sua proposta está na faixa competitiva de mercado para projetos de consultoria."
                  }
                </p>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-3">
              <Button variant="outline">
                <Briefcase className="h-4 w-4 mr-2" />
                Exportar Simulação (PDF)
              </Button>
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Gerar Proposta Comercial Completa
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
