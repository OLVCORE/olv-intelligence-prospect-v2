import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import ICPBulkAnalysisWithMapping from '@/components/icp/ICPBulkAnalysisWithMapping';

export default function BatchAnalysis() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Análise ICP em Massa</h1>
          <p className="text-muted-foreground">
            Upload de qualquer CSV com mapeamento inteligente automático
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/leads/icp-quarantine')}>
          Ver Quarentena ICP
        </Button>
      </div>

      <ICPBulkAnalysisWithMapping />
    </div>
  );
}
