import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface CompanyEnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    domain?: string;
    website?: string;
    headquarters_state?: string;
    headquarters_city?: string;
    headquarters_country?: string;
    sector?: string;
    sector_code?: string;
    niche?: string;
    niche_code?: string;
    size?: string;
    employees?: number;
    revenue?: string;
  };
}

export function CompanyEnrichmentDialog({ open, onOpenChange, company }: CompanyEnrichmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    domain: company.domain || company.website || '',
    headquarters_state: company.headquarters_state || '',
    headquarters_city: company.headquarters_city || '',
    headquarters_country: company.headquarters_country || '',
    sector: company.sector || '',
    sector_code: company.sector_code || '',
    niche: company.niche || '',
    niche_code: company.niche_code || '',
    size: company.size || '',
    employees: company.employees?.toString() || '',
    revenue: company.revenue || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: any = {};

      // Apenas atualizar campos que foram preenchidos
      if (formData.domain) updateData.domain = formData.domain;
      if (formData.headquarters_state) updateData.headquarters_state = formData.headquarters_state;
      if (formData.headquarters_city) updateData.headquarters_city = formData.headquarters_city;
      if (formData.headquarters_country) updateData.headquarters_country = formData.headquarters_country;
      // Mapear 'Setor' para coluna existente 'industry'
      if (formData.sector) updateData.industry = formData.sector;
      // Não enviar campos inexistentes: sector_code, niche, niche_code, size
      if (formData.employees) updateData.employees = parseInt(formData.employees);
      if (formData.revenue) updateData.revenue = formData.revenue;

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: '✅ Dados salvos com sucesso',
        description: 'As informações complementares foram atualizadas.',
      });

      // Invalidar queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['company', company.id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: '❌ Erro ao salvar',
        description: 'Não foi possível atualizar os dados da empresa.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enriquecer Dados da Empresa</DialogTitle>
          <DialogDescription>
            Adicione ou edite informações complementares de <strong>{company.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Domínio */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domínio/Website</Label>
            <Input
              id="domain"
              placeholder="exemplo.com.br"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
          </div>

          {/* Localização */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="state">Estado (UF)</Label>
              <Input
                id="state"
                placeholder="SP"
                maxLength={2}
                value={formData.headquarters_state}
                onChange={(e) => setFormData({ ...formData, headquarters_state: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Município</Label>
              <Input
                id="city"
                placeholder="São Paulo"
                value={formData.headquarters_city}
                onChange={(e) => setFormData({ ...formData, headquarters_city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                placeholder="Brasil"
                value={formData.headquarters_country}
                onChange={(e) => setFormData({ ...formData, headquarters_country: e.target.value })}
              />
            </div>
          </div>

          {/* Setor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Input
                id="sector"
                placeholder="Tecnologia"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector_code">Código do Setor</Label>
              <Input
                id="sector_code"
                placeholder="62"
                value={formData.sector_code}
                onChange={(e) => setFormData({ ...formData, sector_code: e.target.value })}
              />
            </div>
          </div>

          {/* Nicho */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho</Label>
              <Textarea
                id="niche"
                placeholder="Desenvolvimento de software"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche_code">CNAE Principal</Label>
              <Input
                id="niche_code"
                placeholder="6201-5/00"
                value={formData.niche_code}
                onChange={(e) => setFormData({ ...formData, niche_code: e.target.value })}
              />
            </div>
          </div>

          {/* Tamanho */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="size">Porte</Label>
              <Input
                id="size"
                placeholder="Médio"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employees">Funcionários</Label>
              <Input
                id="employees"
                type="number"
                placeholder="100"
                value={formData.employees}
                onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue">Receita</Label>
              <Input
                id="revenue"
                placeholder="R$ 10M"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Dados
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
