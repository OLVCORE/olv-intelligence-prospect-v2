import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Building2, LayoutDashboard, Search, Server, Brain, Target, TrendingUp,
  Zap, Users, BarChart3, Globe, Database, Shield, CheckCircle2, ArrowRight,
  Sparkles, LineChart, FileText, MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <Badge className="mb-4 text-sm px-4 py-2 bg-primary/20 text-primary border-primary/40">
            <Sparkles className="h-3 w-3 mr-2" />
            Inteligência Artificial para Prospecção B2B
          </Badge>
          
          <Building2 className="h-20 w-20 text-primary mb-6 animate-pulse" />
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-white via-primary/90 to-white bg-clip-text text-transparent">
            STRATEVO Intelligence 360°
          </h1>
          
          <p className="text-xl md:text-2xl text-white/70 mb-4 max-w-3xl">
            A Plataforma Definitiva de Inteligência de Vendas
          </p>
          
          <p className="text-lg text-white/60 mb-12 max-w-2xl">
            Transforme dados públicos em insights acionáveis. Identifique decisores, 
            analise maturidade digital e acelere seu ciclo de vendas com IA.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button asChild size="lg" className="text-lg px-8 h-14 shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60">
              <Link to="/login">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 h-14 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/dashboard">
                Ver Dashboard
                <LayoutDashboard className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white/80 max-w-4xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">360°</div>
              <p className="text-sm">Análise Completa</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">98%</div>
              <p className="text-sm">Precisão de Dados</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">5min</div>
              <p className="text-sm">Tempo de Análise</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">24/7</div>
              <p className="text-sm">Monitoramento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tudo que Você Precisa em Uma Plataforma
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Dados enriquecidos, IA avançada e automação para acelerar suas vendas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {/* Feature Cards */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Search className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Busca Inteligente</CardTitle>
              <CardDescription className="text-white/60">
                Encontre empresas por CNPJ, nome, setor, localização ou tecnologias utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Integração ReceitaWS e Apollo.io
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Dados de CNPJ, faturamento e funcionários
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Refinamento por localização e produtos
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Decisores Mapeados</CardTitle>
              <CardDescription className="text-white/60">
                Identifique CEOs, CTOs, CFOs e outros decisores com emails verificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Emails verificados automaticamente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Perfis do LinkedIn integrados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Hierarquia e departamentos
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Maturidade Digital</CardTitle>
              <CardDescription className="text-white/60">
                Análise em 5 dimensões: Infraestrutura, Sistemas, Processos, Segurança e Inovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Score de 0 a 10 por dimensão
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Análise via IA e fontes públicas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Recomendações personalizadas
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Server className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Tech Stack Detection</CardTitle>
              <CardDescription className="text-white/60">
                Identifique as tecnologias usadas pelas empresas prospectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Cloud providers (AWS, Azure, GCP)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  ERPs, CRMs e ferramentas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Stack completo mapeado
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Sinais de Compra</CardTitle>
              <CardDescription className="text-white/60">
                Detecte empresas prontas para comprar com IA e análise de comportamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Expansão de equipe detectada
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Novas rodadas de investimento
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Mudanças de liderança
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Fit TOTVS</CardTitle>
              <CardDescription className="text-white/60">
                Score de aderência aos produtos TOTVS com recomendações específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Score de fit de 0 a 100
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Produtos recomendados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Pitch personalizado por IA
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* SDR Module Highlight */}
        <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/40 rounded-xl p-8 md:p-12 mb-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-primary/30 text-primary border-primary/50">
                Módulo SDR & CRM
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Gestão Completa de Pipeline
              </h3>
              <p className="text-white/70 mb-6 text-lg">
                Gerencie todo o ciclo de vendas em uma única plataforma: inbox unificado, 
                sequências automáticas, tarefas e analytics em tempo real.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold text-white">Inbox Unificado</div>
                    <div className="text-sm text-white/60">Email, WhatsApp, Telegram</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <LineChart className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold text-white">Pipeline Visual</div>
                    <div className="text-sm text-white/60">Kanban e métricas</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold text-white">Automações IA</div>
                    <div className="text-sm text-white/60">Sequências inteligentes</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold text-white">Relatórios</div>
                    <div className="text-sm text-white/60">Analytics detalhado</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <Target className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-2xl text-white">R$ 500K</CardTitle>
                  <CardDescription className="text-white/60">Pipeline Total</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-2xl text-white">150+</CardTitle>
                  <CardDescription className="text-white/60">Decisores Ativos</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-2xl text-white">28%</CardTitle>
                  <CardDescription className="text-white/60">Taxa Conversão</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-2xl text-white">45</CardTitle>
                  <CardDescription className="text-white/60">Sinais Detectados</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para Revolucionar sua Prospecção?
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Comece agora e veja como a inteligência artificial pode multiplicar seus resultados
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 h-14 shadow-lg shadow-primary/50">
              <Link to="/login">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 h-14 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/search">
                Fazer uma Busca
                <Search className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-white/40 text-sm">
          <p>© 2025 STRATEVO Intelligence. Powered by OLV Internacional + IA Intelligence 2025 *</p>
        </div>
      </div>
    </div>
  );
}
