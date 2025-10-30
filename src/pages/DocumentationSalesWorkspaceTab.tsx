import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Activity, BarChart3, TrendingUp, Zap, CheckSquare, Inbox, Mail, AlertCircle,
  Clock, Users, DollarSign, Target, Rocket, Eye, Play, MousePointerClick,
  ChevronRight, CheckCircle, Trophy, Award, ListChecks, MessageSquare, Phone,
  Calendar, Bell, Filter, Search, Sparkles, LineChart, PieChart, FileText,
  Settings, Repeat, Workflow, Send, Link2, Edit, Trash2, Copy, ThumbsUp,
  TrendingDown, Star, Package, Building2
} from 'lucide-react';

export function DocumentationSalesWorkspaceTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary border-b pb-3 flex items-center gap-3">
        <Activity className="h-8 w-8" />
        Módulo 4: Sales Workspace
      </h2>
      
      {/* Visão Geral */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-blue-400" />
            O QUE É O SALES WORKSPACE?
          </h3>
          <p className="text-muted-foreground mb-4">
            O Sales Workspace é o centro de comando unificado de vendas onde você gerencia todo o ciclo de vendas em um único lugar. 
            Plataforma completa com 11 abas especializadas:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: BarChart3, text: "Executivo - KPIs e alertas prioritários", badge: "NOVO" },
              { icon: Activity, text: "Pipeline - Kanban visual de deals", badge: null },
              { icon: AlertCircle, text: "Health - Monitor de deals em risco", badge: "IA" },
              { icon: BarChart3, text: "Analytics - Dashboard executivo completo", badge: null },
              { icon: TrendingUp, text: "Forecast - Previsão de receita com IA", badge: "IA" },
              { icon: TrendingUp, text: "Funil AI - Análise de conversão", badge: "IA" },
              { icon: BarChart3, text: "Predição - Scoring preditivo", badge: "IA" },
              { icon: Zap, text: "Automações - Alertas inteligentes", badge: null },
              { icon: Inbox, text: "Inbox - Mensagens centralizadas", badge: null },
              { icon: CheckSquare, text: "Smart Tasks - Tarefas com IA", badge: "IA" },
              { icon: Mail, text: "Email Sequences - Cadências automáticas", badge: null },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                <item.icon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm">{item.text}</span>
                  {item.badge && (
                    <Badge className={`ml-2 ${item.badge === 'IA' ? 'bg-purple-500' : 'bg-green-500'}`}>
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por que usar */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-green-400" />
            POR QUE USAR O SALES WORKSPACE?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Clock, title: "Economiza 4-5 horas/dia", desc: "tudo em um único lugar" },
              { icon: TrendingUp, title: "Aumenta produtividade 60%", desc: "automações e IA" },
              { icon: Users, title: "Visibilidade total", desc: "do pipeline em tempo real" },
              { icon: Trophy, title: "Previsibilidade", desc: "de receita com IA" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-green-500/20">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <item.icon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-400">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guia Passo a Passo */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" />
            GUIA COMPLETO - 11 ABAS
          </h3>
          
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
            <p className="font-semibold mb-2">ACESSO RÁPIDO:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>URL:</strong> <code className="bg-muted px-2 py-0.5 rounded">/sdr/workspace</code></p>
              <p><strong>Menu:</strong> SDR → Sales Workspace</p>
              <p><strong>Atalho:</strong> Botão "Manual do SDR" sempre visível no topo</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {/* ABA 1: EXECUTIVO */}
            <AccordionItem value="aba-1">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">1</div>
                  <span>Aba Executivo - Visão Estratégica</span>
                  <Badge className="ml-2 bg-green-500">NOVO</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                      O QUE FAZ
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Dashboard executivo minimalista com os indicadores mais críticos para tomada de decisão rápida.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">📊 KPIs Principais (Cards no topo):</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            Pipeline Total (valor em R$)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            Taxa de Conversão (%)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            Ticket Médio (R$)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            Velocidade de Vendas (dias)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            Receita Mensal Recorrente (MRR)
                          </li>
                        </ul>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">🚨 Alertas Prioritários:</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                            Deals estagnados há +7 dias
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Follow-ups atrasados
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            Oportunidades quentes sem contato
                          </li>
                        </ul>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">📅 Atividades Recentes (filtráveis):</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Feed unificado de tarefas, mensagens e contatos
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Filtro por período (7, 30, 90 dias ou customizado)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Mostra últimas 5 por padrão (expansível)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Play className="h-5 w-5 text-green-400" />
                      COMO USAR
                    </h4>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Abra o Sales Workspace e clique na aba <strong>"Executivo"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Visualize os 5 KPIs principais no topo da página</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Revise os alertas prioritários (vermelho = urgente)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Filtre atividades por data usando o seletor de período</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Clique em "Ver todas" para expandir atividades</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ABA 2: PIPELINE */}
            <AccordionItem value="aba-2">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">2</div>
                  <span>Aba Pipeline - Kanban Visual</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-400" />
                      KANBAN INTERATIVO
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">🎯 Estágios Padrão:</p>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <Badge variant="outline" className="justify-center">Qualificação</Badge>
                          <Badge variant="outline" className="justify-center">Proposta</Badge>
                          <Badge variant="outline" className="justify-center">Negociação</Badge>
                          <Badge variant="outline" className="justify-center">Fechamento</Badge>
                          <Badge variant="outline" className="justify-center bg-green-500/20">Ganho</Badge>
                        </div>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">✨ Funcionalidades:</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <MousePointerClick className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Arrastar e soltar deals entre estágios
                          </li>
                          <li className="flex items-start gap-2">
                            <Edit className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Editar deal direto no card (clique duplo)
                          </li>
                          <li className="flex items-start gap-2">
                            <Filter className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Filtros: prioridade, valor, probabilidade, dono
                          </li>
                          <li className="flex items-start gap-2">
                            <Search className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Busca instantânea por nome de empresa ou deal
                          </li>
                          <li className="flex items-start gap-2">
                            <BarChart3 className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            Estatísticas por estágio (valor total, média, quantidade)
                          </li>
                        </ul>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">📋 Informações no Card:</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>• Nome da empresa</li>
                          <li>• Título do deal</li>
                          <li>• Valor (R$) e probabilidade (%)</li>
                          <li>• Badge de prioridade (alta, média, baixa)</li>
                          <li>• Temperatura do lead (🔥 hot, 🟡 warm, 🔵 cold)</li>
                          <li>• Dono responsável (avatar)</li>
                          <li>• Data da última interação</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Play className="h-5 w-5 text-green-400" />
                      FLUXO DE TRABALHO TÍPICO
                    </h4>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">1.</span>
                        <span>Lead qualificado no ICP entra automaticamente no estágio <strong>"Qualificação"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">2.</span>
                        <span>SDR faz primeira ligação e move para <strong>"Proposta"</strong> (arrastar card)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">3.</span>
                        <span>Proposta enviada → Card atualiza automaticamente a data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">4.</span>
                        <span>Cliente responde → Move para <strong>"Negociação"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">5.</span>
                        <span>Contrato assinado → <strong>"Fechamento"</strong> → <strong>"Ganho"</strong></span>
                      </li>
                    </ol>
                  </div>

                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-400" />
                      DICAS DE PRODUTIVIDADE
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ThumbsUp className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>Atualize o pipeline DIARIAMENTE (manhã e fim do dia)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ThumbsUp className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>Use prioridades: Alta (vence hoje), Média (esta semana), Baixa (mês)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ThumbsUp className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>Deals sem atualização +7 dias → Revisar urgente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ThumbsUp className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>Mantenha máximo 5-7 deals em "Qualificação" simultaneamente</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ABA 3: HEALTH */}
            <AccordionItem value="aba-3">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">3</div>
                  <span>Aba Health - Monitor de Risco</span>
                  <Badge className="ml-2 bg-purple-500">IA</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      MONITORAMENTO INTELIGENTE
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      A IA analisa automaticamente todos os deals e identifica riscos de perda baseado em padrões comportamentais.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">🚨 Sinais de Risco Detectados:</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <TrendingDown className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Sem interação há +14 dias
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingDown className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Probabilidade caiu -20% no último mês
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingDown className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Cliente não responde emails/ligações
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingDown className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Deal estagnado no mesmo estágio +30 dias
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingDown className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Múltiplas reuniões canceladas
                          </li>
                        </ul>
                      </div>

                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold text-sm mb-2">💡 Recomendações IA:</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Para cada deal em risco, a IA sugere ações específicas:
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>• Ligar imediatamente (com script sugerido)</li>
                          <li>• Enviar email de reengajamento (template pronto)</li>
                          <li>• Agendar reunião de alinhamento</li>
                          <li>• Escalar para gerente de vendas</li>
                          <li>• Oferecer desconto estratégico</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Play className="h-5 w-5 text-green-400" />
                      COMO USAR
                    </h4>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">1.</span>
                        <span>Acesse a aba <strong>"Health"</strong> no Sales Workspace</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">2.</span>
                        <span>Visualize cards dos deals em risco (ordenados por gravidade)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">3.</span>
                        <span>Clique em um card para ver análise detalhada e recomendações</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">4.</span>
                        <span>Execute as ações recomendadas pela IA</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold">5.</span>
                        <span>Registre o resultado no CRM (deal recuperado ou perdido)</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ABA 4: ANALYTICS */}
            <AccordionItem value="aba-4">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">4</div>
                  <span>Aba Analytics - Dashboard Completo</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-semibold mb-3">📊 MÉTRICAS DISPONÍVEIS:</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-2">Performance de Vendas:</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Receita total e projetada</li>
                        <li>• Taxa de conversão por estágio</li>
                        <li>• Ticket médio por segmento</li>
                        <li>• Ciclo de vendas médio</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-2">Performance de SDRs:</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Ranking de SDRs (top performers)</li>
                        <li>• Atividades por SDR (calls, emails)</li>
                        <li>• Taxa de conversão individual</li>
                        <li>• Quota achievement (%)</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-2">Pipeline Health:</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Distribuição por estágio</li>
                        <li>• Velocidade de movimento</li>
                        <li>• Deals estagnados</li>
                        <li>• Valor ponderado (weighted)</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-2">Análise Temporal:</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Evolução semanal/mensal</li>
                        <li>• Comparativo período anterior</li>
                        <li>• Tendências e sazonalidade</li>
                        <li>• Previsão próximos 90 dias</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ABA 5: FORECAST */}
            <AccordionItem value="aba-5">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">5</div>
                  <span>Aba Forecast - Previsão com IA</span>
                  <Badge className="ml-2 bg-purple-500">IA</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    PREVISÃO INTELIGENTE
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    A IA analisa seu pipeline atual e histórico para prever receita futura com alta precisão.
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold text-sm mb-2">📈 Previsões Geradas:</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Receita esperada próximos 30 dias (90% confiança)</li>
                        <li>• Receita esperada próximos 60 dias (80% confiança)</li>
                        <li>• Receita esperada próximos 90 dias (70% confiança)</li>
                        <li>• Cenário otimista/realista/pessimista</li>
                        <li>• Identificação de riscos e oportunidades</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Abas restantes resumidas */}
            <AccordionItem value="aba-outras">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">6-11</div>
                  <span>Outras Abas - Resumo Rápido</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  {[
                    {
                      num: 6,
                      name: "Funil AI",
                      icon: TrendingUp,
                      desc: "Análise de conversão em cada estágio do funil com recomendações de otimização por IA"
                    },
                    {
                      num: 7,
                      name: "Predição",
                      icon: BarChart3,
                      desc: "Scoring preditivo que indica probabilidade de fechamento de cada deal baseado em ML"
                    },
                    {
                      num: 8,
                      name: "Automações",
                      icon: Zap,
                      desc: "Central de alertas inteligentes e ações automatizadas (follow-ups, tarefas, emails)"
                    },
                    {
                      num: 9,
                      name: "Inbox",
                      icon: Inbox,
                      desc: "Centraliza todas as mensagens recebidas (emails, WhatsApp, LinkedIn) em um só lugar"
                    },
                    {
                      num: 10,
                      name: "Smart Tasks",
                      icon: CheckSquare,
                      desc: "Lista inteligente de tarefas com priorização automática por IA e sugestões de próximas ações"
                    },
                    {
                      num: 11,
                      name: "Email Sequences",
                      icon: Mail,
                      desc: "Criador visual de cadências de email automáticas com templates prontos e A/B testing"
                    },
                  ].map((aba) => (
                    <div key={aba.num} className="p-4 bg-muted/30 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                          {aba.num}
                        </div>
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <aba.icon className="h-5 w-5 text-primary" />
                            {aba.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{aba.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Fluxo de Trabalho Diário */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-cyan-400" />
            FLUXO DE TRABALHO DIÁRIO RECOMENDADO
          </h3>
          <div className="space-y-3">
            {[
              { time: "08:00-08:30", task: "Revisar aba Executivo: KPIs, alertas e atividades do dia anterior" },
              { time: "08:30-10:00", task: "Pipeline: Atualizar status de todos os deals ativos, mover cards" },
              { time: "10:00-10:30", task: "Health: Revisar deals em risco e executar ações recomendadas" },
              { time: "10:30-12:00", task: "Smart Tasks: Executar tarefas prioritárias (calls, emails, follow-ups)" },
              { time: "13:00-15:00", task: "Inbox: Responder mensagens e Sequences: Configurar cadências" },
              { time: "15:00-16:00", task: "Analytics: Revisar métricas e Forecast: Validar projeções" },
              { time: "16:00-17:00", task: "Automações: Configurar alertas para amanhã e registrar atividades do dia" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                <Badge className="bg-cyan-500 flex-shrink-0">{item.time}</Badge>
                <p className="text-sm">{item.task}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo Final */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-400" />
            RESUMO DO MÓDULO 4
          </h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">O QUE VOCÊ APRENDEU:</p>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                {[
                  "Estrutura completa do Sales Workspace (11 abas)",
                  "Como usar a aba Executivo para decisões rápidas",
                  "Gerenciar pipeline visual com Kanban",
                  "Monitorar deals em risco com Health Monitor",
                  "Analisar performance com Analytics",
                  "Prever receita com Forecast IA",
                  "Otimizar funil com Funil AI",
                  "Usar predição para priorizar deals",
                  "Configurar automações inteligentes",
                  "Centralizar comunicação no Inbox",
                  "Gerenciar tarefas com Smart Tasks",
                  "Criar cadências com Email Sequences",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-background rounded border">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                TEMPO ESTIMADO PARA DOMINAR:
              </p>
              <div className="space-y-1 text-sm">
                <p>• Primeira semana: <Badge className="bg-cyan-500">Aprendendo navegação básica</Badge></p>
                <p>• Segunda semana: <Badge className="bg-cyan-500">Usando 5-6 abas regularmente</Badge></p>
                <p>• Terceira semana: <Badge className="bg-cyan-500">Fluxo de trabalho otimizado</Badge></p>
                <p>• Quarta semana: <Badge className="bg-green-600">Produtividade máxima - expert</Badge></p>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 rounded border border-green-500/20">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-400" />
                RESULTADO ESPERADO:
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Economia de 4-5 horas/dia em gerenciamento de vendas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Aumento de 40-60% na taxa de conversão
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Redução de 50% em deals perdidos por falta de follow-up
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Previsibilidade de receita com 85-90% de precisão
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Visibilidade total do pipeline em tempo real
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
