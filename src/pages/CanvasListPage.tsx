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

export default function CanvasListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [newCanvasTitle, setNewCanvasTitle] = useState('');
  const [newCanvasPurpose, setNewCanvasPurpose] = useState('');
  const [newCanvasTemplate, setNewCanvasTemplate] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
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
          companyId: selectedCompanyId || null,
          title: newCanvasTitle,
          purpose: newCanvasPurpose || null,
          template: newCanvasTemplate || null
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Canvas War Room
            </h1>
            <p className="text-muted-foreground mt-2">
              Workspace colaborativo vivo com IA • Contexto → Decisão → Execução
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Criar Canvas
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
                      <SelectItem value="">Nenhuma empresa</SelectItem>
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
                      <SelectItem value="">Canvas em branco</SelectItem>
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
            <Card className="col-span-full border-2 border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <Zap className="h-16 w-16 mx-auto text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Crie seu primeiro War Room</h3>
                    <p className="text-muted-foreground">
                      Um workspace colaborativo vivo que conecta contexto, decisões e execução com inteligência artificial
                    </p>
                  </div>
                  <Button onClick={() => setIsDialogOpen(true)} size="lg">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Criar Primeiro Canvas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}