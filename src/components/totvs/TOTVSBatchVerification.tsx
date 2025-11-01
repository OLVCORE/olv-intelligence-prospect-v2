import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTOTVSVerificationBatch } from '@/hooks/useTOTVSVerification';
import { Play, Pause, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TOTVSBatchVerificationProps {
  empresas: any[];
  onComplete?: (resultados: any[]) => void;
}

export default function TOTVSBatchVerification({
  empresas,
  onComplete,
}: TOTVSBatchVerificationProps) {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultados, setResultados] = useState<any[]>([]);

  const { mutate: verificarLote } = useTOTVSVerificationBatch();

  const iniciarVerificacao = () => {
    setProcessando(true);
    setProgresso(0);
    setResultados([]);

    verificarLote(empresas, {
      onSuccess: (data) => {
        setResultados(data);
        setProcessando(false);
        setProgresso(100);
        onComplete?.(data);
      },
      onError: (error) => {
        console.error('[BATCH] Erro:', error);
        setProcessando(false);
      },
    });
  };

  const goCount = resultados.filter(r => r.resultado?.status === 'go').length;
  const revisarCount = resultados.filter(r => r.resultado?.status === 'revisar').length;
  const noGoCount = resultados.filter(r => r.resultado?.status === 'no-go').length;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              Verificação TOTVS em Lote
            </h3>
            <p className="text-sm text-muted-foreground">
              {empresas.length} empresas para verificar
            </p>
          </div>
          <Button
            onClick={iniciarVerificacao}
            disabled={processando}
          >
            {processando ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Verificação
              </>
            )}
          </Button>
        </div>

        {processando && (
          <div>
            <Progress value={progresso} className="mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              {resultados.length} de {empresas.length} empresas verificadas
            </p>
          </div>
        )}

        {resultados.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold">GO</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{goCount}</p>
              <p className="text-xs text-green-700">Não são clientes TOTVS</p>
            </Card>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold">REVISAR</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">{revisarCount}</p>
              <p className="text-xs text-yellow-700">Evidências encontradas</p>
            </Card>

            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-semibold">NO-GO</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{noGoCount}</p>
              <p className="text-xs text-red-700">Clientes TOTVS confirmados</p>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
}
