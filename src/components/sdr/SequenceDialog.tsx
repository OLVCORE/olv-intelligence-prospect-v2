import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Mail, MessageSquare } from 'lucide-react';

interface SequenceStep {
  step_order: number;
  channel: 'email' | 'whatsapp';
  day_offset: number;
  message_template: string;
}

interface SequenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SequenceDialog({ open, onOpenChange, onSuccess }: SequenceDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [sequence, setSequence] = useState({
    name: '',
    description: '',
  });
  const [steps, setSteps] = useState<SequenceStep[]>([
    { step_order: 1, channel: 'email' as const, day_offset: 0, message_template: '' },
  ]);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_order: steps.length + 1,
        channel: 'email',
        day_offset: steps.length > 0 ? steps[steps.length - 1].day_offset + 2 : 0,
        message_template: '',
      },
    ]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder
    setSteps(newSteps.map((step, i) => ({ ...step, step_order: i + 1 })));
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!sequence.name) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe um nome para a sequência',
        variant: 'destructive',
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: 'Adicione steps',
        description: 'A sequência precisa ter pelo menos 1 step',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Create sequence
      const { data: seqData, error: seqError } = await supabase
        .from('sdr_sequences')
        .insert([{
          name: sequence.name,
          description: sequence.description,
          active: true,
        }])
        .select()
        .single();

      if (seqError) throw seqError;

      // Create steps
      const stepsToInsert = steps.map(step => ({
        sequence_id: seqData.id,
        step_order: step.step_order,
        channel: step.channel,
        day_offset: step.day_offset,
        message_template: step.message_template,
      }));

      const { error: stepsError } = await supabase
        .from('sdr_sequence_steps')
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      toast({
        title: 'Sequência criada',
        description: `${sequence.name} foi criada com ${steps.length} steps`,
      });

      onOpenChange(false);
      onSuccess();

      // Reset form
      setSequence({ name: '', description: '' });
      setSteps([{ step_order: 1, channel: 'email', day_offset: 0, message_template: '' }]);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar sequência',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Sequência de Cadência</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sequence Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Sequência *</Label>
              <Input
                id="name"
                value={sequence.name}
                onChange={(e) => setSequence({ ...sequence, name: e.target.value })}
                placeholder="Ex: Outbound Cold SaaS"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={sequence.description}
                onChange={(e) => setSequence({ ...sequence, description: e.target.value })}
                placeholder="Descreva o objetivo desta sequência..."
                rows={2}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Steps da Cadência</Label>
              <Button onClick={addStep} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Step
              </Button>
            </div>

            {steps.map((step, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Step {step.step_order}</h4>
                  {steps.length > 1 && (
                    <Button
                      onClick={() => removeStep(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Canal</Label>
                    <Select
                      value={step.channel}
                      onValueChange={(value: 'email' | 'whatsapp') =>
                        updateStep(index, 'channel', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Dia (offset)</Label>
                    <Input
                      type="number"
                      value={step.day_offset}
                      onChange={(e) =>
                        updateStep(index, 'day_offset', parseInt(e.target.value) || 0)
                      }
                      min={0}
                    />
                  </div>
                </div>

                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={step.message_template}
                    onChange={(e) => updateStep(index, 'message_template', e.target.value)}
                    placeholder="Olá {{name}}, tudo bem? Vi que sua empresa {{company}} atua em..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use variáveis: {'{{name}}'}, {'{{company}}'}, {'{{email}}'}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Criar Sequência'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
