import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Trash2, Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface CurrentCostItem {
  id: string;
  name: string;
  category: 'software' | 'personnel' | 'maintenance' | 'consulting';
  cost: number;
  isCustom?: boolean;
}

interface CurrentCostsSelectorProps {
  selectedCosts: CurrentCostItem[];
  onCostsChange: (costs: CurrentCostItem[]) => void;
  onSaveCost?: () => Promise<void>;
}

const SOFTWARE_OPTIONS = [
  { id: 'erp_legacy', name: 'ERP Legado', category: 'software' as const },
  { id: 'crm_atual', name: 'CRM Atual', category: 'software' as const },
  { id: 'bi_analytics', name: 'BI/Analytics', category: 'software' as const },
  { id: 'sistema_financeiro', name: 'Sistema Financeiro', category: 'software' as const },
  { id: 'sistema_rh', name: 'Sistema de RH', category: 'software' as const },
  { id: 'sistema_estoque', name: 'Sistema de Estoque', category: 'software' as const },
  { id: 'sistema_producao', name: 'Sistema de Produção', category: 'software' as const },
  { id: 'planilhas_excel', name: 'Planilhas Excel', category: 'software' as const },
  { id: 'email_marketing', name: 'Email Marketing', category: 'software' as const },
  { id: 'sistema_vendas', name: 'Sistema de Vendas', category: 'software' as const },
];

const PERSONNEL_OPTIONS = [
  { id: 'analista_ti', name: 'Analista de TI', category: 'personnel' as const },
  { id: 'desenvolvedor', name: 'Desenvolvedor', category: 'personnel' as const },
  { id: 'suporte_tecnico', name: 'Suporte Técnico', category: 'personnel' as const },
  { id: 'analista_dados', name: 'Analista de Dados', category: 'personnel' as const },
  { id: 'analista_processos', name: 'Analista de Processos', category: 'personnel' as const },
  { id: 'coordenador_ti', name: 'Coordenador de TI', category: 'personnel' as const },
  { id: 'operador_manual', name: 'Operador de Processos Manuais', category: 'personnel' as const },
  { id: 'digitador', name: 'Digitador', category: 'personnel' as const },
];

const MAINTENANCE_OPTIONS = [
  { id: 'manutencao_software', name: 'Manutenção de Software', category: 'maintenance' as const },
  { id: 'suporte_tecnico', name: 'Suporte Técnico', category: 'maintenance' as const },
  { id: 'infraestrutura', name: 'Infraestrutura de TI', category: 'maintenance' as const },
  { id: 'licencas_anuais', name: 'Licenças Anuais', category: 'maintenance' as const },
  { id: 'atualizacoes', name: 'Atualizações de Sistema', category: 'maintenance' as const },
  { id: 'backup_storage', name: 'Backup e Storage', category: 'maintenance' as const },
];

const CONSULTING_OPTIONS = [
  { id: 'cons_ext_diagnostico', name: 'Diagnóstico Empresarial Externo', category: 'consulting' as const },
  { id: 'cons_ext_operacional', name: 'Consultoria Operacional Externa', category: 'consulting' as const },
  { id: 'cons_ext_estrategica', name: 'Consultoria Estratégica Externa', category: 'consulting' as const },
  { id: 'cons_ext_tecnologia', name: 'Consultoria de TI Externa', category: 'consulting' as const },
  { id: 'cons_ext_compliance', name: 'Compliance e Auditoria Externa', category: 'consulting' as const },
  { id: 'cons_ext_capacitacao', name: 'Treinamento e Capacitação Externa', category: 'consulting' as const },
  { id: 'cons_ext_implantacao', name: 'Implantação de Sistemas Externa', category: 'consulting' as const },
  { id: 'cons_ext_desenvolvimento', name: 'Desenvolvimento Customizado Externo', category: 'consulting' as const },
];

export function CurrentCostsSelector({ selectedCosts, onCostsChange, onSaveCost }: CurrentCostsSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    software: false,
    personnel: false,
    maintenance: false,
    consulting: false,
  });

  const [customItemName, setCustomItemName] = useState<Record<string, string>>({});

  const isCostSelected = (costId: string) => {
    return selectedCosts.some(cost => cost.id === costId);
  };

  const toggleCost = async (costId: string, costName: string, category: CurrentCostItem['category']) => {
    if (isCostSelected(costId)) {
      onCostsChange(selectedCosts.filter(cost => cost.id !== costId));
    } else {
      onCostsChange([...selectedCosts, { id: costId, name: costName, category, cost: 0 }]);
      // Expandir automaticamente a categoria para mostrar o item adicionado
      setExpandedCategories(prev => ({ ...prev, [category]: true }));
      if (onSaveCost) {
        await onSaveCost();
        toast.success(`${costName} adicionado e salvo`);
      }
    }
  };

  const updateCost = (costId: string, value: number) => {
    onCostsChange(
      selectedCosts.map(cost =>
        cost.id === costId ? { ...cost, cost: value } : cost
      )
    );
  };

  const removeCost = (costId: string) => {
    onCostsChange(selectedCosts.filter(cost => cost.id !== costId));
  };

  const addCustomCost = async (category: CurrentCostItem['category']) => {
    const name = customItemName[category]?.trim();
    if (!name) return;

    const customId = `custom_${category}_${Date.now()}`;
    onCostsChange([...selectedCosts, { 
      id: customId, 
      name, 
      category, 
      cost: 0,
      isCustom: true 
    }]);
    setCustomItemName({ ...customItemName, [category]: '' });
    // Expandir automaticamente a categoria para mostrar o item customizado
    setExpandedCategories(prev => ({ ...prev, [category]: true }));
    if (onSaveCost) {
      await onSaveCost();
      toast.success(`${name} adicionado e salvo`);
    }
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

  const getTotalByCategory = (category: CurrentCostItem['category']) => {
    return selectedCosts
      .filter(cost => cost.category === category)
      .reduce((sum, cost) => sum + cost.cost, 0);
  };

  const getTotalCosts = () => {
    return selectedCosts.reduce((sum, cost) => sum + cost.cost, 0);
  };

  const getCategoryOptions = (category: CurrentCostItem['category']) => {
    switch (category) {
      case 'software': return SOFTWARE_OPTIONS;
      case 'personnel': return PERSONNEL_OPTIONS;
      case 'maintenance': return MAINTENANCE_OPTIONS;
      case 'consulting': return CONSULTING_OPTIONS;
    }
  };

  const getCategoryTitle = (category: CurrentCostItem['category']) => {
    switch (category) {
      case 'software': return 'Software Atual';
      case 'personnel': return 'Custos de Pessoal';
      case 'maintenance': return 'Manutenção';
      case 'consulting': return 'Consultoria Externa Atual';
    }
  };

  const getCategoryDescription = (category: CurrentCostItem['category']) => {
    switch (category) {
      case 'software': return 'Sistemas e ferramentas que você utiliza atualmente';
      case 'personnel': return 'Custos com pessoal em processos manuais';
      case 'maintenance': return 'Custos de manutenção e suporte técnico';
      case 'consulting': return 'Consultorias externas e outsourcing que você já contrata';
    }
  };

  const renderCategory = (category: CurrentCostItem['category']) => {
    const options = getCategoryOptions(category);
    const selectedInCategory = selectedCosts.filter(cost => cost.category === category);
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={isCostSelected(option.id)}
                  onCheckedChange={() => toggleCost(option.id, option.name, category)}
                />
                <Label
                  htmlFor={option.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.name}
                </Label>
              </div>
            ))}
          </div>

          {/* Add Custom Item */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Adicionar item customizado..."
              value={customItemName[category] || ''}
              onChange={(e) => setCustomItemName({ ...customItemName, [category]: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCustomCost(category);
                }
              }}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => addCustomCost(category)}
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
                    Itens selecionados ({selectedInCategory.length})
                  </span>
                  {expandedCategories[category] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {selectedInCategory.map((cost) => (
                  <div key={cost.id} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{cost.name}</Label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={async () => {
                            if (onSaveCost) {
                              await onSaveCost();
                              toast.success('Item salvo');
                            }
                          }}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeCost(cost.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">Custo Mensal (R$)</Label>
                      <Input
                        type="number"
                        value={cost.cost || 0}
                        onChange={(e) => updateCost(cost.id, Number(e.target.value))}
                        placeholder="0"
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        = {formatCurrency(cost.cost)}
                      </span>
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
          <CardTitle>Custos Atuais - Composição Detalhada</CardTitle>
          <CardDescription>
            Selecione e configure os custos detalhados de sua operação atual
          </CardDescription>
          <div className="pt-2 text-sm">
            <span className="font-semibold">Total Geral:</span>{' '}
            <span className="text-2xl font-bold text-primary">{formatCurrency(getTotalCosts())}</span>
          </div>
        </CardHeader>
      </Card>

      {renderCategory('software')}
      {renderCategory('personnel')}
      {renderCategory('maintenance')}
      {renderCategory('consulting')}
    </div>
  );
}
