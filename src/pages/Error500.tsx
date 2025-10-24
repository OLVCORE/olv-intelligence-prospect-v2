import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error500() {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Erro Interno do Servidor</CardTitle>
          <CardDescription>
            Algo deu errado no nosso sistema. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Código de erro: <span className="font-mono font-semibold">500</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Horário: <span className="font-mono">{new Date().toLocaleString('pt-BR')}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleReload} className="flex-1" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={handleGoHome} className="flex-1" variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Página Inicial
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
