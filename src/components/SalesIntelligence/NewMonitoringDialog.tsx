import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Plus, ChevronDown } from 'lucide-react';
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
    states: [] as string[],
    city: '',
    keywords: [] as string[],
    min_employees: '',
    max_employees: ''
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [statesPopoverOpen, setStatesPopoverOpen] = useState(false);

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

  const regionsByState: Record<string, string[]> = {
    'Norte': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
    'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    'Centro-Oeste': ['DF', 'GO', 'MS', 'MT'],
    'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
    'Sul': ['PR', 'RS', 'SC']
  };

  const handleToggleState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter(s => s !== state)
        : [...prev.states, state]
    }));
  };

  const handleToggleRegion = (region: string) => {
    const regionStates = regionsByState[region];
    const allSelected = regionStates.every(state => formData.states.includes(state));
    
    setFormData(prev => ({
      ...prev,
      states: allSelected
        ? prev.states.filter(s => !regionStates.includes(s))
        : [...new Set([...prev.states, ...regionStates])]
    }));
  };

  const handleToggleAll = () => {
    setFormData(prev => ({
      ...prev,
      states: prev.states.length === brazilStates.length ? [] : [...brazilStates]
    }));
  };

  const isRegionSelected = (region: string) => {
    const regionStates = regionsByState[region];
    return regionStates.every(state => formData.states.includes(state));
  };

  const isRegionPartiallySelected = (region: string) => {
    const regionStates = regionsByState[region];
    const selectedCount = regionStates.filter(state => formData.states.includes(state)).length;
    return selectedCount > 0 && selectedCount < regionStates.length;
  };

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
          target_states: formData.states,
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
        states: [],
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
              <Label>Estado(s) *</Label>
              <Popover open={statesPopoverOpen} onOpenChange={setStatesPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {formData.states.length === 0
                      ? "Selecione estado(s)"
                      : formData.states.length === brazilStates.length
                      ? "Todos os estados"
                      : `${formData.states.length} estado(s) selecionado(s)`}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-4">
                      {/* Todos */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-states"
                          checked={formData.states.length === brazilStates.length}
                          onCheckedChange={handleToggleAll}
                        />
                        <label
                          htmlFor="all-states"
                          className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Todos os Estados
                        </label>
                      </div>

                      <Separator />

                      {/* Regiões */}
                      {Object.entries(regionsByState).map(([region, states]) => (
                        <div key={region} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`region-${region}`}
                              checked={isRegionSelected(region)}
                              onCheckedChange={() => handleToggleRegion(region)}
                            />
                            <label
                              htmlFor={`region-${region}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {region} {isRegionPartiallySelected(region) && '(parcial)'}
                            </label>
                          </div>
                          <div className="ml-6 space-y-2">
                            {states.map(state => (
                              <div key={state} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`state-${state}`}
                                  checked={formData.states.includes(state)}
                                  onCheckedChange={() => handleToggleState(state)}
                                />
                                <label
                                  htmlFor={`state-${state}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {state}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {formData.states.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.states.map(state => (
                    <Badge
                      key={state}
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleToggleState(state)}
                    >
                      {state}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
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
            disabled={!formData.name || !formData.sector || !formData.niche || formData.states.length === 0}
          >
            Criar Monitoramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}