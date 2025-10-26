import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, PenTool, Calendar, Building2, Zap, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { CanvasTutorial } from '@/components/canvas/CanvasTutorial';
import { CanvasDashboard } from '@/components/canvas/CanvasDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CanvasListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [newCanvasTitle, setNewCanvasTitle] = useState('');
  const [newCanvasPurpose, setNewCanvasPurpose] = useState('');
  const [newCanvasTemplate, setNewCanvasTemplate] = useState('blank');
  const [selectedCompanyId, setSelectedCompanyId] = useState('none');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: canvasList, isLoading, refetch } = useQuery({
    queryKey: ['canvas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canvas')
        .select('*, companies(name, cnpj)')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-for-canvas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, cnpj')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleCreateCanvas = async () => {
    if (!newCanvasTitle.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe um título para o canvas.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingCanvas(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('canvas-create', {
        body: {
          companyId: selectedCompanyId === 'none' ? null : selectedCompanyId,
          title: newCanvasTitle,
          purpose: newCanvasPurpose || null,
          template: newCanvasTemplate === 'blank' ? null : newCanvasTemplate
        }
      });

      if (error) throw error;

      toast({
        title: 'Canvas criado',
        description: 'Redirecionando para edição...',
      });

      setIsDialogOpen(false);
      setNewCanvasTitle('');
      setNewCanvasPurpose('');
      setNewCanvasTemplate('');
      setSelectedCompanyId('');
      
      refetch();
      navigate(`/canvas/${data.canvas.id}${selectedCompanyId ? `?company_id=${selectedCompanyId}` : ''}`);
    } catch (error) {
      console.error('Error creating canvas:', error);
      toast({
        title: 'Erro ao criar canvas',
        description: 'Não foi possível criar o canvas.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCanvas(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-12">
        {/* Hero Landing Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/5 border border-primary/20 p-12">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/30">
              <Zap className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-semibold">Inteligência Colaborativa em Tempo Real</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Canvas War Room
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary mt-2">
                Decisões Inteligentes • Execução Ágil
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              O Canvas War Room é seu workspace colaborativo vivo onde contexto empresarial, 
              inteligência artificial e execução convergem. Transforme dados em decisões, 
              decisões em tarefas e tarefas em resultados — tudo em um único ambiente unificado.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-lg px-8 py-6 h-auto shadow-lg shadow-primary/25">
                    <Sparkles className="h-6 w-6" />
                    Criar Meu Canvas
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Criar Novo Canvas War Room
                    </DialogTitle>
                    <DialogDescription>
                      Crie um canvas colaborativo conectado com inteligência, decisões e execução
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Título *</label>
                      <Input
                        value={newCanvasTitle}
                        onChange={(e) => setNewCanvasTitle(e.target.value)}
                        placeholder="Ex: Descoberta Master Indústria, Qualificação TOTVS..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Empresa (opcional)</label>
                      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma empresa..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma empresa</SelectItem>
                          {companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name} {company.cnpj ? `(${company.cnpj})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Conecta automaticamente dados de Maturidade, Fit, Tech Stack, Decisores
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Template (opcional)</label>
                      <Select value={newCanvasTemplate} onValueChange={setNewCanvasTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blank">Canvas em branco</SelectItem>
                          <SelectItem value="descoberta">🔍 Descoberta Inicial</SelectItem>
                          <SelectItem value="qualificacao">✅ Qualificação de Oportunidade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Propósito (opcional)</label>
                      <Textarea
                        value={newCanvasPurpose}
                        onChange={(e) => setNewCanvasPurpose(e.target.value)}
                        placeholder="Ex: Mapear oportunidades e definir estratégia de abordagem..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleCreateCanvas} 
                      className="w-full" 
                      size="lg"
                      disabled={isCreatingCanvas || !newCanvasTitle.trim()}
                    >
                      {isCreatingCanvas ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Criar Canvas War Room
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 max-w-4xl mx-auto">
              <div className="bg-background/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">360°</div>
                <div className="text-sm text-muted-foreground">Visão Contextual Completa</div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-500 mb-2">AI</div>
                <div className="text-sm text-muted-foreground">Assistente Proativo</div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">∞</div>
                <div className="text-sm text-muted-foreground">Colaboração Infinita</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-primary/20 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Contexto Enriquecido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Conecte automaticamente dados de empresas: Maturidade Digital, Fit Score, 
                Tech Stack, Decisores e Sinais de Compra em tempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-500/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-500" />
              </div>
              <CardTitle className="text-xl">IA Colaborativa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Assistente AI proativo que sugere insights, identifica padrões, 
                e recomenda próximos passos baseado no contexto do canvas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Execução Ágil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Transforme decisões em tarefas SDR automaticamente. 
                Timeline viva rastreando todas as ações e mudanças do time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Use Cases Section */}
        <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-3xl p-8 border border-border">
          <h2 className="text-3xl font-bold text-center mb-8">
            Como Usar o Canvas War Room
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Descoberta Inicial</h3>
                  <p className="text-sm text-muted-foreground">
                    Vincule uma empresa ao canvas e veja automaticamente dados de maturidade, 
                    tech stack e decisores. Adicione notas, insights e referências.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Análise Colaborativa</h3>
                  <p className="text-sm text-muted-foreground">
                    Use comandos AI (/ai) para obter insights. A IA analisa o contexto completo 
                    e sugere oportunidades, riscos e próximos passos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-500">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Decisões Estratégicas</h3>
                  <p className="text-sm text-muted-foreground">
                    Crie blocos de decisão para registrar escolhas importantes. 
                    Promova decisões diretamente para tarefas SDR executáveis.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-500">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Execução e Timeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe todas as atividades na timeline. Exporte canvas para compartilhar 
                    com stakeholders. Versione momentos importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CanvasTutorial />

        <Tabs defaultValue="canvas" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="canvas" className="gap-2">
              <Zap className="h-4 w-4" />
              Meus Canvas
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </>
          ) : canvasList && canvasList.length > 0 ? (
            canvasList.map((canvas) => (
              <Card
                key={canvas.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/canvas/${canvas.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      {canvas.title}
                    </span>
                    <div className="flex gap-1">
                      {canvas.is_template && <Badge variant="secondary">Template</Badge>}
                      {canvas.status === 'archived' && <Badge variant="outline">Arquivado</Badge>}
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Atualizado {new Date(canvas.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {canvas.companies && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{canvas.companies.name}</span>
                        {canvas.companies.cnpj && (
                          <Badge variant="outline" className="text-xs">{canvas.companies.cnpj}</Badge>
                        )}
                      </div>
                    )}
                    
                    {canvas.purpose && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {canvas.purpose}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        📋 {(canvas.content as any)?.blocks?.length || 0} blocos
                      </span>
                      {canvas.template && (
                        <Badge variant="outline" className="text-xs">
                          {canvas.template}
                        </Badge>
                      )}
                    </div>
                    
                    {canvas.tags && canvas.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {canvas.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full border-2 border-dashed bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                    <Zap className="h-20 w-20 mx-auto text-primary relative" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Crie seu primeiro War Room</h3>
                    <p className="text-muted-foreground">
                      Um workspace colaborativo vivo que conecta contexto, decisões e execução com inteligência artificial
                    </p>
                  </div>
                  <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
                    <Sparkles className="h-5 w-5" />
                    Criar Primeiro Canvas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <CanvasDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}