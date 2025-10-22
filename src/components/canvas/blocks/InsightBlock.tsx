import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import type { CanvasBlock } from '@/hooks/useCanvasBlocks';

interface InsightBlockProps {
  block: CanvasBlock;
  onUpdate: (blockId: string, updates: Partial<CanvasBlock>) => void;
}

export const InsightBlock = ({ block, onUpdate }: InsightBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.content.title || '');
  const [hypothesis, setHypothesis] = useState(block.content.hypothesis || '');
  const [evidence, setEvidence] = useState(block.content.evidence || '');
  const [status, setStatus] = useState(block.content.status || 'open');

  const handleSave = () => {
    onUpdate(block.id, {
      content: {
        ...block.content,
        title,
        hypothesis,
        evidence,
        status
      }
    });
    setIsEditing(false);
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-700 border-blue-200',
    validating: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-blue-700 border-blue-500/50">
              <Lightbulb className="h-3 w-3 mr-1" />
              Insight
            </Badge>
            {!isEditing && (
              <Badge className={statusColors[status as keyof typeof statusColors]}>
                {status === 'open' && 'Aberto'}
                {status === 'validating' && 'Validando'}
                {status === 'approved' && 'Aprovado'}
                {status === 'rejected' && 'Rejeitado'}
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do insight..."
                className="font-semibold"
              />
              <Textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="Hipótese..."
                rows={3}
              />
              <Textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Evidências..."
                rows={2}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="open">Aberto</option>
                <option value="validating">Validando</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
              </select>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 cursor-pointer" onClick={() => setIsEditing(true)}>
              <h3 className="font-semibold text-lg">{title || 'Sem título'}</h3>
              {hypothesis && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hipótese:</p>
                  <p className="text-sm">{hypothesis}</p>
                </div>
              )}
              {evidence && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Evidências:</p>
                  <p className="text-sm">{evidence}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};