import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, ExternalLink, AlertTriangle, Globe, Search, Clock } from 'lucide-react';

interface TOTVSVerificationReportProps {
  data: any;
  companyName: string;
  cnpj?: string;
}

export default function TOTVSVerificationReport({ data, companyName, cnpj }: TOTVSVerificationReportProps) {
  if (!data) {
    return (
      <Card className="p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Dados não disponíveis</h3>
        <p className="text-gray-600">Execute a verificação para gerar o relatório</p>
      </Card>
    );
  }

  const isClienteTOTVS = data.status === 'cliente_totvs';
  const confidence = data.confidence || 'low';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Relatório TOTVS</h1>
        </div>
        <p className="text-lg font-semibold mt-2">{companyName}</p>
        {cnpj && <p className="text-sm text-gray-600">CNPJ: {cnpj}</p>}
      </Card>

      {/* Status */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Status da Verificação</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border-2">
            <p className="text-sm font-semibold text-gray-600 mb-3">Status</p>
            <Badge variant={isClienteTOTVS ? 'destructive' : 'default'} className="text-lg px-6 py-2">
              {isClienteTOTVS ? (
                <><XCircle className="w-5 h-5 mr-2" />Cliente TOTVS</>
              ) : (
                <><CheckCircle className="w-5 h-5 mr-2" />Não é Cliente TOTVS</>
              )}
            </Badge>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border-2">
            <p className="text-sm font-semibold text-gray-600 mb-3">Confiança</p>
            <Badge variant="outline" className="text-lg px-6 py-2">
              {confidence === 'high' && '🟢 Alta'}
              {confidence === 'medium' && '🟡 Média'}
              {confidence === 'low' && '🔴 Baixa'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Evidências */}
      {data.evidences && data.evidences.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Evidências ({data.evidences.length})</h2>
          <div className="space-y-4">
            {data.evidences.map((evidence: any, index: number) => (
              <div key={index} className="bg-gray-50 p-5 rounded-lg border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm mb-3">{evidence.text}</p>
                    {evidence.source && (
                      <a 
                        href={evidence.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />Ver fonte
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Metodologia */}
      {data.methodology && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Metodologia</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-5 rounded-lg text-center border border-blue-200">
              <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{data.methodology.sources_checked || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Fontes</p>
            </div>
            <div className="bg-green-50 p-5 rounded-lg text-center border border-green-200">
              <Search className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{data.methodology.total_searches || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Buscas</p>
            </div>
            <div className="bg-purple-50 p-5 rounded-lg text-center border border-purple-200">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{data.methodology.total_matches || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Matches</p>
            </div>
            <div className="bg-orange-50 p-5 rounded-lg text-center border border-orange-200">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{data.methodology.execution_time_ms || 0}ms</p>
              <p className="text-xs text-gray-600 mt-2">Tempo</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
