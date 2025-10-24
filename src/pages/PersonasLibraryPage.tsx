import { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBuyerPersonas, useCreateBuyerPersona, useUpdateBuyerPersona, useDeleteBuyerPersona } from '@/hooks/useBuyerPersonas';
import { useToast } from '@/hooks/use-toast';

export default function PersonasLibraryPage() {
  const { data: personas, isLoading } = useBuyerPersonas();
  const createPersona = useCreateBuyerPersona();
  const updatePersona = useUpdateBuyerPersona();
  const deletePersona = useDeleteBuyerPersona();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    seniority: 'Gerência',
    department: '',
    communication_style: '',
    decision_factors: '',
    pain_points: '',
    motivators: '',
    objections: '',
    preferred_channels: '',
    best_approach: '',
    meeting_style: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      decision_factors: formData.decision_factors.split(',').map(s => s.trim()),
      pain_points: formData.pain_points.split(',').map(s => s.trim()),
      motivators: formData.motivators.split(',').map(s => s.trim()),
      objections: formData.objections.split(',').map(s => s.trim()),
      preferred_channels: formData.preferred_channels.split(',').map(s => s.trim()),
    };

    if (editingPersona) {
      await updatePersona.mutateAsync({ id: editingPersona.id, updates: data });
    } else {
      await createPersona.mutateAsync(data);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      seniority: 'Gerência',
      department: '',
      communication_style: '',
      decision_factors: '',
      pain_points: '',
      motivators: '',
      objections: '',
      preferred_channels: '',
      best_approach: '',
      meeting_style: '',
    });
    setEditingPersona(null);
  };

  const handleEdit = (persona: any) => {
    setEditingPersona(persona);
    setFormData({
      name: persona.name,
      role: persona.role,
      seniority: persona.seniority,
      department: persona.department || '',
      communication_style: persona.communication_style || '',
      decision_factors: (persona.decision_factors || []).join(', '),
      pain_points: (persona.pain_points || []).join(', '),
      motivators: (persona.motivators || []).join(', '),
      objections: (persona.objections || []).join(', '),
      preferred_channels: (persona.preferred_channels || []).join(', '),
      best_approach: persona.best_approach || '',
      meeting_style: persona.meeting_style || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta persona?')) {
      await deletePersona.mutateAsync(id);
    }
  };

  const handleDuplicate = (persona: any) => {
    setFormData({
      name: `${persona.name} (Cópia)`,
      role: persona.role,
      seniority: persona.seniority,
      department: persona.department || '',
      communication_style: persona.communication_style || '',
      decision_factors: (persona.decision_factors || []).join(', '),
      pain_points: (persona.pain_points || []).join(', '),
      motivators: (persona.motivators || []).join(', '),
      objections: (persona.objections || []).join(', '),
      preferred_channels: (persona.preferred_channels || []).join(', '),
      best_approach: persona.best_approach || '',
      meeting_style: persona.meeting_style || '',
    });
    setIsDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca de Personas</h1>
            <p className="text-muted-foreground">Gerencie os perfis de buyer personas para suas estratégias</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Persona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPersona ? 'Editar Persona' : 'Nova Persona'}</DialogTitle>
                <DialogDescription>
                  Defina as características e comportamentos desta buyer persona
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Persona *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: CEO Visionário"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      placeholder="Ex: CEO, CFO, CTO"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seniority">Senioridade *</Label>
                    <Select value={formData.seniority} onValueChange={(v) => setFormData({...formData, seniority: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C-Level">C-Level</SelectItem>
                        <SelectItem value="Diretoria">Diretoria</SelectItem>
                        <SelectItem value="Gerência">Gerência</SelectItem>
                        <SelectItem value="Coordenação">Coordenação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="Ex: Financeiro, TI, Operações"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="communication_style">Estilo de Comunicação</Label>
                  <Input
                    id="communication_style"
                    value={formData.communication_style}
                    onChange={(e) => setFormData({...formData, communication_style: e.target.value})}
                    placeholder="Ex: Direto e Objetivo, Analítico, Relacionamento"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="decision_factors">Fatores de Decisão (separados por vírgula)</Label>
                  <Textarea
                    id="decision_factors"
                    value={formData.decision_factors}
                    onChange={(e) => setFormData({...formData, decision_factors: e.target.value})}
                    placeholder="Ex: ROI, Segurança, Escalabilidade, Suporte"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pain_points">Dores e Desafios (separados por vírgula)</Label>
                  <Textarea
                    id="pain_points"
                    value={formData.pain_points}
                    onChange={(e) => setFormData({...formData, pain_points: e.target.value})}
                    placeholder="Ex: Falta de controle, Processos manuais, Sistemas legados"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motivators">Motivadores (separados por vírgula)</Label>
                  <Textarea
                    id="motivators"
                    value={formData.motivators}
                    onChange={(e) => setFormData({...formData, motivators: e.target.value})}
                    placeholder="Ex: Crescimento, Eficiência, Inovação"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="objections">Objeções Típicas (separadas por vírgula)</Label>
                  <Textarea
                    id="objections"
                    value={formData.objections}
                    onChange={(e) => setFormData({...formData, objections: e.target.value})}
                    placeholder="Ex: Custo elevado, Tempo de implementação, Complexidade"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferred_channels">Canais Preferidos (separados por vírgula)</Label>
                  <Input
                    id="preferred_channels"
                    value={formData.preferred_channels}
                    onChange={(e) => setFormData({...formData, preferred_channels: e.target.value})}
                    placeholder="Ex: email, whatsapp, linkedin, reunião presencial"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="best_approach">Melhor Abordagem</Label>
                  <Textarea
                    id="best_approach"
                    value={formData.best_approach}
                    onChange={(e) => setFormData({...formData, best_approach: e.target.value})}
                    placeholder="Descreva a estratégia de abordagem recomendada"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meeting_style">Estilo de Reunião</Label>
                  <Textarea
                    id="meeting_style"
                    value={formData.meeting_style}
                    onChange={(e) => setFormData({...formData, meeting_style: e.target.value})}
                    placeholder="Como essa persona prefere conduzir reuniões"
                    rows={2}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingPersona ? 'Atualizar' : 'Criar'} Persona
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando personas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas?.map((persona) => (
              <Card key={persona.id} className="relative">
                {persona.is_default && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3" />
                      Padrão
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-xl">{persona.name}</CardTitle>
                  <CardDescription>
                    {persona.role} • {persona.seniority}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Estilo de Comunicação</p>
                    <p className="text-sm text-muted-foreground">{persona.communication_style || 'Não definido'}</p>
                  </div>
                  
                  {Array.isArray(persona.decision_factors) && persona.decision_factors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Fatores de Decisão</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.decision_factors.slice(0, 3).map((factor: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{String(factor)}</Badge>
                        ))}
                        {persona.decision_factors.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{persona.decision_factors.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {Array.isArray(persona.preferred_channels) && persona.preferred_channels.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Canais Preferidos</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.preferred_channels.map((channel: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{String(channel)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(persona)}
                      className="flex-1"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(persona)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    
                    {!persona.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(persona.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
