import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Search, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Users, 
  ArrowRight,
  FileSpreadsheet,
  Filter,
  Target,
  Rocket,
  Play
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Bem-vindo à OLV Intelligence! 🎉',
    description: 'Sua máquina de vendas automatizada',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Rocket className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Transforme Dados em Vendas</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vamos te mostrar como usar nossa plataforma para encontrar os melhores clientes 
            e fechar mais negócios. É simples e rápido!
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">1. Upload</p>
              <p className="text-xs text-muted-foreground">Envie sua lista</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm font-medium">2. Análise</p>
              <p className="text-xs text-muted-foreground">IA trabalha</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">3. Vendas</p>
              <p className="text-xs text-muted-foreground">Foque nos Hot</p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Passo 1: Traga suas Empresas 📊',
    description: 'Upload do seu arquivo CSV',
    icon: Upload,
    content: (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 rounded-full p-3">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2">O que você precisa fazer?</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Tenha uma planilha Excel ou CSV com empresas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Pode ter qualquer coluna: nome, CNPJ, site, etc.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Não precisa estar perfeito, a IA organiza!
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Exemplo de CSV que funciona:
          </h4>
          <div className="bg-white dark:bg-gray-900 rounded p-4 font-mono text-xs overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome da Empresa</th>
                  <th className="text-left p-2">CNPJ</th>
                  <th className="text-left p-2">Site</th>
                  <th className="text-left p-2">Email</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">Empresa ABC Ltda</td>
                  <td className="p-2">12.345.678/0001-90</td>
                  <td className="p-2">empresaabc.com.br</td>
                  <td className="p-2">contato@abc.com</td>
                </tr>
                <tr>
                  <td className="p-2">Tech Solutions</td>
                  <td className="p-2">98.765.432/0001-10</td>
                  <td className="p-2">techsolutions.com</td>
                  <td className="p-2">info@tech.com</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="text-2xl">💡</div>
          <div>
            <p className="font-medium">Dica importante:</p>
            <p className="text-sm text-muted-foreground">
              Quanto mais informação você fornecer (nome, CNPJ, site), melhor será a análise!
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Passo 2: IA Analisa Tudo ✨',
    description: 'Sistema trabalha automaticamente',
    icon: Sparkles,
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">A Mágica Acontece Aqui!</h3>
          <p className="text-muted-foreground">
            Nossa IA analisa cada empresa em segundos
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">1. Busca Informações</h4>
                  <p className="text-sm text-muted-foreground">
                    Pesquisa em +40 portais de vagas, LinkedIn, Receita Federal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <Filter className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">2. Detecta TOTVS</h4>
                  <p className="text-sm text-muted-foreground">
                    Descarta empresas que já são clientes TOTVS
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">3. Calcula Score ICP</h4>
                  <p className="text-sm text-muted-foreground">
                    Nota de 0-100 baseada no fit com seu perfil ideal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-6 border-2">
          <h4 className="font-bold mb-3">⏱️ Quanto tempo leva?</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>10 empresas:</span>
              <Badge>~30 segundos</Badge>
            </div>
            <div className="flex justify-between">
              <span>100 empresas:</span>
              <Badge>~5 minutos</Badge>
            </div>
            <div className="flex justify-between">
              <span>1000 empresas:</span>
              <Badge>~50 minutos</Badge>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Passo 3: Resultados na Quarentena 🎯',
    description: 'Revise e aprove as empresas',
    icon: CheckCircle,
    content: (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg p-6 border-2">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            Entendendo as Temperaturas
          </h3>
          
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border-2 border-red-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-sm">HOT</Badge>
                  <span className="font-bold">Score 70-100</span>
                </div>
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Cliente ideal!</strong> Alta chance de compra. Ligue agora mesmo!
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border-2 border-orange-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-sm bg-orange-500">WARM</Badge>
                  <span className="font-bold">Score 40-69</span>
                </div>
                <span className="text-2xl">🌡️</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Bom potencial!</strong> Vale a pena trabalhar. Nutrição necessária.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">COLD</Badge>
                  <span className="font-bold">Score 0-39</span>
                </div>
                <span className="text-2xl">❄️</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Baixa prioridade.</strong> Foco em outros leads primeiro.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-2">
          <CardContent className="pt-6">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              O que fazer na Quarentena?
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-xs">1</span>
                </div>
                <span>Revise a lista de empresas analisadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-xs">2</span>
                </div>
                <span>Selecione as que você quer trabalhar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-xs">3</span>
                </div>
                <span>Clique em "Aprovar" para mover ao Pool de Leads</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <div>
            <p className="font-medium">Automação Inteligente</p>
            <p className="text-sm text-muted-foreground">
              Hot Leads (score ≥75) são automaticamente transformados em Deals!
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Passo 4: Venda! 🚀',
    description: 'Foque nos melhores leads',
    icon: TrendingUp,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Agora é Só Vender!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seu pipeline está organizado e priorizado. Foque nas oportunidades quentes!
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Pool de Leads
              </CardTitle>
              <CardDescription>
                Todas as empresas aprovadas organizadas por temperatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded">
                  <span>🔥 Hot Leads</span>
                  <Badge variant="destructive">Alta Prioridade</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded">
                  <span>🌡️ Warm Leads</span>
                  <Badge className="bg-orange-500">Média Prioridade</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <span>❄️ Cold Leads</span>
                  <Badge variant="secondary">Baixa Prioridade</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                SDR Workspace
              </CardTitle>
              <CardDescription>
                Gerencie seus deals e conversas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Pipeline visual de oportunidades
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Inbox unificado (WhatsApp + Email)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Tarefas e follow-ups automáticos
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-6 border-2 border-green-200">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Dica de Ouro
          </h4>
          <p className="text-sm mb-2">
            <strong>Comece sempre pelos Hot Leads!</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Eles têm 5x mais chance de fechar. Ligue, mande email, seja rápido! 
            A velocidade faz diferença nas vendas.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: 'Pronto para Começar! 🎉',
    description: 'Vamos fazer seu primeiro upload?',
    icon: Rocket,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <Rocket className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-3xl font-bold mb-4">Você Está Pronto!</h3>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Agora você sabe como transformar uma lista de empresas em vendas reais. 
            Vamos começar?
          </p>
        </div>

        <Card className="border-2 border-primary">
          <CardContent className="pt-6">
            <h4 className="font-bold mb-4 text-center text-lg">
              📝 Recapitulando o Fluxo Completo:
            </h4>
            <div className="space-y-3">
              {[
                { icon: Upload, text: 'Upload do CSV com empresas', color: 'text-blue-500' },
                { icon: Sparkles, text: 'IA analisa + detecta TOTVS', color: 'text-purple-500' },
                { icon: CheckCircle, text: 'Revisa na Quarentena', color: 'text-orange-500' },
                { icon: Target, text: 'Aprova para Pool de Leads', color: 'text-green-500' },
                { icon: TrendingUp, text: 'Vende focando em Hot Leads', color: 'text-red-500' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-bold">{idx + 1}</span>
                  </div>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                  <span className="text-sm font-medium">{step.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="font-bold mb-1">Rápido</p>
              <p className="text-xs text-muted-foreground">Análise em minutos</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="font-bold mb-1">Preciso</p>
              <p className="text-xs text-muted-foreground">IA detecta TOTVS</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">🤖</div>
              <p className="font-bold mb-1">Automático</p>
              <p className="text-xs text-muted-foreground">Hot leads → Deals</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-bold mb-1">Eficiente</p>
              <p className="text-xs text-muted-foreground">Foco no que converte</p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const StepIcon = step.icon;

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/central-icp/batch-analysis');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Passo {currentStep + 1} de {steps.length}
                </p>
                <h1 className="text-2xl font-bold">{step.title}</h1>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSkip}>
              Pular Tutorial
            </Button>
          </div>

          <Progress value={progress} className="h-2" />
        </div>

        {/* Content Card */}
        <Card className="border-2 shadow-2xl">
          <CardHeader>
            <CardDescription className="text-base">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[500px]">
            {step.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Voltar
          </Button>

          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-primary w-8'
                    : idx < currentStep
                    ? 'bg-primary/50'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext} size="lg">
            {currentStep === steps.length - 1 ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Começar Agora!
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Quick Links */}
        {currentStep === steps.length - 1 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/central-icp/batch-analysis')}
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs">Fazer Upload</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/leads/icp-quarantine')}
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-xs">Ver Quarentena</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/leads/pool')}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs">Pool de Leads</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
