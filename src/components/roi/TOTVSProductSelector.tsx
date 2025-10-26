import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface TOTVSProduct {
  id: string;
  name: string;
  licenseCost: number;
  implementationCost: number;
  maintenanceCost: number;
  users: number;
}

interface TOTVSProductSelectorProps {
  selectedProducts: TOTVSProduct[];
  onProductsChange: (products: TOTVSProduct[]) => void;
}

const AVAILABLE_PRODUCTS = [
  { id: 'ia', name: 'Inteligência Artificial' },
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

export function TOTVSProductSelector({ selectedProducts, onProductsChange }: TOTVSProductSelectorProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const toggleProduct = (productId: string, productName: string) => {
    if (isProductSelected(productId)) {
      onProductsChange(selectedProducts.filter(p => p.id !== productId));
    } else {
      onProductsChange([
        ...selectedProducts,
        {
          id: productId,
          name: productName,
          licenseCost: 0,
          implementationCost: 0,
          maintenanceCost: 0,
          users: 0,
        }
      ]);
      setExpandedProducts(prev => new Set([...prev, productId]));
    }
  };

  const updateProduct = (productId: string, field: keyof TOTVSProduct, value: number) => {
    onProductsChange(
      selectedProducts.map(p =>
        p.id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const startEditingField = (productId: string, field: keyof TOTVSProduct, currentValue: number) => {
    setEditingField(`${productId}-${field}`);
    setEditingValue(currentValue);
  };

  const saveEditedField = (productId: string, field: keyof TOTVSProduct) => {
    updateProduct(productId, field, editingValue);
    setEditingField(null);
    toast.success('Valor atualizado');
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
    return selectedProducts.reduce((acc, p) => ({
      licenses: acc.licenses + p.licenseCost,
      implementation: acc.implementation + p.implementationCost,
      maintenance: acc.maintenance + p.maintenanceCost,
    }), { licenses: 0, implementation: 0, maintenance: 0 });
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
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
