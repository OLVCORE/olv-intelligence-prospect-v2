import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Trash2, Plus } from "lucide-react";
import { useState } from "react";

export interface OLVServiceItem {
  id: string;
  name: string;
  category: 'supply_chain' | 'comex' | 'expansion' | 'logistics' | 'procurement' | 'mentorship';
  estimatedHours: number;
  hourlyRate: number;
  isCustom?: boolean;
}

interface OLVPremiumServicesSelectorProps {
  selectedServices: OLVServiceItem[];
  onServicesChange: (services: OLVServiceItem[]) => void;
}

const SUPPLY_CHAIN_OPTIONS = [
  { id: 'sc_diagnostico', name: 'Diagnóstico Completo Supply Chain', category: 'supply_chain' as const, hours: 60 },
  { id: 'sc_mapeamento', name: 'Mapeamento Ponta a Ponta', category: 'supply_chain' as const, hours: 45 },
  { id: 'sc_otimizacao', name: 'Otimização de Processos', category: 'supply_chain' as const, hours: 80 },
  { id: 'sc_kpis', name: 'Definição de KPIs e Métricas', category: 'supply_chain' as const, hours: 30 },
  { id: 'sc_fornecedores', name: 'Análise de Fornecedores', category: 'supply_chain' as const, hours: 40 },
  { id: 'sc_implementacao', name: 'Implementação de Melhorias', category: 'supply_chain' as const, hours: 100 },
];

const COMEX_OPTIONS = [
  { id: 'comex_iniciacao', name: 'Iniciação em Comércio Exterior', category: 'comex' as const, hours: 25 },
  { id: 'comex_regulatorio', name: 'Análise Regulatória', category: 'comex' as const, hours: 35 },
  { id: 'comex_processos', name: 'Desenho de Processos Import/Export', category: 'comex' as const, hours: 45 },
  { id: 'comex_aduaneiro', name: 'Consultoria Aduaneira', category: 'comex' as const, hours: 40 },
  { id: 'comex_cambio', name: 'Gestão Cambial e Financeira', category: 'comex' as const, hours: 30 },
  { id: 'comex_compliance', name: 'Compliance Internacional', category: 'comex' as const, hours: 50 },
];

const EXPANSION_OPTIONS = [
  { id: 'exp_viabilidade', name: 'Análise de Viabilidade Global', category: 'expansion' as const, hours: 55 },
  { id: 'exp_mercado', name: 'Estudo de Mercado Internacional', category: 'expansion' as const, hours: 70 },
  { id: 'exp_estrategia', name: 'Estratégia de Entrada', category: 'expansion' as const, hours: 60 },
  { id: 'exp_parceiros', name: 'Identificação de Parceiros', category: 'expansion' as const, hours: 40 },
  { id: 'exp_roadmap', name: 'Roadmap de Internacionalização', category: 'expansion' as const, hours: 50 },
  { id: 'exp_due_diligence', name: 'Due Diligence Internacional', category: 'expansion' as const, hours: 80 },
];

const LOGISTICS_OPTIONS = [
  { id: 'log_internacional', name: 'Logística Internacional', category: 'logistics' as const, hours: 90 },
  { id: 'log_modais', name: 'Otimização de Modais', category: 'logistics' as const, hours: 45 },
  { id: 'log_armazenagem', name: 'Gestão de Armazenagem Global', category: 'logistics' as const, hours: 60 },
  { id: 'log_distribuicao', name: 'Rede de Distribuição', category: 'logistics' as const, hours: 70 },
  { id: 'log_tracking', name: 'Sistema de Rastreamento', category: 'logistics' as const, hours: 50 },
  { id: 'log_custos', name: 'Redução de Custos Logísticos', category: 'logistics' as const, hours: 55 },
];

const PROCUREMENT_OPTIONS = [
  { id: 'proc_estrategico', name: 'Procurement Estratégico', category: 'procurement' as const, hours: 80 },
  { id: 'proc_negociacao', name: 'Negociação Estratégica', category: 'procurement' as const, hours: 25 },
  { id: 'proc_categoria', name: 'Gestão por Categoria', category: 'procurement' as const, hours: 60 },
  { id: 'proc_sourcing', name: 'Strategic Sourcing', category: 'procurement' as const, hours: 70 },
  { id: 'proc_contratos', name: 'Gestão de Contratos', category: 'procurement' as const, hours: 45 },
  { id: 'proc_risco', name: 'Gestão de Risco de Fornecedores', category: 'procurement' as const, hours: 50 },
];

const MENTORSHIP_OPTIONS = [
  { id: 'ment_executiva', name: 'Mentoria Executiva', category: 'mentorship' as const, hours: 16 },
  { id: 'ment_supply_chain', name: 'Mentoria Supply Chain', category: 'mentorship' as const, hours: 20 },
  { id: 'ment_procurement', name: 'Mentoria Procurement', category: 'mentorship' as const, hours: 20 },
  { id: 'ment_internacional', name: 'Mentoria Expansão Internacional', category: 'mentorship' as const, hours: 24 },
  { id: 'ment_lideranca', name: 'Mentoria de Liderança', category: 'mentorship' as const, hours: 18 },
  { id: 'ment_transformacao', name: 'Mentoria Transformação Digital', category: 'mentorship' as const, hours: 22 },
];

// Níveis de consultores OLV com taxas horárias
const CONSULTANT_LEVELS = [
  { id: 'senior', name: 'Sênior', rate: 550 },
  { id: 'especialista', name: 'Especialista', rate: 800 },
  { id: 'diretor', name: 'Diretor/Partner', rate: 1250 },
];

export function OLVPremiumServicesSelector({ selectedServices, onServicesChange }: OLVPremiumServicesSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    supply_chain: false,
    comex: false,
    expansion: false,
    logistics: false,
    procurement: false,
    mentorship: false,
  });

  const [customItemName, setCustomItemName] = useState<Record<string, string>>({});
  const [selectedLevel, setSelectedLevel] = useState(CONSULTANT_LEVELS[1].id); // Especialista default

  const currentLevel = CONSULTANT_LEVELS.find(l => l.id === selectedLevel) || CONSULTANT_LEVELS[1];

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(service => service.id === serviceId);
  };

  const toggleService = (serviceId: string, serviceName: string, category: OLVServiceItem['category'], hours: number) => {
    if (isServiceSelected(serviceId)) {
      onServicesChange(selectedServices.filter(service => service.id !== serviceId));
    } else {
      onServicesChange([...selectedServices, { 
        id: serviceId, 
        name: serviceName, 
        category, 
        estimatedHours: hours,
        hourlyRate: currentLevel.rate,
      }]);
    }
  };

  const updateServiceHours = (serviceId: string, hours: number) => {
    onServicesChange(
      selectedServices.map(service =>
        service.id === serviceId ? { ...service, estimatedHours: hours } : service
      )
    );
  };

  const updateServiceRate = (serviceId: string, rate: number) => {
    onServicesChange(
      selectedServices.map(service =>
        service.id === serviceId ? { ...service, hourlyRate: rate } : service
      )
    );
  };

  const removeService = (serviceId: string) => {
    onServicesChange(selectedServices.filter(service => service.id !== serviceId));
  };

  const addCustomService = (category: OLVServiceItem['category']) => {
    const name = customItemName[category]?.trim();
    if (!name) return;

    const customId = `custom_${category}_${Date.now()}`;
    onServicesChange([...selectedServices, { 
      id: customId, 
      name, 
      category, 
      estimatedHours: 40,
      hourlyRate: currentLevel.rate,
      isCustom: true 
    }]);
    setCustomItemName({ ...customItemName, [category]: '' });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTotalByCategory = (category: OLVServiceItem['category']) => {
    return selectedServices
      .filter(service => service.category === category)
      .reduce((sum, service) => sum + (service.estimatedHours * service.hourlyRate), 0);
  };

  const getTotalInvestment = () => {
    return selectedServices.reduce((sum, service) => sum + (service.estimatedHours * service.hourlyRate), 0);
  };

  const getCategoryOptions = (category: OLVServiceItem['category']) => {
    switch (category) {
      case 'supply_chain': return SUPPLY_CHAIN_OPTIONS;
      case 'comex': return COMEX_OPTIONS;
      case 'expansion': return EXPANSION_OPTIONS;
      case 'logistics': return LOGISTICS_OPTIONS;
      case 'procurement': return PROCUREMENT_OPTIONS;
      case 'mentorship': return MENTORSHIP_OPTIONS;
    }
  };

  const getCategoryTitle = (category: OLVServiceItem['category']) => {
    switch (category) {
      case 'supply_chain': return 'Supply Chain Management';
      case 'comex': return 'Comércio Exterior';
      case 'expansion': return 'Expansão Global';
      case 'logistics': return 'Logística Internacional';
      case 'procurement': return 'Procurement Estratégico';
      case 'mentorship': return 'Mentoria Executiva';
    }
  };

  const getCategoryDescription = (category: OLVServiceItem['category']) => {
    switch (category) {
      case 'supply_chain': return 'Otimização e gestão de cadeia de suprimentos';
      case 'comex': return 'Operações de importação e exportação';
      case 'expansion': return 'Estratégias de internacionalização';
      case 'logistics': return 'Gestão logística global e multimodal';
      case 'procurement': return 'Compras estratégicas e gestão de fornecedores';
      case 'mentorship': return 'Acompanhamento estratégico de executivos';
    }
  };

  const renderCategory = (category: OLVServiceItem['category']) => {
    const options = getCategoryOptions(category);
    const selectedInCategory = selectedServices.filter(service => service.category === category);
    const totalCategory = getTotalByCategory(category);

    return (
      <Card key={category}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {getCategoryTitle(category)}
            <span className="text-primary">{formatCurrency(totalCategory)}</span>
          </CardTitle>
          <CardDescription>{getCategoryDescription(category)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={isServiceSelected(option.id)}
                  onCheckedChange={() => toggleService(option.id, option.name, category, option.hours)}
                />
                <Label
                  htmlFor={option.id}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {option.name}
                  <span className="text-xs text-muted-foreground ml-2">({option.hours}h)</span>
                </Label>
              </div>
            ))}
          </div>

          {/* Add Custom Item */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Adicionar serviço customizado..."
              value={customItemName[category] || ''}
              onChange={(e) => setCustomItemName({ ...customItemName, [category]: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCustomService(category);
                }
              }}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => addCustomService(category)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Items with Values */}
          {selectedInCategory.length > 0 && (
            <Collapsible
              open={expandedCategories[category]}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>
                    Serviços selecionados ({selectedInCategory.length})
                  </span>
                  {expandedCategories[category] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {selectedInCategory.map((service) => (
                  <div key={service.id} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{service.name}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeService(service.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Horas</Label>
                        <Input
                          type="number"
                          value={service.estimatedHours}
                          onChange={(e) => updateServiceHours(service.id, Number(e.target.value))}
                          placeholder="0"
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">R$/h</Label>
                        <Input
                          type="number"
                          value={service.hourlyRate}
                          onChange={(e) => updateServiceRate(service.id, Number(e.target.value))}
                          placeholder="0"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total: {formatCurrency(service.estimatedHours * service.hourlyRate)}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Serviços OLV Premium - Composição Detalhada</CardTitle>
          <CardDescription>
            Selecione os serviços de consultoria estratégica especializada
          </CardDescription>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Nível Consultor:</Label>
              <select 
                value={selectedLevel} 
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                {CONSULTANT_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.name} - {formatCurrency(level.rate)}/h
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Investimento Total:</span>{' '}
              <span className="text-2xl font-bold text-primary">{formatCurrency(getTotalInvestment())}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {renderCategory('supply_chain')}
      {renderCategory('comex')}
      {renderCategory('expansion')}
      {renderCategory('logistics')}
      {renderCategory('procurement')}
      {renderCategory('mentorship')}
    </div>
  );
}
