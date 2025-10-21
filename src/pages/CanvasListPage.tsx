import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, PenTool, Calendar, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function CanvasListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: canvasList, isLoading } = useQuery({
    queryKey: ['canvas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canvas')
        .select('*, companies(name)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCreateCanvas = async () => {
    try {
      const { data, error } = await supabase
        .from('canvas')
        .insert({
          title: 'Novo Canvas',
          content: { blocks: [] },
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Canvas criado',
        description: 'Você pode começar a editar agora.',
      });

      navigate(`/canvas/${data.id}`);
    } catch (error) {
      console.error('Error creating canvas:', error);
      toast({
        title: 'Erro ao criar canvas',
        description: 'Não foi possível criar um novo canvas.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PenTool className="h-8 w-8" />
              Canvas Colaborativos
            </h1>
            <p className="text-muted-foreground mt-2">
              Crie documentos estratégicos com inteligência artificial
            </p>
          </div>
          <Button onClick={handleCreateCanvas} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Novo Canvas
          </Button>
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
                    <span className="truncate">{canvas.title}</span>
                    {canvas.is_template && <Badge variant="secondary">Template</Badge>}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Atualizado em{' '}
                    {new Date(canvas.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {canvas.companies && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {canvas.companies.name}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {(canvas.content as any)?.blocks?.length || 0} bloco(s)
                    </div>
                    {canvas.tags && canvas.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {canvas.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center">
                <PenTool className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Nenhum canvas criado ainda. Comece criando seu primeiro canvas!
                </p>
                <Button onClick={handleCreateCanvas}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Canvas
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}