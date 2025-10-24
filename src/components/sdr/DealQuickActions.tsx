import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, Phone, Calendar, MessageSquare, 
  Target, Sparkles, ExternalLink, FileText 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DealQuickActionsProps {
  dealId: string;
  contactEmail?: string;
  contactPhone?: string;
  companyId?: string;
  onActionComplete?: () => void;
}

export function DealQuickActions({ 
  dealId, 
  contactEmail, 
  contactPhone, 
  companyId,
  onActionComplete 
}: DealQuickActionsProps) {
  const { toast } = useToast();
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [note, setNote] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');

  const handleSendEmail = () => {
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}`;
      logActivity('email_sent', `Email enviado para ${contactEmail}`);
    }
  };

  const handleCall = () => {
    if (contactPhone) {
      window.location.href = `tel:${contactPhone}`;
      logActivity('call_made', `Ligação realizada para ${contactPhone}`);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;

    try {
      await logActivity('note_added', note);
      toast({
        title: 'Nota adicionada',
        description: 'A nota foi registrada com sucesso.',
      });
      setNote('');
      setShowNoteDialog(false);
      onActionComplete?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskDueDate) return;

    try {
      const { error } = await supabase
        .from('sdr_tasks')
        .insert({
          title: taskTitle,
          description: `Relacionado ao deal ${dealId}`,
          company_id: companyId,
          status: 'todo',
          priority: taskPriority,
          due_date: taskDueDate,
        });

      if (error) throw error;

      await logActivity('task_created', `Tarefa criada: ${taskTitle}`);
      
      toast({
        title: 'Tarefa criada',
        description: 'A tarefa foi criada com sucesso.',
      });
      
      setTaskTitle('');
      setTaskDueDate('');
      setShowTaskDialog(false);
      onActionComplete?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const logActivity = async (type: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (companyId) {
        await supabase
          .from('activities')
          .insert({
            company_id: companyId,
            activity_type: type,
            title: description,
            description,
            created_by: user?.id,
          });
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {contactEmail && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendEmail}
            className="gap-2"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </Button>
        )}

        {contactPhone && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCall}
            className="gap-2"
          >
            <Phone className="h-3.5 w-3.5" />
            Ligar
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNoteDialog(true)}
          className="gap-2"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Nota
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTaskDialog(true)}
          className="gap-2"
        >
          <Calendar className="h-3.5 w-3.5" />
          Tarefa
        </Button>

        {companyId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/intelligence-360?company=${companyId}`, '_blank')}
            className="gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Intel 360°
          </Button>
        )}
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Adicionar Nota
            </DialogTitle>
            <DialogDescription>
              Registre informações importantes sobre este deal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nota</Label>
              <Textarea
                placeholder="Digite sua nota aqui..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddNote} disabled={!note.trim()}>
                Salvar Nota
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Criar Tarefa
            </DialogTitle>
            <DialogDescription>
              Agende uma ação de follow-up
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                placeholder="Ex: Follow-up com cliente"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateTask} 
                disabled={!taskTitle.trim() || !taskDueDate}
              >
                Criar Tarefa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
