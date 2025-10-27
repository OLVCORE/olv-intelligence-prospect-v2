import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DealFormDialog({ open, onOpenChange, onSuccess }: DealFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'select' | 'manual'>('select');
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchingCompanies, setSearchingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    value: '',
    stage: 'discovery',
    priority: 'medium',
    notes: '',
  });

  // Buscar empresas ao abrir
  useEffect(() => {
    if (open && mode === 'select') {
      searchCompanies();
    }
  }, [open, mode]);

  const searchCompanies = async (query?: string) => {
    setSearchingCompanies(true);
    try {
      let queryBuilder = supabase
        .from('companies')
        .select('id, name, employees, revenue, industry, cnpj')
        .order('name');

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,cnpj.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error searching companies:', error);
    } finally {
      setSearchingCompanies(false);
    }
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setFormData({
      ...formData,
      company_name: company.name,
      title: `Prospecção - ${company.name}`,
    });
    setComboboxOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let companyId: string | null = null;

      // Modo SELECT: usar empresa selecionada
      if (mode === 'select') {
        if (!selectedCompany) {
          toast({
            title: 'Selecione uma empresa',
            description: 'É necessário selecionar uma empresa da lista',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        companyId = selectedCompany.id;
      } 
      // Modo MANUAL: criar ou buscar empresa
      else {
        if (formData.company_name) {
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('name', formData.company_name)
            .maybeSingle();

          if (existingCompany) {
            companyId = existingCompany.id;
          } else {
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({ name: formData.company_name })
              .select('id')
              .single();

            if (companyError) throw companyError;
            companyId = newCompany.id;
          }
        }
      }

      // 2. Criar contato
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          name: formData.contact_name,
          email: formData.contact_email || null,
          phone: formData.contact_phone || null,
          company_id: companyId,
        })
        .select('id')
        .single();

      if (contactError) throw contactError;

      // 3. Criar deal
      const { error: dealError } = await supabase
        .from('sdr_deals')
        .insert({
          title: formData.title,
          company_id: companyId,
          contact_id: contact.id,
          stage: formData.stage,
          priority: formData.priority,
          value: formData.value ? parseFloat(formData.value) : 0,
          probability: 30,
          status: 'open',
          notes: formData.notes || null,
        });

      if (dealError) throw dealError;

      toast({
        title: '✅ Deal criado com sucesso!',
        description: `${formData.title} foi adicionado ao pipeline`,
      });

      // Reset form
      setFormData({
        title: '',
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        value: '',
        stage: 'discovery',
        priority: 'medium',
        notes: '',
      });
      setSelectedCompany(null);
      setMode('select');

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        title: 'Erro ao criar deal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Deal</DialogTitle>
          <DialogDescription>
            Selecione uma empresa existente ou crie um deal manual
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'select' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">🔍 Selecionar Empresa</TabsTrigger>
            <TabsTrigger value="manual">✏️ Criar Manual</TabsTrigger>
          </TabsList>

          {/* MODO: Selecionar Empresa Existente */}
          <TabsContent value="select" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Autocomplete */}
              <div className="space-y-2">
                <Label>Buscar Empresa *</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between"
                    >
                      {selectedCompany ? (
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {selectedCompany.name}
                        </span>
                      ) : (
                        "Digite para buscar empresa..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Digite nome ou CNPJ..." 
                        onValueChange={(value) => searchCompanies(value)}
                      />
                      <CommandEmpty>
                        {searchingCompanies ? 'Buscando...' : 'Nenhuma empresa encontrada'}
                      </CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {companies.map((company) => (
                            <CommandItem
                              key={company.id}
                              value={company.id}
                              onSelect={() => handleSelectCompany(company)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCompany?.id === company.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{company.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {company.cnpj && `CNPJ: ${company.cnpj} • `}
                                  {company.industry || 'Sem setor'} 
                                  {company.employees && ` • ${company.employees} funcionários`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Resto do formulário SELECT */}
              <div className="space-y-2">
                <Label htmlFor="title-select">Título do Deal *</Label>
                <Input
                  id="title-select"
                  placeholder="Ex: Implementação TOTVS"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value-select">Valor Estimado (R$)</Label>
                  <Input
                    id="value-select"
                    type="number"
                    placeholder="50000"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage-select">Estágio</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discovery">Discovery</SelectItem>
                      <SelectItem value="qualification">Qualificação</SelectItem>
                      <SelectItem value="proposal">Proposta</SelectItem>
                      <SelectItem value="negotiation">Negociação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-name-select">Nome do Contato *</Label>
                <Input
                  id="contact-name-select"
                  placeholder="João Silva"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email-select">Email</Label>
                  <Input
                    id="contact-email-select"
                    type="email"
                    placeholder="joao@empresa.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone-select">Telefone</Label>
                  <Input
                    id="contact-phone-select"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority-select">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes-select">Observações</Label>
                <Textarea
                  id="notes-select"
                  placeholder="Notas sobre o deal..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Deal'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* MODO: Criar Manual */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Deal *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Implementação TOTVS para Indústria X"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa</Label>
                <Input
                  id="company_name"
                  placeholder="Empresa XPTO Ltda"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Estimado (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="50000"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Estágio</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discovery">Discovery</SelectItem>
                      <SelectItem value="qualification">Qualificação</SelectItem>
                      <SelectItem value="proposal">Proposta</SelectItem>
                      <SelectItem value="negotiation">Negociação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome do Contato *</Label>
                <Input
                  id="contact_name"
                  placeholder="João Silva"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="joao@empresa.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas sobre o deal..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Deal'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
