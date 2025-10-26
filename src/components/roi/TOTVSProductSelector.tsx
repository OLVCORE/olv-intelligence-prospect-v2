import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface TOTVSSubModule {
  id: string;
  name: string;
  licenseCost: number;
  implementationCost: number;
  maintenanceCost: number;
  users: number;
}

export interface TOTVSProduct {
  id: string;
  name: string;
  licenseCost: number;
  implementationCost: number;
  maintenanceCost: number;
  users: number;
  subModules?: TOTVSSubModule[];
}

interface TOTVSProductSelectorProps {
  selectedProducts: TOTVSProduct[];
  onProductsChange: (products: TOTVSProduct[]) => void;
  onSaveProduct?: () => Promise<void>;
}

// Sub-módulos de Inteligência Artificial
const IA_SUB_MODULES = [
  { id: 'ia-auditoria-folha', name: 'Auditoria de Folha Protheus', defaultCost: 15000 },
  { id: 'ia-supervisao-compras', name: 'Supervisão de Compras', defaultCost: 12000 },
  { id: 'ia-supervisao-financeira', name: 'Supervisão Financeira', defaultCost: 18000 },
  { id: 'ia-dilligence-check', name: 'Dilligence Check', defaultCost: 20000 },
  { id: 'ia-contract-chat', name: 'Contract Chat', defaultCost: 10000 },
  { id: 'ia-consultor-dados', name: 'Consultor de Dados Financeiros', defaultCost: 25000 },
  { id: 'ia-target-talk', name: 'Target Talk', defaultCost: 8000 },
  { id: 'ia-analise-leads', name: 'Análise de Leads', defaultCost: 12000 },
  { id: 'ia-ropa-legal', name: 'RoPA Legal', defaultCost: 15000 },
  { id: 'ia-conselheiro-feedbacks', name: 'Conselheiro de Feedbacks', defaultCost: 9000 },
];

const AVAILABLE_PRODUCTS = [
  { id: 'ia', name: 'Inteligência Artificial', hasSubModules: true },
  { id: 'erp', name: 'ERP' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'assinatura', name: 'Assinatura Eletrônica' },
  { id: 'chatbot', name: 'Atendimento e Chatbot' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'credito', name: 'Crédito' },
  { id: 'crm', name: 'CRM de Vendas' },
  { id: 'fluig', name: 'Fluig' },
  { id: 'ipaas', name: 'IPAAS' },
  { id: 'marketing', name: 'Marketing Digital' },
  { id: 'pagamentos', name: 'Pagamentos' },
  { id: 'rh', name: 'RH' },
  { id: 'sfa', name: 'SFA' },
];

export function TOTVSProductSelector({ selectedProducts, onProductsChange, onSaveProduct }: TOTVSProductSelectorProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedSubModules, setExpandedSubModules] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const toggleProduct = async (productId: string, productName: string) => {
    if (isProductSelected(productId)) {
      onProductsChange(selectedProducts.filter(p => p.id !== productId));
    } else {
      const newProduct: TOTVSProduct = {
        id: productId,
        name: productName,
        licenseCost: 0,
        implementationCost: 0,
        maintenanceCost: 0,
        users: 0,
      };

      // Se for IA, inicializar com sub-módulos
      if (productId === 'ia') {
        newProduct.subModules = IA_SUB_MODULES.map(sm => ({
          id: sm.id,
          name: sm.name,
          licenseCost: sm.defaultCost,
          implementationCost: Math.round(sm.defaultCost * 0.3),
          maintenanceCost: Math.round(sm.defaultCost * 0.2),
          users: 10,
        }));
      }

      onProductsChange([...selectedProducts, newProduct]);
      setExpandedProducts(prev => new Set([...prev, productId]));
      if (productId === 'ia') {
        setExpandedSubModules(prev => new Set([...prev, productId]));
      }
      
      // Salvar automaticamente após adicionar
      if (onSaveProduct) {
        await onSaveProduct();
        toast.success(`${productName} adicionado e salvo`);
      }
    }
  };

  useEffect(() => {
    // Se IA já estiver selecionada mas sem sub-módulos (dados antigos), inicializa agora
    const iaSelected = selectedProducts.find(p => p.id === 'ia' && !p.subModules);
    if (iaSelected) {
      const enriched = selectedProducts.map(p => p.id === 'ia'
        ? {
            ...p,
            subModules: IA_SUB_MODULES.map(sm => ({
              id: sm.id,
              name: sm.name,
              licenseCost: sm.defaultCost,
              implementationCost: Math.round(sm.defaultCost * 0.3),
              maintenanceCost: Math.round(sm.defaultCost * 0.2),
              users: 10,
            }))
          }
        : p
      );
      onProductsChange(enriched);
      setExpandedSubModules(prev => new Set([...prev, 'ia']));
    }
  }, [selectedProducts]);
  const updateProduct = (productId: string, field: keyof TOTVSProduct, value: number) => {
    onProductsChange(
      selectedProducts.map(p =>
        p.id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const updateSubModule = (productId: string, subModuleId: string, field: keyof TOTVSSubModule, value: number) => {
    onProductsChange(
      selectedProducts.map(p => {
        if (p.id === productId && p.subModules) {
          return {
            ...p,
            subModules: p.subModules.map(sm =>
              sm.id === subModuleId ? { ...sm, [field]: value } : sm
            )
          };
        }
        return p;
      })
    );
  };

  const startEditingField = (productId: string, field: keyof TOTVSProduct, currentValue: number) => {
    setEditingField(`${productId}-${field}`);
    setEditingValue(currentValue);
  };

  const saveEditedField = async (productId: string, field: keyof TOTVSProduct) => {
    updateProduct(productId, field, editingValue);
    setEditingField(null);
    if (onSaveProduct) {
      await onSaveProduct();
    }
    toast.success('Valor atualizado e salvo');
  };

  const toggleExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTotalCosts = () => {
    return selectedProducts.reduce((acc, p) => {
      let productLicenses = p.licenseCost;
      let productImplementation = p.implementationCost;
      let productMaintenance = p.maintenanceCost;

      // Somar sub-módulos
      if (p.subModules) {
        p.subModules.forEach(sm => {
          productLicenses += sm.licenseCost;
          productImplementation += sm.implementationCost;
          productMaintenance += sm.maintenanceCost;
        });
      }

      return {
        licenses: acc.licenses + productLicenses,
        implementation: acc.implementation + productImplementation,
        maintenance: acc.maintenance + productMaintenance,
      };
    }, { licenses: 0, implementation: 0, maintenance: 0 });
  };

  const toggleSubModulesSection = (productId: string) => {
    setExpandedSubModules(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const totals = getTotalCosts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos TOTVS Selecionados</CardTitle>
        <CardDescription>
          Selecione os produtos e configure custos detalhados para cada solução
        </CardDescription>
        {selectedProducts.length > 0 && (
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary">
              Licenças: {formatCurrency(totals.licenses)}
            </Badge>
            <Badge variant="secondary">
              Implementação: {formatCurrency(totals.implementation)}
            </Badge>
            <Badge variant="secondary">
              Manutenção: {formatCurrency(totals.maintenance)}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de produtos disponíveis */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/50">
          {AVAILABLE_PRODUCTS.map(product => (
            <div key={product.id} className="flex items-center space-x-2">
              <Checkbox
                id={product.id}
                checked={isProductSelected(product.id)}
                onCheckedChange={() => toggleProduct(product.id, product.name)}
              />
              <label
                htmlFor={product.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {product.name}
              </label>
            </div>
          ))}
        </div>

        {/* Produtos selecionados com detalhes */}
        {selectedProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Selecione produtos acima para adicionar custos detalhados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedProducts.map(product => (
              <Collapsible
                key={product.id}
                open={expandedProducts.has(product.id)}
                onOpenChange={() => toggleExpanded(product.id)}
              >
                <Card className="border-2 border-primary/20">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (onSaveProduct) {
                                await onSaveProduct();
                                toast.success('Produto salvo');
                              }
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProduct(product.id, product.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <div>
                            <CardTitle className="text-base">{product.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Total: {formatCurrency(product.licenseCost + product.implementationCost + product.maintenanceCost)}
                            </CardDescription>
                          </div>
                        </div>
                        {expandedProducts.has(product.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${product.id}-license`}>Custo de Licenças (R$)</Label>
                        {editingField === `${product.id}-licenseCost` ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(parseFloat(e.target.value) || 0)}
                              className="flex-1"
                              step="1000"
                              min="0"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditedField(product.id, 'licenseCost')}
                              className="h-9 w-9 p-0"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${product.id}-license`}
                              type="number"
                              value={product.licenseCost || ''}
                              onChange={(e) => updateProduct(product.id, 'licenseCost', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              step="1000"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingField(product.id, 'licenseCost', product.licenseCost)}
                              className="h-9 w-9 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${product.id}-implementation`}>Custo de Implementação (R$)</Label>
                        {editingField === `${product.id}-implementationCost` ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(parseFloat(e.target.value) || 0)}
                              className="flex-1"
                              step="1000"
                              min="0"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditedField(product.id, 'implementationCost')}
                              className="h-9 w-9 p-0"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${product.id}-implementation`}
                              type="number"
                              value={product.implementationCost || ''}
                              onChange={(e) => updateProduct(product.id, 'implementationCost', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              step="1000"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingField(product.id, 'implementationCost', product.implementationCost)}
                              className="h-9 w-9 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${product.id}-maintenance`}>Manutenção Anual (R$)</Label>
                        {editingField === `${product.id}-maintenanceCost` ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(parseFloat(e.target.value) || 0)}
                              className="flex-1"
                              step="1000"
                              min="0"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditedField(product.id, 'maintenanceCost')}
                              className="h-9 w-9 p-0"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${product.id}-maintenance`}
                              type="number"
                              value={product.maintenanceCost || ''}
                              onChange={(e) => updateProduct(product.id, 'maintenanceCost', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              step="1000"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingField(product.id, 'maintenanceCost', product.maintenanceCost)}
                              className="h-9 w-9 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${product.id}-users`}>Número de Usuários</Label>
                        {editingField === `${product.id}-users` ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(parseInt(e.target.value) || 0)}
                              className="flex-1"
                              step="1"
                              min="0"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditedField(product.id, 'users')}
                              className="h-9 w-9 p-0"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${product.id}-users`}
                              type="number"
                              value={product.users || ''}
                              onChange={(e) => updateProduct(product.id, 'users', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              step="1"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingField(product.id, 'users', product.users)}
                              className="h-9 w-9 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>

                  {/* Sub-módulos (apenas para IA) */}
                  {product.id === 'ia' && product.subModules && (
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Collapsible
                          open={expandedSubModules.has(product.id)}
                          onOpenChange={() => toggleSubModulesSection(product.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full mb-3">
                              {expandedSubModules.has(product.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-2" />
                                  Ocultar Sub-Módulos ({product.subModules.length})
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                  Ver Sub-Módulos ({product.subModules.length})
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                              {product.subModules.map(subModule => (
                                <Card key={subModule.id} className="bg-muted/30 border-primary/10">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                      {subModule.name}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Licenças (R$)</Label>
                                      {editingField === `${subModule.id}-licenseCost` ? (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1000"
                                            min="0"
                                            autoFocus
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              updateSubModule(product.id, subModule.id, 'licenseCost', editingValue);
                                              setEditingField(null);
                                              toast.success('Valor atualizado');
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Save className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={subModule.licenseCost || ''}
                                            onChange={(e) => updateSubModule(product.id, subModule.id, 'licenseCost', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1000"
                                            min="0"
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingField(`${subModule.id}-licenseCost`);
                                              setEditingValue(subModule.licenseCost);
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Implementação (R$)</Label>
                                      {editingField === `${subModule.id}-implementationCost` ? (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1000"
                                            min="0"
                                            autoFocus
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              updateSubModule(product.id, subModule.id, 'implementationCost', editingValue);
                                              setEditingField(null);
                                              toast.success('Valor atualizado');
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Save className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={subModule.implementationCost || ''}
                                            onChange={(e) => updateSubModule(product.id, subModule.id, 'implementationCost', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1000"
                                            min="0"
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingField(`${subModule.id}-implementationCost`);
                                              setEditingValue(subModule.implementationCost);
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Manutenção (R$)</Label>
                                      {editingField === `${subModule.id}-maintenanceCost` ? (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1000"
                                            min="0"
                                            autoFocus
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              updateSubModule(product.id, subModule.id, 'maintenanceCost', editingValue);
                                              setEditingField(null);
                                              toast.success('Valor atualizado');
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Save className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={subModule.maintenanceCost || ''}
                                            onChange={(e) => updateSubModule(product.id, subModule.id, 'maintenanceCost', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1000"
                                            min="0"
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingField(`${subModule.id}-maintenanceCost`);
                                              setEditingValue(subModule.maintenanceCost);
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Usuários</Label>
                                      {editingField === `${subModule.id}-users` ? (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(parseInt(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1"
                                            min="0"
                                            autoFocus
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              updateSubModule(product.id, subModule.id, 'users', editingValue);
                                              setEditingField(null);
                                              toast.success('Valor atualizado');
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Save className="h-3 w-3 text-green-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={subModule.users || ''}
                                            onChange={(e) => updateSubModule(product.id, subModule.id, 'users', parseInt(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                            step="1"
                                            min="0"
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingField(`${subModule.id}-users`);
                                              setEditingValue(subModule.users);
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </CollapsibleContent>
                  )}
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
