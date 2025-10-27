import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, AlertCircle, Clock, TrendingUp, Target, 
  CheckCircle2, X, Sparkles, Play 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutomationEngine } from '@/hooks/useAutomationEngine';
import { WorkflowBuilder } from './WorkflowBuilder';
import { cn } from '@/lib/utils';

export function AutomationPanel() {
  const { 
    automationTriggers, 
    isLoading, 
    executeAction,
    totalTriggers,
    urgentTriggers,
    highTriggers 
  } = useAutomationEngine();

  const getIcon = (ruleId: string) => {
    switch (ruleId) {
      case 'stale_deal': return Clock;
      case 'sla_close': return AlertCircle;
      case 'stage_progression': return TrendingUp;
      case 'low_probability': return Target;
      case 'high_value_attention': return Sparkles;
      case 'auto_assign': return Play;
      default: return Zap;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800';
      case 'medium': return 'bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800';
      case 'low': return 'bg-gray-100 border-gray-300 dark:bg-gray-950 dark:border-gray-800';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <Zap className="h-12 w-12 mx-auto mb-3 animate-pulse text-primary" />
        <p className="text-sm text-muted-foreground">Analisando deals e gerando automações...</p>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="auto" className="space-y-4">
      <TabsList>
        <TabsTrigger value="auto" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Automações Inteligentes
        </TabsTrigger>
        <TabsTrigger value="workflows" className="gap-2">
          <Zap className="h-4 w-4" />
          Workflows Customizados
        </TabsTrigger>
      </TabsList>

      <TabsContent value="auto" className="space-y-4">
        {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{totalTriggers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Urgentes</p>
              <p className="text-lg font-bold">{urgentTriggers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Alta</p>
              <p className="text-lg font-bold">{highTriggers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Automation Triggers List */}
      <ScrollArea className="h-[500px]">
        {!automationTriggers || automationTriggers.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600 opacity-50" />
            <p className="text-lg font-medium mb-2">Tudo sob controle! ✅</p>
            <p className="text-sm text-muted-foreground">
              Nenhuma automação pendente no momento
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {automationTriggers.map((trigger, idx) => {
              const Icon = getIcon(trigger.ruleId);
              return (
                <Card 
                  key={`${trigger.dealId}-${idx}`}
                  className={cn(
                    "p-4 border-2",
                    getPriorityColor(trigger.priority)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{trigger.action.replace(/_/g, ' ').toUpperCase()}</h4>
                            <Badge variant={
                              trigger.priority === 'urgent' ? 'destructive' :
                              trigger.priority === 'high' ? 'default' :
                              'secondary'
                            }>
                              {trigger.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{trigger.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => executeAction.mutate({ 
                            execution: trigger, 
                            action: 'execute' 
                          })}
                          className="gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Executar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => executeAction.mutate({ 
                            execution: trigger, 
                            action: 'dismiss' 
                          })}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Ignorar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

        <Card className="p-3 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <p className="text-xs text-center">
            🤖 Engine de automação analisando deals em tempo real
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="workflows">
        <WorkflowBuilder />
      </TabsContent>
    </Tabs>
  );
}
