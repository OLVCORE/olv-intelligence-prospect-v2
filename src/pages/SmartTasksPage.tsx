import { SmartTasksList } from '@/components/sdr/SmartTasksList';

export default function SmartTasksPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Smart Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas tarefas com automação inteligente
        </p>
      </div>
      
      <SmartTasksList />
    </div>
  );
}
