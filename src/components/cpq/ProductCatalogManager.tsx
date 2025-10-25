import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Check, PackagePlus } from "lucide-react";
import { TOTVS_PRODUCTS } from "@/lib/engines/ai/fit";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES: Array<'BÁSICO' | 'INTERMEDIÁRIO' | 'AVANÇADO' | 'ESPECIALIZADO'> = [
  'BÁSICO','INTERMEDIÁRIO','AVANÇADO','ESPECIALIZADO'
];

function slugifySku(name: string) {
  return name
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export function ProductCatalogManager() {
  const { data: catalog = [], refetch, isLoading } = useProductCatalog();
  const [openNew, setOpenNew] = useState(false);

  const existingByName = useMemo(() => new Set(catalog.map(p => p.name.toLowerCase())), [catalog]);

  const grouped = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      items: TOTVS_PRODUCTS.filter(p => p.category === cat)
    }));
  }, []);

  const getCategoryBadge = (category: string) => {
    const map: Record<string, string> = {
      'BÁSICO': 'bg-primary/10 text-primary',
      'INTERMEDIÁRIO': 'bg-accent/30 text-foreground',
      'AVANÇADO': 'bg-secondary/30 text-foreground',
      'ESPECIALIZADO': 'bg-destructive/15 text-destructive'
    };
    return map[category] || 'bg-muted text-muted-foreground';
  };

  const handleAddTotvsToCatalog = async (name: string, category: typeof CATEGORIES[number], description: string) => {
    try {
      const sku = slugifySku(name);
      const { error } = await supabase.from('product_catalog').insert({
        sku,
        name,
        category,
        description,
        base_price: 0,
        min_price: 0,
        implementation_cost: 0,
        training_cost: 0,
        annual_maintenance: 0,
        is_configurable: false,
        config_options: {},
        dependencies: [],
        recommended_with: [],
        min_quantity: 1,
        active: true,
      });
      if (error) throw error;
      toast.success('Produto adicionado ao catálogo');
      await refetch();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar produto');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Soluções TOTVS & Subprodutos</CardTitle>
            <CardDescription>Expanda por categoria e adicione ao catálogo</CardDescription>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PackagePlus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <NewProductDialog onSaved={async () => { setOpenNew(false); await refetch(); }} />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Carregando...</div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {grouped.map(group => (
              <AccordionItem key={group.category} value={group.category}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <Badge className={getCategoryBadge(group.category)}>{group.category}</Badge>
                    <span className="font-medium">{group.category}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {group.items.map(item => {
                      const already = existingByName.has(item.name.toLowerCase());
                      return (
                        <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">{item.name}</span>
                              <Badge variant="outline" className="text-xs">{group.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          {already ? (
                            <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3"/>No Catálogo</Badge>
                          ) : (
                            <Button size="sm" onClick={() => handleAddTotvsToCatalog(item.name, group.category, item.description)}>
                              <Plus className="h-4 w-4 mr-1" /> Adicionar ao Catálogo
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        <Separator className="my-4" />
        <p className="text-xs text-muted-foreground">Não encontrou? Clique em "Novo Produto" para cadastrar manualmente no catálogo.</p>
      </CardContent>
    </Card>
  );
}

function parseArray(text: string): string[] {
  return text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function safeJson(text: string) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}

function NewProductDialog({ onSaved }: { onSaved: () => Promise<void> | void }) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<'BÁSICO' | 'INTERMEDIÁRIO' | 'AVANÇADO' | 'ESPECIALIZADO'>('BÁSICO');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [implementationCost, setImplementationCost] = useState<number>(0);
  const [trainingCost, setTrainingCost] = useState<number>(0);
  const [annualMaintenance, setAnnualMaintenance] = useState<number>(0);
  const [minQty, setMinQty] = useState<number>(1);
  const [maxQty, setMaxQty] = useState<number | undefined>(undefined);
  const [dependencies, setDependencies] = useState('');
  const [recommendedWith, setRecommendedWith] = useState('');
  const [configOptions, setConfigOptions] = useState('');

  const handleSave = async () => {
    if (!name) return toast.error('Informe o nome');
    const newSku = sku || slugifySku(name);
    try {
      const { error } = await supabase.from('product_catalog').insert({
        name,
        sku: newSku,
        category,
        description,
        base_price: Number(basePrice) || 0,
        min_price: Number(minPrice) || 0,
        implementation_cost: Number(implementationCost) || 0,
        training_cost: Number(trainingCost) || 0,
        annual_maintenance: Number(annualMaintenance) || 0,
        is_configurable: Boolean(configOptions && configOptions.trim()),
        config_options: safeJson(configOptions),
        dependencies: parseArray(dependencies),
        recommended_with: parseArray(recommendedWith),
        min_quantity: Number(minQty) || 1,
        max_quantity: typeof maxQty === 'number' ? Number(maxQty) : null,
        active: true,
      });
      if (error) throw error;
      toast.success('Produto cadastrado no catálogo');
      await onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo Produto no Catálogo</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: TOTVS Protheus" />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="PROD_001" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Categoria</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={category} onChange={e => setCategory(e.target.value as any)}>
              {CATEGORIES.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <Label>Preço Base (R$)</Label>
            <Input type="number" value={basePrice} onChange={e => setBasePrice(parseFloat(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Preço Mínimo (R$)</Label>
            <Input type="number" value={minPrice} onChange={e => setMinPrice(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Custo Implementação (R$)</Label>
            <Input type="number" value={implementationCost} onChange={e => setImplementationCost(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Custo Treinamento (R$)</Label>
            <Input type="number" value={trainingCost} onChange={e => setTrainingCost(parseFloat(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Manutenção Anual (R$)</Label>
            <Input type="number" value={annualMaintenance} onChange={e => setAnnualMaintenance(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Qtde Mínima</Label>
            <Input type="number" value={minQty} onChange={e => setMinQty(parseInt(e.target.value))} />
          </div>
          <div>
            <Label>Qtde Máxima (opcional)</Label>
            <Input type="number" value={maxQty ?? ''} onChange={e => setMaxQty(e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição do produto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Dependências (vírgula)</Label>
            <Input value={dependencies} onChange={e => setDependencies(e.target.value)} placeholder="SKU1, SKU2" />
          </div>
          <div>
            <Label>Recomendado com (vírgula)</Label>
            <Input value={recommendedWith} onChange={e => setRecommendedWith(e.target.value)} placeholder="SKU3, SKU4" />
          </div>
        </div>
        <div>
          <Label>Opções de Config (JSON opcional)</Label>
          <Textarea value={configOptions} onChange={e => setConfigOptions(e.target.value)} placeholder='{"módulo":"premium"}' />
        </div>
        <Button onClick={handleSave} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Salvar no Catálogo
        </Button>
      </div>
    </DialogContent>
  );
}
