import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

export function NetworkStatusIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
      <Alert variant="destructive" className="max-w-md mx-auto">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Você está offline. Algumas funcionalidades podem não estar disponíveis.
        </AlertDescription>
      </Alert>
    </div>
  );
}
