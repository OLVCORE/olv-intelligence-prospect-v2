import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Trash2, Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface TOTVSCostItem {
  id: string;
  name: string;
  category: 'implementation' | 'training' | 'consulting' | 'infrastructure' | 'support';
  cost: number;
  isCustom?: boolean;
}

interface TOTVSCostsSelectorProps {
  selectedCosts: TOTVSCostItem[];
  onCostsChange: (costs: TOTVSCostItem[]) => void;
  onSaveCost?: () => Promise<void>;
}

const IMPLEMENTATION_OPTIONS = [
  { id: 'imp_analise_requisitos', name: 'Análise de Requisitos', category: 'implementation' as const },
  { id: 'imp_parametrizacao', name: 'Parametrização de Sistema', category: 'implementation' as const },
  { id: 'imp_customizacao', name: 'Customização', category: 'implementation' as const },
  { id: 'imp_migracao_dados', name: 'Migração de Dados', category: 'implementation' as const },
  { id: 'imp_integracao', name: 'Integração com Sistemas', category: 'implementation' as const },
  { id: 'imp_testes', name: 'Testes e Validação', category: 'implementation' as const },
  { id: 'imp_go_live', name: 'Go-Live e Acompanhamento', category: 'implementation' as const },
  { id: 'imp_documentacao', name: 'Documentação', category: 'implementation' as const },
];

const TRAINING_OPTIONS = [
  { id: 'train_usuario_final', name: 'Treinamento Usuário Final', category: 'training' as const },
  { id: 'train_key_users', name: 'Treinamento Key Users', category: 'training' as const },
  { id: 'train_gestores', name: 'Treinamento Gestores', category: 'training' as const },
  { id: 'train_ti', name: 'Treinamento Equipe TI', category: 'training' as const },
  { id: 'train_avancado', name: 'Treinamento Avançado', category: 'training' as const },
  { id: 'train_material', name: 'Material Didático', category: 'training' as const },
];

const CONSULTING_OPTIONS = [
  { id: 'cons_impl_diagnostico', name: 'Diagnóstico de Implementação', category: 'consulting' as const },
  { id: 'cons_impl_mapeamento', name: 'Mapeamento de Processos TOTVS', category: 'consulting' as const },
  { id: 'cons_impl_otimizacao', name: 'Otimização de Processos', category: 'consulting' as const },
  { id: 'cons_impl_change', name: 'Gestão de Mudança (Change Management)', category: 'consulting' as const },
  { id: 'cons_impl_governanca', name: 'Governança de Dados e BI', category: 'consulting' as const },
  { id: 'cons_impl_integracao', name: 'Consultoria de Integração', category: 'consulting' as const },
  { id: 'cons_impl_pmo', name: 'PMO de Implementação', category: 'consulting' as const },
  { id: 'cons_impl_pos_golive', name: 'Acompanhamento Pós Go-Live', category: 'consulting' as const },
];

const INFRASTRUCTURE_OPTIONS = [
  { id: 'infra_servidor', name: 'Servidor e Infraestrutura', category: 'infrastructure' as const },
  { id: 'infra_cloud', name: 'Hospedagem Cloud', category: 'infrastructure' as const },
  { id: 'infra_backup', name: 'Backup e Recuperação', category: 'infrastructure' as const },
  { id: 'infra_seguranca', name: 'Segurança da Informação', category: 'infrastructure' as const },
  { id: 'infra_monitoramento', name: 'Monitoramento', category: 'infrastructure' as const },
  { id: 'infra_banco_dados', name: 'Banco de Dados', category: 'infrastructure' as const },
];

const SUPPORT_OPTIONS = [
  { id: 'sup_basico', name: 'Suporte Básico', category: 'support' as const },
  { id: 'sup_premium', name: 'Suporte Premium', category: 'support' as const },
  { id: 'sup_24x7', name: 'Suporte 24x7', category: 'support' as const },
  { id: 'sup_atualizacoes', name: 'Atualizações de Versão', category: 'support' as const },
  { id: 'sup_manutencao', name: 'Manutenção Preventiva', category: 'support' as const },
  { id: 'sup_helpdesk', name: 'Helpdesk Dedicado', category: 'support' as const },
];

export function TOTVSCostsSelector({ selectedCosts, onCostsChange, onSaveCost }: TOTVSCostsSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    implementation: false,
    training: false,
    consulting: false,
    infrastructure: false,
    support: false,
  });

  const [customItemName, setCustomItemName] = useState<Record<string, string>>({});

  const isCostSelected = (costId: string) => {
    return selectedCosts.some(cost => cost.id === costId);
  };

  const toggleCost = async (costId: string, costName: string, category: TOTVSCostItem['category']) => {
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

  const addCustomCost = async (category: TOTVSCostItem['category']) => {
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

  const getTotalByCategory = (category: TOTVSCostItem['category']) => {
    return selectedCosts
      .filter(cost => cost.category === category)
      .reduce((sum, cost) => sum + cost.cost, 0);
  };

  const getTotalCosts = () => {
    return selectedCosts.reduce((sum, cost) => sum + cost.cost, 0);
  };

  const getCategoryOptions = (category: TOTVSCostItem['category']) => {
    switch (category) {
      case 'implementation': return IMPLEMENTATION_OPTIONS;
      case 'training': return TRAINING_OPTIONS;
      case 'consulting': return CONSULTING_OPTIONS;
      case 'infrastructure': return INFRASTRUCTURE_OPTIONS;
      case 'support': return SUPPORT_OPTIONS;
    }
  };

  const getCategoryTitle = (category: TOTVSCostItem['category']) => {
    switch (category) {
      case 'implementation': return 'Implementação';
      case 'training': return 'Treinamento';
      case 'consulting': return 'Consultoria de Implementação e Diagnóstico';
      case 'infrastructure': return 'Infraestrutura';
      case 'support': return 'Suporte e Manutenção';
    }
  };

  const getCategoryDescription = (category: TOTVSCostItem['category']) => {
    switch (category) {
      case 'implementation': return 'Custos de implementação e configuração';
      case 'training': return 'Treinamento e capacitação de equipes';
      case 'consulting': return 'Diagnóstico, mapeamento e consultoria focada na implementação TOTVS';
      case 'infrastructure': return 'Infraestrutura e tecnologia necessária';
      case 'support': return 'Suporte técnico e manutenção contínua';
    }
  };

  const renderCategory = (category: TOTVSCostItem['category']) => {
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
                      <Label className="text-xs whitespace-nowrap">Valor (R$)</Label>
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
          <CardTitle>Custos TOTVS - Composição Detalhada</CardTitle>
          <CardDescription>
            Selecione e configure os custos detalhados do investimento TOTVS
          </CardDescription>
          <div className="pt-2 text-sm">
            <span className="font-semibold">Total Geral:</span>{' '}
            <span className="text-2xl font-bold text-primary">{formatCurrency(getTotalCosts())}</span>
          </div>
        </CardHeader>
      </Card>

      {renderCategory('implementation')}
      {renderCategory('training')}
      {renderCategory('consulting')}
      {renderCategory('infrastructure')}
      {renderCategory('support')}
    </div>
  );
}
