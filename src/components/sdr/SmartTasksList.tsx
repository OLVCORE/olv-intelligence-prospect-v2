import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useSmartTasks, useCompleteSmartTask } from '@/hooks/useSmartTasks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SmartTasksList() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent'>('pending');
  const { data: tasks, isLoading } = useSmartTasks({
    status: filter === 'all' ? undefined : filter === 'urgent' ? 'pending' : 'pending',
  });
  const completeTask = useCompleteSmartTask();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'follow_up': return '📞';
      case 'proposal': return '📄';
      case 'meeting': return '📅';
      case 'call': return '☎️';
      case 'email': return '📧';
      default: return '✓';
    }
  };

  const filteredTasks = tasks?.filter(task => {
    if (filter === 'urgent') {
      return task.priority === 'urgent' || task.priority === 'high';
    }
    return true;
  });

  const urgentCount = tasks?.filter(t => t.priority === 'urgent' || t.priority === 'high').length || 0;

  return (
    <Card className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Smart Tasks
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredTasks?.length || 0} tarefas {filter === 'pending' ? 'pendentes' : filter === 'urgent' ? 'urgentes' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter('urgent')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'urgent'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Urgentes
          {urgentCount > 0 && (
            <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              {urgentCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando tarefas...
          </div>
        ) : filteredTasks && filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={() => {
                  if (task.status !== 'completed') {
                    completeTask.mutate(task.id);
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getTaskIcon(task.task_type)}</span>
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                  {task.auto_created && (
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Auto
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.company_id && (
                    <span className="flex items-center gap-1">
                      🏢 Empresa vinculada
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(task.due_date), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
              {task.status === 'completed' && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {task.priority === 'urgent' && task.status !== 'completed' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhuma tarefa {filter === 'pending' ? 'pendente' : filter === 'urgent' ? 'urgente' : ''}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
