import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, CheckCircle2, Monitor, Tablet } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">Instale o STRATEVO Intelligence</CardTitle>
          <CardDescription className="text-base">
            Acesse a plataforma diretamente da tela inicial do seu dispositivo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">App Instalado com Sucesso!</h3>
              <p className="text-muted-foreground">Redirecionando para o dashboard...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50">
                  <Monitor className="w-8 h-8 text-primary" />
                  <h4 className="font-semibold text-sm">Desktop</h4>
                  <p className="text-xs text-muted-foreground">Funciona perfeitamente no computador</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted/50">
                  <Tablet className="w-8 h-8 text-primary" />
                  <h4 className="font-semibold text-sm">Tablet</h4>
                  <p className="text-xs text-muted-foreground">Experiência otimizada para tablets</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-primary/10">
                  <Smartphone className="w-8 h-8 text-primary" />
                  <h4 className="font-semibold text-sm">Mobile</h4>
                  <p className="text-xs text-muted-foreground">Como um app nativo no celular</p>
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Benefícios
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Acesso rápido direto da tela inicial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Funciona offline (cache inteligente)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Interface otimizada para touch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Performance superior a sites tradicionais</span>
                  </li>
                </ul>
              </div>

              {isInstallable ? (
                <Button 
                  onClick={handleInstall} 
                  size="lg" 
                  className="w-full h-14 text-lg touch-manipulation active:scale-95"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Agora
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                      Como instalar manualmente:
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li><strong>Chrome/Edge:</strong> Menu (⋮) → Instalar app</li>
                      <li><strong>Safari (iOS):</strong> Compartilhar → Adicionar à Tela Inicial</li>
                      <li><strong>Android:</strong> Menu → Adicionar à tela inicial</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    variant="outline"
                    size="lg" 
                    className="w-full h-14 text-lg touch-manipulation active:scale-95"
                  >
                    Continuar sem Instalar
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
