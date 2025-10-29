import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Target, Bot, Rocket, Clock, TrendingUp, Users, Trophy, Flame, Thermometer,
  Snowflake, Package, MessageSquare, Phone, DollarSign, AlertTriangle, Sparkles,
  CheckCircle2, ArrowRight, Building2, MapPin, Briefcase, Activity, Eye, Play,
  Search, MousePointerClick, Loader2, FileText, BarChart3, ShoppingCart, 
  PhoneCall, Calculator, ListChecks, Send, Mail, Clipboard, ThumbsUp, XCircle,
  ChevronRight, Zap, ShieldAlert, Factory, TrendingDown, Star, Award, CheckCircle
} from 'lucide-react';

export function DocumentationQualificacaoTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary border-b pb-3 flex items-center gap-3">
        <Target className="h-8 w-8" />
        Módulo 3: Qualificação ICP + IA
      </h2>
      
      {/* Visão Geral */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-400" />
            O QUE É QUALIFICAÇÃO ICP?
          </h3>
          <p className="text-muted-foreground mb-4">
            ICP (Ideal Customer Profile) é o perfil do cliente ideal para sua empresa. 
            A Máquina de Vendas OLV usa Inteligência Artificial para:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: Target, text: "Calcular automaticamente o score ICP (0-100 pontos)" },
              { icon: Flame, text: "Classificar leads por temperatura (🔥 HOT, 🟡 WARM, 🔵 COLD)" },
              { icon: AlertTriangle, text: "Detectar pain points (dores do cliente)" },
              { icon: Package, text: "Recomendar produtos TOTVS específicos" },
              { icon: MessageSquare, text: "Gerar proposta de valor personalizada com IA" },
              { icon: Phone, text: "Criar script de abordagem comercial pronto" },
              { icon: DollarSign, text: "Estimar ROI (retorno sobre investimento)" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                <item.icon className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por que usar */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-green-400" />
            POR QUE USAR?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Clock, title: "Economiza 2-3 horas", desc: "de pesquisa por lead" },
              { icon: TrendingUp, title: "Aumenta conversão em 35%", desc: "foco em leads quentes" },
              { icon: Users, title: "Padroniza abordagem", desc: "todos os SDRs usam o mesmo método" },
              { icon: Trophy, title: "Melhora qualidade", desc: "das conversas comerciais" },
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

      {/* Tempo do Processo */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-cyan-400" />
            TEMPO TOTAL DO PROCESSO
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-cyan-500/20">
              <span className="font-semibold">Análise ICP (automático):</span>
              <Badge className="bg-cyan-500">15-30 segundos</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-cyan-500/20">
              <span className="font-semibold">Leitura de proposta:</span>
              <Badge className="bg-cyan-500">5-7 minutos</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-cyan-500/20">
              <span className="font-semibold">Prática de script:</span>
              <Badge className="bg-cyan-500">15-20 minutos</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-cyan-500/20 rounded-lg border-2 border-cyan-500">
              <span className="font-bold text-cyan-400">TOTAL POR LEAD:</span>
              <Badge className="bg-cyan-600">~25-30 minutos</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jornada do Usuário - Passo a Passo */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            JORNADA DO USUÁRIO - PASSO A PASSO
          </h3>
          
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
            <p className="font-semibold mb-2">CENÁRIO REAL:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Persona:</strong> João Silva, SDR da OLV Internacional</p>
              <p><strong>Objetivo:</strong> Qualificar um lead aprovado e preparar abordagem comercial</p>
              <p><strong>Tempo estimado:</strong> 5-7 minutos por lead</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {/* PASSO 1: Acessar página */}
            <AccordionItem value="passo-1">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">1</div>
                  <span>Acessar a Página de Qualificação ICP</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Search className="h-5 w-5 text-blue-400" />
                      CAMINHO A: Via Quarentena (Mais Comum)
                    </h4>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>Acesse o menu lateral e clique em <strong>"Quarentena"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>URL muda para: <code className="bg-muted px-2 py-0.5 rounded">/leads/quarantine</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>Localize um lead com status <Badge className="bg-green-500">Aprovado</Badge></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>Clique no botão <strong>"Qualificar ICP →"</strong></span>
                      </li>
                    </ol>
                    <div className="mt-4 p-3 bg-background rounded border">
                      <p className="text-xs font-semibold mb-2">O que acontece:</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                          Sistema redireciona para /leads/icp-analysis?leadId={"{uuid}"}
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                          Lead é selecionado automaticamente
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                          Análise ICP inicia automaticamente
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MousePointerClick className="h-5 w-5 text-purple-400" />
                      CAMINHO B: Acesso Direto (Menos Comum)
                    </h4>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Clique em <strong>"Análise ICP"</strong> no menu</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>URL: <code className="bg-muted px-2 py-0.5 rounded">/leads/icp-analysis</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Clique em um lead da lista</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Análise ICP inicia automaticamente</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* PASSO 2: Aguardar análise */}
            <AccordionItem value="passo-2">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">2</div>
                  <span>Aguardar Análise ICP Automática (15-30s)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="h-6 w-6 text-orange-400 animate-spin" />
                    <div>
                      <h4 className="font-semibold">TELA DE LOADING</h4>
                      <p className="text-sm text-muted-foreground">Você verá: "🔄 Analisando lead... ⏳ Aguarde 15-30s"</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold text-sm mb-2">Etapa 1: Cálculo do Score ICP (5-10s)</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Zap className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                          Edge Function <code>calculate-icp-score-advanced</code> é executada
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                          Sistema analisa 7 dimensões: Setor (0-30pts), Porte (0-25pts), Região (0-20pts), Status TOTVS (0-20pts), Concorrente (0-15pts), Qualidade (0-10pts), Sinais (0-10pts)
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                          Calcula score total (0-100) e define temperatura (HOT/WARM/COLD)
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                          Detecta pain points e recomenda produtos TOTVS
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold text-sm mb-2">Etapa 2: Geração de Proposta com IA (10-20s)</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                          Edge Function <code>generate-value-proposition</code> é executada
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                          OpenAI GPT-4 gera: Proposta de valor (500 palavras), Script de abordagem (200 palavras), Estimativa de ROI (12-24 meses)
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                          Sistema salva tudo em <code>icp_analysis_history</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-400" />
                    POSSÍVEIS ERROS E SOLUÇÕES
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-1">ERRO 1: "Timeout - Análise demorou muito"</p>
                      <p className="text-xs text-muted-foreground mb-2">Causa: Edge Function demorou mais de 30 segundos</p>
                      <p className="text-xs"><strong>Solução:</strong> Clique em "Tentar Novamente" ou recarregue a página (F5)</p>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-1">ERRO 2: "Erro ao gerar proposta - API key inválida"</p>
                      <p className="text-xs text-muted-foreground mb-2">Causa: OPENAI_API_KEY não configurada</p>
                      <p className="text-xs"><strong>Solução:</strong> Sistema usa template estático (fallback) - Proposta ainda é gerada, mas sem personalização IA</p>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-semibold mb-1">ERRO 3: "Lead não encontrado"</p>
                      <p className="text-xs text-muted-foreground mb-2">Causa: Lead foi deletado ou ID inválido</p>
                      <p className="text-xs"><strong>Solução:</strong> Volte para /leads/quarantine e verifique se lead ainda existe</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* PASSO 3: Analisar Score ICP */}
            <AccordionItem value="passo-3">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">3</div>
                  <span>Analisar o Score ICP (7 Dimensões)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <h4 className="font-semibold mb-3">CARD DE SCORE ICP - EXEMPLO</h4>
                  <div className="p-4 bg-background rounded border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">Score ICP: 85/100</span>
                      <Badge className="bg-red-500">🔥 LEAD QUENTE</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: "Setor", score: 30, max: 30, color: "bg-green-500" },
                        { label: "Porte", score: 25, max: 25, color: "bg-green-500" },
                        { label: "Região", score: 20, max: 20, color: "bg-green-500" },
                        { label: "Concorrente", score: 15, max: 15, color: "bg-green-500" },
                        { label: "Qualidade", score: 10, max: 10, color: "bg-green-500" },
                        { label: "TOTVS Status", score: 20, max: 20, color: "bg-green-500" },
                        { label: "Sinais", score: 3, max: 10, color: "bg-yellow-500" },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{item.label}:</span>
                            <span>{item.score}/{item.max}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`${item.color} h-2 rounded-full`}
                              style={{ width: `${(item.score / item.max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {/* Dimensão 1: Setor */}
                  <AccordionItem value="dimensao-setor">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Factory className="h-5 w-5 text-primary" />
                        Dimensão 1: SETOR (0-30 pontos)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="p-3 bg-muted/30 rounded border">
                        <p className="font-semibold text-sm mb-2">Como é calculado:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span>Agro / Cooperativas:</span><Badge className="bg-green-500">30 pts</Badge></div>
                          <div className="flex justify-between"><span>Construção:</span><Badge className="bg-green-500">28 pts</Badge></div>
                          <div className="flex justify-between"><span>Distribuição / Atacado:</span><Badge className="bg-green-500">26 pts</Badge></div>
                          <div className="flex justify-between"><span>Varejo:</span><Badge className="bg-yellow-500">24 pts</Badge></div>
                          <div className="flex justify-between"><span>Indústria:</span><Badge className="bg-yellow-500">22 pts</Badge></div>
                          <div className="flex justify-between"><span>Logística:</span><Badge className="bg-yellow-500">20 pts</Badge></div>
                          <div className="flex justify-between"><span>Serviços:</span><Badge className="bg-orange-500">18 pts</Badge></div>
                          <div className="flex justify-between"><span>Outros:</span><Badge className="bg-red-500">10 pts</Badge></div>
                        </div>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                        <p className="font-semibold text-sm mb-1">Exemplo Prático:</p>
                        <p className="text-xs text-muted-foreground">Lead: Cooperativa Agro LTDA | Setor: Agro | Score: 30/30 ✅</p>
                        <p className="text-xs mt-2"><strong>Justificativa:</strong> "Setor Agro é prioritário para TOTVS. Alta demanda por soluções específicas de gestão de safras, cooperados e controle financeiro."</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                        <p className="font-semibold text-sm mb-2">Ação do SDR:</p>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                            Score alto (≥26): Enfatize expertise TOTVS no setor
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            Score médio (18-25): Mostre cases de sucesso
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Score baixo (&lt;18): Qualifique melhor antes de abordar
                          </li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Dimensão 2: Porte */}
                  <AccordionItem value="dimensao-porte">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Dimensão 2: PORTE (0-25 pontos)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="p-3 bg-muted/30 rounded border">
                        <p className="font-semibold text-sm mb-2">Como é calculado:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span>50-500 funcionários:</span><Badge className="bg-green-500">25 pts (SWEET SPOT)</Badge></div>
                          <div className="flex justify-between"><span>20-49 funcionários:</span><Badge className="bg-yellow-500">18 pts</Badge></div>
                          <div className="flex justify-between"><span>501-1000 funcionários:</span><Badge className="bg-orange-500">15 pts</Badge></div>
                          <div className="flex justify-between"><span>&gt;1000 funcionários:</span><Badge className="bg-red-500">10 pts</Badge></div>
                          <div className="flex justify-between"><span>&lt;20 funcionários:</span><Badge className="bg-red-500">8 pts</Badge></div>
                        </div>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                        <p className="font-semibold text-sm mb-1">Exemplo Prático:</p>
                        <p className="text-xs text-muted-foreground">Lead: Cooperativa Agro LTDA | Funcionários: 150 | Score: 25/25 ✅</p>
                        <p className="text-xs mt-2"><strong>Justificativa:</strong> "Empresa com 150 funcionários está no porte ideal para TOTVS (50-500). Tamanho suficiente para justificar ERP robusto, mas não tão grande que tenha processos engessados."</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Dimensão 3: Região */}
                  <AccordionItem value="dimensao-regiao">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Dimensão 3: REGIÃO (0-20 pontos)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="p-3 bg-muted/30 rounded border">
                        <p className="font-semibold text-sm mb-2">Como é calculado:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span>SP:</span><Badge className="bg-green-500">20 pts (Hub TOTVS)</Badge></div>
                          <div className="flex justify-between"><span>MG, RS, PR, SC:</span><Badge className="bg-green-500">18 pts</Badge></div>
                          <div className="flex justify-between"><span>GO, MT, MS:</span><Badge className="bg-yellow-500">16 pts</Badge></div>
                          <div className="flex justify-between"><span>BA, ES:</span><Badge className="bg-yellow-500">14 pts</Badge></div>
                          <div className="flex justify-between"><span>RJ:</span><Badge className="bg-orange-500">12 pts</Badge></div>
                          <div className="flex justify-between"><span>Outros:</span><Badge className="bg-red-500">8 pts</Badge></div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Dimensões restantes resumidas */}
                  <AccordionItem value="dimensao-totvs">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Dimensão 4: STATUS TOTVS (0-20 pontos)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="p-3 bg-muted/30 rounded border text-xs space-y-1">
                        <div className="flex justify-between"><span>NÃO usa TOTVS:</span><Badge className="bg-green-500">+20 pts (OPORTUNIDADE!)</Badge></div>
                        <div className="flex justify-between"><span>Desconhecido:</span><Badge className="bg-yellow-500">+10 pts</Badge></div>
                        <div className="flex justify-between"><span>Usa TOTVS:</span><Badge className="bg-red-500">-30 pts (Não é oportunidade)</Badge></div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dimensao-concorrente">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-primary" />
                        Dimensão 5: CONCORRENTE (0-15 pontos)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="p-3 bg-muted/30 rounded border text-xs space-y-1">
                        <div className="flex justify-between"><span>SAP / Oracle:</span><Badge className="bg-green-500">15 pts (Alto custo, complexo)</Badge></div>
                        <div className="flex justify-between"><span>Microsoft Dynamics:</span><Badge className="bg-green-500">14 pts</Badge></div>
                        <div className="flex justify-between"><span>Senior:</span><Badge className="bg-green-500">13 pts</Badge></div>
                        <div className="flex justify-between"><span>Sankhya:</span><Badge className="bg-yellow-500">12 pts</Badge></div>
                        <div className="flex justify-between"><span>Bling / Tiny:</span><Badge className="bg-yellow-500">8 pts</Badge></div>
                        <div className="flex justify-between"><span>Nenhum (planilhas):</span><Badge className="bg-orange-500">5 pts</Badge></div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dimensao-qualidade">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        Dimensão 6: QUALIDADE DE DADOS (0-10 pontos)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="p-3 bg-muted/30 rounded border">
                        <p className="text-xs mb-2">Fórmula: <code>(data_quality_score / 100) * 10</code></p>
                        <p className="text-xs font-semibold mb-2">Fatores que aumentam qualidade:</p>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-400" />CNPJ preenchido e válido</li>
                          <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-400" />Website ativo e verificado</li>
                          <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-400" />Email verificado</li>
                          <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-400" />LinkedIn encontrado</li>
                          <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-400" />Todos os campos preenchidos</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dimensao-sinais">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Dimensão 7: SINAIS DE INTENÇÃO (0-10 pontos)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-3">
                      <div className="p-3 bg-muted/30 rounded border">
                        <p className="text-xs mb-2">Fórmula: <code>número_de_sinais * 3 (máximo 10)</code></p>
                        <p className="text-xs font-semibold mb-2">Sinais detectados:</p>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center gap-2"><Flame className="h-3 w-3 text-orange-400" />Visitou site TOTVS recentemente</li>
                          <li className="flex items-center gap-2"><Flame className="h-3 w-3 text-orange-400" />Baixou material (ebook, whitepaper)</li>
                          <li className="flex items-center gap-2"><Flame className="h-3 w-3 text-orange-400" />Assistiu webinar</li>
                          <li className="flex items-center gap-2"><Flame className="h-3 w-3 text-orange-400" />Abriu/clicou em email</li>
                          <li className="flex items-center gap-2"><Flame className="h-3 w-3 text-orange-400" />Agendou reunião ou pediu orçamento</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            {/* PASSO 4: Classificação de Temperatura */}
            <AccordionItem value="passo-4">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">4</div>
                  <span>Classificação de Temperatura (HOT/WARM/COLD)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* HOT */}
                  <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border-2 border-red-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="h-6 w-6 text-red-400" />
                      <h4 className="font-bold text-lg">🔥 HOT</h4>
                    </div>
                    <Badge className="bg-red-500 mb-3">80-100 pontos</Badge>
                    <p className="text-xs mb-3">Lead com FIT PERFEITO. Alta probabilidade de conversão (&gt;50%).</p>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-background/50 rounded">
                        <p className="font-semibold mb-1">AÇÃO IMEDIATA:</p>
                        <ul className="space-y-0.5 text-xs">
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Ligar HOJE (próximas 2h)
                          </li>
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Agendar reunião esta semana
                          </li>
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                            Enviar proposta por email
                          </li>
                        </ul>
                      </div>
                      <p className="text-muted-foreground">🎯 Conversão: 50-70%</p>
                      <p className="text-muted-foreground">⏱️ Fechamento: 30-45 dias</p>
                    </div>
                  </div>

                  {/* WARM */}
                  <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg border-2 border-yellow-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Thermometer className="h-6 w-6 text-yellow-400" />
                      <h4 className="font-bold text-lg">🟡 WARM</h4>
                    </div>
                    <Badge className="bg-yellow-500 mb-3">60-79 pontos</Badge>
                    <p className="text-xs mb-3">Lead com BOM FIT. Probabilidade média de conversão (30-50%).</p>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-background/50 rounded">
                        <p className="font-semibold mb-1">ABORDAR ESTA SEMANA:</p>
                        <ul className="space-y-0.5 text-xs">
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            Ligar em 3-5 dias
                          </li>
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            Qualificar BANT na ligação
                          </li>
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                            Enviar case de sucesso
                          </li>
                        </ul>
                      </div>
                      <p className="text-muted-foreground">🎯 Conversão: 30-50%</p>
                      <p className="text-muted-foreground">⏱️ Fechamento: 45-60 dias</p>
                    </div>
                  </div>

                  {/* COLD */}
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border-2 border-blue-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Snowflake className="h-6 w-6 text-blue-400" />
                      <h4 className="font-bold text-lg">🔵 COLD</h4>
                    </div>
                    <Badge className="bg-blue-500 mb-3">0-59 pontos</Badge>
                    <p className="text-xs mb-3">Lead com FIT BAIXO. Baixa probabilidade de conversão (&lt;30%).</p>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-background/50 rounded">
                        <p className="font-semibold mb-1">NUTRIR ANTES:</p>
                        <ul className="space-y-0.5 text-xs">
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            NÃO ligar agora
                          </li>
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            Adicionar em campanha
                          </li>
                          <li className="flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            Monitorar sinais
                          </li>
                        </ul>
                      </div>
                      <p className="text-muted-foreground">🎯 Conversão: &lt;30%</p>
                      <p className="text-muted-foreground">⏱️ Fechamento: 90+ dias</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* PASSO 5-9: Resumidos */}
            <AccordionItem value="passo-5">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">5</div>
                  <span>Analisar Pain Points</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">Sistema detecta automaticamente 4 tipos de pain points:</p>
                <div className="space-y-2">
                  {[
                    { type: "TECNOLOGIA", desc: "Concorrente caro ou sistema legado", severity: "HIGH" },
                    { type: "MERCADO", desc: "Setor prioritário com desafios únicos", severity: "HIGH" },
                    { type: "PORTE", desc: "Tamanho ideal para TOTVS (50-500)", severity: "MEDIUM" },
                    { type: "REGIÃO", desc: "Localização com suporte forte", severity: "MEDIUM" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded border text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{item.type}</span>
                        <Badge className={item.severity === "HIGH" ? "bg-red-500" : "bg-yellow-500"}>{item.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="passo-6">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">6</div>
                  <span>Ver Produtos TOTVS Recomendados</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">IA recomenda produtos baseado no setor:</p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-muted/30 rounded border">
                    <p className="font-semibold mb-1">TOTVS AGRO</p>
                    <p className="text-muted-foreground">Para Cooperativas: Gestão de safras, cooperados e controle financeiro rural</p>
                    <p className="text-xs mt-1">💰 R$ 22.500 - R$ 45.000/mês | ⏱️ 3-6 meses implementação</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded border">
                    <p className="font-semibold mb-1">TOTVS PROTHEUS</p>
                    <p className="text-muted-foreground">ERP completo com módulos específicos por setor</p>
                    <p className="text-xs mt-1">💰 R$ 30.000 - R$ 60.000/mês | ⏱️ 4-8 meses implementação</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded border">
                    <p className="font-semibold mb-1">TOTVS FLUIG</p>
                    <p className="text-muted-foreground">Automação de processos (sempre recomendado)</p>
                    <p className="text-xs mt-1">💰 R$ 5.000 - R$ 15.000/mês | ⏱️ 1-3 meses implementação</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="passo-7">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">7</div>
                  <span>Ler Proposta de Valor Gerada por IA</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <h4 className="font-semibold">Proposta Personalizada com IA</h4>
                    <Badge className="bg-purple-500">Gerado por IA ✨</Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold">Estrutura da proposta (~500 palavras):</p>
                    <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
                      <li>Abertura contextualizada (desafios do setor)</li>
                      <li>Dores identificadas (4-5 pain points)</li>
                      <li>Solução TOTVS (como resolve cada dor)</li>
                      <li>Diferencial competitivo (vs concorrente)</li>
                      <li>Próximos passos (agendamento)</li>
                      <li>ROI estimado (12-24 meses)</li>
                    </ul>
                    <div className="mt-3 p-2 bg-background rounded border">
                      <p className="font-semibold mb-1">Como usar:</p>
                      <ul className="space-y-0.5 ml-4 list-disc text-muted-foreground">
                        <li>Enviar por email após primeira ligação</li>
                        <li>Usar como roteiro na ligação (não ler textualmente)</li>
                        <li>Apresentar em reunião (compartilhar tela)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="passo-8">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">8</div>
                  <span>Copiar Script de Abordagem</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Script Comercial Pronto</h4>
                    <button className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded text-xs">
                      <Clipboard className="h-4 w-4" />
                      Copiar Script
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold">Estrutura do script (~200 palavras):</p>
                    <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
                      <li><strong>Apresentação (15s):</strong> Nome, empresa, motivo da ligação</li>
                      <li><strong>Quebra-gelo:</strong> Pergunta sobre desafio atual</li>
                      <li><strong>Pitch de valor (30s):</strong> Resultados de clientes similares</li>
                      <li><strong>Qualificação BANT:</strong> Budget, Authority, Need, Timing</li>
                      <li><strong>Agendamento:</strong> Propor reunião de 30 min</li>
                      <li><strong>Tratamento de objeções:</strong> 5 objeções comuns com respostas</li>
                    </ul>
                    <div className="mt-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <p className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-400" />
                        IMPORTANTE:
                      </p>
                      <p className="text-muted-foreground">Praticar 15-20 min ANTES de ligar. Não ler palavra por palavra - adaptar conforme conversa.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="passo-9">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">9</div>
                  <span>Ver ROI Estimado & Próximas Ações</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-green-400" />
                      ROI ESTIMADO
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold mb-1">💵 INVESTIMENTO:</p>
                        <p className="text-muted-foreground">Mensal: R$ 22.500 - R$ 45.000</p>
                        <p className="text-muted-foreground">Anual: R$ 270.000 - R$ 540.000</p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="font-semibold mb-1">📈 RETORNO (12 meses):</p>
                        <p className="text-muted-foreground">Total: R$ 500k - R$ 750k/ano</p>
                        <p className="text-green-400 font-semibold">⏱️ Payback: 12-18 meses</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-orange-400" />
                      CHECKLIST DE PRÓXIMAS AÇÕES
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        "Copiar script de abordagem",
                        "Praticar script (15-20 min)",
                        "Ligar para o lead",
                        "Qualificar BANT na ligação",
                        "Agendar reunião de descoberta",
                        "Enviar proposta por email",
                        "Adicionar lead no CRM",
                        "Configurar follow-up automático",
                        "Registrar interação",
                        "Mover para pipeline",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-background rounded border">
                          <CheckCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Resumo Final */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-400" />
            RESUMO DO MÓDULO 3
          </h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">O QUE VOCÊ APRENDEU:</p>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                {[
                  "Como acessar a página de Qualificação ICP",
                  "Como interpretar Score ICP (0-100 pontos)",
                  "As 7 dimensões do score",
                  "Classificação por temperatura (HOT/WARM/COLD)",
                  "Como analisar pain points",
                  "Ver produtos TOTVS recomendados",
                  "Ler proposta de valor gerada por IA",
                  "Usar script de abordagem",
                  "Apresentar ROI estimado",
                  "Próximas ações após qualificação",
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
                TEMPO TOTAL DO PROCESSO:
              </p>
              <div className="space-y-1 text-sm">
                <p>• Análise ICP: <Badge className="bg-cyan-500">15-30 segundos</Badge> (automático)</p>
                <p>• Leitura de proposta: <Badge className="bg-cyan-500">5-7 minutos</Badge></p>
                <p>• Prática de script: <Badge className="bg-cyan-500">15-20 minutos</Badge></p>
                <p className="font-bold pt-2 border-t">TOTAL: <Badge className="bg-cyan-600">~25-30 minutos por lead</Badge></p>
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
                  Lead qualificado com score preciso
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Proposta de valor personalizada pronta
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Script de abordagem pronto para usar
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  ROI calculado e justificado
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  SDR preparado para ligar com confiança
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
