import { useState, useEffect } from 'react';
import { DraggableDialog } from '@/components/ui/draggable-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, ChevronsUpDown, Building2, Sparkles, X, UserPlus } from 'lucide-react';
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
  
  const [enriching, setEnriching] = useState(false);
  const [contacts, setContacts] = useState<Array<{
    name: string;
    email: string;
    phone: string;
    role?: string;
  }>>([{ name: '', email: '', phone: '', role: '' }]);
  
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    cnpj: '',
    employees: '',
    industry: '',
    value: '',
    stage: 'discovery',
    priority: 'medium',
    description: '',
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
        .select('id, name, employees, revenue, industry, cnpj, lead_score')
        .order('lead_score', { ascending: false, nullsFirst: false });

      if (query) {
        // Remove apenas pontuação para busca de CNPJ
        const cleanQuery = query.replace(/[^\w\s]/g, '');
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,cnpj.ilike.%${cleanQuery}%`);
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error searching companies:', error);
      toast({
        title: 'Erro ao buscar empresas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSearchingCompanies(false);
    }
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setFormData({
      ...formData,
      company_name: company.name,
      cnpj: company.cnpj || '',
      employees: company.employees?.toString() || '',
      industry: company.industry || '',
      title: `Prospecção - ${company.name}`,
    });
    setComboboxOpen(false);
  };

  const handleEnrichCompany = async () => {
    // Aceita empresa selecionada OU CNPJ digitado
    if (!selectedCompany?.id && !formData.cnpj) {
      toast({
        title: 'CNPJ obrigatório',
        description: 'Digite o CNPJ ou selecione uma empresa',
        variant: 'destructive',
      });
      return;
    }

    setEnriching(true);
    try {
      let companyId = selectedCompany?.id as string | undefined;
      const clean = (formData.cnpj || '').replace(/\D/g, '');

      // Se não há empresa selecionada, BUSCAR DADOS REAIS PRIMEIRO
      if (!companyId) {
        // 🔥 PASSO 1: BUSCAR DADOS REAIS DA RECEITA FEDERAL
        console.log('🔍 Buscando dados reais da Receita Federal para CNPJ:', clean);
        const { data: receitaResponse, error: receitaError } = await supabase.functions.invoke('enrich-receitaws', {
          body: { cnpj: clean }
        });

        if (receitaError) {
          throw new Error('Erro ao buscar dados da Receita Federal: ' + receitaError.message);
        }

        if (!receitaResponse || (receitaResponse as any).error) {
          throw new Error('CNPJ não encontrado na Receita Federal');
        }

        // A função retorna no formato { data: {...} } — extrair corretamente
        const payload: any = receitaResponse as any;
        const receitaData = payload?.data ?? payload;
        console.log('✅ Dados da Receita Federal recebidos:', receitaData);

        // 🔥 PASSO 2: VERIFICAR SE EMPRESA JÁ EXISTE NO BANCO
        const { data: existing, error: findError } = await supabase
          .from('companies')
          .select('id, name, cnpj, employees, industry, revenue, lead_score')
          .or(`cnpj.ilike.%${clean}%,cnpj.eq.${clean}`)
          .maybeSingle();
        if (findError && findError.code !== 'PGRST116') throw findError;

        if (existing) {
          // Empresa já existe, usar ela
          companyId = existing.id;
          console.log('✅ Empresa já existe no banco:', existing.name);
        } else {
          // 🔥 PASSO 3: CRIAR EMPRESA COM DADOS REAIS DA RECEITA FEDERAL
          const companyData: any = {
            name: receitaData.nome || receitaData.fantasia || `Empresa ${clean}`,
            cnpj: formData.cnpj,
            industry: receitaData.atividade_principal?.[0]?.text || null,
            raw_data: {
              receitaws: receitaData
            }
          };

          // Adicionar dados de localização se disponíveis
          if (receitaData.municipio && receitaData.uf) {
            companyData.location = {
              city: receitaData.municipio,
              state: receitaData.uf,
              country: 'Brasil',
              address: [
                receitaData.logradouro,
                receitaData.numero,
                receitaData.complemento,
                receitaData.bairro,
                receitaData.cep
              ].filter(Boolean).join(', ')
            };
          }

          const { data: created, error: insertErr } = await supabase
            .from('companies')
            .insert(companyData)
            .select('id, name, cnpj, employees, industry, revenue, lead_score, location')
            .single();
          
          if (insertErr) throw insertErr;
          companyId = created.id;
          console.log('✅ Empresa criada com dados da Receita Federal:', created.name);
        }

        // Recarregar dados atualizados da empresa
        const { data: updated, error: updateError } = await supabase
          .from('companies')
          .select('id, name, cnpj, employees, industry, revenue, lead_score, location')
          .eq('id', companyId)
          .single();

        if (updateError) throw updateError;

        if (updated) {
          setSelectedCompany(updated);
          setFormData({
            ...formData,
            company_name: updated.name || formData.company_name,
            cnpj: updated.cnpj || formData.cnpj,
            employees: updated.employees?.toString() || formData.employees,
            industry: updated.industry || formData.industry,
            title: formData.title || `Prospecção - ${updated.name}`,
          });
        }

        toast({
          title: '✅ Dados da Receita Federal carregados!',
          description: `Empresa: ${updated?.name || 'N/A'}`,
        });
      } else {
        // Empresa já selecionada, apenas enriquecer 360°
        const { error } = await supabase.functions.invoke('enrich-company-360', {
          body: { company_id: companyId },
        });
        if (error) throw error;

        // Recarregar dados atualizados
        const { data: updated } = await supabase
          .from('companies')
          .select('id, name, cnpj, employees, industry, revenue, lead_score')
          .eq('id', companyId)
          .single();

        if (updated) {
          setSelectedCompany(updated);
          setFormData({
            ...formData,
            company_name: updated.name || formData.company_name,
            cnpj: updated.cnpj || formData.cnpj,
            employees: updated.employees?.toString() || formData.employees,
            industry: updated.industry || formData.industry,
            title: formData.title || `Prospecção - ${updated.name}`,
          });
        }

        toast({
          title: '✅ Enriquecimento 360° concluído!',
          description: 'Dados atualizados com sucesso.',
        });
      }
    } catch (error: any) {
      console.error('Enrichment error:', error);
      toast({
        title: 'Erro ao buscar dados',
        description: error.message || 'Verifique o CNPJ e tente novamente',
        variant: 'destructive',
      });
    } finally {
      setEnriching(false);
    }
  };

  const addContact = () => {
    setContacts([...contacts, { name: '', email: '', phone: '', role: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: string, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
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
            .or(`name.eq.${formData.company_name}${formData.cnpj ? `,cnpj.eq.${formData.cnpj}` : ''}`)
            .maybeSingle();

          if (existingCompany) {
            companyId = existingCompany.id;
          } else {
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({ 
                name: formData.company_name,
                cnpj: formData.cnpj || null,
                employees: formData.employees ? parseInt(formData.employees) : null,
                industry: formData.industry || null,
              })
              .select('id')
              .single();

            if (companyError) throw companyError;
            companyId = newCompany.id;
          }
        }
      }

      // 2. Criar contatos (múltiplos)
      const validContacts = contacts.filter(c => c.name.trim());
      if (validContacts.length === 0) {
        toast({
          title: 'Erro ao criar deal',
          description: 'Adicione pelo menos um contato',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const contactsToInsert = validContacts.map(c => ({
        name: c.name,
        email: c.email || null,
        phone: c.phone || null,
        company_id: companyId,
        meta: c.role ? { role: c.role } : {},
      }));

      const { data: createdContacts, error: contactError } = await supabase
        .from('contacts')
        .insert(contactsToInsert)
        .select('id');

      if (contactError) throw contactError;
      
      const primaryContactId = createdContacts[0].id;

      // 3. Criar deal
      const { error: dealError } = await supabase
        .from('sdr_deals')
        .insert({
          title: formData.title,
          company_id: companyId,
          contact_id: primaryContactId,
          stage: formData.stage,
          priority: formData.priority,
          value: formData.value ? parseFloat(formData.value) : 0,
          probability: 30,
          status: 'open',
          description: formData.description || null,
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
        cnpj: '',
        employees: '',
        industry: '',
        value: '',
        stage: 'discovery',
        priority: 'medium',
        description: '',
      });
      setContacts([{ name: '', email: '', phone: '', role: '' }]);
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
    <DraggableDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="Criar Novo Deal"
      description="Selecione uma empresa existente ou crie um deal manual"
      className="max-w-2xl"
    >

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'select' | 'manual')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">
              <Building2 className="h-4 w-4 mr-2" />
              Selecionar Empresa
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Sparkles className="h-4 w-4 mr-2" />
              Criar Manual
            </TabsTrigger>
          </TabsList>

          {/* MODO: Selecionar Empresa Existente */}
          <TabsContent value="select" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Autocomplete */}
              <div className="space-y-2">
                <Label>Buscar Empresa *</Label>
                <div className="flex gap-2">
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="flex-1 justify-between"
                      >
                        {selectedCompany ? (
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {selectedCompany.name}
                            {selectedCompany.lead_score > 0 && (
                              <Badge variant="secondary" className="ml-auto">
                                Score: {selectedCompany.lead_score}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          "Digite nome ou CNPJ..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Buscar por nome ou CNPJ (em tempo real)..." 
                          onValueChange={(value) => searchCompanies(value)}
                        />
                        <CommandEmpty>
                          {searchingCompanies ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Buscando empresas...
                            </div>
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Nenhuma empresa encontrada
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => setMode('manual')}
                                className="block mx-auto mt-2"
                              >
                                Criar nova empresa
                              </Button>
                            </div>
                          )}
                        </CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {companies.map((company) => (
                              <CommandItem
                                key={company.id}
                                value={company.id}
                                onSelect={() => handleSelectCompany(company)}
                                className="flex items-start gap-3 py-3"
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 mt-1",
                                    selectedCompany?.id === company.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{company.name}</span>
                                    {company.lead_score > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {company.lead_score}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {company.cnpj && `📄 ${company.cnpj}`}
                                    {company.industry && ` • 🏭 ${company.industry}`}
                                    {company.employees && ` • 👥 ${company.employees} funcionários`}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {selectedCompany && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Dados da Empresa</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedCompany.cnpj && (
                      <div>
                        <span className="text-muted-foreground">CNPJ:</span> {selectedCompany.cnpj}
                      </div>
                    )}
                    {selectedCompany.industry && (
                      <div>
                        <span className="text-muted-foreground">Setor:</span> {selectedCompany.industry}
                      </div>
                    )}
                    {selectedCompany.employees && (
                      <div>
                        <span className="text-muted-foreground">Funcionários:</span> {selectedCompany.employees}
                      </div>
                    )}
                    {selectedCompany.revenue && (
                      <div>
                        <span className="text-muted-foreground">Faturamento:</span> {selectedCompany.revenue}
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {/* Múltiplos Contatos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Contatos *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContact}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Contato
                  </Button>
                </div>
                
                {contacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Contato {index + 1}</span>
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Input
                          placeholder="Nome completo *"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          required={index === 0}
                        />
                      </div>
                      <Input
                        type="email"
                        placeholder="email@empresa.com"
                        value={contact.email}
                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                      />
                      <Input
                        type="tel"
                        placeholder="(11) 98765-4321"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                      />
                      <div className="col-span-2">
                        <Input
                          placeholder="Cargo (ex: Gerente de TI)"
                          value={contact.role}
                          onChange={(e) => updateContact(index, 'role', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                <Label htmlFor="description-select">Observações</Label>
                <Textarea
                  id="description-select"
                  placeholder="Notas sobre o deal..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                📋 <strong>Busca Oficial:</strong> Preencha o CNPJ e clique em "Receita Federal" para carregar dados cadastrais oficiais
              </div>

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

              {/* CNPJ com Enriquecimento */}
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleEnrichCompany}
                    disabled={!formData.cnpj || enriching}
                  >
                    {enriching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 mr-2" />
                        Receita Federal
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Digite o CNPJ e clique para buscar dados oficiais da Receita Federal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa *</Label>
                <Input
                  id="company_name"
                  placeholder="Empresa XPTO Ltda"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Setor</Label>
                  <Input
                    id="industry"
                    placeholder="Indústria"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employees">Funcionários</Label>
                  <Input
                    id="employees"
                    type="number"
                    placeholder="50"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                  />
                </div>
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

              {/* Múltiplos Contatos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Contatos *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContact}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Contato
                  </Button>
                </div>
                
                {contacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Contato {index + 1}</span>
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Input
                          placeholder="Nome completo *"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          required={index === 0}
                        />
                      </div>
                      <Input
                        type="email"
                        placeholder="email@empresa.com"
                        value={contact.email}
                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                      />
                      <Input
                        type="tel"
                        placeholder="(11) 98765-4321"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                      />
                      <div className="col-span-2">
                        <Input
                          placeholder="Cargo (ex: Gerente de TI)"
                          value={contact.role}
                          onChange={(e) => updateContact(index, 'role', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                <Label htmlFor="description">Observações</Label>
                <Textarea
                  id="description"
                  placeholder="Notas sobre o deal..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
    </DraggableDialog>
  );
}
