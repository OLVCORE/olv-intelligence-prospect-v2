import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BitrixIntegrationConfig } from '@/components/sdr/BitrixIntegrationConfig';

export default function SDRBitrixConfigPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/sdr/integrations')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Integrações
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuração Bitrix24</h1>
          <p className="text-muted-foreground">
            Configure a sincronização bidirecional de deals entre STRATEVO Intelligence e Bitrix24
          </p>
        </div>

        <BitrixIntegrationConfig />
      </div>
    </AppLayout>
  );
}
