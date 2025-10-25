import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, Search, Calendar, 
  AlertCircle, Clock, User, Building2, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  due_date?: string;
  assigned_to?: string;
  company_id?: string;
  contact_id?: string;
  conversation_id?: string;
  created_at: string;
  company?: { id: string; name: string };
  contact?: { id: string; name: string };
}

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-100' },
  { id: 'done', title: 'Concluído', color: 'bg-green-100' },
] as const;

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-4 cursor-move hover:shadow-md transition-all',
        isDragging && 'shadow-lg'
      )}
    >
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium">{task.title}</h3>
            {task.due_date && (
              <Badge
                variant={
                  isOverdue(task.due_date) && task.status !== 'done'
                    ? 'destructive'
                    : 'secondary'
                }
                className="text-xs"
              >
                {isOverdue(task.due_date) && task.status !== 'done' ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Vencida
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(task.due_date), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </>
                )}
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {task.company && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {task.company.name}
              </div>
            )}
            {task.contact && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.contact.name}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function SDRTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    company_id: '',
    contact_id: '',
    status: 'todo' as const,
  });

  useEffect(() => {
    loadTasks();
    loadCompanies();
    loadContacts();

    const channel = supabase
      .channel('sdr-tasks-kanban')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sdr_tasks' }, loadTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sdr_tasks')
        .select(`
          *,
          company:companies(id, name),
          contact:contacts(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Erro ao carregar tarefas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    setCompanies(data || []);
  };

  const loadContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('id, name, company_id')
      .order('name');
    setContacts(data || []);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    if (COLUMNS.some(col => col.id === newStatus)) {
      try {
        const { error } = await supabase
          .from('sdr_tasks')
          .update({ status: newStatus })
          .eq('id', taskId);

        if (error) throw error;

        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        ));

        toast({
          title: 'Tarefa atualizada',
          description: `Movida para ${COLUMNS.find(c => c.id === newStatus)?.title}`,
        });
      } catch (error: any) {
        toast({
          title: 'Erro ao atualizar tarefa',
          description: error.message,
          variant: 'destructive',
        });
      }
    }

    setActiveId(null);
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.company_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e selecione uma empresa',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sdr_tasks')
        .insert([{
          ...newTask,
          due_date: newTask.due_date || null,
        }]);

      if (error) throw error;

      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi adicionada ao kanban',
      });

      setIsDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        company_id: '',
        contact_id: '',
        status: 'todo',
      });
      loadTasks();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.company?.name?.toLowerCase().includes(query) ||
      task.contact?.name?.toLowerCase().includes(query)
    );
  });

  const getColumnTasks = (status: Task['status']) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kanban de Tarefas</h1>
            <p className="text-muted-foreground">Arraste e solte para organizar suas tarefas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Nome da tarefa"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Detalhes da tarefa"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Empresa *</Label>
                  <Select
                    value={newTask.company_id}
                    onValueChange={(value) => setNewTask({ ...newTask, company_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contact">Contato</Label>
                  <Select
                    value={newTask.contact_id}
                    onValueChange={(value) => setNewTask({ ...newTask, contact_id: value })}
                    disabled={!newTask.company_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !newTask.company_id 
                          ? "Selecione uma empresa primeiro" 
                          : contacts.filter(c => c.company_id === newTask.company_id).length === 0
                          ? "Nenhum contato para esta empresa"
                          : "Selecionar contato (opcional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts
                        .filter(c => c.company_id === newTask.company_id)
                        .map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      {newTask.company_id && contacts.filter(c => c.company_id === newTask.company_id).length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum contato cadastrado para esta empresa
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!newTask.company_id ? 'Selecione uma empresa para filtrar contatos' : ''}
                  </p>
                </div>

                <div>
                  <Label htmlFor="due_date">Data de Vencimento</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>

                <Button onClick={createTask} className="w-full">
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const count = getColumnTasks(column.id).length;
            return (
              <Card key={column.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{column.title}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Kanban Board */}
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((column) => {
              const columnTasks = getColumnTasks(column.id);
              
              return (
                <div key={column.id} className="space-y-3">
                  <div className={cn('p-3 rounded-lg', column.color)}>
                    <h3 className="font-semibold flex items-center justify-between">
                      {column.title}
                      <Badge variant="secondary">{columnTasks.length}</Badge>
                    </h3>
                  </div>

                  <SortableContext
                    id={column.id}
                    items={columnTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[200px]">
                      {columnTasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma tarefa
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <Card className="p-4 rotate-3 shadow-xl">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium">{activeTask.title}</h3>
                    {activeTask.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activeTask.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  );
}
