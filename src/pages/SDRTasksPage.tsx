import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Search, CheckCircle2, Circle, Calendar, 
  AlertCircle, Clock, User, Building2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'done';
  due_date?: string;
  assigned_to?: string;
  company_id?: string;
  contact_id?: string;
  created_at: string;
  company?: { name: string };
  contact?: { name: string };
}

export default function SDRTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel('sdr-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sdr_tasks' }, loadTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sdr_tasks')
        .select(`
          *,
          company:companies(name),
          contact:contacts(name)
        `)
        .order('due_date', { ascending: true });

      const today = new Date().toISOString().split('T')[0];

      if (filter === 'today') {
        query = query.eq('due_date', today);
      } else if (filter === 'overdue') {
        query = query.lt('due_date', today).neq('status', 'done');
      } else if (filter === 'upcoming') {
        query = query.gt('due_date', today);
      }

      const { data, error } = await query;

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

  const toggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      
      const { error } = await supabase
        .from('sdr_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus as 'todo' | 'done' } : task
      ));

      toast({
        title: newStatus === 'done' ? 'Tarefa concluída' : 'Tarefa reaberta',
        description: 'Status atualizado com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar tarefa',
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

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const isToday = (dueDate?: string) => {
    if (!dueDate) return false;
    return dueDate === new Date().toISOString().split('T')[0];
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={cn(
      'p-4 hover:shadow-md transition-all',
      task.status === 'done' && 'opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.status === 'done'}
          onCheckedChange={() => toggleTask(task.id, task.status)}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={cn(
              'font-medium',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h3>
            {task.due_date && (
              <Badge
                variant={
                  isOverdue(task.due_date) && task.status !== 'done'
                    ? 'destructive'
                    : isToday(task.due_date)
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs"
              >
                {isToday(task.due_date) ? (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Hoje
                  </>
                ) : isOverdue(task.due_date) && task.status !== 'done' ? (
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
            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Central de Tarefas</h1>
            <p className="text-muted-foreground">Gerencie suas atividades diárias</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Fazer</p>
                <p className="text-2xl font-bold">{todoTasks.length}</p>
              </div>
              <Circle className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{doneTasks.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => isToday(t.due_date)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="overdue">Vencidas</TabsTrigger>
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tasks List */}
        <Tabs defaultValue="todo">
          <TabsList>
            <TabsTrigger value="todo">
              A Fazer ({todoTasks.length})
            </TabsTrigger>
            <TabsTrigger value="done">
              Concluídas ({doneTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="space-y-3 mt-4">
            {todoTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">Nenhuma tarefa pendente</p>
              </div>
            ) : (
              todoTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>

          <TabsContent value="done" className="space-y-3 mt-4">
            {doneTasks.length === 0 ? (
              <div className="text-center py-12">
                <Circle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">Nenhuma tarefa concluída</p>
              </div>
            ) : (
              doneTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
