import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { useCanvasIntelligence } from '@/hooks/useCanvasIntelligence';
import { useCanvasBlocks } from '@/hooks/useCanvasBlocks';
import { CompanyDataPanel } from '@/components/canvas/CompanyDataPanel';
import { InsightsPanel } from '@/components/canvas/InsightsPanel';
import { TimelinePanel } from '@/components/canvas/TimelinePanel';
import { MultiLayerEnrichButton } from '@/components/canvas/MultiLayerEnrichButton';
import { DecisionBlock } from '@/components/canvas/blocks/DecisionBlock';
import { InsightBlock } from '@/components/canvas/blocks/InsightBlock';
import { TaskBlock } from '@/components/canvas/blocks/TaskBlock';
import { NoteBlock } from '@/components/canvas/blocks/NoteBlock';
import { ReferenceBlock } from '@/components/canvas/blocks/ReferenceBlock';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Lightbulb,
  CheckCircle2,
  CheckSquare,
  Paperclip,
  GitBranch,
  Download,
  Zap
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = new URLSearchParams(window.location.search).get('company_id') || undefined;
  const { toast } = useToast();
  
  const {
    canvas,
    isLoading: isLoadingCanvas,
    isSaving,
    isExecutingAI,
    executeAICommand,
    companyData,
    digitalMaturity,
    governanceSignals,
    comments,
    addComment,
    updateCommentStatus,
    deleteComment,
    executeProactiveAI
  } = useCanvasIntelligence(id!, companyId);

  const {
    blocks,
    activities,
    links,
    isLoading: isLoadingBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    promoteDecisionToTask,
    createVersion
  } = useCanvasBlocks(id!);
  
  const [aiCommand, setAiCommand] = useState('');
  const [versionTag, setVersionTag] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  const handleAddBlock = async (type: 'note' | 'insight' | 'decision' | 'task' | 'reference') => {
    const defaultContent = {
      note: { html: '', text: '' },
      insight: { title: '', hypothesis: '', evidence: '', status: 'open' },
      decision: { title: '', why: '', impact: '', status: 'pending' },
      task: { title: '', description: '', status: 'todo', priority: 'medium' },
      reference: { source: 'maturity', snapshot_at: new Date().toISOString(), data: {} }
    };

    await addBlock(type, defaultContent[type]);
  };

  const handleAICommand = async () => {
    if (!aiCommand.trim()) return;
    await executeAICommand(aiCommand);
    setAiCommand('');
  };

  const handleCreateVersion = async () => {
    setIsCreatingVersion(true);
    await createVersion(versionTag, versionDescription);
    setIsCreatingVersion(false);
    setVersionTag('');
    setVersionDescription('');
  };

  const handleExport = async (format: 'json' | 'html') => {
    try {
      const { data, error } = await supabase.functions.invoke('canvas-export', {
        body: { canvasId: id, format }
      });

      if (error) throw error;

      // Criar download
      const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : data], {
        type: format === 'json' ? 'application/json' : 'text/html'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvas-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportado com sucesso',
        description: `Canvas exportado em formato ${format.toUpperCase()}.`
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o canvas.',
        variant: 'destructive'
      });
    }
  };

  const renderBlock = (block: any) => {
    switch (block.type) {
      case 'decision':
        return (
          <DecisionBlock
            block={block}
            onUpdate={updateBlock}
            onPromote={promoteDecisionToTask}
          />
        );
      case 'insight':
        return <InsightBlock block={block} onUpdate={updateBlock} />;
      case 'task':
        return <TaskBlock block={block} onUpdate={updateBlock} />;
      case 'note':
        return <NoteBlock block={block} onUpdate={updateBlock} />;
      case 'reference':
        return <ReferenceBlock block={block} />;
      default:
        return null;
    }
  };

  if (isLoadingCanvas || isLoadingBlocks) {
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
                <Button onClick={() => navigate('/canvas')}>
                  Voltar à Lista
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
        {/* Header - War Room */}
        <div className="flex items-center justify-between border-b border-primary/20 pb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/canvas')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" />
                {canvas.title}
                <Badge variant="secondary" className="text-xs">WAR ROOM</Badge>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isSaving ? 'Salvando...' : 'Colaboração em tempo real • IA proativa ativa'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Badge variant="secondary">Salvando...</Badge>}
            
            {/* Criar Versão */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Criar Versão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Snapshot de Versão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    placeholder="Tag (ex: v1.0, Pré-reunião...)"
                  />
                  <Textarea
                    value={versionDescription}
                    onChange={(e) => setVersionDescription(e.target.value)}
                    placeholder="Descrição opcional..."
                    rows={3}
                  />
                  <Button onClick={handleCreateVersion} disabled={isCreatingVersion} className="w-full">
                    <GitBranch className="h-4 w-4 mr-2" />
                    {isCreatingVersion ? 'Criando...' : 'Criar Versão'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Exportar */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Exportar Canvas</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Button onClick={() => handleExport('json')} className="w-full">
                    JSON
                  </Button>
                  <Button onClick={() => handleExport('html')} className="w-full" variant="outline">
                    HTML
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={executeProactiveAI}
              disabled={!companyData}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              IA Proativa
            </Button>
            <Badge variant="outline">
              <Save className="h-3 w-3 mr-1" />
              Autosave
            </Badge>
          </div>
        </div>

        {/* Company Data Panel with Multi-Layer Enrichment */}
        {companyData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dados da Empresa</h2>
              <MultiLayerEnrichButton
                companyId={companyData.id}
                cnpj={companyData.cnpj}
                onComplete={() => {
                  // Recarregar dados da empresa após enriquecimento
                  window.location.reload();
                }}
              />
            </div>
            <CompanyDataPanel
              company={companyData}
              digitalMaturity={digitalMaturity}
              techStack={companyData.technologies}
              buyingSignals={governanceSignals}
            />
          </div>
        )}

        {/* AI Command Bar */}
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                placeholder="Ex: 'Crie uma estratégia de abordagem' ou 'Sugira 3 pain points'"
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
          </CardContent>
        </Card>

        {/* Add Block Toolbar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Adicionar bloco:</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleAddBlock('note')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Nota
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">Anotações livres em texto ou HTML para documentar informações importantes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleAddBlock('insight')}>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Insight
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">Descobertas e hipóteses estratégicas com evidências que suportam a conclusão</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleAddBlock('decision')}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Decisão
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">Registre decisões estratégicas com motivação, impacto esperado e responsável</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleAddBlock('task')}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Tarefa
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">Tarefas acionáveis com responsável, prazo, prioridade e status de execução</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleAddBlock('reference')}>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Referência
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">Snapshot de dados de outros módulos (maturidade, fit, tech) para contexto histórico</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {/* Main Content: Tabs */}
        <Tabs defaultValue="canvas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="canvas">📋 Canvas ({blocks.length})</TabsTrigger>
            <TabsTrigger value="timeline">⏰ Timeline ({activities.length})</TabsTrigger>
            <TabsTrigger value="links">🔗 Links ({links.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Insights Panel (1/3) */}
              <div className="lg:col-span-1">
                <InsightsPanel
                  comments={comments}
                  onAddComment={addComment}
                  onUpdateStatus={updateCommentStatus}
                  onDelete={deleteComment}
                />
              </div>

              {/* Canvas Blocks (2/3) */}
              <div className="lg:col-span-2 space-y-4">
                {blocks.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Nenhum bloco ainda. Use os botões acima para adicionar conteúdo ou execute um comando de IA.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  blocks.map((block) => (
                    <div key={block.id} className="group relative">
                      <div className="absolute -left-10 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col gap-2">
                          <div className="cursor-move">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteBlock(block.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {renderBlock(block)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <TimelinePanel activities={activities} />
          </TabsContent>

          <TabsContent value="links">
            <Card>
              <CardContent className="pt-6">
                {links.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum link com outros módulos ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <Badge variant="outline">{link.target_type}</Badge>
                          <p className="text-sm mt-1">ID: {link.target_id}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          Ver →
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Collaborators indicator */}
        <Card className="border-dashed bg-gradient-to-r from-primary/5 to-transparent">
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