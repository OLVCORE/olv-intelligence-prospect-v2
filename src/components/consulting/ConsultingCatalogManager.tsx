import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Check } from "lucide-react";
import { useConsultingCatalog, ConsultingCategory } from "@/hooks/useConsultingCatalog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES: ConsultingCategory[] = ['DIAGNÓSTICO','OPERACIONAL','ESTRATÉGICO','TECNOLOGIA','COMPLIANCE','CAPACITAÇÃO'];

function slugifySku(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export function ConsultingCatalogManager() {
  const { data: services = [], refetch, isLoading } = useConsultingCatalog();
  const [openNew, setOpenNew] = useState(false);

  const grouped = useMemo(() => {
    const byCat: Record<string, typeof services> = {};
    for (const cat of CATEGORIES) byCat[cat] = [];
    services.forEach(s => { (byCat[s.category] ||= []).push(s); });
    return CATEGORIES.map(category => ({ category, items: byCat[category] || [] }));
  }, [services]);

  const getCategoryBadge = (category: string) => {
    const map: Record<string, string> = {
      'DIAGNÓSTICO': 'bg-primary/10 text-primary',
      'OPERACIONAL': 'bg-accent/30 text-foreground',
      'ESTRATÉGICO': 'bg-secondary/30 text-foreground',
      'TECNOLOGIA': 'bg-muted text-foreground',
      'COMPLIANCE': 'bg-destructive/15 text-destructive',
      'CAPACITAÇÃO': 'bg-primary/10 text-primary'
    };
    return map[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Serviços de Consultoria OLV</CardTitle>
            <CardDescription>Gerencie o catálogo de serviços e precificação</CardDescription>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Novo Serviço
              </Button>
            </DialogTrigger>
            <NewServiceDialog onSaved={async () => { setOpenNew(false); await refetch(); }} />
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
                    <span className="text-xs text-muted-foreground">({group.items.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {group.items.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum serviço nesta categoria.</p>
                    )}
                    {group.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{item.name}</span>
                            <Badge variant="outline" className="text-xs">{item.sku}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {item.base_project_price && <span>Projeto: R$ {Number(item.base_project_price).toLocaleString()}</span>}
                            {item.min_hourly_rate && item.max_hourly_rate && (
                              <span>Hora: R$ {Number(item.min_hourly_rate)} - R$ {Number(item.max_hourly_rate)}</span>
                            )}
                            {item.estimated_hours_min && item.estimated_hours_max && (
                              <span>Horas: {item.estimated_hours_min}-{item.estimated_hours_max}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3"/>No Catálogo</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        <p className="text-xs text-muted-foreground mt-4">Precisa de algo não listado? Clique em "Novo Serviço" para cadastrar.</p>
      </CardContent>
    </Card>
  );
}

function NewServiceDialog({ onSaved }: { onSaved: () => Promise<void> | void }) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<ConsultingCategory>('DIAGNÓSTICO');
  const [description, setDescription] = useState('');
  const [baseProjectPrice, setBaseProjectPrice] = useState<number>(0);
  const [minProjectPrice, setMinProjectPrice] = useState<number>(0);
  const [maxProjectPrice, setMaxProjectPrice] = useState<number>(0);
  const [minHourly, setMinHourly] = useState<number>(0);
  const [maxHourly, setMaxHourly] = useState<number>(0);
  const [hoursMin, setHoursMin] = useState<number>(0);
  const [hoursMax, setHoursMax] = useState<number>(0);

  const handleSave = async () => {
    if (!name) return toast.error('Informe o nome do serviço');
    const newSku = sku || slugifySku(name);
    try {
      const { error } = await supabase.from('consulting_services').insert({
        name,
        sku: newSku,
        category,
        description,
        base_project_price: Number(baseProjectPrice) || null,
        min_project_price: Number(minProjectPrice) || null,
        max_project_price: Number(maxProjectPrice) || null,
        min_hourly_rate: Number(minHourly) || null,
        max_hourly_rate: Number(maxHourly) || null,
        estimated_hours_min: Number(hoursMin) || null,
        estimated_hours_max: Number(hoursMax) || null,
        active: true,
      });
      if (error) throw error;
      toast.success('Serviço cadastrado');
      await onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo Serviço de Consultoria</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Diagnóstico Estratégico" />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="OLV_DIAG_001" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Categoria</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={category} onChange={e => setCategory(e.target.value as ConsultingCategory)}>
              {CATEGORIES.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <Label>Preço Base do Projeto (R$)</Label>
            <Input type="number" value={baseProjectPrice} onChange={e => setBaseProjectPrice(parseFloat(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Preço Mínimo (R$)</Label>
            <Input type="number" value={minProjectPrice} onChange={e => setMinProjectPrice(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Preço Máximo (R$)</Label>
            <Input type="number" value={maxProjectPrice} onChange={e => setMaxProjectPrice(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Horas (mín-máx)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={hoursMin} onChange={e => setHoursMin(parseFloat(e.target.value))} placeholder="mín" />
              <Input type="number" value={hoursMax} onChange={e => setHoursMax(parseFloat(e.target.value))} placeholder="máx" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Hora Técnica (mín)</Label>
            <Input type="number" value={minHourly} onChange={e => setMinHourly(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Hora Técnica (máx)</Label>
            <Input type="number" value={maxHourly} onChange={e => setMaxHourly(parseFloat(e.target.value))} />
          </div>
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Resumo do serviço" />
        </div>
        <Button onClick={handleSave} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Salvar Serviço
        </Button>
      </div>
    </DialogContent>
  );
}
