import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Play, Zap, Clock, Target, Mail, Phone, CheckSquare,
  ArrowRight, Trash2, Save, Settings
} from 'lucide-react';
import { useWorkflows } from '@/hooks/useWorkflows';
import { toast } from 'sonner';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  nodeType: string;
  config: any;
}

const TRIGGERS = [
  { id: 'deal_created', label: 'Deal Criado', icon: Plus },
  { id: 'deal_stage_changed', label: 'Estágio Alterado', icon: ArrowRight },
  { id: 'deal_stale', label: 'Deal Estagnado (7+ dias)', icon: Clock },
  { id: 'high_value_deal', label: 'Deal Alto Valor (>R$50k)', icon: Target },
];

const CONDITIONS = [
  { id: 'stage_equals', label: 'Estágio é igual a...', field: 'stage' },
  { id: 'value_greater', label: 'Valor maior que...', field: 'value' },
  { id: 'probability_less', label: 'Probabilidade menor que...', field: 'probability' },
  { id: 'priority_equals', label: 'Prioridade é igual a...', field: 'priority' },
];

const ACTIONS = [
  { id: 'send_email', label: 'Enviar Email', icon: Mail },
  { id: 'create_task', label: 'Criar Tarefa', icon: CheckSquare },
  { id: 'make_call', label: 'Iniciar Ligação', icon: Phone },
  { id: 'update_stage', label: 'Atualizar Estágio', icon: ArrowRight },
  { id: 'change_priority', label: 'Alterar Prioridade', icon: Target },
];

export function WorkflowBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const { workflows, createWorkflow, toggleWorkflow } = useWorkflows();

  const addNode = (type: WorkflowNode['type'], nodeType: string) => {
    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      type,
      nodeType,
      config: {}
    };
    setNodes([...nodes, newNode]);
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const updateNodeConfig = (id: string, config: any) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, config } : n));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Digite um nome para o workflow');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Adicione pelo menos um trigger e uma ação');
      return;
    }

    const trigger = nodes.find(n => n.type === 'trigger');
    if (!trigger) {
      toast.error('Adicione um trigger (gatilho) ao workflow');
      return;
    }

    const action = nodes.find(n => n.type === 'action');
    if (!action) {
      toast.error('Adicione pelo menos uma ação ao workflow');
      return;
    }

    createWorkflow.mutate({
      name,
      trigger: trigger.nodeType,
      conditions: nodes.filter(n => n.type === 'condition').map(n => ({
        type: n.nodeType,
        config: n.config
      })),
      actions: nodes.filter(n => n.type === 'action').map(n => ({
        type: n.nodeType,
        config: n.config
      })),
      isActive: true
    });

    setIsOpen(false);
    setName('');
    setNodes([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workflows Customizados</h3>
          <p className="text-sm text-muted-foreground">
            Crie automações personalizadas para seu pipeline
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Criar Workflow de Automação</DialogTitle>
            </DialogHeader>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Nome do Workflow */}
                <div className="space-y-2">
                  <Label>Nome do Workflow</Label>
                  <Input
                    placeholder="Ex: Follow-up automático após 7 dias"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Canvas de Construção */}
                <div className="space-y-4">
                  <Label>Construtor Visual</Label>
                  
                  {/* Nodes List */}
                  {nodes.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Adicione um gatilho (trigger) para começar
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {nodes.map((node, idx) => (
                        <div key={node.id}>
                          <NodeCard 
                            node={node} 
                            onRemove={() => removeNode(node.id)}
                            onConfigUpdate={(config) => updateNodeConfig(node.id, config)}
                          />
                          {idx < nodes.length - 1 && (
                            <div className="flex justify-center py-2">
                              <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-3 text-sm">1. Trigger (Gatilho)</h4>
                    <div className="space-y-2">
                      {TRIGGERS.map(t => (
                        <Button
                          key={t.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => addNode('trigger', t.id)}
                          disabled={nodes.some(n => n.type === 'trigger')}
                        >
                          <t.icon className="h-3 w-3" />
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-3 text-sm">2. Condição (Se...)</h4>
                    <div className="space-y-2">
                      {CONDITIONS.map(c => (
                        <Button
                          key={c.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => addNode('condition', c.id)}
                        >
                          <Settings className="h-3 w-3" />
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-3 text-sm">3. Ação (Então...)</h4>
                    <div className="space-y-2">
                      {ACTIONS.map(a => (
                        <Button
                          key={a.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => addNode('action', a.id)}
                        >
                          <a.icon className="h-3 w-3" />
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Save Button */}
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1 gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Workflow
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows Existentes */}
      <div className="grid gap-3">
        {workflows?.map((wf: any) => (
          <Card key={wf.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{wf.name}</h4>
                  <Badge variant={wf.is_active ? 'default' : 'secondary'}>
                    {wf.is_active ? 'Ativo' : 'Pausado'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Trigger: {wf.trigger_type} → {wf.actions?.length || 0} ações
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Play className="h-3 w-3 mr-1" />
                    {wf.execution_count || 0} execuções
                  </Badge>
                </div>
              </div>
              <Button
                variant={wf.is_active ? 'outline' : 'default'}
                size="sm"
                onClick={() => toggleWorkflow.mutate({ id: wf.id, isActive: !wf.is_active })}
              >
                {wf.is_active ? 'Pausar' : 'Ativar'}
              </Button>
            </div>
          </Card>
        ))}

        {(!workflows || workflows.length === 0) && (
          <Card className="p-8 text-center border-dashed">
            <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum workflow customizado ainda
            </p>
            <p className="text-xs text-muted-foreground">
              Crie seu primeiro workflow para automatizar tarefas repetitivas
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

interface NodeCardProps {
  node: WorkflowNode;
  onRemove: () => void;
  onConfigUpdate: (config: any) => void;
}

function NodeCard({ node, onRemove, onConfigUpdate }: NodeCardProps) {
  const getNodeInfo = () => {
    if (node.type === 'trigger') {
      return TRIGGERS.find(t => t.id === node.nodeType);
    } else if (node.type === 'condition') {
      return CONDITIONS.find(c => c.id === node.nodeType);
    } else {
      return ACTIONS.find(a => a.id === node.nodeType);
    }
  };

  const nodeInfo = getNodeInfo();
  const bgColor = node.type === 'trigger' ? 'bg-blue-50 dark:bg-blue-950' :
                  node.type === 'condition' ? 'bg-purple-50 dark:bg-purple-950' :
                  'bg-green-50 dark:bg-green-950';

  return (
    <Card className={`p-4 ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{node.type}</Badge>
            <span className="font-medium text-sm">{nodeInfo?.label}</span>
          </div>
          
          {/* Config Form baseado no tipo */}
          <div className="space-y-2 mt-3">
            {node.type === 'condition' && node.nodeType === 'value_greater' && (
              <div className="space-y-1">
                <Label className="text-xs">Valor mínimo (R$)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={node.config.minValue || ''}
                  onChange={(e) => onConfigUpdate({ ...node.config, minValue: e.target.value })}
                />
              </div>
            )}

            {node.type === 'action' && node.nodeType === 'send_email' && (
              <div className="space-y-1">
                <Label className="text-xs">Template de Email</Label>
                <Select
                  value={node.config.template || ''}
                  onValueChange={(v) => onConfigUpdate({ ...node.config, template: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow-up Padrão</SelectItem>
                    <SelectItem value="proposal">Envio de Proposta</SelectItem>
                    <SelectItem value="reminder">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {node.type === 'action' && node.nodeType === 'create_task' && (
              <div className="space-y-1">
                <Label className="text-xs">Título da Tarefa</Label>
                <Input
                  placeholder="Ex: Fazer follow-up com cliente"
                  value={node.config.taskTitle || ''}
                  onChange={(e) => onConfigUpdate({ ...node.config, taskTitle: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
