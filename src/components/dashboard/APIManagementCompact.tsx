import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Shield,
  Building2,
  Rocket,
  Bot,
  Sparkles,
  MapPin,
  Search,
  BarChart3,
  ShieldCheck,
  Scale,
  DollarSign,
  Mail,
  Map,
  Phone,
  MessageSquare,
  Send,
  Ghost,
  TrendingUp,
  Landmark,
  CircleDollarSign,
  AlertCircle,
  LineChart,
  ShieldAlert,
  Flag
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type APIStatus = "active" | "inactive";

interface CompactAPI {
  name: string;
  status: APIStatus;
  cost: string;
  uptime: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  signupUrl?: string;
}

const API_GROUPS = {
  critical: [
    { 
      name: 'ReceitaWS', 
      status: 'active' as APIStatus, 
      cost: 'R$ 49-199/mês', 
      uptime: 99.9, 
      icon: Building2, 
      description: 'API oficial de consulta CNPJ com dados cadastrais completos da Receita Federal. Retorna razão social, endereço, atividades CNAE, situação cadastral e sócios em tempo real.',
      signupUrl: 'https://receitaws.com.br' 
    },
    { 
      name: 'Apollo.io', 
      status: 'active' as APIStatus, 
      cost: 'US$ 49-149/mês', 
      uptime: 99.5, 
      icon: Rocket, 
      description: 'Líder global em enriquecimento B2B com +275M de contatos verificados. Retorna e-mails, telefones diretos, cargos, hierarquia empresarial e sinais de compra (intent data).',
      signupUrl: 'https://apollo.io' 
    },
    { 
      name: 'OpenAI', 
      status: 'active' as APIStatus, 
      cost: 'US$ 20-200/mês', 
      uptime: 99.8, 
      icon: Bot, 
      description: 'API dos modelos GPT-4, GPT-3.5 e DALL-E 3. Permite geração de texto, análise semântica, classificação, summarização e criação de imagens via prompt. Tokenização otimizada.',
      signupUrl: 'https://platform.openai.com' 
    },
    { 
      name: 'Lovable AI', 
      status: 'active' as APIStatus, 
      cost: 'Incluído', 
      uptime: 100, 
      icon: Sparkles, 
      description: 'IA generativa nativa da plataforma Lovable. Acesso direto sem necessidade de API keys externas. Ideal para prototipagem rápida e geração de código React/TypeScript.',
      signupUrl: 'https://lovable.dev' 
    },
    { 
      name: 'Google Places', 
      status: 'active' as APIStatus, 
      cost: 'US$ 0-200/mês', 
      uptime: 99.9, 
      icon: MapPin, 
      description: 'API do Google Maps para dados geográficos completos. Busca por proximidade, detalhes de estabelecimentos, avaliações, fotos, horários e geocoding reverso com precisão global.',
      signupUrl: 'https://console.cloud.google.com' 
    },
    { 
      name: 'Serper', 
      status: 'active' as APIStatus, 
      cost: 'US$ 50/mês', 
      uptime: 99.7, 
      icon: Search, 
      description: 'API de busca do Google com resultados estruturados em tempo real. Extrai featured snippets, people also ask, related searches e knowledge graph. Latência <500ms.',
      signupUrl: 'https://serper.dev' 
    },
    { 
      name: 'EmpresaQui', 
      status: 'active' as APIStatus, 
      cost: 'R$ 99-299/mês', 
      uptime: 98.5, 
      icon: BarChart3, 
      description: 'Inteligência competitiva com dados financeiros, processos judiciais, protestos, participação societária e scoring proprietário. Cobertura +50M de CNPJs brasileiros.',
      signupUrl: 'https://empresaqui.com.br' 
    },
  ],
  highPriority: [
    { 
      name: 'Serasa Experian', 
      status: 'inactive' as APIStatus, 
      cost: 'R$ 500-2000/mês', 
      uptime: 0, 
      icon: ShieldCheck, 
      description: 'Bureau de crédito líder no Brasil. Score Serasa, consultas a SPC/Serasa, dívidas ativas, cheques sem fundo, protestos e histórico de adimplência. Essencial para análise de risco.',
    },
    { 
      name: 'JusBrasil API', 
      status: 'inactive' as APIStatus, 
      cost: 'R$ 300-1500/mês', 
      uptime: 0, 
      icon: Scale, 
      description: 'Maior base de processos judiciais do Brasil (+200M). Consulta por CPF/CNPJ retorna processos em todas as instâncias, varas, tribunais e situação atualizada. Monitoring de novos processos.',
    },
    { 
      name: 'Hunter.io', 
      status: 'active' as APIStatus, 
      cost: 'US$ 49-399/mês', 
      uptime: 99.6, 
      icon: Mail, 
      description: 'Validação e descoberta de e-mails corporativos. Verifica deliverability em tempo real, busca padrões de e-mail por domínio e retorna confidence score. Integração nativa com CRMs.',
    },
    { 
      name: 'Twilio Voice', 
      status: 'active' as APIStatus, 
      cost: 'US$ 0.013/min', 
      uptime: 99.95, 
      icon: Phone, 
      description: 'Telefonia programável cloud com cobertura global. APIs de voz: chamadas out/inbound, gravação, transcrição automática, IVR dinâmico e voicemail. Números virtuais em +180 países.',
    },
    { 
      name: 'Twilio WhatsApp', 
      status: 'active' as APIStatus, 
      cost: 'US$ 0.005/msg', 
      uptime: 99.95, 
      icon: MessageSquare, 
      description: 'WhatsApp Business API oficial. Envio de mensagens template, conversações bidirecionais, mídia (imagens/docs/vídeos), botões interativos e webhooks de status. Compliance LGPD.',
    },
  ],
  complementary: [
    { 
      name: 'PhantomBuster', 
      status: 'active' as APIStatus, 
      cost: 'US$ 69-439/mês', 
      uptime: 99.0, 
      icon: Ghost, 
      description: 'Automação de scraping em redes sociais (LinkedIn, Twitter, Instagram). Extrai leads, seguidores, engajamento e envia mensagens em massa. Evita rate limiting com rotação de IPs.',
    },
    { 
      name: 'Reclame Aqui', 
      status: 'inactive' as APIStatus, 
      cost: 'R$ 200-800/mês', 
      uptime: 0, 
      icon: AlertCircle, 
      description: 'Monitoring de reputação online com +20M de reclamações. API retorna reclamações por CNPJ, índice de solução, tempo médio de resposta e nota RA1000. Alertas automáticos.',
    },
    { 
      name: 'Google Analytics', 
      status: 'inactive' as APIStatus, 
      cost: 'Gratuito', 
      uptime: 0, 
      icon: LineChart, 
      description: 'Analytics web e mobile com reporting API. Extrai sessões, usuários, conversões, eventos personalizados e funis. Ideal para dashboards executivos com métricas unificadas.',
    },
  ],
};

interface APIGroupCardProps {
  title: string;
  apis: CompactAPI[];
  color: string;
  defaultOpen?: boolean;
}

function APIGroupCard({ title, apis, color, defaultOpen = false }: APIGroupCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState<string>("");
  const [password, setPassword] = useState("");

  const activeCount = apis.filter(api => api.status === 'active').length;
  const totalCount = apis.length;

  const handleConfigureClick = (apiName: string) => {
    setSelectedAPI(apiName);
    setShowAuthDialog(true);
  };

  const handleAuthSubmit = () => {
    // Senha: Adapta2025!
    if (password === "Adapta2025!") {
      toast.success(`✅ Acesso concedido para configurar ${selectedAPI}`);
      setShowAuthDialog(false);
      setPassword("");
      // Aqui iria abrir o modal de configuração real
      toast.info(`🔧 Modal de configuração de ${selectedAPI} em desenvolvimento`, {
        description: "Esta funcionalidade será implementada na próxima fase."
      });
    } else {
      toast.error("❌ Senha incorreta. Acesso negado.");
    }
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-1 w-8 rounded-full ${color}`} />
                <CardTitle className="text-sm">{title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {activeCount}/{totalCount}
                </Badge>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {apis.map((api) => {
                const Icon = api.icon;
                return (
                  <TooltipProvider key={api.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all group">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded-lg border ${
                              api.status === 'active' 
                                ? 'bg-green-500/10 border-green-500/20 group-hover:bg-green-500/20' 
                                : 'bg-muted/50 border-border'
                            } transition-all`}>
                              <Icon className={`h-4 w-4 ${
                                api.status === 'active' ? 'text-green-500' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{api.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{api.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={api.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {api.status === 'active' ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleConfigureClick(api.name)}
                            >
                              <Shield className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-md">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold">{api.name}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{api.description}</p>
                          <div className="pt-2 border-t border-border space-y-1">
                            <p className="text-xs"><strong>Custo:</strong> {api.cost}</p>
                            {api.status === 'active' && (
                              <p className="text-xs"><strong>Uptime:</strong> {api.uptime}%</p>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <Lock className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Autenticação Necessária</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4">
              <p>
                As configurações de <strong>{selectedAPI}</strong> são sensíveis e requerem autenticação administrativa.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Senha de Administrador</label>
                <Input
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAuthSubmit();
                  }}
                />
                <p className="text-xs text-primary font-semibold">
                  🔐 Senha: Adapta2025!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPassword("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAuthSubmit}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function APIManagementCompact() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <APIGroupCard
        title="APIs Críticas"
        apis={API_GROUPS.critical}
        color="bg-gradient-to-r from-green-500 to-emerald-500"
        defaultOpen={false}
      />
      <APIGroupCard
        title="Alta Prioridade"
        apis={API_GROUPS.highPriority}
        color="bg-gradient-to-r from-yellow-500 to-orange-500"
        defaultOpen={false}
      />
      <APIGroupCard
        title="Complementares"
        apis={API_GROUPS.complementary}
        color="bg-gradient-to-r from-blue-500 to-cyan-500"
        defaultOpen={false}
      />
    </div>
  );
}

export default APIManagementCompact;
