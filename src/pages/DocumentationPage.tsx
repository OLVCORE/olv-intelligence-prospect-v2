import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, GraduationCap, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('introducao');

  const sections = [
    { id: 'introducao', title: '📘 Introdução', icon: BookOpen },
    { id: 'visao-geral', title: '🎯 Visão Geral', icon: Lightbulb },
    { id: 'arquitetura', title: '🏗️ Arquitetura', icon: FileText },
    { id: 'sdr-workspace', title: '💼 SDR Workspace', icon: GraduationCap },
    { id: 'ia-copiloto', title: '🤖 IA Copiloto', icon: Lightbulb },
    { id: 'pipeline', title: '📊 Pipeline', icon: FileText },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-primary" />
              Centro de Documentação
            </h1>
            <p className="text-muted-foreground mt-2">
              Tutoriais, guias e orientações completas da STRATEVO Intelligence
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            v1.0 - Manual do Operador
          </Badge>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {sections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="gap-2"
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card className="bg-gradient-to-br from-background via-background to-primary/5">
            <CardContent className="p-8">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <TabsContent value="introducao" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-primary border-b pb-3">
                      🚀 STRATEVO Intelligence: O Guia Definitivo da Máquina de Vendas
                    </h2>
                    
                    <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
                      <h3 className="text-xl font-semibold text-primary mb-3">O que é a STRATEVO Intelligence?</h3>
                      <p className="text-foreground/90 leading-relaxed">
                        A <strong>STRATEVO Intelligence</strong> é uma plataforma completa de vendas B2B que integra 
                        inteligência artificial, automação e análise estratégica para transformar completamente 
                        seu processo comercial.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardContent className="p-4">
                          <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="text-2xl">🎯</span> Prospecção Inteligente
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Identifique empresas ideais automaticamente com IA e dados em tempo real
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <CardContent className="p-4">
                          <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                            <span className="text-2xl">⚡</span> Automação Total
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Cadências, follow-ups e engajamento automatizado multicanal
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                        <CardContent className="p-4">
                          <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                            <span className="text-2xl">📊</span> Analytics Avançado
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Dashboards em tempo real, forecasts e insights preditivos
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                        <CardContent className="p-4">
                          <h4 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                            <span className="text-2xl">🤖</span> IA Copiloto
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Assistente inteligente que sugere próximas ações e otimiza estratégias
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                      <p className="text-sm text-amber-200 flex items-start gap-2">
                        <span className="text-xl">💡</span>
                        <span>
                          <strong>Dica:</strong> Este guia cobre todos os módulos da plataforma. 
                          Use as abas acima para navegar entre os diferentes tópicos.
                        </span>
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="visao-geral" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3">
                    🎯 Visão Geral do Sistema
                  </h2>
                  
                  <div className="space-y-4">
                    <Card className="bg-card/50">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Módulos Principais</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Badge>1</Badge>
                            <div>
                              <h4 className="font-semibold">SDR Dashboard & Workspace</h4>
                              <p className="text-sm text-muted-foreground">
                                Centro de comando com métricas, alertas e acesso rápido a todas as ferramentas
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Badge>2</Badge>
                            <div>
                              <h4 className="font-semibold">Pipeline Visual</h4>
                              <p className="text-sm text-muted-foreground">
                                Kanban interativo para gerenciar deals em todas as etapas do funil
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Badge>3</Badge>
                            <div>
                              <h4 className="font-semibold">Inteligência de Mercado</h4>
                              <p className="text-sm text-muted-foreground">
                                Análise de empresas, sinais de compra e enriquecimento automático de dados
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="arquitetura" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3">
                    🏗️ Arquitetura da Plataforma
                  </h2>
                  
                  <Card className="bg-card/50">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Fluxo de Dados</h3>
                      <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                          <p className="font-mono text-sm">
                            Lead → Qualificação → Enriquecimento → Estratégia → Execução → Análise → Fechamento
                          </p>
                        </div>
                        <p className="text-muted-foreground">
                          Cada etapa é automatizada e alimenta a próxima com dados estruturados e insights acionáveis.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sdr-workspace" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3">
                    💼 SDR Workspace - Guia Completo
                  </h2>
                  
                  <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-3">O que é o SDR Workspace?</h3>
                        <p className="text-foreground/90">
                          O <strong>SDR Workspace</strong> é o centro de comando unificado onde o representante de 
                          vendas gerencia todo o ciclo de prospecção e qualificação. Aqui você encontra:
                        </p>
                        <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
                          <li>Pipeline visual de oportunidades</li>
                          <li>Inbox centralizado de conversas</li>
                          <li>Gerenciamento de tarefas e follow-ups</li>
                          <li>Sequências de cadência automatizadas</li>
                          <li>Analytics e forecasts em tempo real</li>
                          <li>IA Copiloto com sugestões contextuais</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-3">Como usar o Workspace</h3>
                        <div className="space-y-3">
                          <div className="bg-muted/30 p-3 rounded">
                            <h4 className="font-semibold text-sm">1️⃣ Acessando o Workspace</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Navegue para <code className="bg-primary/10 px-2 py-0.5 rounded">SDR → Workspace</code> 
                              no menu lateral
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded">
                            <h4 className="font-semibold text-sm">2️⃣ Visualizando Métricas</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Os cards no topo mostram: Deals Ativos, Pipeline Value, Probabilidade Média e Deals Prioritários
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded">
                            <h4 className="font-semibold text-sm">3️⃣ Navegando pelas Abas</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Use as 7 abas para alternar entre Pipeline, Analytics, Forecast, Automações, Inbox, Tarefas e Sequências
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ia-copiloto" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3">
                    🤖 IA Copiloto - Seu Assistente Inteligente
                  </h2>
                  
                  <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/5">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-3">Recursos do Copiloto</h3>
                      <div className="grid gap-3">
                        <div className="bg-background/50 p-4 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2">
                            <span>💬</span> Sugestões Contextuais
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Recebe sugestões automáticas de próximas ações baseadas no contexto atual
                          </p>
                        </div>
                        <div className="bg-background/50 p-4 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2">
                            <span>✍️</span> Geração de Mensagens
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Crie emails, mensagens e follow-ups personalizados com IA
                          </p>
                        </div>
                        <div className="bg-background/50 p-4 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2">
                            <span>📊</span> Insights Preditivos
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Identifica padrões e prevê probabilidades de conversão
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pipeline" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3">
                    📊 Gerenciamento de Pipeline
                  </h2>
                  
                  <Card className="bg-card/50">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Estágios do Pipeline</h3>
                      <div className="space-y-3">
                        <Badge variant="outline" className="w-full justify-start text-left py-2">
                          🔍 Discovery → Prospecção e qualificação inicial
                        </Badge>
                        <Badge variant="outline" className="w-full justify-start text-left py-2">
                          📞 Contact Made → Primeiro contato estabelecido
                        </Badge>
                        <Badge variant="outline" className="w-full justify-start text-left py-2">
                          💬 Meeting Scheduled → Reunião agendada
                        </Badge>
                        <Badge variant="outline" className="w-full justify-start text-left py-2">
                          📋 Proposal → Proposta apresentada
                        </Badge>
                        <Badge variant="outline" className="w-full justify-start text-left py-2">
                          🤝 Negotiation → Em negociação
                        </Badge>
                        <Badge variant="outline" className="w-full justify-start text-left py-2">
                          ✅ Closed Won → Venda fechada!
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </AppLayout>
  );
}
