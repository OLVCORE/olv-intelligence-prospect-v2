import { Card, CardContent } from '@/components/ui/card';
import { Upload, Sparkles, CheckCircle, Users, Target, TrendingUp, ArrowRight, Flame, AlertTriangle } from 'lucide-react';

export function FlowDiagram() {
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: 'Upload CSV',
      description: 'Envie sua lista de empresas',
      color: 'bg-blue-500',
      detail: 'Qualquer CSV com nome, CNPJ ou site',
    },
    {
      number: 2,
      icon: Sparkles,
      title: 'IA Analisa',
      description: 'Busca dados em +40 fontes',
      color: 'bg-purple-500',
      detail: 'Automático: Receita Federal, LinkedIn, portais de vagas',
    },
    {
      number: 3,
      icon: AlertTriangle,
      title: 'Detecta TOTVS',
      description: 'Filtra clientes existentes',
      color: 'bg-red-500',
      detail: 'Descarta automaticamente quem já usa TOTVS',
    },
    {
      number: 4,
      icon: CheckCircle,
      title: 'Quarentena',
      description: 'Revise os resultados',
      color: 'bg-yellow-500',
      detail: 'Você decide quais empresas aprovar',
    },
    {
      number: 5,
      icon: Users,
      title: 'Pool de Leads',
      description: 'Empresas aprovadas aqui',
      color: 'bg-green-500',
      detail: 'Organizadas por temperatura: Hot, Warm, Cold',
    },
    {
      number: 6,
      icon: Flame,
      title: 'Deals Automáticos',
      description: 'Hot leads viram deals',
      color: 'bg-orange-500',
      detail: 'Score ≥75 cria deal automaticamente',
    },
    {
      number: 7,
      icon: Target,
      title: 'SDR Workspace',
      description: 'Gerencie suas vendas',
      color: 'bg-indigo-500',
      detail: 'Pipeline, inbox, tarefas em um só lugar',
    },
    {
      number: 8,
      icon: TrendingUp,
      title: 'Feche Vendas!',
      description: 'Foque nos hot leads',
      color: 'bg-emerald-500',
      detail: 'Priorize empresas com maior score',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Fluxo Visual */}
      <div className="relative">
        {/* Linha conectora */}
        <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />
        
        {/* Steps */}
        <div className="space-y-6 relative">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-start gap-4">
              {/* Icon Circle */}
              <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10 flex-shrink-0`}>
                <step.icon className="w-8 h-8" />
              </div>
              
              {/* Content */}
              <Card className="flex-1">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold">{step.number}.</span>
                        <h3 className="text-xl font-bold">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {step.description}
                      </p>
                      <p className="text-sm bg-secondary/50 p-3 rounded-lg">
                        💡 {step.detail}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Arrow between steps */}
              {idx < steps.length - 1 && (
                <div className="absolute left-8 flex items-center justify-center" 
                     style={{ top: `${(idx + 1) * 124 + 50}px` }}>
                  <ArrowRight className="w-6 h-6 text-muted-foreground animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda de Temperaturas */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-500" />
            Entendendo as Temperaturas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4 rounded-lg border-2 border-red-300">
              <div className="text-3xl mb-2">🔥</div>
              <h4 className="font-bold mb-1">HOT (70-100)</h4>
              <p className="text-sm text-muted-foreground">Cliente ideal! Alta chance de compra.</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 p-4 rounded-lg border-2 border-orange-300">
              <div className="text-3xl mb-2">🌡️</div>
              <h4 className="font-bold mb-1">WARM (40-69)</h4>
              <p className="text-sm text-muted-foreground">Bom potencial! Vale trabalhar.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg border-2 border-blue-300">
              <div className="text-3xl mb-2">❄️</div>
              <h4 className="font-bold mb-1">COLD (0-39)</h4>
              <p className="text-sm text-muted-foreground">Baixa prioridade. Nurture.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
