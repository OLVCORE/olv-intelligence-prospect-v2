import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Lock, Settings2, ExternalLink, Shield } from "lucide-react";
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
  logo: string;
  description: string;
  signupUrl?: string;
}

const API_GROUPS = {
  critical: [
    { name: 'ReceitaWS', status: 'active' as APIStatus, cost: 'R$ 49-199/mês', uptime: 99.9, logo: '🏢', description: 'Dados empresariais via CNPJ', signupUrl: 'https://receitaws.com.br' },
    { name: 'Apollo.io', status: 'active' as APIStatus, cost: 'US$ 49-149/mês', uptime: 99.5, logo: '🚀', description: 'Enriquecimento B2B', signupUrl: 'https://apollo.io' },
    { name: 'OpenAI', status: 'active' as APIStatus, cost: 'US$ 20-200/mês', uptime: 99.8, logo: '🤖', description: 'Inteligência Artificial', signupUrl: 'https://platform.openai.com' },
    { name: 'Lovable AI', status: 'active' as APIStatus, cost: 'Incluído', uptime: 100, logo: '💜', description: 'IA nativa integrada', signupUrl: 'https://lovable.dev' },
    { name: 'Google Places', status: 'active' as APIStatus, cost: 'US$ 0-200/mês', uptime: 99.9, logo: '📍', description: 'Dados geográficos', signupUrl: 'https://console.cloud.google.com' },
    { name: 'Serper', status: 'active' as APIStatus, cost: 'US$ 50/mês', uptime: 99.7, logo: '🔍', description: 'Busca avançada', signupUrl: 'https://serper.dev' },
    { name: 'EmpresaQui', status: 'active' as APIStatus, cost: 'R$ 99-299/mês', uptime: 98.5, logo: '📊', description: 'Inteligência empresarial', signupUrl: 'https://empresaqui.com.br' },
  ],
  highPriority: [
    { name: 'Serasa Experian', status: 'inactive' as APIStatus, cost: 'R$ 500-2000/mês', uptime: 0, logo: '🛡️', description: 'Score de crédito' },
    { name: 'JusBrasil API', status: 'inactive' as APIStatus, cost: 'R$ 300-1500/mês', uptime: 0, logo: '⚖️', description: 'Dados jurídicos' },
    { name: 'Hunter.io', status: 'active' as APIStatus, cost: 'US$ 49-399/mês', uptime: 99.6, logo: '📧', description: 'Validação de e-mails' },
    { name: 'Twilio Voice', status: 'active' as APIStatus, cost: 'US$ 0.013/min', uptime: 99.95, logo: '📞', description: 'Telefonia cloud' },
    { name: 'Twilio WhatsApp', status: 'active' as APIStatus, cost: 'US$ 0.005/msg', uptime: 99.95, logo: '💬', description: 'Mensagens WhatsApp' },
  ],
  complementary: [
    { name: 'PhantomBuster', status: 'active' as APIStatus, cost: 'US$ 69-439/mês', uptime: 99.0, logo: '👻', description: 'Automação LinkedIn' },
    { name: 'Reclame Aqui', status: 'inactive' as APIStatus, cost: 'R$ 200-800/mês', uptime: 0, logo: '📢', description: 'Reputação online' },
    { name: 'Google Analytics', status: 'inactive' as APIStatus, cost: 'Gratuito', uptime: 0, logo: '📊', description: 'Análise de dados' },
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
    // Simples validação - em produção, usar autenticação real
    if (password === "admin123") {
      toast.success(`Acesso concedido para configurar ${selectedAPI}`);
      setShowAuthDialog(false);
      setPassword("");
      // Aqui iria abrir o modal de configuração real
    } else {
      toast.error("Senha incorreta. Acesso negado.");
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
              {apis.map((api) => (
                <TooltipProvider key={api.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all group">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-xl">{api.logo}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{api.name}</p>
                            <p className="text-xs text-muted-foreground">{api.description}</p>
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
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold">{api.name}</p>
                        <p className="text-xs text-muted-foreground">{api.description}</p>
                        <p className="text-xs"><strong>Custo:</strong> {api.cost}</p>
                        {api.status === 'active' && (
                          <p className="text-xs"><strong>Uptime:</strong> {api.uptime}%</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
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
                <p className="text-xs text-muted-foreground italic">
                  💡 Demo: use "admin123" para acessar
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
