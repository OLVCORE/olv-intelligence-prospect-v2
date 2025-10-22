import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Calendar, User } from 'lucide-react';
import type { CanvasBlock } from '@/hooks/useCanvasBlocks';

interface DecisionBlockProps {
  block: CanvasBlock;
  onUpdate: (blockId: string, updates: Partial<CanvasBlock>) => void;
  onPromote?: (blockId: string) => void;
}

export const DecisionBlock = ({ block, onUpdate, onPromote }: DecisionBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.content.title || '');
  const [why, setWhy] = useState(block.content.why || '');
  const [impact, setImpact] = useState(block.content.impact || '');
  const [owner, setOwner] = useState(block.content.owner || '');
  const [dueAt, setDueAt] = useState(block.content.due_at || '');

  const handleSave = () => {
    onUpdate(block.id, {
      content: {
        ...block.content,
        title,
        why,
        impact,
        owner,
        due_at: dueAt,
        status: block.content.status || 'pending'
      }
    });
    setIsEditing(false);
  };

  return (
    <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-green-700 border-green-500/50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Decisão
            </Badge>
            {!isEditing && onPromote && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPromote(block.id)}
                className="text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Criar Tarefa SDR
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da decisão..."
                className="font-semibold"
              />
              <Textarea
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Por quê? Motivação e contexto..."
                rows={3}
              />
              <Textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="Impacto esperado..."
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Responsável..."
                />
                <Input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  placeholder="Data alvo..."
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 cursor-pointer" onClick={() => setIsEditing(true)}>
              <h3 className="font-semibold text-lg">{title || 'Sem título'}</h3>
              {why && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Por quê:</p>
                  <p className="text-sm">{why}</p>
                </div>
              )}
              {impact && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Impacto:</p>
                  <p className="text-sm">{impact}</p>
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                {owner && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {owner}
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