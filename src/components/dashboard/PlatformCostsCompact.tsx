import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Rocket,
  Sparkles,
  Code2,
  Zap,
  Database,
  Workflow,
  Bot,
  Key,
  Globe,
  Github,
  TrendingUp,
  Mail,
  Cloud,
  BarChart3,
  LineChart,
  Users,
  MessageSquare,
  AlertCircle,
  Activity,
  Radio
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PLATFORM_COSTS = [
  { 
    name: 'Apollo.io', 
    cost: 80, 
    description: 'Plataforma líder em enriquecimento de dados B2B. Identifica decisores, cargos, e-mails verificados e telefones de +275M de contatos globais. Essencial para prospecção qualificada e geração de leads enterprise.',
    icon: Rocket,
    status: 'active' 
  },
  { 
    name: 'Lovable', 
    cost: 25, 
    description: 'Plataforma de desenvolvimento low-code com IA generativa. Acelera criação de MVPs e features em 10x através de prompts em linguagem natural. Reduz custos de desenvolvimento em até 70%.',
    icon: Sparkles,
    status: 'active' 
  },
  { 
    name: 'Cursor', 
    cost: 20, 
    description: 'Editor de código com IA integrada baseado em GPT-4. Autocompletar inteligente, geração de código contextual e refatoração assistida. Aumenta produtividade de desenvolvedores em 40%.',
    icon: Code2,
    status: 'active' 
  },
  { 
    name: 'Vercel', 
    cost: 25, 
    description: 'Plataforma de deploy e hospedagem para aplicações modernas. CDN global com edge computing, preview automático de PRs e zero downtime. Performance superior e DX excepcional.',
    icon: Zap,
    status: 'active' 
  },
  { 
    name: 'Supabase', 
    cost: 20, 
    description: 'Backend-as-a-Service open-source. PostgreSQL gerenciado, autenticação integrada, storage de arquivos e APIs auto-geradas. Alternativa moderna ao Firebase com SQL completo.',
    icon: Database,
    status: 'active' 
  },
  { 
    name: 'Adapta', 
    cost: 50, 
    description: 'Solução brasileira de automação e integração de processos empresariais. Conecta sistemas legados, automatiza workflows complexos e reduz trabalho manual em até 80%.',
    icon: Workflow,
    status: 'active' 
  },
  { 
    name: 'ChatGPT Plus', 
    cost: 20, 
    description: 'Acesso prioritário ao GPT-4 e modelos avançados da OpenAI. Essencial para prototipagem rápida, análises complexas e geração de conteúdo de alta qualidade com menor latência.',
    icon: Bot,
    status: 'active' 
  },
  { 
    name: 'OpenAI API', 
    cost: 25, 
    description: 'Chaves de API para integração direta com modelos OpenAI (GPT-4, DALL-E, Whisper). Permite automações personalizadas, chatbots inteligentes e processamento de linguagem natural em escala.',
    icon: Key,
    status: 'active' 
  },
  { 
    name: 'Hostinger', 
    cost: 15, 
    description: 'Hospedagem de websites institucional com domínios personalizados. SSL gratuito, e-mail corporativo e painel simplificado. Ideal para landing pages e sites de marketing.',
    icon: Globe,
    status: 'active' 
  },
  { 
    name: 'GitHub Teams', 
    cost: 25, 
    description: 'Controle de versão Git com CI/CD integrado via Actions. Code review, gestão de branches, wikis e issues. Fundamental para colaboração em equipe e DevOps moderno.',
    icon: Github,
    status: 'active' 
  },
];

const FUTURE_PLATFORMS = [
  { 
    name: 'Salesforce Sales Cloud', 
    cost: 150, 
    description: 'CRM #1 mundial para gestão completa de vendas enterprise. Pipeline visual, automação de follow-ups, previsão de vendas com IA e integrações nativas com +3000 apps. ROI médio de 25% no primeiro ano.',
    icon: TrendingUp,
    timeline: 'Médio prazo (3-6 meses)' 
  },
  { 
    name: 'HubSpot Enterprise', 
    cost: 320, 
    description: 'Suite completa de marketing automation, CRM e customer service. Workflows avançados, lead scoring com IA, ABM (Account-Based Marketing) e atribuição multi-touch. Aumenta conversão em até 35%.',
    icon: Mail,
    timeline: 'Médio prazo (6-9 meses)' 
  },
  { 
    name: 'AWS Enterprise', 
    cost: 500, 
    description: 'Infraestrutura cloud líder global com +200 serviços. EC2, S3, Lambda, RDS e Kubernetes gerenciado (EKS). Escalabilidade ilimitada, 99.99% SLA e compliance total (ISO, SOC, LGPD).',
    icon: Cloud,
    timeline: 'Longo prazo (9-12 meses)' 
  },
  { 
    name: 'Snowflake', 
    cost: 200, 
    description: 'Data warehouse cloud-native para analytics enterprise. Separação de compute e storage, suporte multi-cloud, compartilhamento seguro de dados e queries sub-segundo em petabytes. Líder no Gartner Magic Quadrant.',
    icon: Database,
    timeline: 'Longo prazo (12+ meses)' 
  },
  { 
    name: 'Segment CDP', 
    cost: 120, 
    description: 'Customer Data Platform que unifica dados de clientes de +300 fontes. Perfis únicos em tempo real, governança de dados, sincronização bi-direcional e ativação em todas as ferramentas de marketing.',
    icon: Users,
    timeline: 'Médio prazo (6 meses)' 
  },
  { 
    name: 'Amplitude Analytics', 
    cost: 100, 
    description: 'Product analytics avançado com análise comportamental. Cohort analysis, funnels, retention, experimentação A/B e recomendações de IA. Essencial para product-led growth e otimização de conversão.',
    icon: BarChart3,
    timeline: 'Médio prazo (6 meses)' 
  },
  { 
    name: 'Intercom', 
    cost: 99, 
    description: 'Plataforma de customer engagement com chatbot IA. Suporte in-app, mensagens proativas, tours guiados e help center integrado. Reduz tickets de suporte em 40% e aumenta satisfação do cliente.',
    icon: MessageSquare,
    timeline: 'Curto prazo (3 meses)' 
  },
  { 
    name: 'Datadog', 
    cost: 150, 
    description: 'Observabilidade completa: monitoring, logs, APM e security. Dashboards unificados, alertas inteligentes, distributed tracing e profiling de performance. MTTR (Mean Time To Recovery) reduzido em 60%.',
    icon: Activity,
    timeline: 'Médio prazo (6 meses)' 
  },
  { 
    name: 'PagerDuty', 
    cost: 60, 
    description: 'Incident management e on-call automation. Alertas multi-canal, escalações automáticas, postmortems colaborativos e integrações com Slack/Teams. Reduz downtime em 50% com resposta coordenada.',
    icon: AlertCircle,
    timeline: 'Médio prazo (6 meses)' 
  },
  { 
    name: 'Confluent (Kafka)', 
    cost: 300, 
    description: 'Plataforma de streaming de dados em tempo real baseada em Apache Kafka. Event-driven architecture, processamento de milhões de eventos/segundo, integração com DBs via CDC. Fundamental para microservices.',
    icon: Radio,
    timeline: 'Longo prazo (12+ meses)' 
  },
];

const TOTAL_COST = PLATFORM_COSTS.reduce((sum, p) => sum + p.cost, 0);
const FUTURE_COST = FUTURE_PLATFORMS.reduce((sum, p) => sum + p.cost, 0);

export function PlatformCostsCompact() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFuture, setShowFuture] = useState(false);

  return (
    <div className="space-y-4">
      {/* Plataformas Atuais */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Custos de Plataformas Atuais</CardTitle>
                  <p className="text-sm text-muted-foreground">{PLATFORM_COSTS.length} plataformas ativas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">US$ {TOTAL_COST}</p>
                  <p className="text-xs text-muted-foreground">mensal</p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <TooltipProvider>
                  {PLATFORM_COSTS.map((platform, i) => {
                    const Icon = platform.icon;
                    return (
                      <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-help group">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20 transition-all">
                              <Icon className="h-4 w-4 text-green-500" />
                            </div>
                            <span className="text-sm font-medium">{platform.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">US$ {platform.cost}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-md z-[9999]">
                        <p className="text-xs leading-relaxed">{platform.description}</p>
                      </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground italic">
                  * Valores em US$ convertidos para R$ pela taxa do dia do cartão
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Plataformas Futuras Recomendadas */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-dashed">
        <Collapsible open={showFuture} onOpenChange={setShowFuture}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Plataformas Recomendadas (Futuro)</CardTitle>
                  <p className="text-sm text-muted-foreground">Expansão para escala enterprise</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-500">US$ {FUTURE_COST}</p>
                  <p className="text-xs text-muted-foreground">projeção mensal</p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    {showFuture ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <TooltipProvider>
                  {FUTURE_PLATFORMS.map((platform, i) => {
                    const Icon = platform.icon;
                    return (
                      <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-help group">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
                              <Icon className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium block">{platform.name}</span>
                              <span className="text-xs text-muted-foreground">{platform.timeline}</span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-amber-500">US$ {platform.cost}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-md z-[9999]">
                        <p className="text-xs leading-relaxed">{platform.description}</p>
                      </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-amber-500/80 italic">
                  💡 Investimentos estratégicos para escalar de PME para enterprise
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

export default PlatformCostsCompact;
