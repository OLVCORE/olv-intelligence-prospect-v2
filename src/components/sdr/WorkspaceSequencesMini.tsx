import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Zap, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export function WorkspaceSequencesMini() {
  const [sequences, setSequences] = useState<any[]>([]);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    const { data } = await supabase
      .from('sdr_sequence_runs')
      .select('*')
      .eq('status', 'active')
      .limit(10);
    setSequences(data || []);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Sequências ({sequences.length})
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/sdr/sequences"><ExternalLink className="h-4 w-4" /></Link>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {sequences.map((s) => (
          <Card key={s.id} className="p-3 mb-2">
            <Progress value={(s.current_step / s.total_steps) * 100} />
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}
