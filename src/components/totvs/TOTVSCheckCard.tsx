import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSimpleTOTVSCheck } from '@/hooks/useSimpleTOTVSCheck';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  Clock
} from 'lucide-react';

interface TOTVSCheckCardProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  autoVerify?: boolean;
}

export default function TOTVSCheckCard({
  companyId,
  companyName,
  cnpj,
  domain,
  autoVerify = false,
}: TOTVSCheckCardProps) {
  const [enabled, setEnabled] = useState(autoVerify);
  const [filterMode, setFilterMode] = useState<'all' | 'triple'>('all');

  const { data, isLoading, refetch } = useSimpleTOTVSCheck({
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

  // ESTADO INICIAL
  if (!enabled && !data) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            🔍 Verificação TOTVS
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Verificar se a empresa é cliente TOTVS
          </p>
          <Button onClick={handleVerify}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Verificar Agora
          </Button>
        </div>
      </Card>
    );
  }

  // LOADING
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Buscando evidências em múltiplas fontes...
          </p>
          <p className="text-xs text-muted-foreground">
            Isso pode levar 20-30 segundos
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
          <div className="flex items-center gap-2 mt-1">
            {data.from_cache ? (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Cache (24h)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                🔄 Verificação nova
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {data.methodology?.execution_time}
            </span>
          </div>
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
          className="text-base px-4 py-2"
        >
          {data.status === 'go' && '✅ GO - Não é cliente TOTVS'}
          {data.status === 'revisar' && '⚠️ REVISAR - Evidências encontradas'}
          {data.status === 'no-go' && '❌ NO-GO - Cliente TOTVS confirmado'}
        </Badge>
        <p className="text-sm text-muted-foreground mt-2">
          Confiança: <strong>{data.confidence === 'high' ? 'Alta' : data.confidence === 'medium' ? 'Média' : 'Baixa'}</strong>
          {' | '}
          Peso total: <strong>{data.total_weight} pontos</strong>
        </p>
        
        {/* DEBUG INFO */}
        <div className="text-xs text-muted-foreground mt-3 p-3 bg-muted/30 rounded-md border border-border/50">
          <strong className="text-foreground">Debug:</strong>{' '}
          {data.triple_matches || 0} triple matches |{' '}
          {data.double_matches || 0} double matches |{' '}
          {data.evidences?.length || 0} evidências |{' '}
          {data.methodology?.total_queries || 0} queries executadas
        </div>
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
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredEvidences.map((evidence: any, index: number) => (
            <div key={index} className="border rounded-lg p-3 hover:bg-accent/50">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={evidence.match_type === 'triple' ? 'default' : 'secondary'}>
                  {evidence.match_type === 'triple' ? '🎯 TRIPLE' : '🔍 DOUBLE'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {evidence.source} ({evidence.weight} pts)
                </Badge>
              </div>
              <p className="text-sm font-medium mb-1">{evidence.title}</p>
              <p className="text-sm text-muted-foreground mb-2">{evidence.content}</p>
              {evidence.detected_products?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
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
          <p className="text-xs text-muted-foreground mt-1">
            {data.methodology?.searched_sources} fontes consultadas
          </p>
        </div>
      )}

      {/* METODOLOGIA */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Fontes consultadas: {data.methodology?.searched_sources} | 
          Queries executadas: {data.methodology?.total_queries}
        </p>
      </div>
    </Card>
  );
}
