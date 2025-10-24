import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompetitorFormData {
  name: string;
  category: string;
  description: string;
  website: string;
  market_position: string;
  pricing_model: string;
}

export function CompetitorFormDialog() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [catalogFile, setCatalogFile] = useState<File | null>(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CompetitorFormData>();

  const onSubmit = async (data: CompetitorFormData) => {
    try {
      console.log('[Competitor Form] Criando concorrente:', data.name);

      let catalogUrl = null;

      // Upload do catálogo se houver
      if (catalogFile) {
        const fileExt = catalogFile.name.split('.').pop();
        const fileName = `${data.name.toLowerCase().replace(/\s+/g, '-')}-catalog-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('competitive-docs')
          .upload(fileName, catalogFile);

        if (uploadError) throw uploadError;
        catalogUrl = uploadData.path;
      }

      // Criar concorrente
      const { error } = await supabase
        .from('competitors')
        .insert({
          name: data.name,
          category: data.category,
          description: data.description,
          website: data.website,
          website_url: data.website,
          market_position: data.market_position,
          pricing_model: data.pricing_model,
          catalog_url: catalogUrl,
          active: true,
          strengths: [],
          weaknesses: [],
          totvs_advantages: []
        });

      if (error) throw error;

      toast.success(`Concorrente ${data.name} adicionado!`);
      reset();
      setCatalogFile(null);
      setOpen(false);

    } catch (error: any) {
      console.error('[Competitor Form] Erro:', error);
      toast.error(`Erro ao criar concorrente: ${error.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máx 10MB)');
        return;
      }
      setCatalogFile(file);
      toast.success(`Arquivo ${file.name} selecionado`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Concorrente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Concorrente</DialogTitle>
          <DialogDescription>
            Preencha os dados do concorrente manualmente ou faça upload do catálogo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Concorrente *</Label>
            <Input
              id="name"
              {...register("name", { required: "Nome é obrigatório" })}
              placeholder="Ex: SAP"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ERP">ERP</SelectItem>
                  <SelectItem value="CRM">CRM</SelectItem>
                  <SelectItem value="BI">BI/Analytics</SelectItem>
                  <SelectItem value="HCM">HCM</SelectItem>
                  <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                  <SelectItem value="Other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="market_position">Posição de Mercado *</Label>
              <Select onValueChange={(value) => setValue("market_position", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Leader">Líder</SelectItem>
                  <SelectItem value="Challenger">Desafiante</SelectItem>
                  <SelectItem value="Niche">Nicho</SelectItem>
                  <SelectItem value="Emerging">Emergente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://competitor.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing_model">Modelo de Precificação</Label>
            <Input
              id="pricing_model"
              {...register("pricing_model")}
              placeholder="Ex: Licença perpétua, SaaS mensal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Breve descrição do concorrente..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Catálogo ou Documento (PDF, DOCX - máx 10MB)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="flex-1"
              />
              {catalogFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCatalogFile(null)}
                >
                  Remover
                </Button>
              )}
            </div>
            {catalogFile && (
              <p className="text-sm text-muted-foreground">
                <Upload className="inline h-3 w-3 mr-1" />
                {catalogFile.name} ({(catalogFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Concorrente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
