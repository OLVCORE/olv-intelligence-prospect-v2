import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, Video, MessageSquare, FileText, CheckCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  contact_person: string;
  contact_role: string;
  contact_phone: string;
  contact_email: string;
  outcome: string;
  next_steps: string;
  next_action_date: string;
  duration_minutes: number;
  activity_date: string;
  company_id: string;
  companies: { name: string };
}

const activityIcons: Record<string, any> = {
  call: Phone,
  meeting: Video,
  email: Mail,
  whatsapp: MessageSquare,
  linkedin: MessageSquare,
  demo: Video,
  proposal: FileText,
  follow_up: CheckCircle,
  note: FileText,
  other: Calendar,
};

const activityLabels: Record<string, string> = {
  call: 'Ligação',
  meeting: 'Reunião',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  demo: 'Demonstração',
  proposal: 'Proposta',
  follow_up: 'Follow-up',
  note: 'Nota',
  other: 'Outro',
};

export default function ActivitiesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*, companies(name)')
        .order('activity_date', { ascending: false });
      
      if (error) throw error;
      return data as Activity[];
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createActivity = useMutation({
    mutationFn: async (newActivity: any) => {
      const { data, error } = await supabase
        .from('activities')
        .insert([newActivity])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success("Atividade registrada com sucesso!");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao registrar atividade: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newActivity = {
      company_id: formData.get('company_id'),
      activity_type: formData.get('activity_type'),
      title: formData.get('title'),
      description: formData.get('description'),
      contact_person: formData.get('contact_person'),
      contact_role: formData.get('contact_role'),
      contact_phone: formData.get('contact_phone'),
      contact_email: formData.get('contact_email'),
      outcome: formData.get('outcome'),
      next_steps: formData.get('next_steps'),
      next_action_date: formData.get('next_action_date') || null,
      duration_minutes: formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null,
      activity_date: formData.get('activity_date') || new Date().toISOString(),
    };

    createActivity.mutate(newActivity);
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Log de Atividades</h1>
          <p className="text-muted-foreground mt-2">
            Registre todas as interações com clientes e prospects
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nova Atividade</DialogTitle>
              <DialogDescription>
                Documente sua interação com o cliente ou prospect
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_id">Empresa *</Label>
                <Select name="company_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activity_type">Tipo de Atividade *</Label>
                  <Select name="activity_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(activityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity_date">Data *</Label>
                  <Input type="datetime-local" name="activity_date" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input name="title" placeholder="Ex: Reunião de alinhamento com CFO" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea name="description" placeholder="Detalhes da atividade..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contato</Label>
                  <Input name="contact_person" placeholder="Nome do contato" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_role">Cargo</Label>
                  <Input name="contact_role" placeholder="Ex: CFO" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone</Label>
                  <Input name="contact_phone" type="tel" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">E-mail</Label>
                  <Input name="contact_email" type="email" placeholder="contato@empresa.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome">Resultado</Label>
                <Textarea name="outcome" placeholder="Qual foi o resultado desta interação?" rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_steps">Próximos Passos</Label>
                <Textarea name="next_steps" placeholder="O que deve ser feito a seguir?" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="next_action_date">Próxima Ação</Label>
                  <Input type="date" name="next_action_date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duração (min)</Label>
                  <Input type="number" name="duration_minutes" placeholder="Ex: 30" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Atividade</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map(activity => {
            const Icon = activityIcons[activity.activity_type];
            return (
              <Card key={activity.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>{activity.companies?.name}</span>
                          <span>•</span>
                          <span>{format(new Date(activity.activity_date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>
                          {activity.duration_minutes && (
                            <>
                              <span>•</span>
                              <span>{activity.duration_minutes} min</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {activityLabels[activity.activity_type]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.description && (
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  )}

                  {(activity.contact_person || activity.contact_role) && (
                    <div className="flex items-center gap-4 text-sm">
                      {activity.contact_person && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Contato:</span>
                          <span>{activity.contact_person}</span>
                        </div>
                      )}
                      {activity.contact_role && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Cargo:</span>
                          <span>{activity.contact_role}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {activity.outcome && (
                    <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                      <p className="text-sm font-medium text-success mb-1">Resultado:</p>
                      <p className="text-sm text-muted-foreground">{activity.outcome}</p>
                    </div>
                  )}

                  {activity.next_steps && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-primary">Próximos Passos:</p>
                        {activity.next_action_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(activity.next_action_date), 'dd MMM', { locale: ptBR })}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.next_steps}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma atividade registrada</h3>
            <p className="text-muted-foreground text-center mb-6">
              Comece a documentar suas interações com clientes
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeira Atividade
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
