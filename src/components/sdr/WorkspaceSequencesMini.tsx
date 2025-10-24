import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, Plus, ExternalLink, Users, Play, Pause, Mail, MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Sequence {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  runs?: number;
  steps?: any[];
}

export function WorkspaceSequencesMini() {
  const { toast } = useToast();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

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
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Count runs
      const withRuns = await Promise.all(
        (data || []).map(async (seq) => {
          const { count } = await supabase
            .from('sdr_sequence_runs')
            .select('*', { count: 'exact', head: true })
            .eq('sequence_id', seq.id)
            .eq('status', 'running');

          return { ...seq, runs: count || 0 };
        })
      );

      setSequences(withRuns as Sequence[]);
    } catch (error: any) {
      console.error('Error loading sequences:', error);
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
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const activeCount = sequences.filter(s => s.active).length;
  const totalRuns = sequences.reduce((sum, s) => sum + (s.runs || 0), 0);

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sequências de Cadência
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeCount} ativas, {totalRuns} leads em sequência
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="default" asChild>
            <Link to="/sdr/sequences">
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sdr/sequences">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Sequences List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : sequences.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground mb-4">Nenhuma sequência criada</p>
            <Button size="sm" asChild>
              <Link to="/sdr/sequences">
                <Plus className="h-4 w-4 mr-2" />
                Criar Sequência
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sequences.map((seq) => (
              <Card key={seq.id} className="p-3 hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        {seq.name}
                        {seq.active ? (
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
                      </h4>
                      {seq.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {seq.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={seq.active}
                      onCheckedChange={() => toggleSequence(seq.id, seq.active)}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {seq.steps?.length || 0} etapas
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {seq.runs || 0} leads
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      asChild
                    >
                      <Link to={`/sdr/sequences?id=${seq.id}`}>
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
