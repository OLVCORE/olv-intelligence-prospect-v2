import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, TrendingUp, AlertCircle, CheckCircle, Edit2, Save } from "lucide-react";
import { useProductCatalog, Product } from "@/hooks/useProductCatalog";
import { useCreateQuote, QuoteProduct } from "@/hooks/useQuotes";
import { toast } from "sonner";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";
import { UnsavedChangesWarning } from "@/components/common/UnsavedChangesWarning";
import { useModuleDraft } from "@/hooks/useModuleDraft";

interface QuoteConfiguratorProps {
  companyId: string;
  accountStrategyId?: string;
  onQuoteCreated?: (quoteId: string) => void;
  onUnsavedChangesMount?: (hasChanges: () => boolean, save: () => Promise<void>) => void;
}

export function QuoteConfigurator({ companyId, accountStrategyId, onQuoteCreated, onUnsavedChangesMount }: QuoteConfiguratorProps) {
  const { data: products, isLoading } = useProductCatalog();
  const createQuote = useCreateQuote();
  const [selectedProducts, setSelectedProducts] = useState<QuoteProduct[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const initializedFromDraftRef = useRef(false);

  const { data: draftData, hasUnsavedChanges, save, updateData } = useModuleDraft<{ selectedProducts: QuoteProduct[]; priceOverrides: Record<string, number> }>(
    { selectedProducts: [], priceOverrides: {} },
    {
      module: 'cpq',
      companyId,
      accountStrategyId,
      title: `CPQ - ${companyId || accountStrategyId}`,
      autoSaveInterval: 10000,
    }
  );

  // Aplicar draft apenas uma vez quando carregar
  useEffect(() => {
    if (draftData && !initializedFromDraftRef.current) {
      if (draftData.selectedProducts) setSelectedProducts(draftData.selectedProducts);
      if (draftData.priceOverrides) setPriceOverrides(draftData.priceOverrides);
      initializedFromDraftRef.current = true;
    }
  }, [draftData]);

  // Persistir alterações locais no draft somente se houver diferença real
  useEffect(() => {
    const draftSelStr = JSON.stringify(draftData?.selectedProducts || []);
    const draftOvStr = JSON.stringify(draftData?.priceOverrides || {});
    const localSelStr = JSON.stringify(selectedProducts);
    const localOvStr = JSON.stringify(priceOverrides);

    if (localSelStr !== draftSelStr || localOvStr !== draftOvStr) {
      updateData(prev => ({ ...(prev || { selectedProducts: [], priceOverrides: {} }), selectedProducts, priceOverrides }));
    }
  }, [selectedProducts, priceOverrides, updateData, draftData]);

  // Notificar o componente pai sobre as funções de verificação e salvamento
  useEffect(() => {
    if (onUnsavedChangesMount) {
      onUnsavedChangesMount(() => hasUnsavedChanges, save);
    }
  }, [hasUnsavedChanges, save, onUnsavedChangesMount]);

  const addProduct = async (product: Product) => {
    const existing = selectedProducts.find(p => p.sku === product.sku);
    if (existing) {
      toast.info('Produto já adicionado. Ajuste a quantidade.');
      return;
    }

    const effectivePrice = priceOverrides[product.sku] ?? product.base_price;

    const newProduct: QuoteProduct = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      quantity: product.min_quantity,
      base_price: effectivePrice,
      discount: 0,
      final_price: effectivePrice * product.min_quantity,
    };

    const updated = [...selectedProducts, newProduct];
    setSelectedProducts(updated);
    // Persistir imediatamente no draft para não perder dados ao trocar de aba
    updateData(prev => ({ ...(prev || { selectedProducts: [], priceOverrides: {} }), selectedProducts: updated, priceOverrides }));
    await save();
  };

  const removeProduct = async (sku: string) => {
    const updated = selectedProducts.filter(p => p.sku !== sku);
    setSelectedProducts(updated);
    updateData(prev => ({ ...(prev || { selectedProducts: [], priceOverrides: {} }), selectedProducts: updated, priceOverrides }));
    await save();
  };

  const updateQuantity = async (sku: string, quantity: number) => {
    const updated = selectedProducts.map(p => {
      if (p.sku === sku) {
        const newQuantity = Math.max(1, quantity);
        return {
          ...p,
          quantity: newQuantity,
          final_price: p.base_price * newQuantity * (1 - p.discount / 100),
        };
      }
      return p;
    });
    setSelectedProducts(updated);
    // Persistir imediatamente no draft para evitar perda ao trocar de aba
    updateData(prev => ({ ...(prev || { selectedProducts: [], priceOverrides: {} }), selectedProducts: updated, priceOverrides }));
    await save();
  };

  const updatePrice = (sku: string, price: number) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.sku === sku) {
        return {
          ...p,
          base_price: price,
          final_price: price * p.quantity * (1 - p.discount / 100),
        };
      }
      return p;
    }));
  };

  const startEditingPrice = (sku: string, currentPrice: number) => {
    setEditingPriceId(sku);
    setEditingPrice(currentPrice);
  };

  const saveEditedPrice = async (sku: string) => {
    // Atualiza localmente e no draft (inclui overrides para refletir no ROI imediatamente)
    const newSelected = selectedProducts.map(p =>
      p.sku === sku
        ? { ...p, base_price: editingPrice, final_price: editingPrice * p.quantity * (1 - p.discount / 100) }
        : p
    );
    const newOverrides = { ...priceOverrides, [sku]: editingPrice };
    setSelectedProducts(newSelected);
    setPriceOverrides(newOverrides);
    updateData(prev => ({ ...(prev || { selectedProducts: [], priceOverrides: {} }), selectedProducts: newSelected, priceOverrides: newOverrides }));
    await save();
    setEditingPriceId(null);
    toast.success('Preço atualizado');
  };

  const totalListPrice = selectedProducts.reduce((sum, p) => sum + (p.base_price * p.quantity), 0);
  const totalDiscounts = selectedProducts.reduce((sum, p) => sum + (p.base_price * p.quantity * p.discount / 100), 0);
  const totalFinalPrice = totalListPrice - totalDiscounts;

  const handleGenerateQuote = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Adicione pelo menos um produto');
      return;
    }

    // Garante que o estado atual esteja salvo antes de gerar
    await save();

    await createQuote.mutateAsync({
      company_id: companyId,
      account_strategy_id: accountStrategyId,
      products: selectedProducts,
    });

    // Salva novamente após gerar (inclui sugestões de pricing, se houver)
    await save();

    if (onQuoteCreated) {
      onQuoteCreated('new-quote');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDisplayPrice = (p: Product) => priceOverrides[p.sku] ?? p.base_price;

  const getCategoryColor = (category: string) => {
    const colors = {
      'BÁSICO': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      'INTERMEDIÁRIO': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      'AVANÇADO': 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
      'ESPECIALIZADO': 'bg-red-500/10 text-red-700 dark:text-red-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-700';
  };

  if (isLoading) {
    return <div>Carregando catálogo...</div>;
  }

  return (
    <div className="space-y-6">
      <UnsavedChangesWarning hasUnsavedChanges={hasUnsavedChanges} onSave={save} />
      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={createQuote.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Salvar CPQ
        </Button>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Catálogo de Produtos */}
        <Card>
        <CardHeader>
          <CardTitle>Catálogo de Produtos TOTVS</CardTitle>
          <CardDescription>
            Selecione os produtos para a cotação. Clique no ícone de edição para ajustar preços.
            Os produtos selecionados serão sincronizados automaticamente com o módulo ROI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products?.map(product => {
              const isEditing = editingPriceId === `catalog-${product.sku}`;
              return (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{product.name}</span>
                    <Badge className={getCategoryColor(product.category)}>
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                        className="w-28 h-7 text-sm"
                        step="0.01"
                        min="0"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          // Sobrescreve preço no catálogo e sincroniza seleção
                          const overridePrice = editingPrice;
                          setPriceOverrides(prev => ({ ...prev, [product.sku]: overridePrice }));
                          const alreadySelected = selectedProducts.some(p => p.sku === product.sku);
                          let newSelected = selectedProducts;
                          if (alreadySelected) {
                            newSelected = selectedProducts.map(p =>
                              p.sku === product.sku
                                ? { ...p, base_price: overridePrice, final_price: overridePrice * p.quantity * (1 - p.discount / 100) }
                                : p
                            );
                          } else {
                            // Se não estava selecionado, adiciona automaticamente para refletir no ROI
                            const effectivePrice = overridePrice;
                            const newProduct: QuoteProduct = {
                              id: product.id,
                              sku: product.sku,
                              name: product.name,
                              quantity: product.min_quantity,
                              base_price: effectivePrice,
                              discount: 0,
                              final_price: effectivePrice * product.min_quantity,
                            };
                            newSelected = [...selectedProducts, newProduct];
                          }
                          setSelectedProducts(newSelected);
                          // Persistir no draft imediatamente
                          updateData(prev => ({ ...(prev || { selectedProducts: [], priceOverrides: {} }), selectedProducts: newSelected, priceOverrides: { ...(prev?.priceOverrides || {}), [product.sku]: overridePrice } }));
                          await save();
                          setEditingPriceId(null);
                          toast.success('Preço atualizado no catálogo');
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Save className="h-3 w-3 text-green-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(getDisplayPrice(product))}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingPriceId(`catalog-${product.sku}`);
                          setEditingPrice(getDisplayPrice(product));
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => addProduct(product)}
                  disabled={selectedProducts.some(p => p.sku === product.sku)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Produtos Selecionados */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Produtos Selecionados</CardTitle>
            <CardDescription>
              {selectedProducts.length} produto(s) na cotação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto selecionado</p>
                </div>
              ) : (
                selectedProducts.map(product => (
                  <div key={product.sku} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        {editingPriceId === product.sku ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                              className="w-32 h-8"
                              step="0.01"
                              min="0"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditedPrice(product.sku)}
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(product.base_price)} / unidade
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingPrice(product.sku, product.base_price)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(product.sku)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`qty-${product.sku}`} className="text-xs">
                          Quantidade
                        </Label>
                        <Input
                          id={`qty-${product.sku}`}
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateQuantity(product.sku, parseInt(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Subtotal</p>
                        <p className="font-semibold">
                          {formatCurrency(product.final_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        {selectedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preço de Lista</span>
                <span className="font-medium">{formatCurrency(totalListPrice)}</span>
              </div>
              {totalDiscounts > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descontos</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(totalDiscounts)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Valor Total</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(totalFinalPrice)}
                </span>
              </div>
              <Button
                className="w-full"
                onClick={handleGenerateQuote}
                disabled={createQuote.isPending}
              >
                {createQuote.isPending ? (
                  'Gerando...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Gerar Cotação com Pricing Intelligence
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
      
      <ScrollToTopButton />
    </div>
  );
}
