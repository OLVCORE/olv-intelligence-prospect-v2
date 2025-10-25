import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SequenceDialog } from '@/components/sdr/SequenceDialog';
import { 
  Plus, Zap, Mail, MessageSquare, Clock, 
  Play, Pause, Edit, Copy, Trash2, Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sequence {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  steps?: SequenceStep[];
  runs?: number;
}

interface SequenceStep {
  id: string;
  step_order: number;
  channel: string;
  day_offset: number;
  template_id?: string;
}

export default function SDRSequencesPage() {
  const { toast } = useToast();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sdr_sequences')
        .select(`
          *,
          steps:sdr_sequence_steps(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count runs for each sequence
      const sequencesWithRuns = await Promise.all(
        (data || []).map(async (seq) => {
          const { count } = await supabase
            .from('sdr_sequence_runs')
            .select('*', { count: 'exact', head: true })
            .eq('sequence_id', seq.id)
            .eq('status', 'running');

          return { ...seq, runs: count || 0 };
        })
      );

      setSequences(sequencesWithRuns as Sequence[]);
    } catch (error: any) {
      console.error('Error loading sequences:', error);
      toast({
        title: 'Erro ao carregar sequências',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSequence = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('sdr_sequences')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;

      setSequences(sequences.map(seq =>
        seq.id === id ? { ...seq, active: !active } : seq
      ));

      toast({
        title: !active ? 'Sequência ativada' : 'Sequência pausada',
        description: !active 
          ? 'A sequência está agora ativa' 
          : 'A sequência foi pausada',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar sequência',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sequências de Cadência</h1>
            <p className="text-muted-foreground">Automação de follow-ups e engajamento</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sequência
          </Button>
          
          <SequenceDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen}
            onSuccess={loadSequences}
          />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sequências</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sequences.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sequences.filter(s => s.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads em Sequência</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sequences.reduce((sum, seq) => sum + (seq.runs || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34%</div>
              <p className="text-xs text-muted-foreground">Média geral</p>
            </CardContent>
          </Card>
        </div>

        {/* Sequences List */}
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              Carregando sequências...
            </div>
          ) : sequences.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">Nenhuma sequência criada</p>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira sequência para automatizar o engajamento
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Sequência
              </Button>
            </div>
          ) : (
            sequences.map(sequence => (
              <Card key={sequence.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {sequence.name}
                        {sequence.active ? (
                          <Badge variant="default" className="text-xs">
                            <Play className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Pause className="h-3 w-3 mr-1" />
                            Pausada
                          </Badge>
                        )}
                      </CardTitle>
                      {sequence.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {sequence.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={sequence.active}
                      onCheckedChange={() => toggleSequence(sequence.id, sequence.active)}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Steps Preview */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Etapas ({sequence.steps?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {sequence.steps?.slice(0, 3).map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                        >
                          {getChannelIcon(step.channel)}
                          <span className="flex-1">
                            Dia {step.day_offset} - {step.channel}
                          </span>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ))}
                      {(sequence.steps?.length || 0) > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{(sequence.steps?.length || 0) - 3} etapas
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm pt-3 border-t">
                    <div>
                      <span className="text-muted-foreground">Leads ativos:</span>
                      <span className="font-semibold ml-2">{sequence.runs || 0}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Criada {formatDistanceToNow(new Date(sequence.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
