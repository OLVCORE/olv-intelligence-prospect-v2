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
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Relatório TOTVS</h1>
        </div>
        <p className="text-lg font-semibold mt-2 text-foreground">{companyName}</p>
        {cnpj && <p className="text-sm text-muted-foreground">CNPJ: {cnpj}</p>}
      </Card>

      {/* Status */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Status da Verificação</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-muted/50 p-6 rounded-lg border-2 border-border">
            <p className="text-sm font-semibold text-muted-foreground mb-3">Status</p>
            <Badge variant={isClienteTOTVS ? 'destructive' : 'default'} className="text-lg px-6 py-2">
              {isClienteTOTVS ? (
                <><XCircle className="w-5 h-5 mr-2" />Cliente TOTVS</>
              ) : (
                <><CheckCircle className="w-5 h-5 mr-2" />Não é Cliente TOTVS</>
              )}
            </Badge>
          </div>
          <div className="bg-muted/50 p-6 rounded-lg border-2 border-border">
            <p className="text-sm font-semibold text-muted-foreground mb-3">Confiança</p>
            <Badge variant="outline" className="text-lg px-6 py-2 border-2">
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
          <h2 className="text-2xl font-bold mb-6 text-foreground">Evidências ({data.evidences.length})</h2>
          <div className="space-y-4">
            {data.evidences.map((evidence: any, index: number) => (
              <div key={index} className="bg-card p-5 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm mb-3 text-foreground leading-relaxed">{evidence.text}</p>
                    {evidence.source && (
                      <a 
                        href={evidence.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
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
          <h2 className="text-2xl font-bold mb-6 text-foreground">Metodologia</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-primary/10 p-5 rounded-lg text-center border-2 border-primary/20">
              <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{data.methodology.sources_checked || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Fontes</p>
            </div>
            <div className="bg-primary/10 p-5 rounded-lg text-center border-2 border-primary/20">
              <Search className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{data.methodology.total_searches || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Buscas</p>
            </div>
            <div className="bg-primary/10 p-5 rounded-lg text-center border-2 border-primary/20">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{data.methodology.total_matches || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Matches</p>
            </div>
            <div className="bg-primary/10 p-5 rounded-lg text-center border-2 border-primary/20">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{data.methodology.execution_time_ms || 0}ms</p>
              <p className="text-xs text-muted-foreground mt-2">Tempo</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
