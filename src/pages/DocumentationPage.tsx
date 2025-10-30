import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, FileText, GraduationCap, Target, Zap, CheckCircle2, AlertCircle,
  Download, Upload, Globe, Link2, CheckCheck, Bot, MessageSquare, BarChart3,
  Database, Network, Monitor, ArrowDownUp, Filter, Search, Play, Calendar,
  Building2, MapPin, Users, Briefcase, TrendingUp, DollarSign, Clock,
  Sparkles, Rocket, Trophy, Shield, Settings, Lock, Mail, Phone, Linkedin,
  ExternalLink, FileSpreadsheet, Code, Workflow, GitBranch, Activity, Eye,
  ThumbsUp, ThumbsDown, Ban, RefreshCw, Send, Copy, FileCode, Package,
  Layers, ServerCog, CloudCog, Cpu, HardDrive, CircleDot, ArrowRight,
  CircleCheck, AlertTriangle, Info, XCircle, Flame, Snowflake, Thermometer,
  Lightbulb, Inbox, CheckSquare
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentationQualificacaoTab } from './DocumentationQualificacaoTab';
import { DocumentationSalesWorkspaceTab } from './DocumentationSalesWorkspaceTab';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lov-mermaid': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('visao-geral');

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-primary" />
              Manual do Operador - Máquina de Vendas
            </h1>
            <p className="text-muted-foreground mt-2">
              Sistema Completo de Vendas B2B com Inteligência Artificial
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            v1.0 - STRATEVO Intelligence
          </Badge>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="visao-geral" className="gap-2">
              <Target className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="fluxo-completo" className="gap-2">
              <Zap className="h-4 w-4" />
              Fluxo Completo
            </TabsTrigger>
            <TabsTrigger value="captura" className="gap-2">
              <FileText className="h-4 w-4" />
              Captura
            </TabsTrigger>
            <TabsTrigger value="quarentena" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Quarentena
            </TabsTrigger>
            <TabsTrigger value="qualificacao" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Qualificação ICP
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Sales Workspace
            </TabsTrigger>
          </TabsList>

          <Card className="bg-gradient-to-br from-background via-background to-primary/5">
            <CardContent className="p-8">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                
                {/* TAB 1: VISÃO GERAL DO SISTEMA */}
                <TabsContent value="visao-geral" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-primary border-b pb-3 flex items-center gap-3">
                      <Target className="h-8 w-8" />
                      O QUE É A MÁQUINA DE VENDAS?
                    </h2>
                    
                    <p className="text-lg text-foreground/90">
                      Um sistema completo e automatizado para gerenciar todo o ciclo de vendas B2B:
                    </p>

                    <Accordion type="multiple" defaultValue={["funcionalidades", "arquitetura", "fluxo-dados"]} className="w-full">
                      <AccordionItem value="funcionalidades">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Funcionalidades Principais
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                  <Download className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-blue-400">Captura Inteligente</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Capture leads de múltiplas fontes: CSV, web scraping, API pública
                                  </p>
                                </div>
                              </div>
                            </Card>
                            
                            <Card className="p-4 bg-green-500/10 border-green-500/20">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-green-500/20">
                                  <CheckCheck className="h-6 w-6 text-green-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-green-400">Validação Automática</h4>
                                  <p className="text-sm text-muted-foreground">
                                    CNPJ, website, LinkedIn, email validados automaticamente
                                  </p>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                  <Bot className="h-6 w-6 text-purple-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-purple-400">Qualificação com IA</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Score ICP de 0-100 com 7 dimensões de análise
                                  </p>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4 bg-orange-500/10 border-orange-500/20">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/20">
                                  <MessageSquare className="h-6 w-6 text-orange-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-orange-400">Proposta Personalizada</h4>
                                  <p className="text-sm text-muted-foreground">
                                    IA gera propostas de valor e scripts de abordagem únicos
                                  </p>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4 bg-pink-500/10 border-pink-500/20">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-pink-500/20">
                                  <Activity className="h-6 w-6 text-pink-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-pink-400">Sales Workspace</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Centro de comando com 11 abas: Pipeline Kanban, Analytics, Forecast IA, Health Monitor, e mais
                                  </p>
                                </div>
                              </div>
                            </Card>

                            <Card className="p-4 bg-cyan-500/10 border-cyan-500/20">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/20">
                                  <BarChart3 className="h-6 w-6 text-cyan-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-cyan-400">Analytics Avançado</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Funil de conversão, KPIs e insights acionáveis
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="arquitetura">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Arquitetura do Sistema
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 rounded-lg border border-primary/20 overflow-x-auto">
                            <p className="text-sm text-muted-foreground mb-4 text-center">
                              📊 Diagrama mostrando a arquitetura completa do sistema
                            </p>
                            <lov-mermaid>
{`graph TB
    subgraph CAPTURA["📥 CAMADA DE CAPTURA"]
        style CAPTURA fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
        A1[📤 Upload CSV/Excel]
        A2[🌐 Web Scraping<br/>Empresas Aqui]
        A3[🔗 API Pública<br/>Formulários Web]
    end
    
    subgraph DATABASE["💾 BANCO DE DADOS"]
        style DATABASE fill:#3b82f6,stroke:#2563eb,stroke-width:3px,color:#fff
        B1[(leads_sources<br/>Fontes)]
        B2[(leads_quarantine<br/>Quarentena)]
        B3[(companies<br/>Empresas)]
        B4[(interactions<br/>Interações)]
        B5[(icp_analysis<br/>Análises ICP)]
    end
    
    subgraph FUNCTIONS["⚡ EDGE FUNCTIONS"]
        style FUNCTIONS fill:#8b5cf6,stroke:#7c3aed,stroke-width:3px,color:#fff
        C1[validate-lead<br/>Validação]
        C2[upload-csv<br/>Upload]
        C3[capture-api<br/>API]
        C4[calculate-icp<br/>ICP Score]
        C5[generate-value<br/>Proposta IA]
    end
    
    subgraph INTERFACE["🖥️ INTERFACE"]
        style INTERFACE fill:#f59e0b,stroke:#d97706,stroke-width:3px,color:#fff
        D1[/leads/capture]
        D2[/leads/quarantine]
        D3[/leads/icp-analysis]
        D4[/leads/pipeline]
        D5[/leads/analytics]
    end
    
    A1 --> C2
    A2 --> C2
    A3 --> C3
    
    C2 --> B2
    C3 --> B2
    C2 --> B1
    
    B2 --> C1
    C1 --> B2
    
    B2 --> D2
    D2 --> C4
    
    C4 --> B5
    C4 --> C5
    C5 --> B3
    
    B3 --> D4["Sales Workspace<br/>(11 abas)"]
    B3 --> D5
    
    D1 --> A1
    D1 --> A2
    D1 --> A3
    
    style A1 fill:#34d399,stroke:#10b981,stroke-width:2px
    style A2 fill:#34d399,stroke:#10b981,stroke-width:2px
    style A3 fill:#34d399,stroke:#10b981,stroke-width:2px
    
    style B1 fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style B2 fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style B3 fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style B4 fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style B5 fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    
    style C1 fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style C2 fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style C3 fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style C4 fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style C5 fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    
    style D1 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px
    style D2 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px
    style D3 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px
    style D4 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px
    style D5 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px`}
                            </lov-mermaid>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="fluxo-dados">
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-primary" />
                            Fluxo de Dados Completo
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 rounded-lg border border-primary/20 overflow-x-auto">
                            <p className="text-sm text-muted-foreground mb-4 text-center">
                              📊 Fluxo sequencial de dados desde a captura até o fechamento
                            </p>
                            <lov-mermaid>
{`flowchart LR
    A[📥 CAPTURA] --> B[🔍 VALIDAÇÃO]
    B --> C[⏳ QUARENTENA]
    C --> D[🎯 QUALIFICAÇÃO ICP]
    D --> E[🎛️ SALES WORKSPACE]
    E --> F[💰 FECHAMENTO]
    
    B -.->|APIs Externas| B1[ReceitaWS<br/>LinkedIn<br/>Website<br/>Email]
    C -.->|Humano| C1[Aprovação<br/>Manual<br/>Revisão]
    D -.->|IA| D1[Score ICP<br/>Proposta IA<br/>Script<br/>ROI]
    E -.->|11 Abas| E1[Pipeline Kanban<br/>Health Monitor IA<br/>Analytics<br/>Forecast IA<br/>Smart Tasks]
    F -.->|Sucesso| F1[🎉 VENDA<br/>FECHADA!]
    
    style A fill:#10b981,stroke:#059669,stroke-width:4px,color:#fff,font-size:16px
    style B fill:#3b82f6,stroke:#2563eb,stroke-width:4px,color:#fff,font-size:16px
    style C fill:#f59e0b,stroke:#d97706,stroke-width:4px,color:#fff,font-size:16px
    style D fill:#8b5cf6,stroke:#7c3aed,stroke-width:4px,color:#fff,font-size:16px
    style E fill:#ec4899,stroke:#db2777,stroke-width:4px,color:#fff,font-size:16px
    style F fill:#06b6d4,stroke:#0891b2,stroke-width:4px,color:#fff,font-size:16px
    
    style B1 fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,stroke-dasharray: 5 5
    style C1 fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,stroke-dasharray: 5 5
    style D1 fill:#f3e8ff,stroke:#8b5cf6,stroke-width:2px,stroke-dasharray: 5 5
    style E1 fill:#fce7f3,stroke:#ec4899,stroke-width:2px,stroke-dasharray: 5 5
    style F1 fill:#ecfeff,stroke:#06b6d4,stroke-width:2px,stroke-dasharray: 5 5`}
                            </lov-mermaid>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </TabsContent>

                {/* TAB 2: FLUXO COMPLETO */}
                <TabsContent value="fluxo-completo" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3 flex items-center gap-3">
                    <Activity className="h-8 w-8" />
                    Etapas do Processo de Vendas
                  </h2>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="etapa1">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-blue-500">ETAPA 1</Badge>
                          <span>CAPTURA DE LEADS</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-blue-500/10 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="font-semibold text-blue-400">Página:</span>
                            <code className="ml-2 bg-muted px-2 py-1 rounded">/leads/capture</code>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-400">Objetivo:</span>
                            <span className="ml-2">Capturar leads de múltiplas fontes</span>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-400">Resultado:</span>
                            <span className="ml-2">Lead inserido em <code className="bg-muted px-1 rounded">leads_quarantine</code> com status <Badge variant="outline" className="ml-1">pending</Badge></span>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">3 Fontes Disponíveis:</h4>
                            <ul className="space-y-2 ml-4">
                              <li className="flex items-start gap-2">
                                <Upload className="h-5 w-5 text-blue-400 mt-0.5" />
                                <div>
                                  <strong>Upload Manual (CSV/Excel)</strong>
                                  <p className="text-sm text-muted-foreground">Faça upload de arquivos com dados de empresas</p>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <Globe className="h-5 w-5 text-green-400 mt-0.5" />
                                <div>
                                  <strong>Empresas Aqui (Web Scraping)</strong>
                                  <p className="text-sm text-muted-foreground">Busque empresas automaticamente na web</p>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <Link2 className="h-5 w-5 text-purple-400 mt-0.5" />
                                <div>
                                  <strong>Formulário Web (API Pública)</strong>
                                  <p className="text-sm text-muted-foreground">Integre formulários do seu site via API</p>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="etapa2">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-500">ETAPA 2</Badge>
                          <span>VALIDAÇÃO AUTOMÁTICA</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-green-500/10 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="font-semibold text-green-400">Processo:</span>
                            <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">validate-lead-comprehensive</code>
                          </div>
                          <div>
                            <span className="font-semibold text-green-400">Objetivo:</span>
                            <span className="ml-2">Validar CNPJ, website, LinkedIn, email automaticamente</span>
                          </div>
                          <div>
                            <span className="font-semibold text-green-400">Resultado:</span>
                            <span className="ml-2">Lead com status <Badge variant="outline">validating</Badge> → pode ir para:</span>
                            <div className="flex gap-2 mt-2 ml-6">
                              <Badge className="bg-green-600">approved</Badge>
                              <Badge className="bg-red-600">rejected</Badge>
                              <Badge className="bg-yellow-600">pending</Badge>
                            </div>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Validações Executadas:</h4>
                            <div className="grid md:grid-cols-2 gap-2">
                              <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>CNPJ (ReceitaWS API)</span>
                              </div>
                              <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>Website (HTTP Status)</span>
                              </div>
                              <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>LinkedIn (Scraping)</span>
                              </div>
                              <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>Email (DNS MX Records)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="etapa3">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-yellow-500">ETAPA 3</Badge>
                          <span>QUARENTENA INTELIGENTE</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-yellow-500/10 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="font-semibold text-yellow-400">Página:</span>
                            <code className="ml-2 bg-muted px-2 py-1 rounded">/leads/quarantine</code>
                          </div>
                          <div>
                            <span className="font-semibold text-yellow-400">Objetivo:</span>
                            <span className="ml-2">Revisar leads pendentes e aprovar/rejeitar manualmente</span>
                          </div>
                          <div>
                            <span className="font-semibold text-yellow-400">Resultado:</span>
                            <span className="ml-2">Lead com status <Badge className="bg-green-600">approved</Badge> pronto para qualificação ICP</span>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Sistema de Scoring:</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
                                <span className="text-green-400 font-mono">70-100</span>
                                <span className="text-sm">→ Aprovado automaticamente</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded"></div>
                                <span className="text-yellow-400 font-mono">30-69</span>
                                <span className="text-sm">→ Revisão manual necessária</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-2 bg-gradient-to-r from-red-500 to-red-600 rounded"></div>
                                <span className="text-red-400 font-mono">0-29</span>
                                <span className="text-sm">→ Rejeitado automaticamente</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="etapa4">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-purple-500">ETAPA 4</Badge>
                          <span>QUALIFICAÇÃO ICP COM IA</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-purple-500/10 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="font-semibold text-purple-400">Página:</span>
                            <code className="ml-2 bg-muted px-2 py-1 rounded">/leads/icp-analysis</code>
                          </div>
                          <div>
                            <span className="font-semibold text-purple-400">Objetivo:</span>
                            <span className="ml-2">Calcular score ICP (0-100), gerar proposta de valor personalizada com IA</span>
                          </div>
                          <div>
                            <span className="font-semibold text-purple-400">Resultado:</span>
                            <div className="ml-2 mt-2 space-y-1">
                              <div>• Score ICP de 0-100 pontos</div>
                              <div>• Temperatura: 
                                <Flame className="h-4 w-4 inline text-orange-500" /> HOT / 
                                <Thermometer className="h-4 w-4 inline text-yellow-500" /> WARM / 
                                <Snowflake className="h-4 w-4 inline text-blue-500" /> COLD
                              </div>
                              <div>• Proposta de valor gerada por IA</div>
                              <div>• Script de abordagem personalizado</div>
                              <div>• ROI estimado (12-24 meses)</div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">7 Dimensões de Análise:</h4>
                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                              <div className="bg-muted/30 p-2 rounded">1. Setor (0-30 pts)</div>
                              <div className="bg-muted/30 p-2 rounded">2. Porte (0-25 pts)</div>
                              <div className="bg-muted/30 p-2 rounded">3. Região (0-20 pts)</div>
                              <div className="bg-muted/30 p-2 rounded">4. Status TOTVS (0-20 pts)</div>
                              <div className="bg-muted/30 p-2 rounded">5. Concorrente (0-15 pts)</div>
                              <div className="bg-muted/30 p-2 rounded">6. Qualidade Dados (0-10 pts)</div>
                              <div className="bg-muted/30 p-2 rounded">7. Sinais Intenção (0-10 pts)</div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="etapa5">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-pink-500">ETAPA 5</Badge>
                          <span>SALES WORKSPACE - Centro de Comando</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-pink-500/10 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="font-semibold text-pink-400">Página:</span>
                            <code className="ml-2 bg-muted px-2 py-1 rounded">/sdr/workspace</code>
                          </div>
                          <div>
                            <span className="font-semibold text-pink-400">Objetivo:</span>
                            <span className="ml-2">Centro de comando unificado com 11 abas especializadas para gerenciar todo ciclo de vendas</span>
                          </div>
                          <div>
                            <span className="font-semibold text-pink-400">Resultado:</span>
                            <span className="ml-2">Visibilidade total do pipeline, deals movendo entre estágios, monitoramento de riscos, previsão de receita</span>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">11 Abas do Sales Workspace:</h4>
                            <div className="grid md:grid-cols-2 gap-2">
                              <Badge variant="outline" className="justify-start">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                1. Executivo → KPIs e alertas
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <Activity className="h-4 w-4 mr-2" />
                                2. Pipeline → Kanban visual
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                3. Health → Deals em risco (IA)
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                4. Analytics → Dashboard completo
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                5. Forecast → Previsão IA
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                6. Funil AI → Conversão
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                7. Predição → Scoring ML
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <Zap className="h-4 w-4 mr-2" />
                                8. Automações → Alertas
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <Inbox className="h-4 w-4 mr-2" />
                                9. Inbox → Mensagens
                              </Badge>
                              <Badge variant="outline" className="justify-start">
                                <CheckSquare className="h-4 w-4 mr-2" />
                                10. Smart Tasks → IA
                              </Badge>
                              <Badge variant="outline" className="justify-start bg-purple-500/20">
                                <Mail className="h-4 w-4 mr-2" />
                                11. Email Sequences
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="etapa6">
                      <AccordionTrigger className="text-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-cyan-500">ETAPA 6</Badge>
                          <span>ANALYTICS & OTIMIZAÇÃO</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="bg-cyan-500/10 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="font-semibold text-cyan-400">Página:</span>
                            <code className="ml-2 bg-muted px-2 py-1 rounded">/sdr/workspace</code> <Badge className="ml-2 bg-cyan-500">Aba Analytics</Badge>
                          </div>
                          <div>
                            <span className="font-semibold text-cyan-400">Objetivo:</span>
                            <span className="ml-2">Analisar conversões, funil de vendas, performance do time, previsão de receita e muito mais</span>
                          </div>
                          <div>
                            <span className="font-semibold text-cyan-400">Resultado:</span>
                            <span className="ml-2">Insights acionáveis e previsibilidade de 85-90% na receita futura</span>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Métricas Disponíveis:</h4>
                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                              <div className="bg-muted/30 p-2 rounded flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-cyan-400" />
                                Taxa de conversão por estágio
                              </div>
                              <div className="bg-muted/30 p-2 rounded flex items-center gap-2">
                                <Clock className="h-4 w-4 text-cyan-400" />
                                Tempo médio no funil
                              </div>
                              <div className="bg-muted/30 p-2 rounded flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-cyan-400" />
                                Valor médio de deal
                              </div>
                              <div className="bg-muted/30 p-2 rounded flex items-center gap-2">
                                <Target className="h-4 w-4 text-cyan-400" />
                                Win rate por fonte
                              </div>
                              <div className="bg-muted/30 p-2 rounded flex items-center gap-2">
                                <Zap className="h-4 w-4 text-cyan-400" />
                                Velocidade de vendas
                              </div>
                              <div className="bg-muted/30 p-2 rounded flex items-center gap-2">
                                <Flame className="h-4 w-4 text-cyan-400" />
                                Performance por SDR
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* TAB 3: CAPTURA */}
                <TabsContent value="captura" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3 flex items-center gap-3">
                    <Download className="h-8 w-8" />
                    Módulo 1: Captura de Leads
                  </h2>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                    <p className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>Dica:</strong> A captura de leads é o ponto de entrada do sistema. 
                        Quanto maior a qualidade dos dados capturados, melhor será a qualificação posterior.
                      </span>
                    </p>
                  </div>

                  <Accordion type="multiple" defaultValue={['upload']} className="w-full">
                    <AccordionItem value="upload">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-primary" />
                          OPÇÃO 1: Upload Manual (CSV/Excel)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Passo 1: Prepare seu arquivo</h4>
                            <div className="bg-muted/30 p-4 rounded font-mono text-xs overflow-x-auto">
                              <div>name,cnpj,website,email,phone,sector,state,city,employees</div>
                              <div className="text-muted-foreground">Cooperativa Agro LTDA,12345678000190,cooperativaagro.com.br,contato@empresa.com,11999999999,Agro,SP,São Paulo,150</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Colunas aceitas (flexíveis):</h4>
                            <div className="grid md:grid-cols-2 gap-2">
                              <div className="bg-blue-500/10 p-3 rounded">
                                <code className="text-blue-400">name</code> / <code className="text-blue-400">empresa</code>
                                <p className="text-xs text-muted-foreground mt-1">Nome da empresa (OBRIGATÓRIO)</p>
                              </div>
                              <div className="bg-green-500/10 p-3 rounded">
                                <code className="text-green-400">cnpj</code>
                                <p className="text-xs text-muted-foreground mt-1">CNPJ com 14 dígitos</p>
                              </div>
                              <div className="bg-purple-500/10 p-3 rounded">
                                <code className="text-purple-400">website</code> / <code className="text-purple-400">site</code>
                                <p className="text-xs text-muted-foreground mt-1">Website da empresa</p>
                              </div>
                              <div className="bg-orange-500/10 p-3 rounded">
                                <code className="text-orange-400">email</code>
                                <p className="text-xs text-muted-foreground mt-1">Email de contato</p>
                              </div>
                              <div className="bg-pink-500/10 p-3 rounded">
                                <code className="text-pink-400">phone</code> / <code className="text-pink-400">telefone</code>
                                <p className="text-xs text-muted-foreground mt-1">Telefone</p>
                              </div>
                              <div className="bg-cyan-500/10 p-3 rounded">
                                <code className="text-cyan-400">sector</code> / <code className="text-cyan-400">setor</code>
                                <p className="text-xs text-muted-foreground mt-1">Setor de atuação</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">O que acontece após o upload:</h4>
                            <div className="space-y-2">
                              {[
                                "Sistema lê e normaliza os dados do CSV",
                                "Detecta e ignora duplicados (por CNPJ)",
                                "Insere leads na quarentena com status 'pending'",
                                "Dispara validação automática para cada lead",
                                "Atualiza estatísticas da fonte 'Upload Manual'",
                                "Mostra toast de confirmação com número de leads"
                              ].map((step, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded">
                            <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                              <XCircle className="h-5 w-5" />
                              Erros Comuns
                            </h4>
                            <ul className="space-y-1 text-sm">
                              <li>• <strong>CSV vazio:</strong> Verifique se há pelo menos 1 linha de dados</li>
                              <li>• <strong>Coluna 'name' ausente:</strong> Adicione coluna name, empresa ou razao_social</li>
                              <li>• <strong>CNPJ inválido:</strong> Use formato com 14 dígitos (ex: 12345678000190)</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="scraping">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          OPÇÃO 2: Empresas Aqui (Web Scraping)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-muted-foreground">
                          Busque empresas automaticamente na web através de scraping inteligente do site Empresas Aqui.
                        </p>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold mb-2">Como funciona:</h4>
                            <ol className="space-y-2 list-decimal list-inside">
                              <li>Clique no botão "Buscar Empresas"</li>
                              <li>Você será redirecionado para <code className="bg-muted px-1 rounded">/central-icp/discovery</code></li>
                              <li>Configure os filtros (setor, estado, porte)</li>
                              <li>Sistema faz scraping e captura dados públicos</li>
                              <li>Leads são inseridos na quarentena automaticamente</li>
                            </ol>
                          </div>

                          <div className="bg-blue-500/10 p-4 rounded">
                            <h4 className="font-semibold text-blue-400 mb-2">Filtros Disponíveis:</h4>
                            <div className="grid md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <strong>Setor:</strong>
                                <div className="text-muted-foreground">Agro, Construção, Varejo, Indústria...</div>
                              </div>
                              <div>
                                <strong>Estado:</strong>
                                <div className="text-muted-foreground">SP, MG, RS, PR, SC...</div>
                              </div>
                              <div>
                                <strong>Porte:</strong>
                                <div className="text-muted-foreground">Micro, Pequena, Média, Grande</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-500/10 p-4 rounded">
                            <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Vantagens
                            </h4>
                            <ul className="space-y-1 text-sm">
                              <li>• Dados públicos e atualizados</li>
                              <li>• Filtragem precisa por ICP</li>
                              <li>• Processo 100% automatizado</li>
                              <li>• Sem necessidade de preparar planilhas</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="api">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-primary" />
                          OPÇÃO 3: API Pública (Integração Web)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-muted-foreground">
                          Integre formulários do seu site ou outras plataformas através da API REST.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Endpoint da API:</h4>
                            <div className="bg-muted p-4 rounded font-mono text-sm">
                              <div className="text-green-400">POST</div>
                              <div className="text-foreground">https://[SEU-PROJETO].supabase.co/functions/v1/capture-lead-api</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Exemplo de Integração (JavaScript):</h4>
                            <div className="bg-muted p-4 rounded">
                              <pre className="text-xs overflow-x-auto">
                                <code>{`fetch('https://[SEU-PROJETO].supabase.co/functions/v1/capture-lead-api', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer [ANON-KEY]',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@empresa.com.br',
    phone: '11999999999',
    sector: 'Agro',
    state: 'SP',
    message: 'Quero conhecer as soluções TOTVS',
    source: 'website_form'
  })
})
.then(res => res.json())
.then(data => console.log('Lead capturado:', data.lead_id))`}</code>
                              </pre>
                            </div>
                          </div>

                          <div className="bg-purple-500/10 p-4 rounded">
                            <h4 className="font-semibold text-purple-400 mb-2">Campos Aceitos:</h4>
                            <ul className="grid md:grid-cols-2 gap-2 text-sm">
                              <li><code>name</code> - Nome (obrigatório)</li>
                              <li><code>email</code> - Email (obrigatório)</li>
                              <li><code>phone</code> - Telefone</li>
                              <li><code>cnpj</code> - CNPJ</li>
                              <li><code>sector</code> - Setor</li>
                              <li><code>state</code> - Estado</li>
                              <li><code>city</code> - Cidade</li>
                              <li><code>message</code> - Mensagem</li>
                              <li><code>source</code> - Fonte personalizada</li>
                            </ul>
                          </div>

                          <div className="bg-green-500/10 p-4 rounded">
                            <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Casos de Uso
                            </h4>
                            <ul className="space-y-1 text-sm">
                              <li>• Formulários de contato no website</li>
                              <li>• Landing pages de campanhas</li>
                              <li>• Chatbots e WhatsApp Business</li>
                              <li>• Integrações com RD Station, HubSpot, etc.</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="metricas">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Métricas e Performance
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="p-4">
                            <h4 className="font-semibold mb-3">Estatísticas em Tempo Real</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Hoje:</span>
                                <span>Últimas 24 horas</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Semana:</span>
                                <span>Últimos 7 dias</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Mês:</span>
                                <span>Últimos 30 dias</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total:</span>
                                <span>Todos os leads</span>
                              </div>
                            </div>
                          </Card>

                          <Card className="p-4">
                            <h4 className="font-semibold mb-3">Status de Validação</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Pendentes:</span>
                                <Badge variant="outline">Aguardando revisão</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Aprovados:</span>
                                <Badge className="bg-green-500">Prontos para ICP</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Rejeitados:</span>
                                <Badge variant="destructive">Não qualificados</Badge>
                              </div>
                            </div>
                          </Card>
                        </div>

                        <div className="bg-cyan-500/10 p-4 rounded">
                          <h4 className="font-semibold text-cyan-400 mb-2">Performance das Fontes:</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Acompanhe qual fonte gera os leads de melhor qualidade
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                              <span>Upload Manual</span>
                              <span className="text-green-400">Taxa: 85%</span>
                            </div>
                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                              <span>Empresas Aqui</span>
                              <span className="text-green-400">Taxa: 78%</span>
                            </div>
                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                              <span>API Web</span>
                              <span className="text-yellow-400">Taxa: 62%</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded">
                          <p className="flex items-start gap-2 text-sm">
                            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong>Dica:</strong> A página atualiza automaticamente a cada 30 segundos. 
                              As queries usam cache inteligente de 5 minutos para melhor performance.
                            </span>
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* TAB 4: QUARENTENA */}
                <TabsContent value="quarentena" className="mt-0 space-y-6">
                  <h2 className="text-3xl font-bold text-primary border-b pb-3 flex items-center gap-3">
                    <Filter className="h-8 w-8" />
                    Módulo 2: Quarentena Inteligente
                  </h2>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>Importante:</strong> A quarentena é o filtro de qualidade do sistema. 
                        Apenas leads aprovados seguem para qualificação ICP.
                      </span>
                    </p>
                  </div>

                  <Accordion type="multiple" defaultValue={['filtros']} className="w-full">
                    <AccordionItem value="filtros">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Filter className="h-5 w-5 text-primary" />
                          Filtros e Busca
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="p-4">
                            <h4 className="font-semibold mb-3">Filtro por Status</h4>
                            <div className="space-y-2">
                              <Badge variant="outline" className="w-full justify-start">Todos - Mostra todos os leads</Badge>
                              <Badge variant="outline" className="w-full justify-start bg-yellow-500/20">Pendentes - Aguardando revisão</Badge>
                              <Badge variant="outline" className="w-full justify-start bg-blue-500/20">Validando - Em processo</Badge>
                              <Badge variant="outline" className="w-full justify-start bg-green-500/20">Aprovados - Prontos para ICP</Badge>
                              <Badge variant="outline" className="w-full justify-start bg-red-500/20">Rejeitados - Não qualificados</Badge>
                              <Badge variant="outline" className="w-full justify-start bg-gray-500/20">Duplicados - CNPJ existente</Badge>
                            </div>
                          </Card>

                          <Card className="p-4">
                            <h4 className="font-semibold mb-3">Filtro por Fonte</h4>
                            <div className="space-y-2">
                              <Badge variant="outline" className="w-full justify-start">Todas as fontes</Badge>
                              <Badge variant="outline" className="w-full justify-start flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Manual
                              </Badge>
                              <Badge variant="outline" className="w-full justify-start flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Empresas Aqui
                              </Badge>
                              <Badge variant="outline" className="w-full justify-start flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                API Web
                              </Badge>
                              <Badge variant="outline" className="w-full justify-start flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Indicação
                              </Badge>
                            </div>
                          </Card>
                        </div>

                        <div className="bg-muted/30 p-4 rounded">
                          <h4 className="font-semibold mb-2">Busca em Tempo Real</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Digite nome da empresa, CNPJ ou email para encontrar leads específicos
                          </p>
                          <ul className="text-sm space-y-1">
                            <li>• Busca instantânea (debounce 300ms)</li>
                            <li>• Case-insensitive (não diferencia maiúsculas/minúsculas)</li>
                            <li>• Busca em nome, CNPJ e email simultaneamente</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="cards">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-primary" />
                          Entendendo os Cards de Lead
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-4">
                          <div className="bg-muted/30 p-4 rounded">
                            <h4 className="font-semibold mb-3">Estrutura do Card:</h4>
                            
                            <div className="space-y-4">
                              <div>
                                <Badge className="mb-2">SEÇÃO 1: Cabeçalho</Badge>
                                <div className="bg-background p-3 rounded border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      Cooperativa Agro LTDA
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-yellow-500/20">Pendente</Badge>
                                    <Badge variant="outline" className="bg-purple-500/20">Upload Manual</Badge>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Badge className="mb-2">SEÇÃO 2: Dados Principais</Badge>
                                <div className="bg-background p-3 rounded border text-sm space-y-1">
                                  <div><strong>CNPJ:</strong> 12.345.678/0001-90</div>
                                  <div><strong>Setor:</strong> Agro</div>
                                  <div><strong>Local:</strong> São Paulo - SP</div>
                                  <div><strong>Funcionários:</strong> 150</div>
                                </div>
                              </div>

                              <div>
                                <Badge className="mb-2">SEÇÃO 3: Validações</Badge>
                                <div className="bg-background p-3 rounded border">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-green-500 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      CNPJ Válido
                                    </Badge>
                                    <Badge className="bg-green-500 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Site Ativo
                                    </Badge>
                                    <Badge className="bg-green-500 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      LinkedIn
                                    </Badge>
                                    <Badge className="bg-green-500 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Email
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Badge className="mb-2">SEÇÃO 4: Scores</Badge>
                                <div className="bg-background p-3 rounded border space-y-3">
                                  <div>
                                    <div className="flex justify-between mb-1 text-sm">
                                      <span>Score de Validação</span>
                                      <span className="font-mono">75/100</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded overflow-hidden">
                                      <div className="h-full bg-green-500 w-3/4"></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between mb-1 text-sm">
                                      <span>Qualidade de Dados</span>
                                      <span className="font-mono">90%</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded overflow-hidden">
                                      <div className="h-full bg-blue-500 w-11/12"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="acoes">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Play className="h-5 w-5 text-primary" />
                          Ações Disponíveis
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-6">
                        
                        {/* Diagrama de Estados do Lead */}
                        <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 rounded-lg border border-primary/20">
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-primary" />
                            Estados do Lead na Quarentena
                          </h4>
                          <lov-mermaid>
{`stateDiagram-v2
    [*] --> PENDING: Lead Capturado
    
    PENDING --> VALIDATING: Clicar "Validar"
    PENDING --> APPROVED: Clicar "Aprovar"
    PENDING --> REJECTED: Clicar "Rejeitar"
    
    VALIDATING --> APPROVED: Score ≥ 70
    VALIDATING --> PENDING: Score 30-69
    VALIDATING --> REJECTED: Score < 30
    
    APPROVED --> ICP_ANALYSIS: Clicar "Qualificar ICP"
    REJECTED --> [*]: Lead Descartado
    DUPLICATE --> [*]: Lead Ignorado
    
    ICP_ANALYSIS --> SALES_WORKSPACE: Score ICP calculado
    SALES_WORKSPACE --> CLOSED_WON: Deal Fechado ✅
    SALES_WORKSPACE --> CLOSED_LOST: Deal Perdido ❌
    
    CLOSED_WON --> [*]: Venda Realizada! 🎉
    CLOSED_LOST --> [*]: Oportunidade Perdida
    
    note right of PENDING
        Aguardando revisão manual
        Score: 30-69
    end note
    
    note right of VALIDATING
        Validação em andamento
        Tempo: 5-30s
    end note
    
    note right of APPROVED
        Pronto para qualificação ICP
        Score: ≥ 70
    end note
    
    note right of REJECTED
        Não passou na validação
        Score: < 30
    end note`}
                          </lov-mermaid>
                        </div>
                        
                        <Accordion type="single" collapsible>
                          <AccordionItem value="validar">
                            <AccordionTrigger className="text-base">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-500">1</Badge>
                                <span>VALIDAR Lead</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                <div className="bg-blue-500/10 p-4 rounded">
                                  <h5 className="font-semibold text-blue-400 mb-2">Quando usar:</h5>
                                  <p className="text-sm">Lead com status <Badge variant="outline">pending</Badge> e score entre 30-69</p>
                                </div>

                                <div>
                                  <h5 className="font-semibold mb-2">O que acontece:</h5>
                                  <ol className="text-sm space-y-1 list-decimal list-inside">
                                    <li>Status muda para <Badge variant="outline" className="bg-blue-500/20">validating</Badge></li>
                                    <li>Edge Function valida CNPJ, website, LinkedIn, email</li>
                                    <li>Calcula novo score de validação</li>
                                    <li>Atualiza status baseado no score final</li>
                                    <li>Mostra badges de validação atualizados</li>
                                  </ol>
                                </div>

                                <div>
                                  <h5 className="font-semibold mb-2">Resultado esperado:</h5>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      <span>Se score ≥ 70: <Badge className="bg-green-500 ml-1">approved</Badge></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                                      <span>Se score 30-69: continua <Badge className="bg-yellow-500 ml-1">pending</Badge></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                      <span>Se score &lt; 30: <Badge variant="destructive" className="ml-1">rejected</Badge></span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-muted/30 p-3 rounded text-sm flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <strong>Tempo estimado:</strong> 5-30 segundos
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="aprovar">
                            <AccordionTrigger className="text-base">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-500">2</Badge>
                                <span>APROVAR Lead</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                <div className="bg-green-500/10 p-4 rounded">
                                  <h5 className="font-semibold text-green-400 mb-2">Quando usar:</h5>
                                  <p className="text-sm">Você revisou o lead manualmente e decidiu que ele é válido</p>
                                </div>

                                <div>
                                  <h5 className="font-semibold mb-2">O que acontece:</h5>
                                  <ul className="text-sm space-y-1">
                                    <li className="flex items-start gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span>Status muda para <Badge className="bg-green-500 ml-1">approved</Badge> manualmente</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span>Estatísticas da fonte são atualizadas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span>Botão "Qualificar ICP" é habilitado</span>
                                    </li>
                                  </ul>
                                </div>

                                <Button className="w-full bg-green-500 hover:bg-green-600">
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Aprovar Lead
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="rejeitar">
                            <AccordionTrigger className="text-base">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive">3</Badge>
                                <span>REJEITAR Lead</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                <div className="bg-red-500/10 p-4 rounded border border-red-500/20">
                                  <h5 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Quando usar:
                                  </h5>
                                  <ul className="text-sm space-y-1">
                                    <li>• Dados ruins ou incompletos</li>
                                    <li>• Empresa fora do ICP</li>
                                    <li>• Lead duplicado ou inválido</li>
                                    <li>• Informações incorretas</li>
                                  </ul>
                                </div>

                                <div>
                                  <h5 className="font-semibold mb-2">O que acontece:</h5>
                                  <ul className="text-sm space-y-1">
                                    <li className="flex items-start gap-2">
                                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                      <span>Status muda para <Badge variant="destructive" className="ml-1">rejected</Badge></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                      <span>Lead é removido do fluxo de vendas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                      <span>Estatísticas são atualizadas</span>
                                    </li>
                                  </ul>
                                </div>

                                <Button variant="destructive" className="w-full">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeitar Lead
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="qualificar">
                            <AccordionTrigger className="text-base">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-500">4</Badge>
                                <span>QUALIFICAR ICP →</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                <div className="bg-purple-500/10 p-4 rounded">
                                  <h5 className="font-semibold text-purple-400 mb-2">Quando aparece:</h5>
                                  <p className="text-sm">Lead com status <Badge className="bg-green-500">approved</Badge></p>
                                </div>

                                <div>
                                  <h5 className="font-semibold mb-2">O que acontece:</h5>
                                  <ol className="text-sm space-y-1 list-decimal list-inside">
                                    <li>Redireciona para <code className="bg-muted px-1 rounded">/leads/icp-analysis</code></li>
                                    <li>Lead é selecionado automaticamente</li>
                                    <li>Análise ICP é executada (15-30s)</li>
                                    <li>IA gera proposta de valor personalizada</li>
                                    <li>Score ICP é calculado (0-100)</li>
                                    <li>Temperatura é definida (HOT/WARM/COLD)</li>
                                    <li>Deal qualificado vai para <strong>Sales Workspace</strong> → Pipeline Kanban</li>
                                  </ol>
                                </div>

                                <Button className="w-full bg-purple-500 hover:bg-purple-600">
                                  <Target className="h-4 w-4 mr-2" />
                                  Qualificar ICP
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="scoring">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Sistema de Scoring (0-100)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-full h-3 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
                              <span className="font-mono text-green-400 whitespace-nowrap">70-100</span>
                            </div>
                            <p className="text-sm">
                              <strong className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400 inline" />
                                Aprovado Automaticamente
                              </strong> - Lead com dados completos e validados
                            </p>
                          </div>

                          <div className="bg-yellow-500/10 p-4 rounded border border-yellow-500/20">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-full h-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded"></div>
                              <span className="font-mono text-yellow-400 whitespace-nowrap">30-69</span>
                            </div>
                            <p className="text-sm">
                              <strong className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                                Revisão Manual
                              </strong> - Lead requer aprovação manual do operador
                            </p>
                          </div>

                          <div className="bg-red-500/10 p-4 rounded border border-red-500/20">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-full h-3 bg-gradient-to-r from-red-500 to-red-600 rounded"></div>
                              <span className="font-mono text-red-400 whitespace-nowrap">0-29</span>
                            </div>
                            <p className="text-sm">
                              <strong className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-400 inline" />
                                Rejeitado Automaticamente
                              </strong> - Dados insuficientes ou inválidos
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Critérios de Pontuação:</h4>
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            <div className="bg-muted/30 p-3 rounded">
                              <strong>CNPJ Válido:</strong> +25 pontos
                            </div>
                            <div className="bg-muted/30 p-3 rounded">
                              <strong>Website Ativo:</strong> +25 pontos
                            </div>
                            <div className="bg-muted/30 p-3 rounded">
                              <strong>LinkedIn Encontrado:</strong> +20 pontos
                            </div>
                            <div className="bg-muted/30 p-3 rounded">
                              <strong>Email Válido:</strong> +15 pontos
                            </div>
                            <div className="bg-muted/30 p-3 rounded">
                              <strong>Telefone Presente:</strong> +10 pontos
                            </div>
                            <div className="bg-muted/30 p-3 rounded">
                              <strong>Dados Completos:</strong> +5 pontos
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* TAB 5: QUALIFICAÇÃO ICP */}
                <TabsContent value="qualificacao" className="mt-0">
                  <DocumentationQualificacaoTab />
                </TabsContent>

                <TabsContent value="pipeline" className="mt-0">
                  <DocumentationSalesWorkspaceTab />
                </TabsContent>

              </ScrollArea>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </AppLayout>
  );
}
