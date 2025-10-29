import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NewMonitoringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewMonitoringDialog({ open, onOpenChange }: NewMonitoringDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    niche: '',
    custom_niche: '',
    state: '',
    city: '',
    keywords: [] as string[],
    min_employees: '',
    max_employees: ''
  });
  const [keywordInput, setKeywordInput] = useState('');

  const sectors = [
    { value: 'agro', label: 'Agro' },
    { value: 'construcao', label: 'Construção' },
    { value: 'distribuicao', label: 'Distribuição' },
    { value: 'educacional', label: 'Educacional' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'saude', label: 'Saúde' },
    { value: 'varejo', label: 'Varejo' },
    { value: 'logistica', label: 'Logística' },
    { value: 'manufatura', label: 'Manufatura' },
    { value: 'servicos', label: 'Serviços' }
  ];

  const nichesBySection: Record<string, string[]> = {
    agro: ['Cooperativas Agrícolas', 'Agroindústrias', 'Pecuária', 'Trading de Grãos', 'Usinas', 'Outro (especificar)'],
    construcao: ['Construtoras', 'Incorporadoras', 'Engenharia Civil', 'Materiais de Construção', 'Outro (especificar)'],
    distribuicao: ['Atacado', 'Distribuidor', 'Importador', 'Exportador', 'Outro (especificar)'],
    educacional: ['Universidades', 'Escolas', 'Cursos Técnicos', 'EAD', 'Outro (especificar)'],
    financeiro: ['Bancos', 'Fintech', 'Seguradoras', 'Cooperativas de Crédito', 'Outro (especificar)'],
    saude: ['Hospitais', 'Clínicas', 'Laboratórios', 'Planos de Saúde', 'Outro (especificar)'],
    varejo: ['Supermercados', 'Lojas de Departamento', 'E-commerce', 'Franquias', 'Outro (especificar)'],
    logistica: ['Transportadoras', 'Correios', 'Armazéns', 'Operadores Logísticos', 'Outro (especificar)'],
    manufatura: ['Indústria de Base', 'Metalúrgica', 'Química', 'Alimentícia', 'Outro (especificar)'],
    servicos: ['Consultoria', 'TI', 'Contabilidade', 'Jurídico', 'Outro (especificar)']
  };

  const brazilStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keyword]
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('intelligence_monitoring_config')
        .insert({
          user_id: user.id,
          schedule_name: formData.name,
          target_states: [formData.state],
          target_cities: formData.city ? [formData.city] : null,
          target_sectors: [formData.sector],
          target_niches: [formData.niche],
          custom_niche: formData.custom_niche || null,
          keywords_whitelist: formData.keywords.length > 0 ? formData.keywords : null,
          min_employees: formData.min_employees ? parseInt(formData.min_employees) : null,
          max_employees: formData.max_employees ? parseInt(formData.max_employees) : null,
          is_active: true,
          check_frequency_hours: 24
        });

      if (error) throw error;

      toast({
        title: 'Monitoramento criado',
        description: `"${formData.name}" foi adicionado com sucesso`,
      });

      onOpenChange(false);
      
      setFormData({
        name: '',
        sector: '',
        niche: '',
        custom_niche: '',
        state: '',
        city: '',
        keywords: [],
        min_employees: '',
        max_employees: ''
      });

    } catch (error) {
      console.error('Erro ao criar monitoramento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar monitoramento',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Monitoramento Específico</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label>Nome do Monitoramento *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Pecuaristas Nelore - Tremembé/SP"
            />
          </div>

          <div>
            <Label>Setor *</Label>
            <Select
              value={formData.sector}
              onValueChange={(value) => setFormData({ ...formData, sector: value, niche: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.sector && (
            <div>
              <Label>Nicho *</Label>
              <Select
                value={formData.niche}
                onValueChange={(value) => setFormData({ ...formData, niche: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nicho" />
                </SelectTrigger>
                <SelectContent>
                  {nichesBySection[formData.sector]?.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.niche && (
            <div>
              <Label>Sub-nicho Específico (opcional)</Label>
              <Input
                value={formData.custom_niche}
                onChange={(e) => setFormData({ ...formData, custom_niche: e.target.value })}
                placeholder="Ex: Boi Nelore, Gado Leiteiro, Soja Orgânica"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Especifique ainda mais o nicho (ex: tipo de gado, cultura específica, etc.)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estado *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {brazilStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cidade (opcional)</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Tremembé"
              />
            </div>
          </div>

          <div>
            <Label>Palavras-chave Específicas</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Ex: acima de 500 cabeças, certificação orgânica"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddKeyword}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleRemoveKeyword(index)}
                >
                  {keyword}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione termos específicos para refinar a busca (pressione Enter para adicionar)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mínimo de Funcionários</Label>
              <Input
                type="number"
                value={formData.min_employees}
                onChange={(e) => setFormData({ ...formData, min_employees: e.target.value })}
                placeholder="Ex: 50"
              />
            </div>
            <div>
              <Label>Máximo de Funcionários</Label>
              <Input
                type="number"
                value={formData.max_employees}
                onChange={(e) => setFormData({ ...formData, max_employees: e.target.value })}
                placeholder="Ex: 500"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name || !formData.sector || !formData.niche || !formData.state}
          >
            Criar Monitoramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}