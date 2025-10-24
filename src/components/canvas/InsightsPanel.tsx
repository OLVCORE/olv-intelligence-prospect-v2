import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  AlertTriangle, 
  Target, 
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Comment {
  id: string;
  type: 'comment' | 'insight' | 'risk' | 'hypothesis' | 'task';
  content: string;
  status: 'active' | 'resolved' | 'archived';
  created_at: string;
}

interface InsightsPanelProps {
  comments: Comment[];
  onAddComment: (type: Comment['type'], content: string) => void;
  onUpdateStatus: (id: string, status: Comment['status']) => void;
  onDelete: (id: string) => void;
}

export const InsightsPanel = ({
  comments,
  onAddComment,
  onUpdateStatus,
  onDelete
}: InsightsPanelProps) => {
  const [newContent, setNewContent] = useState('');
  const [selectedType, setSelectedType] = useState<Comment['type']>('insight');

  const handleAdd = () => {
    if (!newContent.trim()) return;
    onAddComment(selectedType, newContent);
    setNewContent('');
  };

  const getIcon = (type: Comment['type']) => {
    switch (type) {
      case 'insight': return <Lightbulb className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'hypothesis': return <Target className="h-4 w-4" />;
      case 'task': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getColor = (type: Comment['type']) => {
    switch (type) {
      case 'insight': return 'from-blue-500/10 to-blue-500/5 border-blue-500/20';
      case 'risk': return 'from-red-500/10 to-red-500/5 border-red-500/20';
      case 'hypothesis': return 'from-purple-500/10 to-purple-500/5 border-purple-500/20';
      case 'task': return 'from-green-500/10 to-green-500/5 border-green-500/20';
      default: return 'from-gray-500/10 to-gray-500/5 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Central de Inteligência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as Comment['type'])}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="insight">Insight</SelectItem>
                <SelectItem value="risk">Risco</SelectItem>
                <SelectItem value="hypothesis">Hipótese</SelectItem>
                <SelectItem value="task">Tarefa</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Adicione um insight, risco, hipótese ou tarefa..."
              className="flex-1 min-h-[60px]"
            />
          </div>
          <Button onClick={handleAdd} className="w-full" disabled={!newContent.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* List items */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {comments.filter(c => c.status === 'active').map((comment) => (
            <Card key={comment.id} className={`bg-gradient-to-br ${getColor(comment.type)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getIcon(comment.type)}
                      <Badge variant="outline" className="text-xs capitalize">
                        {comment.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateStatus(comment.id, 'resolved')}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDelete(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
