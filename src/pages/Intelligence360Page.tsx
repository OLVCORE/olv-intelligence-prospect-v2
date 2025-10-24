import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/common/BackButton';
import { EnhancedCompanyInputForm } from '@/components/intelligence/EnhancedCompanyInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function Intelligence360Page() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'Análise de IA',
      description: 'Inteligência artificial analisa momento da empresa e identifica oportunidades',
      badge: 'Lovable AI',
    },
    {
      icon: Target,
      title: 'Product Fit',
      description: 'Recomendação automática de produtos TOTVS baseada em necessidades reais',
      badge: 'Automatizado',
    },
    {
      icon: TrendingUp,
      title: 'Timing Score',
      description: 'Identifica o momento ideal para abordagem de vendas',
      badge: 'Preditivo',
    },
    {
      icon: Users,
      title: 'Decision Makers',
      description: 'Mapeia e perfia tomadores de decisão com dados de contato',
      badge: 'LinkedIn + Apollo',
    },
    {
      icon: Zap,
      title: 'Empresas Similares',
      description: 'Encontra empresas similares para benchmarking e prospecção',
      badge: 'Vendor Matching',
    },
  ];

  const dataSources = [
    'ReceitaWS - Dados oficiais',
    'Apollo.io - Contatos B2B',
    'PhantomBuster - LinkedIn',
    'Hunter.io - Emails',
    'Serper - Web Search',
    'Google Search - Advanced',
    'Tech Stack Detection',
    'Marketplace Detection',
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-8">
        <BackButton className="mb-4" />
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Inteligência 360º</h1>
              <p className="text-muted-foreground">
                Análise completa de empresas com inteligência artificial
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {dataSources.map((source) => (
              <Badge key={source} variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {source}
              </Badge>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* What You'll Get */}
        <Card>
          <CardHeader>
            <CardTitle>O que você receberá</CardTitle>
            <CardDescription>
              Análise completa em minutos com dados reais e insights acionáveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Dados da Empresa
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                  <li>• Dados oficiais (Receita Federal)</li>
                  <li>• Presença digital completa (website, redes, marketplace)</li>
                  <li>• Tech stack e maturidade digital</li>
                  <li>• Notícias e sentimento do mercado</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Inteligência de Vendas
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                  <li>• Produtos TOTVS recomendados (fit scores)</li>
                  <li>• Momento ideal para abordagem (timing)</li>
                  <li>• Decisores mapeados com contatos</li>
                  <li>• Pitch de vendas personalizado</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Análises de IA
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                  <li>• Dores e necessidades identificadas</li>
                  <li>• Oportunidades de transformação digital</li>
                  <li>• Riscos e pontos de atenção</li>
                  <li>• Estratégia de abordagem recomendada</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Benchmarking
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                  <li>• Empresas similares (vendor matching)</li>
                  <li>• Comparativo setorial</li>
                  <li>• Métricas de mercado</li>
                  <li>• Insights competitivos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Form */}
        <EnhancedCompanyInputForm />

        {/* Footer Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Análise em tempo real</h4>
                <p className="text-sm text-muted-foreground">
                  Todos os dados são buscados em tempo real de APIs oficiais e confiáveis.
                  Nenhum dado é inventado ou estimado - apenas informações verificáveis.
                  Métricas e scores são calculados com transparência total, permitindo
                  que você entenda exatamente como chegamos em cada número.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
