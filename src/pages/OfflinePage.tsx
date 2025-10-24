import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Aguarda um pouco para garantir que a conexão está estável
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [isOnline]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-3">
              <WifiOff className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sem Conexão</CardTitle>
          <CardDescription>
            {isOnline 
              ? 'Conexão restaurada! Recarregando...'
              : 'Você está offline. Verifique sua conexão com a internet e tente novamente.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOnline ? (
            <div className="flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Dicas para resolver:</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Verifique se o Wi-Fi ou dados móveis estão ativados</li>
                  <li>Tente desativar e reativar o modo avião</li>
                  <li>Reinicie o roteador se estiver usando Wi-Fi</li>
                </ul>
              </div>
              
              <Button onClick={handleRetry} className="w-full" variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
