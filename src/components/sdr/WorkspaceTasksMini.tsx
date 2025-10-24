import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckSquare, Plus, Calendar, Building2, 
  AlertCircle, ExternalLink, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  due_date?: string;
  company_id?: string;
  created_at: string;
  company?: { id: string; name: string };
}

export function WorkspaceTasksMini() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    
    const channel = supabase
      .channel('workspace-tasks-mini')
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
          company:companies(id, name)
        `)
        .in('status', ['todo', 'in_progress'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(20);

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: Task['status']) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    
    try {
      const { error } = await supabase
        .from('sdr_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));

      toast({
        title: newStatus === 'done' ? 'Tarefa concluída' : 'Tarefa reaberta',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tarefas & Follow-ups
          </h2>
          <p className="text-sm text-muted-foreground">
            {todoTasks.length} pendentes, {inProgressTasks.length} em progresso
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="default" asChild>
            <Link to="/sdr/tasks">
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sdr/tasks">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground mb-4">Nenhuma tarefa pendente</p>
            <Button size="sm" asChild>
              <Link to="/sdr/tasks">
                <Plus className="h-4 w-4 mr-2" />
                Criar Tarefa
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const overdue = isOverdue(task.due_date);
              
              return (
                <Card 
                  key={task.id}
                  className={cn(
                    "p-3 hover:shadow-md transition-shadow",
                    overdue && "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                        {task.due_date && (
                          <Badge
                            variant={overdue ? 'destructive' : 'secondary'}
                            className="text-xs ml-2"
                          >
                            {overdue ? (
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
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      {task.company && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {task.company.name}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
