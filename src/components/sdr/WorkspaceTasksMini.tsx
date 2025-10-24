import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export function WorkspaceTasksMini() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('sdr_tasks')
      .select('*')
      .eq('status', 'todo')
      .limit(10);
    setTasks(data || []);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Tarefas ({tasks.length})
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/sdr/tasks"><ExternalLink className="h-4 w-4" /></Link>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {tasks.map((t) => (
          <Card key={t.id} className="p-3 mb-2 flex items-center gap-2">
            <Checkbox />
            <span className="text-sm">{t.title}</span>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}
