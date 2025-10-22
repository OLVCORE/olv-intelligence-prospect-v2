import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Calendar, User } from 'lucide-react';
import type { CanvasBlock } from '@/hooks/useCanvasBlocks';

interface TaskBlockProps {
  block: CanvasBlock;
  onUpdate: (blockId: string, updates: Partial<CanvasBlock>) => void;
}

export const TaskBlock = ({ block, onUpdate }: TaskBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.content.title || '');
  const [description, setDescription] = useState(block.content.description || '');
  const [assignee, setAssignee] = useState(block.content.assignee || '');
  const [dueAt, setDueAt] = useState(block.content.due_at || '');
  const [priority, setPriority] = useState(block.content.priority || 'medium');
  const [status, setStatus] = useState(block.content.status || 'todo');

  const handleSave = () => {
    onUpdate(block.id, {
      content: {
        ...block.content,
        title,
        description,
        assignee,
        due_at: dueAt,
        priority,
        status
      }
    });
    setIsEditing(false);
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700'
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    doing: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700'
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-purple-700 border-purple-500/50">
              <CheckSquare className="h-3 w-3 mr-1" />
              Tarefa
            </Badge>
            <div className="flex gap-2">
              <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
                {priority === 'low' && 'Baixa'}
                {priority === 'medium' && 'Média'}
                {priority === 'high' && 'Alta'}
              </Badge>
              <Badge className={statusColors[status as keyof typeof statusColors]}>
                {status === 'todo' && 'A Fazer'}
                {status === 'doing' && 'Fazendo'}
                {status === 'done' && 'Feito'}
              </Badge>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da tarefa..."
                className="font-semibold"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição..."
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Responsável..."
                />
                <Input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="low">Prioridade Baixa</option>
                  <option value="medium">Prioridade Média</option>
                  <option value="high">Prioridade Alta</option>
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="todo">A Fazer</option>
                  <option value="doing">Fazendo</option>
                  <option value="done">Feito</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 cursor-pointer" onClick={() => setIsEditing(true)}>
              <h3 className="font-semibold text-lg">{title || 'Sem título'}</h3>
              {description && <p className="text-sm">{description}</p>}
              <div className="flex gap-4 text-sm text-muted-foreground">
                {assignee && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {assignee}
                  </div>
                )}
                {dueAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(dueAt).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};