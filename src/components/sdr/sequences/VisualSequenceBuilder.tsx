import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Mail, Phone, MessageSquare, Calendar, Trash2, 
  ArrowDown, Save, Play, Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface SequenceStep {
  id: string;
  type: 'email' | 'call' | 'linkedin' | 'whatsapp' | 'task';
  delay_days: number;
  subject?: string;
  content: string;
  order: number;
}

export function VisualSequenceBuilder() {
  const [sequenceName, setSequenceName] = useState('');
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  const addStep = (type: SequenceStep['type']) => {
    const newStep: SequenceStep = {
      id: `step-${Date.now()}`,
      type,
      delay_days: steps.length === 0 ? 0 : 1,
      content: '',
      order: steps.length
    };
    setSteps([...steps, newStep]);
    setEditingStep(newStep.id);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<SequenceStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const saveSequence = () => {
    if (!sequenceName) {
      toast.error('Digite um nome para a sequência');
      return;
    }
    if (steps.length === 0) {
      toast.error('Adicione pelo menos um passo');
      return;
    }
    
    toast.success('Sequência salva com sucesso!');
    console.log('Sequência:', { name: sequenceName, steps });
  };

  const getStepIcon = (type: SequenceStep['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'linkedin': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'task': return <Calendar className="h-4 w-4" />;
    }
  };

  const getStepColor = (type: SequenceStep['type']) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'call': return 'bg-green-100 text-green-700 border-green-300';
      case 'linkedin': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'whatsapp': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'task': return 'bg-orange-100 text-orange-700 border-orange-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Sequência de Cadência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome da Sequência</Label>
            <Input 
              placeholder="Ex: Cadência Executivos C-Level" 
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addStep('email')}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addStep('call')}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              Ligação
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addStep('linkedin')}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              LinkedIn
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addStep('whatsapp')}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addStep('task')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Tarefa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sequence Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id}>
            <Card className={`border-2 ${getStepColor(step.type)}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="gap-2">
                        {getStepIcon(step.type)}
                        {step.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Passo {index + 1}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeStep(step.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  {/* Delay */}
                  <div>
                    <Label className="text-xs">Aguardar (dias)</Label>
                    <Input 
                      type="number"
                      min="0"
                      value={step.delay_days}
                      onChange={(e) => updateStep(step.id, { delay_days: parseInt(e.target.value) || 0 })}
                      className="max-w-[100px]"
                    />
                  </div>

                  {/* Subject (apenas para email) */}
                  {step.type === 'email' && (
                    <div>
                      <Label className="text-xs">Assunto</Label>
                      <Input 
                        placeholder="Ex: Proposta personalizada para [EMPRESA]"
                        value={step.subject || ''}
                        onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <Label className="text-xs">
                      {step.type === 'email' ? 'Corpo do Email' : 
                       step.type === 'task' ? 'Descrição da Tarefa' : 'Mensagem'}
                    </Label>
                    <Textarea 
                      placeholder="Digite o conteúdo... Use [NOME], [EMPRESA], [CARGO] para personalizar"
                      value={step.content}
                      onChange={(e) => updateStep(step.id, { content: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Variáveis disponíveis: [NOME], [EMPRESA], [CARGO], [EMAIL], [TELEFONE]
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arrow connector */}
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="flex flex-col items-center gap-1">
                  <ArrowDown className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-muted-foreground">
                    {steps[index + 1].delay_days} dias
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {steps.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Plus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Clique nos botões acima para adicionar passos à sequência</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      {steps.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <strong>{steps.length}</strong> passos · 
                Duração total: <strong>{steps.reduce((sum, s) => sum + s.delay_days, 0)} dias</strong>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Duplicar
                </Button>
                <Button variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Testar
                </Button>
                <Button onClick={saveSequence} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Sequência
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
