import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Settings2, ExternalLink, Eye, Copy, Check } from "lucide-react";
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

export function APICard({ name, status, cost, uptime, logo, onConfigure, signupUrl, apiKey, envVarName }: APICardProps) {
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [revealedKey, setRevealedKey] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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
            <CardTitle className="text-base font-semibold">{name}</CardTitle>
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
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 border-primary/50" 
            onClick={onConfigure} 
            aria-label={`Configurar ${name}`}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </CardContent>
      </Card>

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
