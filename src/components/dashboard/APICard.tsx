import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Settings2, ExternalLink, Eye, Copy, Check, Key, BookOpen, Shield, Info } from "lucide-react";
import React, { useState } from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type APIStatus = "active" | "inactive" | "error";

export interface APICardProps {
  name: string;
  status: APIStatus;
  cost: string;
  uptime?: number;
  logo?: React.ReactNode;
  onConfigure?: () => void;
  signupUrl?: string;
  apiKey?: string;
  envVarName?: string;
}

const statusStyles: Record<APIStatus, string> = {
  active: "bg-primary/10 text-primary border border-primary/20",
  inactive: "bg-warning/10 text-warning-foreground border border-warning/20",
  error: "bg-destructive/10 text-destructive border border-destructive/20",
};

// Guia de configuração para cada API
const API_GUIDES: Record<string, {
  title: string;
  description: string;
  steps: string[];
  docsUrl?: string;
  secretsNeeded: string[];
}> = {
  'ReceitaWS': {
    title: 'Configurar ReceitaWS',
    description: 'API para consulta de dados de empresas brasileiras via CNPJ',
    steps: [
      '1. Acesse https://receitaws.com.br e crie sua conta',
      '2. Escolha um plano (Pro ou Enterprise)',
      '3. No painel, copie seu Token de API',
      '4. Clique em "Gerenciar Secrets" abaixo para adicionar',
      '5. Adicione uma nova secret com nome: RECEITAWS_API_TOKEN',
      '6. Cole o token copiado e salve'
    ],
    docsUrl: 'https://receitaws.com.br/api',
    secretsNeeded: ['RECEITAWS_API_TOKEN']
  },
  'Apollo.io': {
    title: 'Configurar Apollo.io',
    description: 'API para enriquecimento B2B e busca de decisores',
    steps: [
      '1. Acesse https://apollo.io e faça login',
      '2. Vá em Settings > Integrations > API',
      '3. Clique em "Create New Key"',
      '4. Copie a API Key gerada',
      '5. Clique em "Gerenciar Secrets" abaixo',
      '6. Adicione secret: APOLLO_API_KEY com o valor copiado'
    ],
    docsUrl: 'https://apolloio.github.io/apollo-api-docs/',
    secretsNeeded: ['APOLLO_API_KEY']
  },
  'OpenAI': {
    title: 'Configurar OpenAI',
    description: 'API para modelos de linguagem GPT-4, GPT-3.5 e outros',
    steps: [
      '1. Acesse https://platform.openai.com',
      '2. Faça login ou crie uma conta',
      '3. Vá em API Keys no menu lateral',
      '4. Clique em "Create new secret key"',
      '5. Copie a chave (não será mostrada novamente!)',
      '6. Adicione nos Secrets como: OPENAI_API_KEY'
    ],
    docsUrl: 'https://platform.openai.com/docs',
    secretsNeeded: ['OPENAI_API_KEY']
  },
  'Google Places': {
    title: 'Configurar Google Places',
    description: 'API para busca de locais e informações geográficas',
    steps: [
      '1. Acesse https://console.cloud.google.com',
      '2. Crie um novo projeto ou selecione existente',
      '3. Ative a API "Places API"',
      '4. Vá em Credenciais > Criar Credenciais > Chave de API',
      '5. Copie a chave gerada',
      '6. Adicione nos Secrets como: GOOGLE_PLACES_API_KEY'
    ],
    docsUrl: 'https://developers.google.com/maps/documentation/places/web-service',
    secretsNeeded: ['GOOGLE_PLACES_API_KEY', 'GOOGLE_API_KEY']
  },
  'Serper': {
    title: 'Configurar Serper',
    description: 'API para buscas Google em tempo real',
    steps: [
      '1. Acesse https://serper.dev',
      '2. Faça cadastro e login',
      '3. No dashboard, copie sua API Key',
      '4. Clique em "Gerenciar Secrets"',
      '5. Adicione secret: SERPER_API_KEY',
      '6. Teste fazendo uma busca no playground'
    ],
    docsUrl: 'https://serper.dev/docs',
    secretsNeeded: ['SERPER_API_KEY']
  },
  'Twilio Voice': {
    title: 'Configurar Twilio Voice',
    description: 'API para chamadas de voz e comunicação',
    steps: [
      '1. Acesse https://www.twilio.com e faça login',
      '2. No Console, encontre Account SID e Auth Token',
      '3. Copie ambos os valores',
      '4. Adicione nos Secrets:',
      '   - TWILIO_ACCOUNT_SID',
      '   - TWILIO_AUTH_TOKEN',
      '5. Configure um número de telefone Twilio'
    ],
    docsUrl: 'https://www.twilio.com/docs/voice',
    secretsNeeded: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
  },
  'Twilio WhatsApp': {
    title: 'Configurar Twilio WhatsApp',
    description: 'API para mensagens WhatsApp Business',
    steps: [
      '1. Use as mesmas credenciais do Twilio Voice',
      '2. No Console Twilio, vá em Messaging > WhatsApp',
      '3. Configure um WhatsApp Sender',
      '4. As mesmas secrets do Voice servem para WhatsApp',
      '5. Teste enviando uma mensagem de teste'
    ],
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
    secretsNeeded: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
  }
};

export function APICard({ name, status, cost, uptime, logo, onConfigure, signupUrl, apiKey, envVarName }: APICardProps) {
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [revealedKey, setRevealedKey] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  const guide = API_GUIDES[name];

  const handleRevealKey = async () => {
    if (!password || !envVarName) return;

    setIsRevealing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reveal-api-key', {
        body: {
          envVarName: envVarName,
          password: password,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setRevealedKey(data.apiKey);
      toast.success('Chave revelada com sucesso');
    } catch (error: any) {
      console.error('Error revealing key:', error);
      toast.error('Erro ao revelar chave: ' + error.message);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      toast.success('Chave copiada!');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar chave');
    }
  };

  const handleOpenRevealDialog = () => {
    setPassword('');
    setRevealedKey('');
    setRevealDialogOpen(true);
  };

  const handleCloseRevealDialog = () => {
    setRevealDialogOpen(false);
    setPassword('');
    setRevealedKey('');
  };

  return (
    <>
      <Card className="bg-card/70 backdrop-blur-md border-border/50 transition-all duration-300 hover:shadow-lg hover-scale border-glow depth-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
          <div className="flex items-center gap-3">
            <div aria-hidden className="text-2xl" title={name}>{logo ?? "🔗"}</div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {name}
              <TooltipProvider>
                <TooltipUI>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted/50" aria-label={`Sobre ${name}`}>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{guide?.description || 'Integração disponível. Clique em Configurar para ver o passo a passo e as secrets necessárias.'}</p>
                  </TooltipContent>
                </TooltipUI>
              </TooltipProvider>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("status-dot", {
              "status-dot-active": status === "active",
              "status-dot-inactive": status === "inactive",
              "status-dot-error": status === "error",
            })} />
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusStyles[status])} aria-label={`Status: ${status}`}>
              {status === "active" ? "Ativo" : status === "inactive" ? "Inativo" : "Erro"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Custo mensal</p>
              <p className="font-semibold text-foreground">{cost}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-muted-foreground text-xs">Saúde</p>
              <p className="font-semibold text-foreground">{uptime ? `${uptime}%` : "—"}</p>
            </div>
          </div>
          
          {uptime !== undefined && uptime > 0 && (
            <div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", {
                    "bg-gradient-to-r from-green-500 to-emerald-500": uptime >= 99,
                    "bg-gradient-to-r from-yellow-500 to-orange-500": uptime >= 95 && uptime < 99,
                    "bg-gradient-to-r from-red-500 to-orange-500": uptime < 95,
                  })}
                  style={{ width: `${uptime}%` }}
                />
              </div>
            </div>
          )}

          {signupUrl && (
            <a 
              href={signupUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {signupUrl.replace('https://', '').replace('http://', '').split('/')[0]}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {apiKey && (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                {apiKey}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 flex-shrink-0"
                onClick={handleOpenRevealDialog}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 border-primary/50 transition-all duration-200 hover:scale-105" 
            onClick={() => {
              console.log('Configurar clicked for:', name);
              setConfigDialogOpen(true);
            }}
            aria-label={`Configurar ${name}`}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de configuração */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{guide?.title || `Configurar ${name}`}</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  {guide?.description || `Instruções para configurar a API ${name}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Link de acesso */}
            {signupUrl && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Acessar plataforma</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(signupUrl, '_blank')}
                  >
                    Abrir {name}
                  </Button>
                </div>
              </div>
            )}

            {/* Passo a passo */}
            {guide && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Passo a Passo</h4>
                </div>
                <div className="space-y-2">
                  {guide.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Secrets necessárias */}
            {guide && guide.secretsNeeded.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Secrets Necessárias</h4>
                </div>
                <div className="space-y-2">
                  {guide.secretsNeeded.map((secret, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <code className="text-sm font-mono">{secret}</code>
                      <Badge variant="secondary" className="text-xs">
                        {envVarName === secret ? 'Configurada' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Ações rápidas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Ações Rápidas</h4>
              </div>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Abrir área de secrets - será implementado
                    toast.info('Abrindo gerenciador de Secrets...');
                    window.open('https://lovable.dev', '_blank');
                  }}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Gerenciar Secrets
                </Button>
                {guide?.docsUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(guide.docsUrl, '_blank')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver Documentação Oficial
                  </Button>
                )}
                {signupUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(signupUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Criar Conta / Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para revelar chave de API */}
      <AlertDialog open={revealDialogOpen} onOpenChange={handleCloseRevealDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🔐 Revelar Chave de API</AlertDialogTitle>
            <AlertDialogDescription>
              {!revealedKey ? (
                <>
                  Para revelar a chave completa de <strong>{name}</strong>, 
                  confirme sua senha de administrador:
                </>
              ) : (
                <>
                  Chave completa de <strong>{name}</strong>:
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!revealedKey ? (
            <div className="space-y-4 py-4">
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRevealing) {
                    handleRevealKey();
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                  {revealedKey}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopyKey(revealedKey)}
                >
                  {copiedKey ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Mantenha esta chave segura. Não compartilhe em lugares públicos.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseRevealDialog}>
              {revealedKey ? 'Fechar' : 'Cancelar'}
            </AlertDialogCancel>
            {!revealedKey && (
              <AlertDialogAction onClick={handleRevealKey} disabled={!password || isRevealing}>
                {isRevealing ? 'Validando...' : 'Revelar Chave'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default APICard;
