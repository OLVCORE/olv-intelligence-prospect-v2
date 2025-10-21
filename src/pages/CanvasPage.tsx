import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCanvas, CanvasBlock } from '@/hooks/useCanvas';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2,
  GripVertical,
  FileText,
  Heading1,
  List
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canvas, isLoading, isSaving, isExecutingAI, updateContent, executeAICommand } = useCanvas(id);
  const [aiCommand, setAiCommand] = useState('');

  const handleAddBlock = (type: CanvasBlock['type']) => {
    const newBlock: CanvasBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      position: (canvas?.content.blocks.length || 0) + 1,
    };
    updateContent([...(canvas?.content.blocks || []), newBlock]);
  };

  const handleUpdateBlock = (blockId: string, content: string) => {
    const updatedBlocks = canvas?.content.blocks.map(block =>
      block.id === blockId ? { ...block, content } : block
    ) || [];
    updateContent(updatedBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = canvas?.content.blocks.filter(block => block.id !== blockId) || [];
    updateContent(updatedBlocks);
  };

  const handleAICommand = async () => {
    if (!aiCommand.trim()) return;
    await executeAICommand(aiCommand);
    setAiCommand('');
  };

  const renderBlock = (block: CanvasBlock) => {
    const commonClasses = "w-full p-3 border rounded-md bg-background";
    
    switch (block.type) {
      case 'heading':
        return (
          <Input
            value={block.content}
            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
            placeholder="Digite um título..."
            className={`${commonClasses} text-2xl font-bold`}
          />
        );
      case 'list':
        return (
          <Textarea
            value={block.content}
            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
            placeholder="Digite uma lista (uma linha por item)..."
            className={commonClasses}
            rows={5}
          />
        );
      case 'ai-response':
        return (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary mt-1" />
                <Badge variant="secondary">Resposta da IA</Badge>
              </div>
              <div className="prose prose-sm max-w-none">
                {block.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Textarea
            value={block.content}
            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
            placeholder="Digite seu texto..."
            className={commonClasses}
            rows={4}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!canvas) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Canvas não encontrado</p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => navigate('/dashboard')}>
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{canvas.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isSaving ? 'Salvando...' : 'Todas as alterações são salvas automaticamente'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Badge variant="secondary">Salvando...</Badge>}
            <Badge variant="outline">
              <Save className="h-3 w-3 mr-1" />
              Autosave ativo
            </Badge>
          </div>
        </div>

        {/* AI Command Bar */}
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Comandos de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                placeholder="Ex: 'Crie uma estratégia de abordagem para esta empresa' ou 'Sugira 3 pain points desta empresa'"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAICommand();
                  }
                }}
                disabled={isExecutingAI}
              />
              <Button 
                onClick={handleAICommand} 
                disabled={!aiCommand.trim() || isExecutingAI}
              >
                {isExecutingAI ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Executar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A IA analisará todo o contexto do canvas para gerar respostas personalizadas
            </p>
          </CardContent>
        </Card>

        {/* Add Block Toolbar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Adicionar bloco:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock('heading')}
              >
                <Heading1 className="h-4 w-4 mr-2" />
                Título
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock('text')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Texto
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock('list')}
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Canvas Blocks */}
        <div className="space-y-4">
          {canvas.content.blocks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum bloco ainda. Use os botões acima para adicionar conteúdo ou execute um comando de IA.
                </p>
              </CardContent>
            </Card>
          ) : (
            canvas.content.blocks.map((block) => (
              <Card key={block.id} className="group relative">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      {renderBlock(block)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Collaborators indicator */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Canvas colaborativo • Todas as alterações são sincronizadas em tempo real</span>
              <Badge variant="secondary" className="animate-pulse">
                🟢 Online
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}