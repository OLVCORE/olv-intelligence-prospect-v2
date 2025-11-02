import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, ExternalLink, AlertTriangle, Globe, Search, Clock, CheckSquare } from 'lucide-react';

interface TOTVSVerificationReportProps {
  data: any;
  companyName: string;
  cnpj?: string;
}

export default function TOTVSVerificationReport({ data, companyName, cnpj }: TOTVSVerificationReportProps) {
  console.log('[TOTVS REPORT] 📊 Dados recebidos:', data);
  console.log('[TOTVS REPORT] 📊 Metodologia:', data?.methodology);
  console.log('[TOTVS REPORT] 📊 Evidências:', data?.evidences);

  if (!data) {
    return (
      <Card className="p-12 text-center border-2">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">Dados não disponíveis</h3>
        <p className="text-muted-foreground">Execute a verificação para gerar o relatório</p>
      </Card>
    );
  }

  const isClienteTOTVS = data.status === 'cliente_totvs';
  const confidence = data.confidence || 'low';

  return (
    <div className="space-y-8">
      {/* Header com Gradiente */}
      <Card className="p-8 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/30 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-1">Verificação TOTVS</h1>
            <p className="text-xl font-semibold text-foreground/80">{companyName}</p>
          </div>
        </div>
        {cnpj && (
          <div className="mt-4 p-3 bg-card/50 rounded-lg border border-border">
            <p className="text-sm font-mono text-muted-foreground">CNPJ: {cnpj}</p>
          </div>
        )}
      </Card>

      {/* Status Cards - Maior e mais visível */}
      <div className="grid grid-cols-2 gap-6">
        <Card className={`p-8 border-4 shadow-xl ${isClienteTOTVS ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/50 bg-green-500/5'}`}>
          <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Status da Verificação</p>
          <div className="flex items-center gap-3">
            {isClienteTOTVS ? (
              <>
                <div className="p-3 bg-red-500/20 rounded-full">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">Cliente TOTVS</p>
                  <p className="text-sm text-red-600/70">Não qualificado para abordagem</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">Não é Cliente</p>
                  <p className="text-sm text-green-600/70">Qualificado para abordagem</p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-8 border-4 border-border shadow-xl bg-card">
          <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Nível de Confiança</p>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              confidence === 'high' ? 'bg-emerald-500/20' : 
              confidence === 'medium' ? 'bg-amber-500/20' : 
              'bg-red-500/20'
            }`}>
              <CheckSquare className={`w-8 h-8 ${
                confidence === 'high' ? 'text-emerald-600' : 
                confidence === 'medium' ? 'text-amber-600' : 
                'text-red-600'
              }`} />
            </div>
            <div>
              <p className={`text-3xl font-bold ${
                confidence === 'high' ? 'text-emerald-600' : 
                confidence === 'medium' ? 'text-amber-600' : 
                'text-red-600'
              }`}>
                {confidence === 'high' && '🟢 Alta'}
                {confidence === 'medium' && '🟡 Média'}
                {confidence === 'low' && '🔴 Baixa'}
              </p>
              <p className={`text-sm ${
                confidence === 'high' ? 'text-emerald-600/70' : 
                confidence === 'medium' ? 'text-amber-600/70' : 
                'text-red-600/70'
              }`}>
                {data.methodology?.sources_with_results || 0} fonte(s) confirmada(s)
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Metodologia - Cards grandes e coloridos */}
      {data.methodology && (
        <Card className="p-8 border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Metodologia de Verificação</h2>
          </div>
          
          <div className="grid grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30 shadow-md hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-500/20 rounded-full mb-4">
                  <Globe className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {data.methodology.sources_checked || 0}
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Fontes Consultadas
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-2 border-purple-500/30 shadow-md hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-purple-500/20 rounded-full mb-4">
                  <Search className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-4xl font-bold text-purple-600 mb-2">
                  {data.methodology.total_searches || 0}
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Buscas Realizadas
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/30 shadow-md hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-green-500/20 rounded-full mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {data.methodology.total_matches || 0}
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Matches Encontrados
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-2 border-orange-500/30 shadow-md hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-orange-500/20 rounded-full mb-4">
                  <Clock className="w-10 h-10 text-orange-600" />
                </div>
                <p className="text-4xl font-bold text-orange-600 mb-2">
                  {data.methodology.execution_time_ms || 0}ms
                </p>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Tempo de Execução
                </p>
              </div>
            </Card>
          </div>
        </Card>
      )}

      {/* Evidências - Cards maiores e mais legíveis */}
      {data.evidences && data.evidences.length > 0 && (
        <Card className="p-8 border-2 border-border shadow-lg bg-card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Evidências Encontradas</h2>
            </div>
            <Badge className="text-lg px-4 py-2 bg-primary">
              {data.evidences.length} {data.evidences.length === 1 ? 'evidência' : 'evidências'}
            </Badge>
          </div>

          <div className="space-y-4">
            {data.evidences.map((evidence: any, index: number) => (
              <Card 
                key={index} 
                className="p-6 border-2 border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg bg-gradient-to-r from-card to-card/80"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <p className="text-base leading-relaxed text-foreground font-medium">
                      {evidence.text}
                    </p>
                    {evidence.source && (
                      <a 
                        href={evidence.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver fonte original
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Mensagem caso não haja evidências */}
      {(!data.evidences || data.evidences.length === 0) && (
        <Card className="p-12 text-center border-2 border-dashed border-border">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma evidência encontrada</h3>
          <p className="text-muted-foreground">A análise não encontrou evidências específicas para esta verificação</p>
        </Card>
      )}
    </div>
  );
}
