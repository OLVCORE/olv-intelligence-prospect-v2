import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { CanvasBlock } from '@/hooks/useCanvasBlocks';

interface NoteBlockProps {
  block: CanvasBlock;
  onUpdate: (blockId: string, updates: Partial<CanvasBlock>) => void;
}

export const NoteBlock = ({ block, onUpdate }: NoteBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content.html || block.content.text || '');

  const handleSave = () => {
    onUpdate(block.id, {
      content: {
        ...block.content,
        html: content,
        text: content
      }
    });
    setIsEditing(false);
  };

  return (
    <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Badge variant="outline" className="text-gray-700 border-gray-500/50">
            <FileText className="h-3 w-3 mr-1" />
            Nota
          </Badge>

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite sua nota..."
                rows={6}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none cursor-pointer min-h-[60px]" 
              onClick={() => setIsEditing(true)}
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(content || '<p class="text-muted-foreground">Clique para adicionar conteúdo...</p>', {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote'],
                  ALLOWED_ATTR: ['class']
                })
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};