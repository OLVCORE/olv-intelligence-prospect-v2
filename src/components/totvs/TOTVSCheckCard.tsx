import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTOTVSChecker } from '@/hooks/useTOTVSChecker';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter
} from 'lucide-react';

interface TOTVSCheckCardProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
}

export default function TOTVSCheckCard({
  companyId,
  companyName,
  cnpj,
  domain,
}: TOTVSCheckCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'triple'>('all');

  const { data, isLoading, refetch } = useTOTVSChecker({
    companyId,
    companyName,
    cnpj,
    domain,
    enabled,
  });

  const handleVerify = () => {
    setEnabled(true);
    refetch();
  };

  if (!enabled && !data) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            Verificação TOTVS
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Clique para verificar se a empresa é cliente TOTVS
          </p>
          <Button onClick={handleVerify}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Verificar Agora
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Buscando evidências em múltiplas fontes...
          </p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const evidences = data.evidences || [];
  const tripleMatches = evidences.filter((e: any) => e.match_type === 'triple');
  const doubleMatches = evidences.filter((e: any) => e.match_type === 'double');
  
  const filteredEvidences = filterMode === 'triple' ? tripleMatches : evidences;

  return (
    <Card className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {data.status === 'go' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {data.status === 'revisar' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
            {data.status === 'no-go' && <XCircle className="w-5 h-5 text-red-600" />}
            Verificação TOTVS
          </h3>
          <p className="text-sm text-muted-foreground">
            {data.from_cache ? '📦 Cache (24h)' : '🔄 Verificação nova'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleVerify}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* STATUS */}
      <div className="mb-4">
        <Badge 
          variant={
            data.status === 'go' ? 'default' :
            data.status === 'revisar' ? 'secondary' :
            'destructive'
          }
          className="text-lg px-4 py-2"
        >
          {data.status === 'go' && '✅ GO - Não é cliente TOTVS'}
          {data.status === 'revisar' && '⚠️ REVISAR - Evidências encontradas'}
          {data.status === 'no-go' && '❌ NO-GO - Cliente TOTVS confirmado'}
        </Badge>
      </div>

      {/* FILTROS */}
      {evidences.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <Button
              variant={filterMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('all')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Triple + Double
            </Button>
            <Button
              variant={filterMode === 'triple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('triple')}
            >
              🎯 Apenas Triple
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            🟢 {tripleMatches.length} Triple | 🔵 {doubleMatches.length} Double
          </div>
        </div>
      )}

      {/* EVIDÊNCIAS */}
      {filteredEvidences.length > 0 ? (
        <div className="space-y-3">
          {filteredEvidences.map((evidence: any, index: number) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={evidence.match_type === 'triple' ? 'default' : 'secondary'}>
                  {evidence.match_type === 'triple' ? '🎯 TRIPLE' : '🔍 DOUBLE'}
                </Badge>
                <Badge variant="outline">
                  {evidence.source} ({evidence.weight} pts)
                </Badge>
              </div>
              <p className="text-sm font-medium mb-1">{evidence.title}</p>
              <p className="text-sm text-muted-foreground mb-2">{evidence.content}</p>
              {evidence.detected_products?.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {evidence.detected_products.map((product: string) => (
                    <Badge key={product} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              )}
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Ver fonte <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma evidência de uso de TOTVS encontrada
          </p>
        </div>
      )}
    </Card>
  );
}
