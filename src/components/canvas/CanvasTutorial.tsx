import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Brain, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Lightbulb,
  Target,
  Workflow,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CanvasTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Bem-vindo ao Canvas War Room',
      description: 'Seu workspace colaborativo vivo com inteligência artificial',
      icon: Zap,
      color: 'text-primary',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            O Canvas War Room é um workspace inteligente que conecta <strong>contexto</strong>, <strong>decisões</strong> e <strong>execução</strong> em um único lugar.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
              <Brain className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">IA Proativa</h4>
                <p className="text-sm text-muted-foreground">
                  A inteligência artificial sugere insights, tarefas e decisões baseadas no contexto da empresa
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Colaboração em Tempo Real</h4>
                <p className="text-sm text-muted-foreground">
                  Toda a equipe trabalha junto, vê as mesmas informações e toma decisões alinhadas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Contexto Sempre Atualizado</h4>
                <p className="text-sm text-muted-foreground">
                  Dados de Maturidade, Fit TOTVS, Tech Stack e Decisores sempre à mão
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Como Criar um Canvas',
      description: 'Escolha o tipo certo para cada situação',
      icon: Target,
      color: 'text-blue-500',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Cada tipo de Canvas é otimizado para um objetivo específico:
          </p>
          <div className="space-y-3">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Canvas de Descoberta Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Quando usar:</strong> Primeira interação com uma empresa
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>O que inclui:</strong> Mapeamento de dores, oportunidades, stakeholders e próximos passos
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-xs">Descoberta</Badge>
                  <Badge variant="secondary" className="text-xs">Qualificação</Badge>
                  <Badge variant="secondary" className="text-xs">Planejamento</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  ✅ Canvas de Qualificação de Oportunidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Quando usar:</strong> Avaliar fit e priorizar oportunidades
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>O que inclui:</strong> Score de fit, riscos, valor estimado, decisores e estratégia de abordagem
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-xs">Fit Score</Badge>
                  <Badge variant="secondary" className="text-xs">Riscos</Badge>
                  <Badge variant="secondary" className="text-xs">Pipeline</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  📋 Canvas em Branco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Quando usar:</strong> Situações customizadas ou workflows específicos
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>O que inclui:</strong> Você define! Total flexibilidade para adicionar blocos conforme necessário
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-xs">Flexível</Badge>
                  <Badge variant="secondary" className="text-xs">Customizado</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: 'Tipos de Blocos',
      description: 'Construa seu canvas com blocos inteligentes',
      icon: Workflow,
      color: 'text-purple-500',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Cada bloco tem uma função específica e se conecta com os dados da empresa:
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Insight</h4>
                <p className="text-sm text-muted-foreground">
                  Observações e descobertas importantes sobre a empresa
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Target className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Decisão</h4>
                <p className="text-sm text-muted-foreground">
                  Próximas ações e decisões estratégicas (pode virar task SDR)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">✅ Task</h4>
                <p className="text-sm text-muted-foreground">
                  Tarefas específicas com responsável e prazo
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="h-5 w-5 text-muted-foreground mt-0.5">📝</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">📝 Nota</h4>
                <p className="text-sm text-muted-foreground">
                  Anotações gerais e contexto adicional
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="h-5 w-5 text-muted-foreground mt-0.5">🔗</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">🔗 Referência</h4>
                <p className="text-sm text-muted-foreground">
                  Links para documentos, sites e recursos externos
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'IA e Automação',
      description: 'Deixe a inteligência trabalhar por você',
      icon: Brain,
      color: 'text-green-500',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            O Canvas War Room usa IA para acelerar seu trabalho:
          </p>
          <div className="space-y-3">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Comandos de IA
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Digite comandos como "sugira próximas ações" ou "resuma os insights" e a IA executa
                </p>
                <div className="bg-background/50 p-3 rounded-lg text-sm font-mono">
                  /ai sugira 3 tarefas para essa empresa
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  Análise Contextual Automática
                </h4>
                <p className="text-sm text-muted-foreground">
                  Ao conectar uma empresa, a IA analisa automaticamente maturidade, fit, tech stack e decisores, sugerindo insights relevantes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Promoção para SDR Tasks
                </h4>
                <p className="text-sm text-muted-foreground">
                  Decisões podem ser promovidas para tarefas SDR com um clique, criando follow-up automático
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ];

  const currentTutorialStep = tutorialSteps[currentStep];
  const Icon = currentTutorialStep.icon;

  return (
    <>
      <Card className="border-2 border-dashed bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Novo no Canvas War Room?</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Aprenda como usar o Canvas War Room para transformar contexto em decisões e ações estratégicas com IA
              </p>
            </div>
            <Button onClick={() => setIsOpen(true)} size="lg" className="gap-2">
              <Brain className="h-5 w-5" />
              Ver Tutorial Completo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-primary/10 ${currentTutorialStep.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xl">{currentTutorialStep.title}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {currentTutorialStep.description}
                  </div>
                </div>
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-6">
            {currentTutorialStep.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Anterior
                </Button>
              )}
              {currentStep < tutorialSteps.length - 1 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)} className="gap-2">
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setIsOpen(false)} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Começar a Usar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
